
-- Revoke EXECUTE from anon/authenticated on trigger-only helpers
REVOKE EXECUTE ON FUNCTION public.bloquear_apoio_evento_encerrado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.votacao_esta_aberta(uuid) FROM PUBLIC, anon, authenticated;

-- Ensure aprovar_apoio / cancelar_apoio verify admin role internally (defense-in-depth)
CREATE OR REPLACE FUNCTION public.aprovar_apoio(_apoio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _valor numeric; _pontos int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT valor INTO _valor FROM public.apoios WHERE id = _apoio_id;
  IF _valor IS NULL THEN RAISE EXCEPTION 'apoio not found'; END IF;
  _pontos := GREATEST(0, floor(_valor / 10)::int);
  UPDATE public.apoios SET status='aprovado', pontos=_pontos WHERE id=_apoio_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancelar_apoio(_apoio_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.apoios SET status='cancelado', pontos=0 WHERE id=_apoio_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aprovar_apoio(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancelar_apoio(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aprovar_apoio(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_apoio(uuid) TO authenticated;
