
-- Produtores
CREATE TABLE public.produtores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  bio text,
  foto text,
  cidade text,
  contato text,
  instagram text,
  site text,
  owner_id uuid,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.produtores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtores TO authenticated;
GRANT ALL ON public.produtores TO service_role;

ALTER TABLE public.produtores ENABLE ROW LEVEL SECURITY;

CREATE POLICY produtores_public_select ON public.produtores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY produtores_admin_all ON public.produtores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vinculo eventos -> produtor
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS produtor_id uuid REFERENCES public.produtores(id) ON DELETE SET NULL;

-- Avaliacoes
CREATE TABLE public.avaliacoes_produtor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produtor_id uuid NOT NULL REFERENCES public.produtores(id) ON DELETE CASCADE,
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  estrelas smallint NOT NULL CHECK (estrelas BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (produtor_id, evento_id, user_id)
);

GRANT SELECT ON public.avaliacoes_produtor TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes_produtor TO authenticated;
GRANT ALL ON public.avaliacoes_produtor TO service_role;

ALTER TABLE public.avaliacoes_produtor ENABLE ROW LEVEL SECURITY;

CREATE POLICY avaliacoes_public_select ON public.avaliacoes_produtor FOR SELECT TO anon, authenticated USING (true);

-- Helper: pode avaliar se apoiou (aprovado) este evento do produtor e evento terminou
CREATE OR REPLACE FUNCTION public.pode_avaliar_produtor(_user_id uuid, _produtor_id uuid, _evento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.apoios a
    JOIN public.eventos e ON e.id = a.evento_id
    JOIN public.profiles p ON p.id = _user_id
    WHERE a.evento_id = _evento_id
      AND a.status = 'aprovado'
      AND e.produtor_id = _produtor_id
      AND a.nome_apoiador = p.nome
      AND (e.data_evento IS NULL OR e.data_evento < now())
  );
$$;

CREATE POLICY avaliacoes_insert_apoiador ON public.avaliacoes_produtor FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.pode_avaliar_produtor(auth.uid(), produtor_id, evento_id)
  );

CREATE POLICY avaliacoes_update_own ON public.avaliacoes_produtor FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY avaliacoes_delete_own_or_admin ON public.avaliacoes_produtor FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
