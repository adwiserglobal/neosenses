-- ============================================================
-- NeoSenses — 000: VERIFICAÇÃO DE ESTADO (somente leitura)
-- ============================================================
-- Este script NÃO altera nada. Ele só descreve o que existe hoje.
--
-- Onde rodar: Supabase Studio → SQL Editor → New Query → colar → Run
--
-- IMPORTANTE: o SQL Editor exibe apenas o resultado da ÚLTIMA consulta do
-- editor. Rode um bloco por vez, ou use só o bloco 1 — ele responde o
-- essencial sozinho.
--
-- Motivo de existir: pela chave pública não é possível distinguir "tabela
-- vazia" de "RLS bloqueando a leitura" — as duas retornam zero linhas. Só
-- com este resultado é seguro decidir se dá para recriar o schema.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. O essencial: tabelas, linhas reais, RLS e exposição anônima
-- ─────────────────────────────────────────────────────────────
-- `acesso_anonimo` maior que zero numa tabela de dado pessoal (leads,
-- bookings, conversations) significa vazamento acontecendo agora.
SELECT
  c.relname                                   AS tabela,
  (xpath(
    '/row/cnt/text()',
    query_to_xml(
      format('SELECT count(*) AS cnt FROM public.%I', c.relname),
      false, true, ''
    )
  ))[1]::text::bigint                         AS linhas,
  c.relrowsecurity                            AS rls_ligado,
  (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = c.relname)            AS policies,
  (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = c.relname
      AND 'anon' = ANY(p.roles))              AS acesso_anonimo
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY linhas DESC, c.relname;

-- ─────────────────────────────────────────────────────────────
-- 2. Policies existentes (quem pode ler/escrever o quê)
-- ─────────────────────────────────────────────────────────────
SELECT
  tablename   AS tabela,
  policyname  AS policy,
  cmd         AS operacao,
  roles       AS perfis,
  qual        AS condicao_leitura,
  with_check  AS condicao_escrita
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ─────────────────────────────────────────────────────────────
-- 3. Tipos ENUM já criados (a recriação precisa saber disso)
-- ─────────────────────────────────────────────────────────────
SELECT
  t.typname                                    AS tipo,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS valores
FROM pg_type t
JOIN pg_enum e       ON e.enumtypid = t.oid
JOIN pg_namespace n  ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- ─────────────────────────────────────────────────────────────
-- 4. Usuários cadastrados no Auth (não são apagados pelo reset,
--    mas o perfil vinculado sim — bom saber antes)
-- ─────────────────────────────────────────────────────────────
SELECT count(*) AS usuarios_no_auth FROM auth.users;
