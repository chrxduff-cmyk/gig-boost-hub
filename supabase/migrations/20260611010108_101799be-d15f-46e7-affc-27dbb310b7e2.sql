CREATE TABLE public.configuracoes_pix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL,
  nome_recebedor text NOT NULL,
  cidade text NOT NULL,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT ON public.configuracoes_pix TO anon, authenticated;
GRANT INSERT, UPDATE ON public.configuracoes_pix TO authenticated;
GRANT ALL ON public.configuracoes_pix TO service_role;

ALTER TABLE public.configuracoes_pix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler config PIX" ON public.configuracoes_pix
  FOR SELECT USING (true);

CREATE POLICY "Admins podem inserir config PIX" ON public.configuracoes_pix
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar config PIX" ON public.configuracoes_pix
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.configuracoes_pix (chave, nome_recebedor, cidade)
VALUES ('emporio.encantado.rj@gmail.com', 'UDB', 'RJ');