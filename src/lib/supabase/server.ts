import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

const PUBLIC_QUERY_TIMEOUT_MS = 3500;

/**
 * Evita que uma indisponibilidade/rede lenta do Supabase congele a navegação.
 * O conteúdo público tem fallback visual; esperar dezenas de segundos por uma
 * consulta que provavelmente vai falhar é pior do que renderizar a página sem
 * aquele bloco e continuar navegável.
 */
const fetchPublicoComTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const sinalOriginal = init?.signal;
  const abortar = () => controller.abort();

  if (sinalOriginal) {
    if (sinalOriginal.aborted) controller.abort();
    else sinalOriginal.addEventListener("abort", abortar, { once: true });
  }

  const timer = setTimeout(() => controller.abort(), PUBLIC_QUERY_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    sinalOriginal?.removeEventListener("abort", abortar);
  }
};

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

  return createClient<Database>(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchPublicoComTimeout },
  });
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
