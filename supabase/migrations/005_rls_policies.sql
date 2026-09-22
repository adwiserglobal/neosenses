-- ============================================================
-- NeoSenses — 005: Row Level Security
-- ============================================================
-- MODELO DE SEGURANÇA (ler antes de alterar qualquer policy)
--
--   anon           → a chave pública, que vai no bundle JS do site.
--                    Trate como se estivesse publicada num outdoor.
--                    Pode: LER conteúdo publicado.
--                    Não pode: ler dado pessoal, escrever nada.
--
--   authenticated  → equipe logada no /admin. Acesso conforme profiles.role.
--
--   service_role   → o servidor (API routes / server actions).
--                    Ignora RLS por definição. É por aqui que TODA escrita
--                    do site acontece, com validação no servidor.
--
-- Regra prática: se a resposta a "essa linha pode aparecer num outdoor?"
-- for não, ela não recebe policy para anon. Sem exceção.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. RLS ligado em TODA tabela do schema public
-- ─────────────────────────────────────────────────────────────
-- Feito em laço de propósito: tabela nova criada amanhã e esquecida aqui
-- ficaria aberta ao mundo. Rodar este bloco de novo fecha qualquer buraco.
DO $$
DECLARE t RECORD;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t.relname);
  END LOOP;
END $$;

-- FORCE aplica RLS até para o dono da tabela. service_role continua
-- passando (tem BYPASSRLS), mas um script rodado como postgres não
-- fura a política sem perceber.

-- ─────────────────────────────────────────────────────────────
-- 2. Helper: a experiência está publicada?
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.experiencia_publicada(exp_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.experiences
    WHERE id = exp_id AND status = 'published'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Conteúdo público — leitura liberada
-- ─────────────────────────────────────────────────────────────

-- Geografia e taxonomia
DROP POLICY IF EXISTS pub_countries ON countries;
CREATE POLICY pub_countries ON countries
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS pub_destinations ON destinations;
CREATE POLICY pub_destinations ON destinations
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS pub_categories ON categories;
CREATE POLICY pub_categories ON categories
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS pub_facilitators ON facilitators;
CREATE POLICY pub_facilitators ON facilitators
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- Experiências e seus filhos
DROP POLICY IF EXISTS pub_experiences ON experiences;
CREATE POLICY pub_experiences ON experiences
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS pub_experience_dates ON experience_dates;
CREATE POLICY pub_experience_dates ON experience_dates
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND public.experiencia_publicada(experience_id));

DROP POLICY IF EXISTS pub_itinerary ON itinerary_days;
CREATE POLICY pub_itinerary ON itinerary_days
  FOR SELECT TO anon, authenticated USING (public.experiencia_publicada(experience_id));

DROP POLICY IF EXISTS pub_highlights ON experience_highlights;
CREATE POLICY pub_highlights ON experience_highlights
  FOR SELECT TO anon, authenticated USING (public.experiencia_publicada(experience_id));

DROP POLICY IF EXISTS pub_inclusions ON experience_inclusions;
CREATE POLICY pub_inclusions ON experience_inclusions
  FOR SELECT TO anon, authenticated USING (public.experiencia_publicada(experience_id));

DROP POLICY IF EXISTS pub_experience_faqs ON experience_faqs;
CREATE POLICY pub_experience_faqs ON experience_faqs
  FOR SELECT TO anon, authenticated USING (public.experiencia_publicada(experience_id));

DROP POLICY IF EXISTS pub_experience_facilitators ON experience_facilitators;
CREATE POLICY pub_experience_facilitators ON experience_facilitators
  FOR SELECT TO anon, authenticated USING (public.experiencia_publicada(experience_id));

DROP POLICY IF EXISTS pub_experience_packing ON experience_packing_items;
CREATE POLICY pub_experience_packing ON experience_packing_items
  FOR SELECT TO anon, authenticated USING (public.experiencia_publicada(experience_id));

-- Blog
DROP POLICY IF EXISTS pub_blog_posts ON blog_posts;
CREATE POLICY pub_blog_posts ON blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));

DROP POLICY IF EXISTS pub_blog_categories ON blog_categories;
CREATE POLICY pub_blog_categories ON blog_categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS pub_blog_tags ON blog_tags;
CREATE POLICY pub_blog_tags ON blog_tags
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS pub_blog_post_tags ON blog_post_tags;
CREATE POLICY pub_blog_post_tags ON blog_post_tags
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS pub_blog_post_experiences ON blog_post_experiences;
CREATE POLICY pub_blog_post_experiences ON blog_post_experiences
  FOR SELECT TO anon, authenticated USING (true);

-- Engajamento e conhecimento
DROP POLICY IF EXISTS pub_testimonials ON testimonials;
CREATE POLICY pub_testimonials ON testimonials
  FOR SELECT TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS pub_faqs ON faqs;
CREATE POLICY pub_faqs ON faqs
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS pub_travel_guides ON travel_guides;
CREATE POLICY pub_travel_guides ON travel_guides
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS pub_packing_catalog ON packing_catalog_items;
CREATE POLICY pub_packing_catalog ON packing_catalog_items
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS pub_media ON media;
CREATE POLICY pub_media ON media
  FOR SELECT TO anon, authenticated USING (true);

