
-- ============== Storage policies: open band-logos & band-tracks to authenticated ==============
DROP POLICY IF EXISTS "band-logos admin insert" ON storage.objects;
DROP POLICY IF EXISTS "band-logos admin update" ON storage.objects;
DROP POLICY IF EXISTS "band-logos admin delete" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks admin insert" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks admin update" ON storage.objects;
DROP POLICY IF EXISTS "band-tracks admin delete" ON storage.objects;

CREATE POLICY "band-logos auth insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'band-logos');
CREATE POLICY "band-logos auth update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'band-logos') WITH CHECK (bucket_id = 'band-logos');
CREATE POLICY "band-logos auth delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'band-logos');

CREATE POLICY "band-tracks auth insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'band-tracks');
CREATE POLICY "band-tracks auth update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'band-tracks') WITH CHECK (bucket_id = 'band-tracks');
CREATE POLICY "band-tracks auth delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'band-tracks');

-- ============== Estudios de ensaio ==============
CREATE TABLE public.estudios_ensaio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cidade text,
  estado text,
  endereco text,
  latitude numeric,
  longitude numeric,
  valor_hora numeric,
  telefone text,
  instagram text,
  site text,
  foto text,
  status text NOT NULL DEFAULT 'ativo',
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.estudios_ensaio TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estudios_ensaio TO authenticated;
GRANT ALL ON public.estudios_ensaio TO service_role;
ALTER TABLE public.estudios_ensaio ENABLE ROW LEVEL SECURITY;
CREATE POLICY estudios_public_select ON public.estudios_ensaio FOR SELECT USING (true);
CREATE POLICY estudios_auth_insert ON public.estudios_ensaio FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY estudios_owner_update ON public.estudios_ensaio FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR auth.uid() = created_by OR has_role(auth.uid(),'admin'));
CREATE POLICY estudios_owner_delete ON public.estudios_ensaio FOR DELETE TO authenticated USING (auth.uid() = owner_id OR auth.uid() = created_by OR has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_estudios_updated_at BEFORE UPDATE ON public.estudios_ensaio FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Avaliações de estúdios
CREATE TABLE public.avaliacoes_estudio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estudio_id uuid NOT NULL REFERENCES public.estudios_ensaio(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  estrutura smallint NOT NULL CHECK (estrutura BETWEEN 1 AND 5),
  equipamentos smallint NOT NULL CHECK (equipamentos BETWEEN 1 AND 5),
  banheiro smallint NOT NULL CHECK (banheiro BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (estudio_id, user_id)
);
GRANT SELECT ON public.avaliacoes_estudio TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes_estudio TO authenticated;
GRANT ALL ON public.avaliacoes_estudio TO service_role;
ALTER TABLE public.avaliacoes_estudio ENABLE ROW LEVEL SECURITY;
CREATE POLICY av_estudio_public_select ON public.avaliacoes_estudio FOR SELECT USING (true);
CREATE POLICY av_estudio_own_insert ON public.avaliacoes_estudio FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY av_estudio_own_update ON public.avaliacoes_estudio FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY av_estudio_own_delete ON public.avaliacoes_estudio FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

-- ============== Rádios ==============
CREATE TABLE public.radios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  site text,
  stream_url text,
  logo text,
  cidade text,
  estado text,
  status text NOT NULL DEFAULT 'ativa',
  owner_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.radios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.radios TO authenticated;
GRANT ALL ON public.radios TO service_role;
ALTER TABLE public.radios ENABLE ROW LEVEL SECURITY;
CREATE POLICY radios_public_select ON public.radios FOR SELECT USING (true);
CREATE POLICY radios_auth_insert ON public.radios FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY radios_owner_update ON public.radios FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR auth.uid() = created_by OR has_role(auth.uid(),'admin'));
CREATE POLICY radios_owner_delete ON public.radios FOR DELETE TO authenticated USING (auth.uid() = owner_id OR auth.uid() = created_by OR has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_radios_updated_at BEFORE UPDATE ON public.radios FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.avaliacoes_radio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radio_id uuid NOT NULL REFERENCES public.radios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  estrelas smallint NOT NULL CHECK (estrelas BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (radio_id, user_id)
);
GRANT SELECT ON public.avaliacoes_radio TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes_radio TO authenticated;
GRANT ALL ON public.avaliacoes_radio TO service_role;
ALTER TABLE public.avaliacoes_radio ENABLE ROW LEVEL SECURITY;
CREATE POLICY av_radio_public_select ON public.avaliacoes_radio FOR SELECT USING (true);
CREATE POLICY av_radio_own_insert ON public.avaliacoes_radio FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY av_radio_own_update ON public.avaliacoes_radio FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY av_radio_own_delete ON public.avaliacoes_radio FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
