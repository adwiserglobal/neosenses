-- ============================================================
-- NeoSenses — 017: o esqueleto de 8 seções e a árvore de categorias
-- ============================================================
-- Vem do documento "Reformulação do Site NeoSenses" (passos 1 e 5) e da
-- classificação de roteiros que a equipe entregou.
--
-- 1. ESQUELETO. O passo 5 fixa a ordem obrigatória de toda página de
--    roteiro ou retiro. Cinco das oito seções não tinham onde morar:
--
--      1. Título / subtítulo / período     <- subtitle, period_label
--      2. Introdução                        (short_description, já existia)
--      3. Por que criamos                   <- why_created
--      4. O que é                           (description, já existia)
--      5. Por que participar                <- value_proposition
--      6. A jornada, dia a dia              (itinerary_days, já existia)
--      7. Apenas relaxe                     <- relax_text
--      8. Quem conduz                       (experience_facilitators.role)
--
--    `period_label` é texto e não data: "De 12/05 a 19/05" é o que a
--    página mostra no topo, e a maioria das experiências ainda não tem
--    saída publicada em `experience_dates`. Quando tiver, a data real
--    manda — este campo é o rótulo, não a fonte.
--
-- 2. CATEGORIAS EM ÁRVORE. O menu novo tem três entradas — Viagens &
--    Peregrinações, Retiros & Imersões, Workshops & Aulas — e as sete
--    categorias que já existem são mais finas que isso. Em vez de apagar
--    as sete (o que quebraria os links de categoria que já estão no ar e
--    no sitemap), elas ganham um pai.
--
--    Nacional x internacional NÃO vira campo: sai do país do destino, que
--    já está no banco. Campo novo seria uma segunda verdade para a mesma
--    informação, e as duas divergem no dia em que alguém corrigir só uma.
--
-- Idempotente.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. As cinco seções que faltavam
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS subtitle          jsonb,
  ADD COLUMN IF NOT EXISTS period_label      jsonb,
  ADD COLUMN IF NOT EXISTS why_created       jsonb,
  ADD COLUMN IF NOT EXISTS value_proposition jsonb,
  ADD COLUMN IF NOT EXISTS relax_text        jsonb;

COMMENT ON COLUMN public.experiences.subtitle IS
  'Segunda linha do topo. Ex.: "As Três Faces do Divino".';
COMMENT ON COLUMN public.experiences.period_label IS
  'Período como texto, para o topo da página: "De 12/05 a 19/05". Havendo saída publicada em experience_dates, ela é que vale — este campo é rótulo, não fonte.';
COMMENT ON COLUMN public.experiences.why_created IS
  'Seção 3: o propósito e a intenção de colocar esta experiência no mundo.';
COMMENT ON COLUMN public.experiences.value_proposition IS
  'Seção 5: por que a pessoa deveria participar. Texto de abertura; os itens em lista ficam em experience_highlights com grupo = valor.';
COMMENT ON COLUMN public.experiences.relax_text IS
  'Seção 7 "Apenas Relaxe": quebra de objeção. As perguntas em si ficam em experience_faqs.';

-- ─────────────────────────────────────────────────────────────
-- 2. Categorias em árvore
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.categories.parent_id IS
  'Categoria-mãe. As três de primeiro nível (parent_id nulo) são as entradas do menu; as filhas continuam servindo aos filtros e links já publicados.';

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- Uma categoria não pode ser mãe de si mesma, e a árvore para no segundo
-- nível: o menu tem um dropdown só, e neto viraria item invisível.
CREATE OR REPLACE FUNCTION public.categoria_arvore_rasa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  avo uuid;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'Categoria não pode ser mãe de si mesma.';
  END IF;

  SELECT parent_id INTO avo FROM public.categories WHERE id = NEW.parent_id;
  IF avo IS NOT NULL THEN
    RAISE EXCEPTION 'A árvore de categorias tem no máximo dois níveis.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_categoria_arvore_rasa ON public.categories;
CREATE TRIGGER trg_categoria_arvore_rasa
  BEFORE INSERT OR UPDATE OF parent_id ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.categoria_arvore_rasa();

-- ─────────────────────────────────────────────────────────────
-- 3. As três entradas do menu
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.categories (slug, name, description, sort_order, is_active)
VALUES
  ('viagens-peregrinacoes',
   '{"pt":"Viagens & Peregrinações"}'::jsonb,
   '{"pt":"Jornadas a territórios de força, no Brasil e no mundo."}'::jsonb,
   1, true),
  ('retiros-imersoes',
   '{"pt":"Retiros & Imersões"}'::jsonb,
   '{"pt":"Experiências de imersão profunda, com tempo e lugar dedicados ao processo."}'::jsonb,
   2, true),
  ('workshops-aulas',
   '{"pt":"Workshops & Aulas"}'::jsonb,
   '{"pt":"Encontros de aprendizado, mais curtos e focados num saber."}'::jsonb,
   3, true)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      sort_order = EXCLUDED.sort_order,
      is_active = true;

-- ─────────────────────────────────────────────────────────────
-- 4. As sete antigas ganham um pai
-- ─────────────────────────────────────────────────────────────
-- Ninguém é apagado: os endereços /experiencias?categoria=retiros já estão
-- no ar e no sitemap, e link publicado que passa a dar 404 custa a posição
-- que ele levou meses para ganhar.
UPDATE public.categories AS filha
   SET parent_id = mae.id
  FROM public.categories AS mae
 WHERE mae.slug = 'viagens-peregrinacoes'
   AND filha.slug IN ('peregrinacoes', 'jornadas')
   AND filha.parent_id IS DISTINCT FROM mae.id;

UPDATE public.categories AS filha
   SET parent_id = mae.id
  FROM public.categories AS mae
 WHERE mae.slug = 'retiros-imersoes'
   AND filha.slug IN ('retiros', 'imersoes', 'feminino', 'festivais')
   AND filha.parent_id IS DISTINCT FROM mae.id;

UPDATE public.categories AS filha
   SET parent_id = mae.id
  FROM public.categories AS mae
 WHERE mae.slug = 'workshops-aulas'
   AND filha.slug = 'workshops'
   AND filha.parent_id IS DISTINCT FROM mae.id;

-- ─────────────────────────────────────────────────────────────
-- 5. Dados da empresa que o documento trouxe
-- ─────────────────────────────────────────────────────────────
-- O CNPJ fecha a pendência do contrato de adesão sem parte identificada
-- em /legal/termos. O número do CADASTUR não entra: o documento traz o
-- mesmo número como se fosse o registro, e registro turístico errado no ar
-- é problema com o Ministério, não detalhe de layout. Fica pendente.
INSERT INTO public.settings (key, value, description, is_public)
VALUES
  ('empresa.cnpj', '"60.937.280/0001-90"'::jsonb,
   'CNPJ da NeoSenses, do documento de reformulação (01/09/2026).', true),
  ('empresa.instagram', '"@neosenses"'::jsonb,
   'Perfil no Instagram.', true)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, description = EXCLUDED.description;

DO $bloco$
DECLARE
  raizes INTEGER;
  filhas INTEGER;
BEGIN
  SELECT count(*) INTO raizes FROM public.categories WHERE parent_id IS NULL AND is_active;
  SELECT count(*) INTO filhas FROM public.categories WHERE parent_id IS NOT NULL;
  RAISE NOTICE 'Migration 017: % categoria(s) de primeiro nível, % subcategoria(s).', raizes, filhas;
END;
$bloco$;
