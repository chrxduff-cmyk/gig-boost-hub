CREATE OR REPLACE FUNCTION public.votacao_esta_aberta(_evento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN e.data_evento IS NULL THEN e.status <> 'encerrado'
      ELSE e.status <> 'encerrado' AND now() < (e.data_evento + INTERVAL '12 hours')
    END
  FROM public.eventos e
  WHERE e.id = _evento_id;
$$;

CREATE OR REPLACE FUNCTION public.bloquear_apoio_evento_encerrado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.evento_id IS NOT NULL THEN
    IF NOT public.votacao_esta_aberta(NEW.evento_id) THEN
      RAISE EXCEPTION 'A votação deste evento já foi encerrada (limite de 12h após o evento).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_apoio_evento_encerrado ON public.apoios;
CREATE TRIGGER trg_bloquear_apoio_evento_encerrado
  BEFORE INSERT ON public.apoios
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_apoio_evento_encerrado();