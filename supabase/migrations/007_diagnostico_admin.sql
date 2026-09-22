-- ============================================================
-- NeoSenses — 007: Diagnóstico e administração
-- ============================================================
-- Funções usadas pela tela /admin/supabase.
--
-- Estado de RLS e lista de tabelas vivem no catálogo do Postgres, que a API
-- REST não expõe. Estas funções são a ponte — SECURITY DEFINER para ler o
-- catálogo, mas com checagem de papel logo na primeira linha: sem isso,
-- qualquer visitante saberia exatamente quais tabelas estão desprotegidas.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Estado das tabelas e do RLS
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.diagnostico_tabelas()
RETURNS TABLE (
  tabela        TEXT,
  linhas        BIGINT,
  rls_ligado    BOOLEAN,
  qtd_policies  INTEGER,
  acesso_anonimo BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores';
  END IF;

  RETURN QUERY
  SELECT
    c.relname::TEXT,
    (xpath(
      '/row/cnt/text()',
      query_to_xml(format('SELECT count(*) AS cnt FROM public.%I', c.relname), false, true, '')
    ))[1]::text::bigint,
    c.relrowsecurity,
    (SELECT count(*)::int FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.relname),
    EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.relname AND 'anon' = ANY(p.roles)
    )
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY c.relname;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Verificação de vazamento
-- ─────────────────────────────────────────────────────────────
-- Mesma checagem do fim de 005_rls_policies.sql, disponível a qualquer
-- momento pela tela: uma policy anônima criada por engano numa tabela de
-- dado pessoal aparece aqui antes de virar incidente.
CREATE OR REPLACE FUNCTION public.diagnostico_exposicao()
RETURNS TABLE (tabela TEXT, policy TEXT, operacao TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores';
  END IF;

  RETURN QUERY
  SELECT p.tablename::TEXT, p.policyname::TEXT, p.cmd::TEXT
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND 'anon' = ANY(p.roles)
    AND p.tablename IN (
      'leads','bookings','conversations','messages','ai_lead_captures',
      'ai_recommendations','ai_feedback','audit_logs','profiles',
      'newsletter_subscribers','ai_journeys','ai_journey_experiences',
      'packing_lists','packing_list_items','traveler_profiles',
      'community_matches','ai_knowledge_documents'
    );
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Promoção de administrador
-- ─────────────────────────────────────────────────────────────
-- O primeiro admin não tem como se promover pela tela: `is_admin()` seria
-- falso para ele. Esta função existe para ser chamada uma única vez, no SQL
-- Editor, por quem já tem acesso ao banco.
--
-- Uso:  SELECT public.promover_admin('pessoa@empresa.com');
--
-- Depois do primeiro admin, o próprio painel gerencia a equipe. Existindo
-- algum admin, a função passa a exigir que quem chama já seja um — do
-- contrário ela seria uma porta aberta para escalar privilégio.
-- A trava anti-escalação (trigger em profiles, migration 005) precisa saber
-- distinguir "promoção feita por esta função, que já checou quem pode" de
-- "alguém tentando editar o próprio papel". A flag de sessão abaixo é esse
-- sinal, e é local à transação: não sobrevive ao fim dela nem vaza para
-- outra conexão.
CREATE OR REPLACE FUNCTION public.impedir_escalacao_de_papel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND coalesce(current_setting('app.promocao_autorizada', true), '') <> '1'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Alteração de papel permitida apenas para administradores';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.promover_admin(email_alvo TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ja_existe_admin BOOLEAN;
  alvo_id UUID;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin' AND is_active) INTO ja_existe_admin;

  -- Primeiro admin: qualquer um com acesso ao banco pode criar, porque quem
  -- chega até o SQL Editor já tem o banco inteiro de qualquer forma.
  -- Depois disso, só admin promove admin.
  IF ja_existe_admin AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Já existe administrador. Promoção só por outro administrador.';
  END IF;

  SELECT id INTO alvo_id FROM public.profiles WHERE lower(email) = lower(email_alvo);

  IF alvo_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário com o e-mail %. Crie a conta primeiro em Authentication > Users.', email_alvo;
  END IF;

  PERFORM set_config('app.promocao_autorizada', '1', true);
  UPDATE public.profiles SET role = 'admin', is_active = true WHERE id = alvo_id;
  PERFORM set_config('app.promocao_autorizada', '', true);

  RETURN format('%s agora é administrador.', email_alvo);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Permissões
-- ─────────────────────────────────────────────────────────────
-- EXECUTE só para quem está logado. anon não chama nem para receber o erro.
REVOKE ALL ON FUNCTION public.diagnostico_tabelas()  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.diagnostico_exposicao() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promover_admin(TEXT)    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.diagnostico_tabelas()  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.diagnostico_exposicao() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promover_admin(TEXT)    TO authenticated, service_role;
