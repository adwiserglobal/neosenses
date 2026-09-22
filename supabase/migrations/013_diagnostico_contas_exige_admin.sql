-- ============================================================
-- NeoSenses — 013: diagnostico_contas() exige administrador
-- ============================================================
-- Correção de um buraco aberto pela 012.
--
-- `diagnostico_contas()` devolve o e-mail e o último acesso de TODA conta do
-- sistema. As duas funções vizinhas — `diagnostico_tabelas()` e
-- `diagnostico_exposicao()`, ambas da 007 — começam com
--
--     IF NOT public.is_admin() THEN RAISE EXCEPTION ...
--
-- e a nova saiu sem essa linha. Como o GRANT é para `authenticated`, qualquer
-- pessoa logada — inclusive um `viewer`, que não tem acesso a nada no /admin —
-- podia listar os e-mails da equipe inteira.
--
-- Não foi explorado: descoberto no mesmo dia em que a função nasceu, ao
-- comparar a resposta dela com a da vizinha. Mas o padrão é o que interessa:
-- função nova que devolve dado pessoal precisa ser comparada com a de baixo
-- ANTES de existir, não depois. É por isso que esta migration existe em vez
-- de uma edição na 012 — migration já aplicada não se reescreve, e o registro
-- do erro vale mais que o histórico limpo.
--
-- Idempotente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.diagnostico_contas()
RETURNS TABLE (
  email          TEXT,
  tem_perfil     BOOLEAN,
  papel          TEXT,
  ativo          BOOLEAN,
  confirmado     BOOLEAN,
  ultimo_acesso  TIMESTAMPTZ,
  situacao       TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mesma porta das outras duas funções de diagnóstico.
  --
  -- Consequência prática, e é de propósito: com a chave de servidor
  -- `is_admin()` é sempre falso, então esta função não responde a script
  -- nenhum — só a gente logada. Quem precisa dela antes de existir o primeiro
  -- admin usa o SQL Editor, que fala direto com o banco.
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores';
  END IF;

  RETURN QUERY
  SELECT
    u.email::TEXT,
    p.id IS NOT NULL,
    coalesce(p.role::TEXT, '—'),
    coalesce(p.is_active, false),
    u.email_confirmed_at IS NOT NULL,
    u.last_sign_in_at,
    CASE
      WHEN p.id IS NULL                 THEN 'sem perfil — rode promover_admin ou reaplique a 012'
      WHEN u.email_confirmed_at IS NULL THEN 'e-mail não confirmado — o login vai recusar'
      WHEN NOT p.is_active              THEN 'perfil inativo'
      WHEN p.role = 'admin'             THEN 'administrador'
      ELSE 'sem acesso ao /admin (papel ' || p.role::TEXT || ')'
    END::TEXT
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.diagnostico_contas() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.diagnostico_contas() TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- Rede contra a próxima vez
-- ─────────────────────────────────────────────────────────────
-- Toda função SECURITY DEFINER que lê `auth.users` ou `profiles` e está
-- exposta a `authenticated` precisa checar papel. Esta verificação percorre o
-- código-fonte das funções e ABORTA a migration se achar uma sem checagem —
-- o mesmo desenho da conferência de RLS no fim da 005.
DO $$
DECLARE
  faltando TEXT;
BEGIN
  SELECT string_agg(p.proname, ', ')
  INTO faltando
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef                                    -- SECURITY DEFINER
    AND p.prosrc ~* '(auth\.users|public\.profiles|FROM profiles)'
    AND p.prosrc !~* '(is_admin|is_staff|auth\.uid)'   -- não checa nada
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
    -- Estas três são gatilho/apoio e não devolvem dado a quem chama:
    --   handle_new_user   roda como trigger do Auth, sem sessão
    --   is_admin/is_staff são a própria checagem
    --   promover_admin    tem trava own (só admin, depois do primeiro)
    AND p.proname NOT IN ('handle_new_user', 'is_admin', 'is_staff',
                          'promover_admin', 'impedir_escalacao_de_papel');

  IF faltando IS NOT NULL THEN
    RAISE EXCEPTION
      'Função SECURITY DEFINER lê dado pessoal, está aberta a authenticated e não checa papel: %',
      faltando;
  END IF;

  RAISE NOTICE 'Migration 013: nenhuma função de dado pessoal exposta sem checagem de papel.';
END;
$$;
