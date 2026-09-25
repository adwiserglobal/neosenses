-- ============================================================
-- NeoSenses — 019: materiais importados de páginas de experiências
-- ============================================================
-- O importador por URL copia imagens importantes para o nosso Storage para
-- que a experiência não quebre se o site de origem mudar ou sair do ar.
-- O bucket é público porque as imagens são conteúdo editorial publicado.
-- Escrita pelo painel continua restrita à equipe / service_role.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'experiencias-importadas',
  'experiencias-importadas',
  true,
  8388608,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "experiencias_importadas_staff_grava" ON storage.objects;
CREATE POLICY "experiencias_importadas_staff_grava" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'experiencias-importadas' AND public.is_staff());

DROP POLICY IF EXISTS "experiencias_importadas_staff_atualiza" ON storage.objects;
CREATE POLICY "experiencias_importadas_staff_atualiza" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'experiencias-importadas' AND public.is_staff())
  WITH CHECK (bucket_id = 'experiencias-importadas' AND public.is_staff());

DROP POLICY IF EXISTS "experiencias_importadas_staff_apaga" ON storage.objects;
CREATE POLICY "experiencias_importadas_staff_apaga" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'experiencias-importadas' AND public.is_staff());
