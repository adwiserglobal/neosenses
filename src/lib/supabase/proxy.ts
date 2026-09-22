import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip Supabase session handling if env vars are not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /**
   * Renova a sessão. Roda em toda requisição por causa do matcher.
   *
   * Cookie de sessão vencido ou de um banco que foi recriado faz o Supabase
   * responder `refresh_token_not_found`, e esse erro subia sem tratamento —
   * duas exceções no log a cada visita, antes de o visitante clicar em nada.
   *
   * Não é caso excepcional: acontece com quem voltou ao site depois de meses,
   * com quem saiu em outra aba e, em desenvolvimento, a cada `db reset`. O
   * certo é tratar como "não está logado", que é o que de fato é.
   */
  let user = null;

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      const esperado =
        error.code === "refresh_token_not_found" ||
        error.status === 400 ||
        /refresh token/i.test(error.message);

      // Só o que não for sessão vencida merece log — o resto é ruído que
      // esconde erro de verdade.
      if (!esperado) {
        console.error("[auth] falha ao ler a sessão:", error.message);
      }
    } else {
      user = data.user;
    }
  } catch (err) {
    console.error("[auth] erro inesperado ao ler a sessão:", err instanceof Error ? err.message : err);
  }

  // Protege a área restrita. O layout de /admin ainda confere o papel: aqui
  // só se corta quem não tem sessão nenhuma.
  if (request.nextUrl.pathname.startsWith("/admin") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
