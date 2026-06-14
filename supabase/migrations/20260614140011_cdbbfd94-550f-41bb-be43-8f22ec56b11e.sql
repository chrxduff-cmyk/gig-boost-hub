
-- 1) Casas de shows
CREATE TABLE public.casas_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  endereco text,
  cidade text,
  estado text,
  telefone text,
  instagram text,
  site text,
  foto text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  status text NOT NULL DEFAULT 'ativa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.casas_shows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.casas_shows TO authenticated;
GRANT ALL ON public.casas_shows TO service_role;

ALTER TABLE public.casas_shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "casas_public_select" ON public.casas_shows FOR SELECT USING (true);
CREATE POLICY "casas_auth_insert" ON public.casas_shows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "casas_owner_update" ON public.casas_shows FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by))
  WITH CHECK (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by));
CREATE POLICY "casas_owner_delete" ON public.casas_shows FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by));
CREATE POLICY "casas_admin_all" ON public.casas_shows FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER casas_shows_updated BEFORE UPDATE ON public.casas_shows
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2) Avaliações de casas (estrelas + comentários, abertas a qualquer autenticado)
CREATE TABLE public.avaliacoes_casa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  casa_id uuid NOT NULL REFERENCES public.casas_shows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estrelas smallint NOT NULL CHECK (estrelas BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (casa_id, user_id)
);

GRANT SELECT ON public.avaliacoes_casa TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes_casa TO authenticated;
GRANT ALL ON public.avaliacoes_casa TO service_role;

ALTER TABLE public.avaliacoes_casa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "av_casa_public_select" ON public.avaliacoes_casa FOR SELECT USING (true);
CREATE POLICY "av_casa_auth_insert" ON public.avaliacoes_casa FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_casa_owner_update" ON public.avaliacoes_casa FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "av_casa_owner_delete" ON public.avaliacoes_casa FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Reivindicações (claims) genéricas para bandas / produtores / casas
CREATE TABLE public.reivindicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('banda','produtor','casa')),
  entity_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','rejeitada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reivindicacoes TO authenticated;
GRANT ALL ON public.reivindicacoes TO service_role;

ALTER TABLE public.reivindicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reiv_self_select" ON public.reivindicacoes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "reiv_self_insert" ON public.reivindicacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reiv_admin_update" ON public.reivindicacoes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "reiv_self_delete" ON public.reivindicacoes FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Abrir cadastro público (autenticado) para bandas e produtores; permitir dono editar/excluir.
ALTER TABLE public.bandas ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.produtores ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.produtores ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "bandas_auth_insert" ON public.bandas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "bandas_owner_delete" ON public.bandas FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by));

CREATE POLICY "produtores_auth_insert" ON public.produtores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "produtores_owner_update" ON public.produtores FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by))
  WITH CHECK (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by));
CREATE POLICY "produtores_owner_delete" ON public.produtores FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by));

-- 5) Função para aprovar reivindicação (admin)
CREATE OR REPLACE FUNCTION public.aprovar_reivindicacao(_reiv_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reivindicacoes;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT * INTO r FROM public.reivindicacoes WHERE id = _reiv_id;
  IF r IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF r.entity_type = 'banda' THEN
    UPDATE public.bandas SET owner_id = r.user_id WHERE id = r.entity_id;
  ELSIF r.entity_type = 'produtor' THEN
    UPDATE public.produtores SET owner_id = r.user_id WHERE id = r.entity_id;
  ELSIF r.entity_type = 'casa' THEN
    UPDATE public.casas_shows SET owner_id = r.user_id WHERE id = r.entity_id;
  END IF;
  UPDATE public.reivindicacoes SET status = 'aprovada' WHERE id = _reiv_id;
END $$;
