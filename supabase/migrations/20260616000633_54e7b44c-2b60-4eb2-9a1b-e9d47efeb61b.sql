
-- 1. casas_shows: public can read everything EXCEPT telefone; authenticated reads all
REVOKE SELECT ON public.casas_shows FROM anon, authenticated;
GRANT SELECT (id, owner_id, created_by, nome, descricao, endereco, cidade, estado, instagram, site, foto, latitude, longitude, status, created_at, updated_at)
  ON public.casas_shows TO anon;
GRANT SELECT ON public.casas_shows TO authenticated;

-- 2. estudios_ensaio: same model for telefone
REVOKE SELECT ON public.estudios_ensaio FROM anon, authenticated;
GRANT SELECT (id, nome, descricao, cidade, estado, endereco, latitude, longitude, valor_hora, instagram, site, foto, status, owner_id, created_by, created_at, updated_at)
  ON public.estudios_ensaio TO anon;
GRANT SELECT ON public.estudios_ensaio TO authenticated;

-- 3. participacao_evento: drop broad public select; expose only safe columns; admins keep full access via existing pe_admin_all
DROP POLICY IF EXISTS pe_public_select ON public.participacao_evento;
CREATE POLICY pe_public_select_safe ON public.participacao_evento
  FOR SELECT TO anon, authenticated USING (true);
REVOKE SELECT ON public.participacao_evento FROM anon, authenticated;
GRANT SELECT (id, evento_id, banda_id, pontos, created_at) ON public.participacao_evento TO anon, authenticated;

-- 4. profiles: allow admins to read all profiles
DROP POLICY IF EXISTS profiles_admin_select ON public.profiles;
CREATE POLICY profiles_admin_select ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. storage band-logos / band-tracks: only admins may write/update/delete
DROP POLICY IF EXISTS "band-logos auth insert" ON storage.objects;
DROP POLICY IF EXISTS "band-logos auth update" ON storage.objects;
DROP POLICY IF EXISTS "band-logos auth delete" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks auth insert" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks auth update" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks auth delete" ON storage.objects;

CREATE POLICY "band-logos admin insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'band-logos' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "band-logos admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'band-logos' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "band-logos admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'band-logos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "band-tracks admin insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'band-tracks' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "band-tracks admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'band-tracks' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "band-tracks admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'band-tracks' AND public.has_role(auth.uid(), 'admin'::app_role));
