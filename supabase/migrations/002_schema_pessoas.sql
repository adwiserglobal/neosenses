-- ============================================================
-- NeoSenses — 002: Dados de pessoas e negócio
-- ============================================================
-- ATENÇÃO: tudo neste arquivo contém dado pessoal (LGPD).
-- Nenhuma destas tabelas pode ser legível pela chave pública do site.
-- O acesso é definido em 005_rls_policies.sql — leia antes de mexer.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Leads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT,
  email                 TEXT,
  phone                 TEXT,
  country               TEXT,
  experience_id         UUID REFERENCES experiences(id) ON DELETE SET NULL,
  preferred_destination TEXT,
  budget                TEXT,
  desired_month         TEXT,
  travelers_count       INTEGER CHECK (travelers_count IS NULL OR travelers_count > 0),
  message               TEXT,
  source                lead_source NOT NULL DEFAULT 'website',
  status                TEXT NOT NULL DEFAULT 'new',
  assigned_to           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Um lead sem forma de contato é lixo no CRM.
  CONSTRAINT lead_tem_contato CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email   ON leads(lower(email));
SELECT public.attach_updated_at('leads');

-- ─────────────────────────────────────────────────────────────
-- Reservas
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code     TEXT UNIQUE NOT NULL,
  lead_id            UUID REFERENCES leads(id) ON DELETE SET NULL,
  experience_id      UUID NOT NULL REFERENCES experiences(id) ON DELETE RESTRICT,
  experience_date_id UUID REFERENCES experience_dates(id) ON DELETE SET NULL,
  customer_name      TEXT NOT NULL,
  customer_email     TEXT NOT NULL,
  customer_phone     TEXT,
  travelers_count    INTEGER NOT NULL DEFAULT 1 CHECK (travelers_count > 0),
  total_price        DECIMAL(10,2) CHECK (total_price IS NULL OR total_price >= 0),
  currency           TEXT NOT NULL DEFAULT 'BRL',
  status             booking_status NOT NULL DEFAULT 'pending',
  notes              TEXT,
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_experience ON bookings(experience_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date       ON bookings(experience_date_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_email      ON bookings(lower(customer_email));
SELECT public.attach_updated_at('bookings');

-- Gera o código da reserva no banco.
-- Fazer isso na aplicação com Date.now() gera colisão sob concorrência.
CREATE SEQUENCE IF NOT EXISTS booking_reference_seq START 1000;

CREATE OR REPLACE FUNCTION public.gerar_reference_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference_code IS NULL OR NEW.reference_code = '' THEN
    NEW.reference_code := 'NS-' || to_char(now(), 'YY') || '-' ||
                          lpad(nextval('booking_reference_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_reference ON bookings;
CREATE TRIGGER trg_booking_reference
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.gerar_reference_code();

-- ─────────────────────────────────────────────────────────────
-- Concierge: conversas e mensagens
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id          TEXT NOT NULL,
  profile_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  language            TEXT NOT NULL DEFAULT 'pt',
  summary             TEXT,
  lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL,
  is_escalated        BOOLEAN NOT NULL DEFAULT false,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  metadata            JSONB NOT NULL DEFAULT '{}',
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at            TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor  ON conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_started  ON conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_language ON conversations(language);
SELECT public.attach_updated_at('conversations');

CREATE TABLE IF NOT EXISTS messages (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id        UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role                   TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content                TEXT NOT NULL,
  recommended_experiences UUID[],
  metadata               JSONB NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- ─────────────────────────────────────────────────────────────
-- Concierge: captação, recomendação, feedback
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_lead_captures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id       UUID REFERENCES conversations(id) ON DELETE SET NULL,
  name                  TEXT,
  email                 TEXT,
  phone                 TEXT,
  preferred_destination TEXT,
  preferred_period      TEXT,
  language              TEXT NOT NULL DEFAULT 'pt',
  source_page           TEXT,
  interests             TEXT[],
  raw_context           TEXT,
  message               TEXT,
  consent_at            TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'new',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_captures_conv    ON ai_lead_captures(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_captures_created ON ai_lead_captures(created_at DESC);
-- Um lead por conversa. Evita duplicata sob concorrência — o SELECT-antes-do-INSERT
-- da aplicação não protege contra duas requisições simultâneas.
--
-- Sem cláusula WHERE de propósito: ON CONFLICT (conversation_id) não casa com
-- índice parcial, e o upsert falha com "no unique or exclusion constraint
-- matching the ON CONFLICT specification". O índice completo funciona igual
-- aqui, porque no Postgres valores NULL não conflitam entre si.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_captures_conv
  ON ai_lead_captures(conversation_id);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id       UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id            UUID REFERENCES messages(id) ON DELETE CASCADE,
  experience_id         UUID REFERENCES experiences(id) ON DELETE CASCADE,
  destination_id        UUID REFERENCES destinations(id) ON DELETE CASCADE,
  recommendation_reason TEXT,
  position              INTEGER NOT NULL DEFAULT 0,
  was_clicked           BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_recs_conv ON ai_recommendations(conversation_id);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id      UUID REFERENCES messages(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating IN (-1, 1)),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_conv ON ai_feedback(conversation_id);
-- Um voto por mensagem: trocar de ideia atualiza, não acumula.
-- Índice completo pelo mesmo motivo do uq_ai_captures_conv acima.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_feedback_message
  ON ai_feedback(message_id);

-- ─────────────────────────────────────────────────────────────
-- Base de conhecimento do Concierge (texto livre curado)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_knowledge_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL DEFAULT 'general',
  entity_id   UUID,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'about',
  content     TEXT NOT NULL,
  source_url  TEXT,
  language    TEXT NOT NULL DEFAULT 'pt',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_lang     ON ai_knowledge_documents(language, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_entity   ON ai_knowledge_documents(entity_type, entity_id);
SELECT public.attach_updated_at('ai_knowledge_documents');
