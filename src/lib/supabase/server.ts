import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

const PUBLIC_QUERY_TIMEOUT_MS = 3500;

function envObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) {
    throw new Error(`[supabase] ${nome} não configurada no ambiente.`);
  }
  return valor;
}

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
 * Continua sujeito ao RLS e nunca usa a service_role.
 */
export function criarClientePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createClient<Database>(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchPublicoComTimeout },
  });
}

/** Cliente que enxerga e atualiza a sessão do usuário logado. */
export async function createServerSupabaseClient() {
  const url = envObrigatoria("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = envObrigatoria("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
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
          // Server Components podem não permitir escrita de cookie. O proxy
          // renova a sessão e grava os cookies quando isso é necessário.
        }
      },
    },
  });
}

/**
 * Cliente administrativo de servidor.
 *
 * A service_role não representa uma sessão de usuário e não deve carregar
 * cookies do navegador. Usar o client normal do supabase-js evita misturar a
 * sessão do visitante com privilégios administrativos e funciona de forma
 * previsível nas Server Actions/Route Handlers do Vercel.
 */
export function createAdminClient() {
  const url = envObrigatoria("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = envObrigatoria("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
