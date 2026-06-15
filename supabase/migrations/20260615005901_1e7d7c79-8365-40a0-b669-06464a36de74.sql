
-- 1) apoios.txid: revoke column-level SELECT from anon and authenticated
REVOKE SELECT (txid) ON public.apoios FROM anon;
REVOKE SELECT (txid) ON public.apoios FROM authenticated;

-- 2) casas_shows.telefone: revoke column-level SELECT from anon only
REVOKE SELECT (telefone) ON public.casas_shows FROM anon;

-- 3) Remove participacao_evento from Realtime publication so PIX txid/qr_code aren't broadcast
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'participacao_evento'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.participacao_evento';
  END IF;
END $$;
