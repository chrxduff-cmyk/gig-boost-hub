
-- 1) Liberar upload de logos e faixas para qualquer usuário autenticado
DROP POLICY IF EXISTS "band-logos admin insert" ON storage.objects;
DROP POLICY IF EXISTS "band-logos admin update" ON storage.objects;
DROP POLICY IF EXISTS "band-logos admin delete" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks admin insert" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks admin update" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks admin delete" ON storage.objects;

CREATE POLICY "band-logos auth insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'band-logos' AND auth.uid() = owner);
CREATE POLICY "band-logos owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'band-logos' AND (auth.uid() = owner OR has_role(auth.uid(),'admin'::app_role)))
  WITH CHECK (bucket_id = 'band-logos');
CREATE POLICY "band-logos owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'band-logos' AND (auth.uid() = owner OR has_role(auth.uid(),'admin'::app_role)));

CREATE POLICY "band-tracks auth insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'band-tracks' AND auth.uid() = owner);
CREATE POLICY "band-tracks owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'band-tracks' AND (auth.uid() = owner OR has_role(auth.uid(),'admin'::app_role)))
  WITH CHECK (bucket_id = 'band-tracks');
CREATE POLICY "band-tracks owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'band-tracks' AND (auth.uid() = owner OR has_role(auth.uid(),'admin'::app_role)));

-- 2) Remover campo "banheiro" de estúdios e avaliações
ALTER TABLE public.avaliacoes_estudio DROP COLUMN IF EXISTS banheiro;
ALTER TABLE public.estudios_ensaio DROP COLUMN IF EXISTS banheiro;

-- 3) Cadastros ficam pendentes de aprovação até admin aprovar
ALTER TABLE public.bandas ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.casas_shows ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.radios ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.estudios_ensaio ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.produtores ALTER COLUMN status SET DEFAULT 'pendente';

CREATE OR REPLACE FUNCTION public.force_pending_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    IF TG_TABLE_NAME IN ('estudios_ensaio','produtores') THEN
      NEW.status := 'pendente';
    ELSE
      NEW.status := 'pendente';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bandas_pending ON public.bandas;
CREATE TRIGGER trg_bandas_pending BEFORE INSERT ON public.bandas
  FOR EACH ROW EXECUTE FUNCTION public.force_pending_on_insert();
DROP TRIGGER IF EXISTS trg_casas_pending ON public.casas_shows;
CREATE TRIGGER trg_casas_pending BEFORE INSERT ON public.casas_shows
  FOR EACH ROW EXECUTE FUNCTION public.force_pending_on_insert();
DROP TRIGGER IF EXISTS trg_radios_pending ON public.radios;
CREATE TRIGGER trg_radios_pending BEFORE INSERT ON public.radios
  FOR EACH ROW EXECUTE FUNCTION public.force_pending_on_insert();
DROP TRIGGER IF EXISTS trg_estudios_pending ON public.estudios_ensaio;
CREATE TRIGGER trg_estudios_pending BEFORE INSERT ON public.estudios_ensaio
  FOR EACH ROW EXECUTE FUNCTION public.force_pending_on_insert();
DROP TRIGGER IF EXISTS trg_produtores_pending ON public.produtores;
CREATE TRIGGER trg_produtores_pending BEFORE INSERT ON public.produtores
  FOR EACH ROW EXECUTE FUNCTION public.force_pending_on_insert();

-- 4) RPC para admin aprovar/rejeitar cadastros pendentes (genérica)
CREATE OR REPLACE FUNCTION public.moderar_cadastro(_entity_type text, _id uuid, _aprovar boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF _entity_type IN ('estudio','produtor') THEN
    _status := CASE WHEN _aprovar THEN 'ativo' ELSE 'rejeitado' END;
  ELSE
    _status := CASE WHEN _aprovar THEN 'ativa' ELSE 'rejeitada' END;
  END IF;
  IF _entity_type = 'banda' THEN
    UPDATE public.bandas SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'casa' THEN
    UPDATE public.casas_shows SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'radio' THEN
    UPDATE public.radios SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'estudio' THEN
    UPDATE public.estudios_ensaio SET status = _status WHERE id = _id;
  ELSIF _entity_type = 'produtor' THEN
    UPDATE public.produtores SET status = _status WHERE id = _id;
  ELSE
    RAISE EXCEPTION 'invalid entity_type';
  END IF;
END;
$$;
