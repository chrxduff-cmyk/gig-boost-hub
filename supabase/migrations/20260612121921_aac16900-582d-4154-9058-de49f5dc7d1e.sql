
-- 1) Restrict configuracoes_pix public SELECT (admins only)
DROP POLICY IF EXISTS "Todos podem ler config PIX" ON public.configuracoes_pix;
CREATE POLICY "Admins podem ler config PIX"
  ON public.configuracoes_pix FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) Public server-side accessor for PIX config (only safe fields needed at payment time)
CREATE OR REPLACE FUNCTION public.get_pix_config_public()
RETURNS TABLE(chave text, nome_recebedor text, cidade text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT chave, nome_recebedor, cidade FROM public.configuracoes_pix LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_pix_config_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pix_config_public() TO anon, authenticated;

-- 3) apoios: add user_id (for proper review authorization), hide txid from public
ALTER TABLE public.apoios ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Revoke broad SELECT and grant only safe columns to anon/authenticated.
REVOKE SELECT ON public.apoios FROM anon, authenticated;
GRANT SELECT (id, banda_id, evento_id, nome_apoiador, valor, pontos, status, created_at, user_id)
  ON public.apoios TO anon, authenticated;
-- txid intentionally excluded — only admins can read it.

-- 4) Fix pode_avaliar_produtor to use user_id instead of free-text name matching
CREATE OR REPLACE FUNCTION public.pode_avaliar_produtor(_user_id uuid, _produtor_id uuid, _evento_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.apoios a
    JOIN public.eventos e ON e.id = a.evento_id
    WHERE a.evento_id = _evento_id
      AND a.status = 'aprovado'
      AND e.produtor_id = _produtor_id
      AND a.user_id = _user_id
      AND (e.data_evento IS NULL OR e.data_evento < now())
  );
$function$;

-- 5) Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated
-- (RLS policies still work — they execute as table owner.)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pode_avaliar_produtor(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
-- pode_avaliar_produtor is used in WITH CHECK; needs to be callable by authenticated
GRANT EXECUTE ON FUNCTION public.pode_avaliar_produtor(uuid, uuid, uuid) TO authenticated;

-- 6) Remove apoios from realtime publication (sensitive broadcast)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'apoios'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.apoios';
  END IF;
END $$;
