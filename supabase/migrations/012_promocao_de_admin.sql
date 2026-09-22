-- ============================================================
-- NeoSenses — 012: promoção de administrador que funciona
-- ============================================================
-- A versão anterior procurava o alvo em `public.profiles` e, não achando,
-- mandava criar a conta em Authentication > Users. Nos dois casos em que a
-- pessoa mais precisa da função, esse conselho não resolve:
--
--   1. A conta existe em auth.users desde ANTES da migration 001. O trigger
--      `on_auth_user_created` só dispara em INSERT novo, então nunca rodou
--      para ela e o perfil nunca nasceu.
--   2. O schema public foi recriado (foi o que aconteceu em 09/08/2026).
--      auth.users sobrevive porque está em outro schema; profiles vai junto
--      com o DROP.
--
-- Nos dois, criar a conta de novo em Authentication falha com "user already
-- registered", e a pessoa fica presa entre duas mensagens que se contradizem.
--
-- Correção: perguntar ao Auth, que é a fonte da verdade sobre quem existe, e
-- reconstruir o perfil quando ele faltar.
--
-- Idempotente: pode rodar de novo sem quebrar.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Reconstrói os perfis que ficaram para trás
-- ─────────────────────────────────────────────────────────────
-- Vale para quem se cadastrou antes da 001 e para quem perdeu o perfil na
-- recriação do schema. Papel `viewer`, que é o padrão: esta migration repara
-- ausência, não distribui privilégio.
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- promover_admin
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.promover_admin(email_alvo TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ja_existe_admin BOOLEAN;
  quantas         INTEGER;
  alvo_id         UUID;
  alvo_email      TEXT;
  alvo_nome       TEXT;
  perfil_existia  BOOLEAN;
  email_limpo     TEXT := lower(trim(coalesce(email_alvo, '')));
BEGIN
  IF email_limpo = '' THEN
    RAISE EXCEPTION 'Informe o e-mail. Uso: SELECT public.promover_admin(''pessoa@empresa.com'');';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin' AND is_active
  ) INTO ja_existe_admin;

  -- Primeiro admin: quem chega ao SQL Editor já tem o banco inteiro, então
  -- exigir credencial que ainda não existe só trava. Depois disso, a porta
  -- fecha: só admin promove admin.
  IF ja_existe_admin AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Já existe administrador. A promoção passa a ser feita por um deles, pelo painel ou logado no SQL Editor.';
  END IF;

  -- O Auth é a fonte da verdade sobre quem existe. profiles é espelho, e
  -- espelho pode estar desatualizado — foi exatamente o que aconteceu.
  SELECT count(*) INTO quantas
  FROM auth.users u
  WHERE lower(u.email) = email_limpo;

  IF quantas = 0 THEN
    RAISE EXCEPTION
      'Nenhuma conta com o e-mail % em Authentication > Users. Crie lá primeiro, marcando Auto Confirm User — sem isso o login espera uma confirmação que ninguém recebe.',
      email_limpo;
  END IF;

  -- Duas contas com o mesmo e-mail não é hipótese remota. O índice do Auth
  -- (`users_email_partial_key`) é único sobre o e-mail EXATO e só vale
  -- `WHERE is_sso_user = false`. Então `Chefe@x.com` e `chefe@x.com` convivem,
  -- e conta de SSO escapa da restrição por inteiro. Comparando em minúsculas,
  -- como aqui, as duas aparecem — e escolher uma no escuro deixaria a outra
  -- parecendo admin sem ser.
  IF quantas > 1 THEN
    RAISE EXCEPTION
      'Há % contas com o e-mail % no Auth (o índice do Auth distingue maiúsculas e ignora contas SSO). Resolva a duplicidade antes.',
      quantas, email_limpo;
  END IF;

  SELECT u.id, u.email, u.raw_user_meta_data->>'full_name'
  INTO alvo_id, alvo_email, alvo_nome
  FROM auth.users u
  WHERE lower(u.email) = email_limpo;

  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = alvo_id) INTO perfil_existia;

  -- A flag diz ao trigger anti-escalação que esta mudança de papel já passou
  -- pela checagem acima. É local à transação: não sobrevive ao COMMIT nem
  -- vaza para outra conexão. O ON CONFLICT DO UPDATE dispara o trigger
  -- (BEFORE UPDATE), então sem ela a própria função seria barrada.
  PERFORM set_config('app.promocao_autorizada', '1', true);

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (alvo_id, alvo_email, alvo_nome, 'admin', true)
  ON CONFLICT (id) DO UPDATE
    SET role      = 'admin',
        is_active = true,
        email     = EXCLUDED.email;

  PERFORM set_config('app.promocao_autorizada', '', true);

  RETURN format(
    '%s agora é administrador.%s',
    alvo_email,
    CASE WHEN perfil_existia THEN '' ELSE ' O perfil não existia e foi criado agora.' END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.promover_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promover_admin(TEXT) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- Diagnóstico de quem é quem
-- ─────────────────────────────────────────────────────────────
-- Responde "por que essa pessoa não consegue entrar no /admin?" sem precisar
-- de três consultas em tabelas diferentes. Mostra a conta do Auth ao lado do
-- perfil, que é onde a divergência aparece.
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
  RETURN QUERY
  SELECT
    u.email::TEXT,
    p.id IS NOT NULL,
    coalesce(p.role::TEXT, '—'),
    coalesce(p.is_active, false),
    u.email_confirmed_at IS NOT NULL,
    u.last_sign_in_at,
    CASE
      WHEN p.id IS NULL                    THEN 'sem perfil — rode promover_admin ou reaplique a 012'
      WHEN u.email_confirmed_at IS NULL    THEN 'e-mail não confirmado — o login vai recusar'
      WHEN NOT p.is_active                 THEN 'perfil inativo'
      WHEN p.role = 'admin'                THEN 'administrador'
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
-- Conferência
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  orfas INTEGER;
BEGIN
  SELECT count(*) INTO orfas
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL AND u.email IS NOT NULL;

  IF orfas > 0 THEN
    RAISE WARNING 'Ainda há % conta(s) do Auth sem perfil.', orfas;
  ELSE
    RAISE NOTICE 'Migration 012 aplicada: toda conta do Auth tem perfil.';
  END IF;
END;
$$;
