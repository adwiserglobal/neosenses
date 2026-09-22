-- ============================================================
-- NeoSenses — 008: manifestação de interesse e lista de espera
-- ============================================================
-- Fecha dois buracos do funil que a auditoria apontou:
--
--   1. A página de uma saída lotada dizia "Esgotado — entre na lista de
--      espera", e não havia lista de espera nenhuma. A demanda de turma
--      cheia — o melhor sinal que existe — se perdia.
--
--   2. Não havia como dizer "quero esta data" no site. O único caminho era
--      o WhatsApp, o que exige que a pessoa esteja disposta a falar com
--      alguém naquele momento.
-- ============================================================

DO $$
BEGIN
  CREATE TYPE interesse_situacao AS ENUM ('novo', 'contatado', 'convertido', 'desistiu');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- Interesse numa saída
-- ─────────────────────────────────────────────────────────────
-- Diferente de `bookings`: aqui não há compromisso nem pagamento. É alguém
-- levantando a mão. Virar reserva é decisão da equipe, no contato.
CREATE TABLE IF NOT EXISTS experience_interests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id      UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  -- Nulo quando a pessoa quer a experiência mas nenhuma data serve.
  experience_date_id UUID REFERENCES experience_dates(id) ON DELETE SET NULL,
  lead_id            UUID REFERENCES leads(id) ON DELETE SET NULL,

  name               TEXT NOT NULL,
  email              TEXT NOT NULL,
  phone              TEXT,
  travelers_count    SMALLINT NOT NULL DEFAULT 1 CHECK (travelers_count > 0),
  message            TEXT,

  -- true quando a saída escolhida já estava lotada. Separa "quero ir" de
  -- "quero ir e não coube": a segunda mede demanda reprimida, que é o que
  -- justifica abrir turma nova.
  lista_de_espera    BOOLEAN NOT NULL DEFAULT false,

  situacao           interesse_situacao NOT NULL DEFAULT 'novo',
  origem             TEXT NOT NULL DEFAULT 'site',
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interesses_experiencia ON experience_interests(experience_id);
CREATE INDEX IF NOT EXISTS idx_interesses_data        ON experience_interests(experience_date_id);
CREATE INDEX IF NOT EXISTS idx_interesses_situacao    ON experience_interests(situacao, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interesses_espera      ON experience_interests(experience_date_id)
  WHERE lista_de_espera = true;

-- A mesma pessoa não entra duas vezes na mesma saída. Sem isto, quem clica
-- duas vezes vira dois registros e a contagem de demanda mente.
--
-- Colunas simples, sem COALESCE nem lower(): `ON CONFLICT` não casa com
-- índice sobre expressão, e o upsert falharia com "no unique or exclusion
-- constraint matching the ON CONFLICT specification" — o mesmo erro que já
-- apareceu em ai_feedback e ai_lead_captures nesta base.
--
-- NULLS NOT DISTINCT faz o Postgres tratar dois NULL como iguais, que é o que
-- se quer aqui: "interesse na experiência, sem data escolhida" também deve
-- ser único por pessoa. Sem isso, NULLs nunca conflitam e a duplicata passa.
--
-- O e-mail é normalizado para minúsculas na aplicação antes de gravar.
CREATE UNIQUE INDEX IF NOT EXISTS uq_interesse_pessoa_saida
  ON experience_interests (experience_id, experience_date_id, email)
  NULLS NOT DISTINCT;

SELECT public.attach_updated_at('experience_interests');

-- ─────────────────────────────────────────────────────────────
-- Segurança
-- ─────────────────────────────────────────────────────────────
ALTER TABLE experience_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_interests FORCE ROW LEVEL SECURITY;

-- Dado pessoal: nenhuma policy para anon, como o resto da tabela de gente.
-- A escrita vem do servidor com service_role, depois de validar.
DROP POLICY IF EXISTS admin_all ON experience_interests;
CREATE POLICY admin_all ON experience_interests
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Demanda por saída, para o painel
-- ─────────────────────────────────────────────────────────────
-- Responde de uma vez: quantos querem, quantos não couberam, e qual saída
-- justifica abrir turma nova.
CREATE OR REPLACE FUNCTION public.demanda_por_saida()
RETURNS TABLE (
  experience_id      UUID,
  experience_date_id UUID,
  titulo             TEXT,
  inicio             DATE,
  vagas_restantes    INTEGER,
  interessados       BIGINT,
  em_espera          BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    e.id,
    d.id,
    coalesce(e.title->>'pt', e.title->>'en', '(sem título)'),
    d.start_date,
    CASE WHEN d.spots_total IS NULL THEN NULL
         ELSE greatest(0, d.spots_total - d.spots_taken) END,
    count(i.id) FILTER (WHERE i.situacao <> 'desistiu'),
    count(i.id) FILTER (WHERE i.lista_de_espera AND i.situacao <> 'desistiu')
  FROM experiences e
  JOIN experience_dates d ON d.experience_id = e.id
  LEFT JOIN experience_interests i ON i.experience_date_id = d.id
  WHERE d.start_date >= CURRENT_DATE
  GROUP BY e.id, d.id, e.title, d.start_date, d.spots_total, d.spots_taken
  ORDER BY count(i.id) FILTER (WHERE i.lista_de_espera) DESC, d.start_date;
$$;

REVOKE ALL ON FUNCTION public.demanda_por_saida() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.demanda_por_saida() TO authenticated, service_role;
