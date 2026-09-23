import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cliente para conteúdo público, sem sessão.
 *
 * Use este em página que qualquer visitante vê. Dois motivos:
 *
 *   1. `cookies()` não existe em tempo de build, e `generateStaticParams`
 *      quebra com "used cookies() inside generateStaticParams".
 *   2. Ler cookie marca a rota como dinâmica, e o `revalidate` da página
 *      deixa de valer — o site perde o cache sem ninguém perceber.
 *
 * Continua sujeito ao RLS: só entrega o que é público de qualquer forma.
 */
export function criarClientePublico() {
  // O conteúdo público também é gerado durante `next build`. Em instalações
  // sem Supabase configurado (por exemplo, um deploy inicial no Netlify), não
  // podemos passar `undefined` ao SDK: ele aborta a coleta de dados das páginas.
  // O endpoint reservado faz o build continuar; as consultas falham de forma
  // tratável e as páginas exibem seus estados vazios até o banco ser conectado.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createClient<Database>(
    url,
    chave,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/** Cliente que enxerga a sessão. Use quando o resultado depende de quem está logado. */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Components
          }
        },
      },
    }
  );
}
