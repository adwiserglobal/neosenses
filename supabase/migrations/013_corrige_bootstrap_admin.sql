-- NeoSenses — 013: corrige bootstrap do primeiro administrador
-- Idempotente. Pode ser executada mais de uma vez.

-- A migration 012 usa uma flag transacional para autorizar a promoção feita
-- pelo próprio bootstrap. A versão anterior do trigger de proteção não lia
-- essa flag, então um profile já existente como viewer podia impedir a própria
-- função promover_admin() de convertê-lo em admin.
CREATE OR REPLACE FUNCTION public.impedir_escalacao_de_papel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Promoção que já passou pela validação de promover_admin().
  IF current_setting('app.promocao_autorizada', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Alteração de papel permitida apenas para administradores';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_escalacao ON public.profiles;
CREATE TRIGGER trg_impedir_escalacao
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.impedir_escalacao_de_papel();

-- Garante profile para contas que já existem no Supabase Auth.
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Recria promover_admin para a instalação atual.
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
  email_limpo     TEXT := lower(trim(coalesce(email_alvo, '')));
BEGIN
  IF email_limpo = '' THEN
    RAISE EXCEPTION 'Informe o e-mail do administrador.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin' AND is_active
  ) INTO ja_existe_admin;

  -- A primeira promoção pode ser feita pelo bootstrap via service_role.
  -- Depois que já existe um admin, um usuário autenticado comum não consegue
  -- promover outra conta sozinho.
  IF ja_existe_admin
     AND auth.role() <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Já existe administrador. A promoção exige um admin autenticado.';
  END IF;

  SELECT count(*) INTO quantas
  FROM auth.users u
  WHERE lower(u.email) = email_limpo;

  IF quantas = 0 THEN
    RAISE EXCEPTION 'Nenhuma conta com o e-mail % existe no Supabase Auth.', email_limpo;
  END IF;

  IF quantas > 1 THEN
    RAISE EXCEPTION 'Há mais de uma conta correspondente ao e-mail %.', email_limpo;
  END IF;

  SELECT u.id, u.email, u.raw_user_meta_data->>'full_name'
    INTO alvo_id, alvo_email, alvo_nome
  FROM auth.users u
  WHERE lower(u.email) = email_limpo;

  PERFORM set_config('app.promocao_autorizada', '1', true);

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (alvo_id, alvo_email, alvo_nome, 'admin', true)
  ON CONFLICT (id) DO UPDATE
    SET role      = 'admin',
        is_active = true,
        email     = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  PERFORM set_config('app.promocao_autorizada', '', true);

  RETURN format('%s agora é administrador.', alvo_email);
END;
$$;

REVOKE ALL ON FUNCTION public.promover_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promover_admin(TEXT) TO authenticated, service_role;
