-- ============================================================
-- NeoSenses — 004: Journey Builder, Packing Assistant, Community Matching
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. AI Journey Builder
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  CREATE TYPE journey_status AS ENUM ('draft', 'saved', 'shared', 'converted', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ai_journeys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  visitor_id      TEXT NOT NULL,

  -- O que o visitante respondeu no questionário.
  -- {"dias":10,"interesses":["natureza","meditacao","cultura_local"],
  --  "periodo":"2026-09","orcamento":"medio","viaja_sozinho":true,
  --  "experiencia_previa":"primeira_vez","restricoes":["vegetariano"]}
  input           JSONB NOT NULL,

  -- Roteiro gerado, dia a dia.
  -- {"dias":[{"dia":1,"titulo":{...},"descricao":{...},"experience_id":"uuid|null",
  --           "tipo":"experiencia_neosenses|extensao_sugerida"}]}
  itinerary       JSONB NOT NULL DEFAULT '{}',
  summary         TEXT,
  language        TEXT NOT NULL DEFAULT 'pt',
  status          journey_status NOT NULL DEFAULT 'draft',

  -- Permite abrir o roteiro depois sem login (URL longa e aleatória).
  access_token    UUID NOT NULL DEFAULT gen_random_uuid(),

  ai_provider     TEXT,
  ai_model        TEXT,
  tokens_used     INTEGER,
  generation_ms   INTEGER,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_journeys_token   ON ai_journeys(access_token);
CREATE INDEX IF NOT EXISTS idx_journeys_visitor       ON ai_journeys(visitor_id);
CREATE INDEX IF NOT EXISTS idx_journeys_created       ON ai_journeys(created_at DESC);
SELECT public.attach_updated_at('ai_journeys');

-- Experiências reais citadas no roteiro. Guardar em tabela (e não só no
-- JSONB) permite medir conversão: quantos roteiros viraram reserva.
CREATE TABLE IF NOT EXISTS ai_journey_experiences (
  journey_id    UUID NOT NULL REFERENCES ai_journeys(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  day_from      SMALLINT,
  day_to        SMALLINT,
  position      SMALLINT NOT NULL DEFAULT 0,
  reason        TEXT,
  PRIMARY KEY (journey_id, experience_id),
  CONSTRAINT dias_coerentes CHECK (day_from IS NULL OR day_to IS NULL OR day_from <= day_to)
);

-- ─────────────────────────────────────────────────────────────
-- 2. AI Packing Assistant
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packing_lists (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         UUID REFERENCES bookings(id) ON DELETE CASCADE,
  lead_id            UUID REFERENCES leads(id) ON DELETE SET NULL,
  experience_id      UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  experience_date_id UUID REFERENCES experience_dates(id) ON DELETE SET NULL,

  traveler_name      TEXT,
  traveler_email     TEXT,
  -- O viajante não tem login. O token é a credencial de acesso à lista.
  access_token       UUID NOT NULL DEFAULT gen_random_uuid(),

  language           TEXT NOT NULL DEFAULT 'pt',
  -- Contexto congelado no momento da geração (clima, altitude, meses).
  -- Sem isso não dá para explicar depois por que um item entrou na lista.
  context            JSONB NOT NULL DEFAULT '{}',
  generated_by       TEXT NOT NULL DEFAULT 'template' CHECK (generated_by IN ('template', 'ai', 'manual')),
  ai_model           TEXT,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_packing_lists_token ON packing_lists(access_token);
CREATE INDEX IF NOT EXISTS idx_packing_lists_booking     ON packing_lists(booking_id);
CREATE INDEX IF NOT EXISTS idx_packing_lists_experience  ON packing_lists(experience_id);
SELECT public.attach_updated_at('packing_lists');

-- Checklist interativo.
CREATE TABLE IF NOT EXISTS packing_list_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id         UUID NOT NULL REFERENCES packing_lists(id) ON DELETE CASCADE,
  -- Nulo quando o item foi sugerido pela IA e não existe no catálogo.
  catalog_item_id UUID REFERENCES packing_catalog_items(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  category        packing_category NOT NULL DEFAULT 'outro',
  quantity        SMALLINT,
  is_essential    BOOLEAN NOT NULL DEFAULT false,
  -- Por que este item está aqui ("altitude acima de 2.500 m").
  reason          TEXT,
  is_checked      BOOLEAN NOT NULL DEFAULT false,
  checked_at      TIMESTAMPTZ,
  note            TEXT,
  -- Item que o próprio viajante acrescentou.
  added_by_traveler BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_packing_items_list ON packing_list_items(list_id, sort_order);

-- checked_at sempre coerente com is_checked, independente do que o cliente enviar.
CREATE OR REPLACE FUNCTION public.sincronizar_checked_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_checked AND (OLD.is_checked IS DISTINCT FROM NEW.is_checked) THEN
    NEW.checked_at := now();
  ELSIF NOT NEW.is_checked THEN
    NEW.checked_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_packing_checked_at ON packing_list_items;
CREATE TRIGGER trg_packing_checked_at
  BEFORE UPDATE ON packing_list_items
  FOR EACH ROW EXECUTE FUNCTION public.sincronizar_checked_at();

-- ─────────────────────────────────────────────────────────────
-- 3. AI Community Matching
-- ─────────────────────────────────────────────────────────────
-- LGPD: aproximar pessoas cruza dado pessoal. Regras aplicadas aqui:
--   • Entrar no matching é opt-in explícito (consent_matching).
--   • O consentimento é revogável a qualquer momento (consent_revoked_at).
--   • Contato (e-mail/telefone) só é exposto com share_contact = true.
--   • Sem consentimento válido o perfil não aparece em nenhuma busca —
--     garantido por índice parcial e pelas policies, não pelo front.
DO $$
BEGIN
  CREATE TYPE traveler_type AS ENUM (
    'viaja_sozinho', 'casal', 'grupo_amigos', 'familia',
    'terapeuta', 'praticante_yoga', 'iniciante_meditacao',
    'praticante_experiente', 'facilitador', 'outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE match_status AS ENUM ('suggested', 'accepted', 'declined', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS traveler_profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id         UUID REFERENCES bookings(id) ON DELETE CASCADE,
  lead_id            UUID REFERENCES leads(id) ON DELETE SET NULL,
  experience_date_id UUID REFERENCES experience_dates(id) ON DELETE CASCADE,

  display_name       TEXT NOT NULL,
  email              TEXT,
  phone              TEXT,
  avatar_url         TEXT,
  bio                TEXT,
  city               TEXT,
  traveler_types     traveler_type[] NOT NULL DEFAULT '{}',
  interests          TEXT[] NOT NULL DEFAULT '{}',
  languages          TEXT[] NOT NULL DEFAULT '{pt}',
  age_range          TEXT,   -- faixa, nunca data de nascimento

  -- ── Consentimento ──────────────────────────────────────────
  consent_matching     BOOLEAN NOT NULL DEFAULT false,
  consent_matching_at  TIMESTAMPTZ,
  consent_revoked_at   TIMESTAMPTZ,
  share_contact        BOOLEAN NOT NULL DEFAULT false,
  -- group_only: aparece só para quem vai na mesma data.
  -- matched_only: aparece só para quem já deu match mútuo.
  visibility           TEXT NOT NULL DEFAULT 'group_only'
                       CHECK (visibility IN ('hidden', 'group_only', 'matched_only')),

  access_token       UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Consentimento marcado sem data é consentimento não comprovável.
  CONSTRAINT consentimento_datado CHECK (
    consent_matching = false OR consent_matching_at IS NOT NULL
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_traveler_profiles_token ON traveler_profiles(access_token);
CREATE INDEX IF NOT EXISTS idx_traveler_date ON traveler_profiles(experience_date_id);
-- Só perfis com consentimento vivo são elegíveis. O matching lê daqui.
CREATE INDEX IF NOT EXISTS idx_traveler_elegivel
  ON traveler_profiles(experience_date_id)
  WHERE consent_matching = true AND consent_revoked_at IS NULL AND visibility <> 'hidden';

CREATE OR REPLACE FUNCTION public.registrar_consentimento_matching()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Usa TG_OP, nunca "OLD IS NULL". Em PL/pgSQL um record só é
  -- considerado NOT NULL quando TODOS os campos são não-nulos — um perfil
  -- com bio ou telefone em branco fazia o teste falhar em silêncio e a
  -- revogação de consentimento não acontecia.
  IF TG_OP = 'INSERT' THEN
    IF NEW.consent_matching THEN
      NEW.consent_matching_at := now();
      NEW.consent_revoked_at  := NULL;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Concedeu agora.
    IF NEW.consent_matching AND OLD.consent_matching IS DISTINCT FROM true THEN
      NEW.consent_matching_at := now();
      NEW.consent_revoked_at  := NULL;
    END IF;
    -- Revogou: carimba a data e some do matching na mesma transação.
    IF OLD.consent_matching AND NOT NEW.consent_matching THEN
      NEW.consent_revoked_at := now();
      NEW.visibility := 'hidden';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consentimento_matching ON traveler_profiles;
CREATE TRIGGER trg_consentimento_matching
  BEFORE INSERT OR UPDATE ON traveler_profiles
  FOR EACH ROW EXECUTE FUNCTION public.registrar_consentimento_matching();

SELECT public.attach_updated_at('traveler_profiles');

-- Quando o consentimento cai, os matches daquele perfil morrem junto.
CREATE OR REPLACE FUNCTION public.expirar_matches_ao_revogar()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.consent_revoked_at IS NOT NULL AND OLD.consent_revoked_at IS NULL THEN
    UPDATE public.community_matches
       SET status = 'expired'
     WHERE (profile_a_id = NEW.id OR profile_b_id = NEW.id)
       AND status IN ('suggested', 'accepted');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS community_matches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_date_id UUID REFERENCES experience_dates(id) ON DELETE CASCADE,
  profile_a_id       UUID NOT NULL REFERENCES traveler_profiles(id) ON DELETE CASCADE,
  profile_b_id       UUID NOT NULL REFERENCES traveler_profiles(id) ON DELETE CASCADE,
  score              SMALLINT CHECK (score BETWEEN 0 AND 100),
  -- Por que a IA aproximou os dois. Mostrado ao viajante — matching
  -- sem explicação parece invasivo.
  reasons            JSONB NOT NULL DEFAULT '{}',
  status             match_status NOT NULL DEFAULT 'suggested',
  a_accepted         BOOLEAN,
  b_accepted         BOOLEAN,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT nao_casar_consigo CHECK (profile_a_id <> profile_b_id)
);
-- Par único independente da ordem: (A,B) e (B,A) são o mesmo match.
CREATE UNIQUE INDEX IF NOT EXISTS uq_match_par ON community_matches (
  LEAST(profile_a_id, profile_b_id),
  GREATEST(profile_a_id, profile_b_id),
  COALESCE(experience_date_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
CREATE INDEX IF NOT EXISTS idx_matches_date ON community_matches(experience_date_id);
SELECT public.attach_updated_at('community_matches');

-- Criado depois de community_matches existir (a função referencia a tabela).
DROP TRIGGER IF EXISTS trg_expirar_matches ON traveler_profiles;
CREATE TRIGGER trg_expirar_matches
  AFTER UPDATE ON traveler_profiles
  FOR EACH ROW EXECUTE FUNCTION public.expirar_matches_ao_revogar();
