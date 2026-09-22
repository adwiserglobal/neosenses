-- ============================================================
-- NeoSenses — 016: os blocos que os modelos B2B usam e o schema não tinha
-- ============================================================
-- A 015 criou o enum `page_template` mas nenhum layout existia ainda.
-- Ao construí-los contra o conteúdo real dos três modelos que a equipe
-- aprovou (peru-sagrado, marrocos, rio-amazonas), quatro peças não
-- couberam em tabela nenhuma:
--
-- 1. O CHAPÉU do topo — "PARCERIA PARA TERAPEUTAS E FACILITADORAS ·
--    PERU". Vinha sendo derivado da categoria, o que dá a palavra errada
--    numa página cujo leitor não é o viajante.
--
-- 2. O FECHAMENTO — "O convite / Sinta o chamado do Peru Sagrado". Os
--    três modelos terminam assim, e é o bloco que leva à conversa.
--
-- 3. A DIVISÃO DA PARCERIA — "Você traz sua medicina / A NeoSenses cuida
--    da jornada". Duas listas lado a lado. Caberia à força em
--    `experience_inclusions`, que tem a mesma forma de duas colunas — mas
--    lá `is_included` quer dizer "está no preço", e um dia alguém somaria
--    o que a facilitadora traz como se fosse item de pacote.
--
-- 4. MAIS DE UMA GRADE de destaques na mesma página. Marrocos tem três:
--    por que o destino, vivências possíveis e diferenciais. Com uma
--    coluna só, as três viravam uma lista de 28 itens sem hierarquia.
--
-- Nada aqui é exclusivo do B2B: uma página B2C também pode ter chapéu,
-- fechamento e mais de uma grade. Só a tabela de parceria é do funil de
-- facilitador, e ela fica vazia nas outras.
--
-- Idempotente.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1 e 2. Chapéu e fechamento
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS hero_kicker   jsonb,
  ADD COLUMN IF NOT EXISTS closing_title jsonb,
  ADD COLUMN IF NOT EXISTS closing_text  jsonb;

COMMENT ON COLUMN public.experiences.hero_kicker IS
  'Linha curta em caixa alta acima do título, no topo da página. Vazio: o layout cai para a categoria (B2C) ou para o destino (B2B).';
COMMENT ON COLUMN public.experiences.closing_title IS
  'Título do bloco de fechamento, o último da página. Vazio: o bloco não é desenhado — melhor terminar sem convite do que com um convite genérico.';
COMMENT ON COLUMN public.experiences.closing_text IS
  'Texto do bloco de fechamento.';

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS hero_kicker       jsonb,
  ADD COLUMN IF NOT EXISTS long_description  jsonb;

COMMENT ON COLUMN public.destinations.long_description IS
  'Texto de corpo da página do destino. `description` continua sendo a linha curta que aparece no card da listagem — são coisas diferentes e estavam na mesma coluna.';

-- ─────────────────────────────────────────────────────────────
-- 3. As duas colunas da parceria
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partnership_side') THEN
    CREATE TYPE partnership_side AS ENUM ('facilitador', 'neosenses');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.experience_partnership (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  side          partnership_side NOT NULL,
  text          jsonb NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partnership_experience
  ON public.experience_partnership(experience_id);

COMMENT ON TABLE public.experience_partnership IS
  'As duas colunas do bloco de parceria nas páginas de facilitador: o que a facilitadora traz e o que a NeoSenses sustenta.';
COMMENT ON COLUMN public.experience_partnership.side IS
  'facilitador = coluna "Você traz". neosenses = coluna "A NeoSenses cuida de".';

-- ─────────────────────────────────────────────────────────────
-- 4. Mais de uma grade de destaques por página
-- ─────────────────────────────────────────────────────────────
-- Texto livre e não enum: cada página nova pode inventar a grade que
-- precisa sem migration. Quem lê agrupa pelo valor e mostra na ordem em
-- que os grupos aparecem.
ALTER TABLE public.experience_highlights
  ADD COLUMN IF NOT EXISTS grupo       text,
  ADD COLUMN IF NOT EXISTS grupo_titulo jsonb;

COMMENT ON COLUMN public.experience_highlights.grupo IS
  'Chave que separa as grades da mesma página (ex.: motivos, territorios, vivencias, diferenciais). NULL = a grade única de "Destaques", que é como as páginas B2C já funcionavam.';
COMMENT ON COLUMN public.experience_highlights.grupo_titulo IS
  'Título da grade, repetido nas linhas do mesmo grupo. O layout usa o primeiro que encontrar.';

CREATE INDEX IF NOT EXISTS idx_highlights_grupo
  ON public.experience_highlights(experience_id, grupo);

-- ─────────────────────────────────────────────────────────────
-- RLS — a mesma regra das outras tabelas de conteúdo
-- ─────────────────────────────────────────────────────────────
-- `experiencia_publicada()` já existe (005) e é o que garante que
-- rascunho não vaze. Tabela nova sem policy fica invisível para todos,
-- o que esconderia o bloco sem erro nenhum: o site apareceria correto e
-- com a parceria em branco.
ALTER TABLE public.experience_partnership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_partnership FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pub_partnership" ON public.experience_partnership;
CREATE POLICY "pub_partnership" ON public.experience_partnership
  FOR SELECT TO anon, authenticated
  USING (public.experiencia_publicada(experience_id));

DROP POLICY IF EXISTS "staff_all" ON public.experience_partnership;
CREATE POLICY "staff_all" ON public.experience_partnership
  FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DO $$
BEGIN
  RAISE NOTICE 'Migration 016: chapéu, fechamento, parceria e grades nomeadas no lugar.';
END;
$$;
