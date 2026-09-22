-- ============================================================
-- NeoSenses — 001: Schema núcleo (conteúdo público)
-- ============================================================
-- Convenção do projeto:
--   • Identificadores (tabela/coluna) em inglês — segue o código.
--   • Comentários em português — segue o time.
--   • Texto multi-idioma em JSONB: {"pt": "...", "en": "...", "es": "..."}
--   • Toda alteração de schema entra por migration versionada. Nunca pelo Studio.
--
-- Idempotente: pode rodar de novo sem quebrar.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─────────────────────────────────────────────────────────────
-- Tipos
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  CREATE TYPE experience_status AS ENUM ('draft', 'published', 'archived', 'sold_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE lead_source AS ENUM ('website', 'whatsapp', 'concierge', 'journey_builder', 'referral', 'social', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE media_type AS ENUM ('image', 'video', 'pdf', 'document');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- Funções utilitárias
-- ─────────────────────────────────────────────────────────────

-- Mantém updated_at sempre correto sem depender do código da aplicação.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplica o trigger de updated_at em uma tabela sem repetir DDL.
CREATE OR REPLACE FUNCTION public.attach_updated_at(target_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON public.%I', target_table);
  EXECUTE format(
    'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.%I
     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
    target_table
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Perfis (espelha auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                 UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email              TEXT NOT NULL,
  full_name          TEXT,
  avatar_url         TEXT,
  phone              TEXT,
  role               user_role NOT NULL DEFAULT 'viewer',
  preferred_language TEXT NOT NULL DEFAULT 'pt',
  is_active          BOOLEAN NOT NULL DEFAULT true,
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT public.attach_updated_at('profiles');

-- Cria o profile automaticamente quando nasce um usuário no Auth.
-- SECURITY DEFINER porque roda no contexto do Auth, sem sessão do usuário.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Checagem de papel usada pelas policies.
-- SECURITY DEFINER é obrigatório: sem ele, uma policy em profiles que
-- consulta profiles entra em recursão infinita.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
      AND is_active = true
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- Geografia
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS countries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        JSONB NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  hero_image  TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT public.attach_updated_at('countries');

CREATE TABLE IF NOT EXISTS destinations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id  UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
  name        JSONB NOT NULL,
  slug        JSONB NOT NULL,
  description JSONB,
  hero_image  TEXT,
  gallery     UUID[],
  latitude    DECIMAL(10,7),
  longitude   DECIMAL(10,7),
  -- Contexto usado pelo Packing Assistant e pelo Concierge:
  climate     JSONB NOT NULL DEFAULT '{}',   -- {"tipo":"tropical","temp_min_c":18,"temp_max_c":32,"estacao_chuvosa":"dez-mar"}
  altitude_m  INTEGER,                       -- relevante p/ Machu Picchu, Himalaia
  timezone    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  seo         JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_destinations_country ON destinations(country_id);
CREATE INDEX IF NOT EXISTS idx_destinations_active  ON destinations(is_active);
SELECT public.attach_updated_at('destinations');

-- ─────────────────────────────────────────────────────────────
-- Categorias e facilitadores
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        JSONB NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description JSONB,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT public.attach_updated_at('categories');

CREATE TABLE IF NOT EXISTS facilitators (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  bio             JSONB,
  short_bio       JSONB,
  photo           TEXT,
  specializations TEXT[],
  social_links    JSONB NOT NULL DEFAULT '{}',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  seo             JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT public.attach_updated_at('facilitators');

-- ─────────────────────────────────────────────────────────────
-- Experiências
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            JSONB NOT NULL,
  slug             JSONB NOT NULL,
  description      JSONB,
  short_description JSONB,
  who_is_this_for  JSONB,
  hero_image       TEXT,
  hero_video       TEXT,
  gallery          UUID[],
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  destination_id   UUID REFERENCES destinations(id) ON DELETE SET NULL,
  duration_days    INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
  group_size_min   INTEGER,
  group_size_max   INTEGER,
  difficulty       difficulty_level NOT NULL DEFAULT 'all_levels',
  price_from       DECIMAL(10,2) CHECK (price_from IS NULL OR price_from >= 0),
  price_currency   TEXT NOT NULL DEFAULT 'BRL',
  price_note       JSONB,
  -- Sinais usados pelo Journey Builder e pelo Community Matching:
  intentions       TEXT[] NOT NULL DEFAULT '{}',  -- {meditacao, natureza, cultura_local, descanso, aventura}
  physical_demand  SMALLINT CHECK (physical_demand IS NULL OR physical_demand BETWEEN 1 AND 5),
  whatsapp_number  TEXT,
  status           experience_status NOT NULL DEFAULT 'draft',
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  seo              JSONB NOT NULL DEFAULT '{}',
  marketing        JSONB NOT NULL DEFAULT '{}',
  metadata         JSONB NOT NULL DEFAULT '{}',
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_size_coerente CHECK (
    group_size_min IS NULL OR group_size_max IS NULL OR group_size_min <= group_size_max
  )
);
CREATE INDEX IF NOT EXISTS idx_experiences_category    ON experiences(category_id);
CREATE INDEX IF NOT EXISTS idx_experiences_destination ON experiences(destination_id);
CREATE INDEX IF NOT EXISTS idx_experiences_status      ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_intentions  ON experiences USING GIN (intentions);
-- Busca por slug em qualquer idioma sem varrer a tabela inteira:
CREATE INDEX IF NOT EXISTS idx_experiences_slug_pt ON experiences ((slug->>'pt'));
CREATE INDEX IF NOT EXISTS idx_experiences_slug_en ON experiences ((slug->>'en'));
CREATE INDEX IF NOT EXISTS idx_experiences_slug_es ON experiences ((slug->>'es'));
SELECT public.attach_updated_at('experiences');

CREATE TABLE IF NOT EXISTS experience_facilitators (
  experience_id  UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  facilitator_id UUID NOT NULL REFERENCES facilitators(id) ON DELETE CASCADE,
  role           TEXT NOT NULL DEFAULT 'facilitator',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (experience_id, facilitator_id)
);

CREATE TABLE IF NOT EXISTS experience_dates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  price         DECIMAL(10,2) CHECK (price IS NULL OR price >= 0),
  spots_total   INTEGER CHECK (spots_total IS NULL OR spots_total >= 0),
  spots_taken   INTEGER NOT NULL DEFAULT 0 CHECK (spots_taken >= 0),
  -- Onde e quando o grupo se encontra. Sai direto na resposta do Concierge.
  meeting_point JSONB NOT NULL DEFAULT '{}',  -- {"local":"...","endereco":"...","horario":"...","instrucoes":{"pt":"..."}}
  status        experience_status NOT NULL DEFAULT 'published',
  notes         JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT periodo_coerente CHECK (end_date >= start_date),
  CONSTRAINT vagas_coerentes  CHECK (spots_total IS NULL OR spots_taken <= spots_total)
);
CREATE INDEX IF NOT EXISTS idx_exp_dates_experience ON experience_dates(experience_id);
CREATE INDEX IF NOT EXISTS idx_exp_dates_start      ON experience_dates(start_date);
SELECT public.attach_updated_at('experience_dates');

CREATE TABLE IF NOT EXISTS itinerary_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  day_number    INTEGER NOT NULL CHECK (day_number > 0),
  title         JSONB NOT NULL,
  description   JSONB,
  image         TEXT,
  location      TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (experience_id, day_number)
);
CREATE INDEX IF NOT EXISTS idx_itinerary_experience ON itinerary_days(experience_id);

CREATE TABLE IF NOT EXISTS experience_highlights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  icon          TEXT,
  title         JSONB NOT NULL,
  description   JSONB,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_highlights_experience ON experience_highlights(experience_id);

CREATE TABLE IF NOT EXISTS experience_inclusions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  text          JSONB NOT NULL,
  is_included   BOOLEAN NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_inclusions_experience ON experience_inclusions(experience_id);

CREATE TABLE IF NOT EXISTS experience_faqs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  question      JSONB NOT NULL,
  answer        JSONB NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_exp_faqs_experience ON experience_faqs(experience_id);

-- ─────────────────────────────────────────────────────────────
-- Blog
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        JSONB NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description JSONB,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          JSONB NOT NULL,
  slug           JSONB NOT NULL,
  content        JSONB,
  excerpt        JSONB,
  featured_image TEXT,
  author_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category_id    UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  reading_time   INTEGER,
  status         content_status NOT NULL DEFAULT 'draft',
  is_featured    BOOLEAN NOT NULL DEFAULT false,
  seo            JSONB NOT NULL DEFAULT '{}',
  published_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_status    ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug_pt   ON blog_posts ((slug->>'pt'));
SELECT public.attach_updated_at('blog_posts');

CREATE TABLE IF NOT EXISTS blog_tags (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_post_experiences (
  post_id       UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, experience_id)
);

-- ─────────────────────────────────────────────────────────────
-- Engajamento
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  photo         TEXT,
  location      TEXT,
  experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,
  quote         JSONB NOT NULL,
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  status        content_status NOT NULL DEFAULT 'draft',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_experience ON testimonials(experience_id);

CREATE TABLE IF NOT EXISTS faqs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   JSONB NOT NULL,
  answer     JSONB NOT NULL,
  category   TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  language        TEXT NOT NULL DEFAULT 'pt',
  source          TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- Mídia
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename          TEXT NOT NULL,
  original_filename TEXT,
  mime_type         TEXT NOT NULL,
  type              media_type NOT NULL,
  size_bytes        BIGINT,
  width             INTEGER,
  height            INTEGER,
  url               TEXT NOT NULL,
  thumbnail_url     TEXT,
  alt_text          JSONB,
  caption           JSONB,
  folder            TEXT NOT NULL DEFAULT '/',
  uploaded_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- Sistema
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT false,  -- só chave marcada assim é legível sem login
  updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  key         TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
