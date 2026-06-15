
ALTER TABLE public.reivindicacoes DROP CONSTRAINT IF EXISTS reivindicacoes_entity_type_check;
ALTER TABLE public.reivindicacoes ADD CONSTRAINT reivindicacoes_entity_type_check
  CHECK (entity_type = ANY (ARRAY['banda','produtor','casa','estudio','radio']));

CREATE OR REPLACE FUNCTION public.aprovar_reivindicacao(_reiv_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ELSIF r.entity_type = 'estudio' THEN
    UPDATE public.estudios_ensaio SET owner_id = r.user_id WHERE id = r.entity_id;
  ELSIF r.entity_type = 'radio' THEN
    UPDATE public.radios SET owner_id = r.user_id WHERE id = r.entity_id;
  END IF;
  UPDATE public.reivindicacoes SET status = 'aprovada' WHERE id = _reiv_id;
END $function$;
