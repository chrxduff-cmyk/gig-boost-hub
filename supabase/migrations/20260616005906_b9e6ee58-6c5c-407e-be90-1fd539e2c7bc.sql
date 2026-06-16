
-- LOJAS & EXPOSITORES
CREATE TABLE public.lojas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  categoria text, -- e.g. "instrumentos", "vestuario", "expositor"
  endereco text,
  cidade text,
  estado text,
  telefone text,
  instagram text,
  site text,
  foto text,
  latitude numeric,
  longitude numeric,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lojas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lojas TO authenticated;
GRANT ALL ON public.lojas TO service_role;

-- Hide phone column from public anon (sensitive contact)
REVOKE SELECT ON public.lojas FROM anon;
GRANT SELECT (id, created_by, owner_id, nome, descricao, categoria, endereco, cidade, estado, instagram, site, foto, latitude, longitude, status, created_at, updated_at) ON public.lojas TO anon;

ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

CREATE POLICY lojas_read_ativa ON public.lojas FOR SELECT TO anon, authenticated USING (status = 'ativa' OR status = 'ativo');
CREATE POLICY lojas_read_own ON public.lojas FOR SELECT TO authenticated USING (auth.uid() = created_by OR auth.uid() = owner_id);
CREATE POLICY lojas_admin_all ON public.lojas FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY lojas_insert_auth ON public.lojas FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY lojas_owner_update ON public.lojas FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by)) WITH CHECK (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by));
CREATE POLICY lojas_owner_delete ON public.lojas FOR DELETE TO authenticated USING (auth.uid() = owner_id OR (owner_id IS NULL AND auth.uid() = created_by));

CREATE TRIGGER trg_lojas_updated_at BEFORE UPDATE ON public.lojas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_lojas_force_pending BEFORE INSERT ON public.lojas FOR EACH ROW EXECUTE FUNCTION public.force_pending_on_insert();

-- AVALIAÇÕES
CREATE TABLE public.avaliacoes_loja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atendimento int NOT NULL CHECK (atendimento BETWEEN 1 AND 5),
  variedade int NOT NULL CHECK (variedade BETWEEN 1 AND 5),
  preco int NOT NULL CHECK (preco BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (loja_id, user_id)
);

GRANT SELECT ON public.avaliacoes_loja TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes_loja TO authenticated;
GRANT ALL ON public.avaliacoes_loja TO service_role;

ALTER TABLE public.avaliacoes_loja ENABLE ROW LEVEL SECURITY;

CREATE POLICY avl_loja_read ON public.avaliacoes_loja FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY avl_loja_insert ON public.avaliacoes_loja FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY avl_loja_update ON public.avaliacoes_loja FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY avl_loja_delete ON public.avaliacoes_loja FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- REIVINDICAÇÕES: support 'loja'
ALTER TABLE public.reivindicacoes DROP CONSTRAINT IF EXISTS reivindicacoes_entity_type_check;
ALTER TABLE public.reivindicacoes ADD CONSTRAINT reivindicacoes_entity_type_check CHECK (entity_type IN ('banda','produtor','casa','estudio','radio','loja'));

CREATE OR REPLACE FUNCTION public.aprovar_reivindicacao(_reiv_id uuid)
 RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.reivindicacoes;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT * INTO r FROM public.reivindicacoes WHERE id = _reiv_id;
  IF r IS NULL THEN RAISE EXCEPTION 'not found'; END IF;
  IF r.entity_type = 'banda' THEN UPDATE public.bandas SET owner_id = r.user_id WHERE id = r.entity_id;
  ELSIF r.entity_type = 'produtor' THEN UPDATE public.produtores SET owner_id = r.user_id WHERE id = r.entity_id;
  ELSIF r.entity_type = 'casa' THEN UPDATE public.casas_shows SET owner_id = r.user_id WHERE id = r.entity_id;
  ELSIF r.entity_type = 'estudio' THEN UPDATE public.estudios_ensaio SET owner_id = r.user_id WHERE id = r.entity_id;
  ELSIF r.entity_type = 'radio' THEN UPDATE public.radios SET owner_id = r.user_id WHERE id = r.entity_id;
  ELSIF r.entity_type = 'loja' THEN UPDATE public.lojas SET owner_id = r.user_id WHERE id = r.entity_id;
  END IF;
  UPDATE public.reivindicacoes SET status = 'aprovada' WHERE id = _reiv_id;
END $function$;

CREATE OR REPLACE FUNCTION public.moderar_cadastro(_entity_type text, _id uuid, _aprovar boolean)
 RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF _entity_type IN ('estudio','produtor') THEN
    _status := CASE WHEN _aprovar THEN 'ativo' ELSE 'rejeitado' END;
  ELSE
    _status := CASE WHEN _aprovar THEN 'ativa' ELSE 'rejeitada' END;
  END IF;
  IF _entity_type = 'banda' THEN UPDATE public.bandas SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'casa' THEN UPDATE public.casas_shows SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'radio' THEN UPDATE public.radios SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'estudio' THEN UPDATE public.estudios_ensaio SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'produtor' THEN UPDATE public.produtores SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'loja' THEN UPDATE public.lojas SET status = _status WHERE id = _id;
  ELSE RAISE EXCEPTION 'invalid entity_type';
  END IF;
END;
$function$;
