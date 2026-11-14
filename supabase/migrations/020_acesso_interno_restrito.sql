-- NeoSenses — acesso estritamente interno ao painel administrativo.
--
-- O endereço de e-mail do JWT é a fonte de identidade. O e-mail de profiles
-- é editável pelo titular e não pode servir como regra de autorização.
-- app_metadata é escrito somente pelo servidor via Supabase Auth Admin.
--
-- Estes corpos refletem a configuração aplicada no projeto de produção em
-- 14/11/2026. Reexecutar é seguro.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_active = true
  )
  AND lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'eduardocamposmachadoalv@gmail.com',
    'tarin@neosenses.com.br'
  )
  AND coalesce(auth.jwt() -> 'app_metadata' ->> 'neosenses_internal_admin', 'false') = 'true'
  AND coalesce(auth.jwt() -> 'app_metadata' ->> 'neosenses_admin_bootstrap_complete', 'false') = 'true'
  AND coalesce(auth.jwt() -> 'app_metadata' ->> 'neosenses_force_password_change', 'false') = 'false';
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'editor')
      AND p.is_active = true
  )
  AND lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'eduardocamposmachadoalv@gmail.com',
    'tarin@neosenses.com.br'
  )
  AND coalesce(auth.jwt() -> 'app_metadata' ->> 'neosenses_internal_admin', 'false') = 'true'
  AND coalesce(auth.jwt() -> 'app_metadata' ->> 'neosenses_admin_bootstrap_complete', 'false') = 'true'
  AND coalesce(auth.jwt() -> 'app_metadata' ->> 'neosenses_force_password_change', 'false') = 'false';
$function$;

-- Helpers de autorização são usados por políticas RLS para usuários autenticados.
-- Não precisam ser invocáveis anonimamente pela Data API.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;
