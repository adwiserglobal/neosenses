import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/models";

/**
 * Perfil de quem está logado, no máximo uma vez por requisição.
 *
 * O layout do painel e a página chamam `exigirPapel`, e cada chamada fazia
 * `auth.getUser()` (ida ao Supabase Auth) mais a consulta ao perfil: duas a
 * três idas à rede repetidas antes de qualquer dado da tela. O `cache` do React
 * as reúne numa só dentro do mesmo render.
 *
 * Fica fora de `actions/auth.ts` porque arquivos "use server" só podem exportar
 * funções assíncronas declaradas, e `cache()` devolve outra coisa.
 */
export const perfilDaSessao = cache(async (): Promise<Profile | null> => {
  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return (data as Profile) ?? null;
});