-- Configuração: só o que foi marcado como público.
DROP POLICY IF EXISTS pub_settings ON settings;
CREATE POLICY pub_settings ON settings
  FOR SELECT TO anon, authenticated USING (is_public = true);

DROP POLICY IF EXISTS pub_feature_flags ON feature_flags;
CREATE POLICY pub_feature_flags ON feature_flags
  FOR SELECT TO anon, authenticated USING (true);

-- ─────────────────────────────────────────────────────────────
-- 4. Dado pessoal — nenhuma policy para anon. De propósito.
-- ─────────────────────────────────────────────────────────────
-- leads, bookings, conversations, messages, ai_lead_captures,
-- ai_recommendations, ai_feedback, ai_knowledge_documents, audit_logs,
-- newsletter_subscribers, ai_journeys, ai_journey_experiences,
-- packing_lists, packing_list_items, traveler_profiles, community_matches
--
-- Com RLS ligado e zero policy, o resultado para anon é sempre vazio.
-- O acesso legítimo acontece:
--   • pelo servidor, com service_role (bypassa RLS);
--   • pelo /admin, pelas policies de staff abaixo.
--
-- O viajante acessa a própria lista de bagagem / roteiro por access_token,
-- validado no servidor. O token nunca vira credencial de banco.

-- ─────────────────────────────────────────────────────────────
-- 5. Perfis
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS profiles_self_select ON profiles;
CREATE POLICY profiles_self_select ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_self_update ON profiles;
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Só admin cria e remove conta de equipe.
DROP POLICY IF EXISTS profiles_admin_insert ON profiles;
CREATE POLICY profiles_admin_insert ON profiles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_admin_delete ON profiles;
CREATE POLICY profiles_admin_delete ON profiles
  FOR DELETE TO authenticated USING (public.is_admin());

-- Trava a escalação de privilégio: ninguém vira admin sozinho.
-- Um editor que edite o próprio perfil não consegue mudar o campo role.
CREATE OR REPLACE FUNCTION public.impedir_escalacao_de_papel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Alteração de papel permitida apenas para administradores';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_escalacao ON profiles;
CREATE TRIGGER trg_impedir_escalacao
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.impedir_escalacao_de_papel();

-- ─────────────────────────────────────────────────────────────
-- 6. Painel administrativo
-- ─────────────────────────────────────────────────────────────
-- Editor e admin gerenciam conteúdo. Só admin toca em dado pessoal
-- e em configuração do sistema.
DO $$
DECLARE t TEXT;
BEGIN
  -- Conteúdo: admin + editor
  FOREACH t IN ARRAY ARRAY[
    'countries', 'destinations', 'categories', 'facilitators',
    'experiences', 'experience_dates', 'itinerary_days',
    'experience_highlights', 'experience_inclusions', 'experience_faqs',
    'experience_facilitators', 'experience_packing_items',
    'blog_posts', 'blog_categories', 'blog_tags', 'blog_post_tags',
    'blog_post_experiences', 'testimonials', 'faqs', 'media',
    'travel_guides', 'packing_catalog_items', 'ai_knowledge_documents'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS staff_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY staff_all ON public.%I FOR ALL TO authenticated
         USING (public.is_staff()) WITH CHECK (public.is_staff())', t
    );
  END LOOP;

  -- Dado pessoal e sistema: só admin
  FOREACH t IN ARRAY ARRAY[
    'leads', 'bookings', 'conversations', 'messages',
    'ai_lead_captures', 'ai_recommendations', 'ai_feedback',
    'newsletter_subscribers', 'audit_logs', 'settings', 'feature_flags',
    'ai_journeys', 'ai_journey_experiences',
    'packing_lists', 'packing_list_items',
    'traveler_profiles', 'community_matches'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_all ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY admin_all ON public.%I FOR ALL TO authenticated
         USING (public.is_admin()) WITH CHECK (public.is_admin())', t
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 7. Conferência — deve retornar zero linhas
-- ─────────────────────────────────────────────────────────────
-- Lista tabela com dado pessoal que tenha ganhado acesso anônimo.
-- Qualquer linha aqui é vazamento. Rodar sempre após mexer em policy.
DO $$
DECLARE achado RECORD; total INT := 0;
BEGIN
  FOR achado IN
    SELECT p.tablename, p.policyname
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND 'anon' = ANY(p.roles)
      AND p.tablename IN (
        'leads','bookings','conversations','messages','ai_lead_captures',
        'ai_recommendations','ai_feedback','audit_logs','profiles',
        'newsletter_subscribers','ai_journeys','ai_journey_experiences',
        'packing_lists','packing_list_items','traveler_profiles',
        'community_matches','ai_knowledge_documents'
      )
  LOOP
    RAISE WARNING 'VAZAMENTO: % tem policy anônima "%"', achado.tablename, achado.policyname;
    total := total + 1;
  END LOOP;

  IF total > 0 THEN
    RAISE EXCEPTION 'RLS rejeitado: % policy(s) expõem dado pessoal ao público', total;
  END IF;

  RAISE NOTICE 'RLS conferido: nenhuma tabela com dado pessoal exposta ao público.';
END $$;
