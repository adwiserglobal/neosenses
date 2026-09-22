-- ============================================================
-- NeoSenses — 018: matéria de blog em blocos, e o rastro de quem a gerou
-- ============================================================
-- O blog guardava o texto inteiro num campo só (`content`), renderizado
-- como um parágrafo atrás do outro. Serve para um texto curto; não serve
-- para o que a equipe pediu: uma matéria com foto ao longo da leitura,
-- miniatura na listagem e a matéria completa ao abrir.
--
-- 1. BLOCOS. `blocks` guarda a matéria como uma lista ordenada de peças —
--    parágrafo, subtítulo, imagem, citação, lista. É o que permite a foto
--    entrar no meio do texto em vez de só no topo.
--
--    Fica em JSONB e não em tabela filha de propósito: um post é escrito e
--    revisado como uma coisa só, nunca item a item, e uma tabela obrigaria
--    a apagar e recriar tudo a cada salvamento — com o post ficando
--    momentaneamente pela metade se algo falhasse no meio.
--
--    `content` continua existindo e continua sendo preenchido: é o que o
--    site já renderiza, o que alimenta a busca e o que sobra se um dia os
--    blocos forem descartados. Blocos vazios não deixam o post mudo.
--
-- 2. RASTRO. `generation` registra o que produziu a matéria: a instrução
--    dada, de onde veio o material, o modelo e quando. Sem isso, daqui a
--    seis meses ninguém sabe se um texto foi escrito por uma pessoa ou por
--    uma máquina — e essa é justamente a pergunta que se faz quando um
--    texto sai errado.
--
-- 3. CRÉDITO DA CAPA. A imagem vem do Wikimedia, onde quase toda licença
--    livre EXIGE atribuição. Guardar a foto e não guardar o crédito é o
--    mesmo que não ter crédito nenhum.
--
-- Idempotente.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Blocos, rastro e crédito
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS blocks           jsonb,
  ADD COLUMN IF NOT EXISTS generation       jsonb,
  ADD COLUMN IF NOT EXISTS featured_credit  text;

COMMENT ON COLUMN public.blog_posts.blocks IS
  'A matéria como lista ordenada de blocos: {tipo, texto, url, credito, alt, itens}. Tipos: paragrafo, subtitulo, imagem, citacao, lista. Vazio: a página cai para `content`.';
COMMENT ON COLUMN public.blog_posts.generation IS
  'Como esta matéria nasceu: {modo, instrucao, fontes[], modelo, em, revisado_por}. Texto escrito à mão deixa isto nulo.';
COMMENT ON COLUMN public.blog_posts.featured_credit IS
  'Atribuição da imagem de capa. Licença livre do Wikimedia costuma exigir crédito visível — guardar a foto sem ele não cumpre a licença.';

-- ─────────────────────────────────────────────────────────────
-- 2. O bucket dos materiais enviados
-- ─────────────────────────────────────────────────────────────
-- PRIVADO. O que a equipe sobe aqui é material de trabalho — PDF de
-- fornecedor, rascunho, proposta — e não conteúdo de site. Bucket público
-- deixaria qualquer um com o endereço ler tudo, e endereço vaza.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materiais',
  'materiais',
  false,
  20971520,  -- 20 MB: o Gemini recebe o arquivo inteiro na requisição
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      public = false;

-- Só quem edita o site enxerga o bucket. `is_staff()` existe desde a 005.
DROP POLICY IF EXISTS "materiais_staff_le" ON storage.objects;
CREATE POLICY "materiais_staff_le" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'materiais' AND public.is_staff());

DROP POLICY IF EXISTS "materiais_staff_grava" ON storage.objects;
CREATE POLICY "materiais_staff_grava" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'materiais' AND public.is_staff());

DROP POLICY IF EXISTS "materiais_staff_apaga" ON storage.objects;
CREATE POLICY "materiais_staff_apaga" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'materiais' AND public.is_staff());

DO $bloco$
BEGIN
  RAISE NOTICE 'Migration 018: blog em blocos, rastro de geração e bucket de materiais.';
END;
$bloco$;
