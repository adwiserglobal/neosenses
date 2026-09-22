-- ============================================================
-- NeoSenses — 015: templates de página e funil B2B
-- ============================================================
-- Duas coisas que o schema não previa.
--
-- 1. TEMPLATE. Toda experiência renderiza com o mesmo layout. Quatro
--    destinos diferentes com a mesma estrutura visual fazem o catálogo
--    parecer menor do que é — e impedem que uma jornada de 15 dias com
--    roteiro dia a dia tenha tratamento diferente de um retiro de fim de
--    semana.
--
-- 2. PÚBLICO. Os modelos que a equipe passou (peru-sagrado, marrocos,
--    rio-amazonas na Netlify) não vendem para o viajante: vendem para
--    TERAPEUTAS levarem os grupos delas. "Você conduz o grupo. A NeoSenses
--    sustenta a jornada." É outro funil — não tem data, não tem vaga, não
--    tem botão de reserva. Tem conversa com consultora.
--
--    Sem esta coluna, o site trataria os dois como a mesma coisa e mostraria
--    "3 vagas restantes" numa página cujo leitor é quem vai FORMAR o grupo.
--
-- Idempotente.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Público-alvo
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audience_type') THEN
    CREATE TYPE audience_type AS ENUM ('viajante', 'facilitador');
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Template
-- ─────────────────────────────────────────────────────────────
-- Nomes descrevem a ESTRUTURA do conteúdo, não a aparência. "imersivo" diz
-- que a página é conduzida por imagem grande e texto curto; "roteiro" diz
-- que o dia a dia é o eixo. Nome de cor ou de estilo envelhece na primeira
-- troca de paleta e deixa de dizer quando usar.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_template') THEN
    CREATE TYPE page_template AS ENUM (
      'classico',   -- B2C: coluna de conteúdo + barra lateral com datas e reserva
      'roteiro',    -- B2C: dia a dia como eixo, para jornadas longas
      'territorio', -- B2B: territórios e vivências que podem compor o retiro
      'convite'     -- B2B: imagem grande, texto curto, conversa com consultora
    );
  END IF;
END;
$$;

ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS audience audience_type  NOT NULL DEFAULT 'viajante',
  ADD COLUMN IF NOT EXISTS template page_template  NOT NULL DEFAULT 'classico';

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS template page_template NOT NULL DEFAULT 'classico';

CREATE INDEX IF NOT EXISTS idx_experiences_audience ON public.experiences(audience);

COMMENT ON COLUMN public.experiences.audience IS
  'viajante = B2C, com data, vaga e reserva. facilitador = B2B, para quem leva o próprio grupo: sem data e sem reserva, o caminho é falar com a consultora.';
COMMENT ON COLUMN public.experiences.template IS
  'Layout da página. classico e roteiro servem ao B2C; territorio e convite ao B2B.';

-- ─────────────────────────────────────────────────────────────
-- Moeda
-- ─────────────────────────────────────────────────────────────
-- A equipe decidiu: preço só em real. O site antigo publicava a mesma viagem
-- em BRL numa seção e em USD noutra, para o mesmo quarto duplo — o tipo de
-- divergência que só aparece quando o cliente reclama.
INSERT INTO public.settings (key, value, description, is_public)
VALUES (
  'site.moeda',
  '"BRL"'::jsonb,
  'Moeda única do site. Valor em outra moeda não é exibido — é convertido antes de cadastrar, ou não entra.',
  true
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, description = EXCLUDED.description;

DO $$
DECLARE
  qtd INTEGER;
BEGIN
  SELECT count(*) INTO qtd FROM public.experiences;
  RAISE NOTICE 'Migration 015: % experiência(s) marcadas como viajante/classico por padrão.', qtd;
END;
$$;
