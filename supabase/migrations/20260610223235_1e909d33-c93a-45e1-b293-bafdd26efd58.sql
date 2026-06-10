
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'banda', 'publico');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cidade TEXT,
  email TEXT,
  termos_aceitos_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, cidade, email, termos_aceitos_em)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.raw_user_meta_data->>'cidade',
    NEW.email,
    now()
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'publico');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bandas
CREATE TABLE public.bandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  foto TEXT,
  release TEXT,
  cidade TEXT,
  instagram TEXT,
  youtube TEXT,
  spotify TEXT,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bandas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bandas TO authenticated;
GRANT ALL ON public.bandas TO service_role;
ALTER TABLE public.bandas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bandas_public_select" ON public.bandas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "bandas_admin_all" ON public.bandas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bandas_owner_update" ON public.bandas FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Eventos
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  data_evento TIMESTAMPTZ,
  data_inicio_votacao TIMESTAMPTZ,
  data_fim_votacao TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.eventos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eventos_public_select" ON public.eventos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "eventos_admin_all" ON public.eventos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Participacao Evento
CREATE TABLE public.participacao_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  banda_id UUID NOT NULL REFERENCES public.bandas(id) ON DELETE CASCADE,
  txid TEXT,
  qr_code TEXT,
  pontos INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evento_id, banda_id)
);
GRANT SELECT ON public.participacao_evento TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.participacao_evento TO authenticated;
GRANT ALL ON public.participacao_evento TO service_role;
ALTER TABLE public.participacao_evento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pe_public_select" ON public.participacao_evento FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pe_admin_all" ON public.participacao_evento FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Apoios
CREATE TABLE public.apoios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
  banda_id UUID NOT NULL REFERENCES public.bandas(id) ON DELETE CASCADE,
  nome_apoiador TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  pontos INT NOT NULL DEFAULT 0,
  txid TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.apoios TO anon, authenticated;
GRANT UPDATE, DELETE ON public.apoios TO authenticated;
GRANT ALL ON public.apoios TO service_role;
ALTER TABLE public.apoios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apoios_public_select" ON public.apoios FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "apoios_public_insert" ON public.apoios FOR INSERT TO anon, authenticated WITH CHECK (status = 'pendente');
CREATE POLICY "apoios_admin_all" ON public.apoios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function: aprovar apoio (recalcula pontos)
CREATE OR REPLACE FUNCTION public.aprovar_apoio(_apoio_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_apoio public.apoios%ROWTYPE;
  v_pontos INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar apoios';
  END IF;
  SELECT * INTO v_apoio FROM public.apoios WHERE id = _apoio_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Apoio não encontrado'; END IF;
  IF v_apoio.status = 'aprovado' THEN RETURN; END IF;
  v_pontos := FLOOR(v_apoio.valor / 10);
  UPDATE public.apoios SET status = 'aprovado', pontos = v_pontos WHERE id = _apoio_id;
  IF v_apoio.evento_id IS NOT NULL THEN
    INSERT INTO public.participacao_evento (evento_id, banda_id, pontos)
    VALUES (v_apoio.evento_id, v_apoio.banda_id, v_pontos)
    ON CONFLICT (evento_id, banda_id) DO UPDATE SET pontos = participacao_evento.pontos + v_pontos;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancelar_apoio(_apoio_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_apoio public.apoios%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem cancelar apoios';
  END IF;
  SELECT * INTO v_apoio FROM public.apoios WHERE id = _apoio_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Apoio não encontrado'; END IF;
  IF v_apoio.status = 'aprovado' AND v_apoio.evento_id IS NOT NULL THEN
    UPDATE public.participacao_evento
      SET pontos = GREATEST(pontos - v_apoio.pontos, 0)
      WHERE evento_id = v_apoio.evento_id AND banda_id = v_apoio.banda_id;
  END IF;
  UPDATE public.apoios SET status = 'cancelado' WHERE id = _apoio_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aprovar_apoio(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_apoio(UUID) TO authenticated;

-- Realtime para ranking
ALTER PUBLICATION supabase_realtime ADD TABLE public.participacao_evento;
ALTER PUBLICATION supabase_realtime ADD TABLE public.apoios;
