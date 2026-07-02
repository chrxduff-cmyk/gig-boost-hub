
-- Hide sensitive columns from anonymous users via column-level privileges

-- apoios: hide txid from anon
REVOKE SELECT ON public.apoios FROM anon;
GRANT SELECT (id, evento_id, banda_id, nome_apoiador, valor, pontos, status, created_at, user_id) ON public.apoios TO anon;

-- participacao_evento: hide txid and qr_code from anon
REVOKE SELECT ON public.participacao_evento FROM anon;
GRANT SELECT (id, evento_id, banda_id, pontos, created_at) ON public.participacao_evento TO anon;

-- casas_shows: hide telefone from anon
REVOKE SELECT ON public.casas_shows FROM anon;
GRANT SELECT (id, owner_id, created_by, nome, descricao, endereco, cidade, estado, instagram, site, foto, latitude, longitude, status, created_at, updated_at) ON public.casas_shows TO anon;

-- estudios_ensaio: hide telefone from anon
REVOKE SELECT ON public.estudios_ensaio FROM anon;
GRANT SELECT (id, nome, descricao, cidade, estado, endereco, latitude, longitude, valor_hora, instagram, site, foto, status, owner_id, created_by, created_at, updated_at) ON public.estudios_ensaio TO anon;
