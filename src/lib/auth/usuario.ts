import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/models";

export type PerfilComAutenticacao = Profile & {
  /** E-mail retornado pelo Supabase Auth, nunca pelo campo editável do profile. */
  auth_email: string;
  /** Marcador confiável, definido somente pelo servidor no app_metadata do Auth. */
  must_change_password: boolean;
};

/**
 * Perfil e metadados confiáveis da sessão, no máximo uma vez por render.
 * O e-mail usado para autorização vem do Supabase Auth; o campo profiles.email
 * é dado de exibição e não é uma fonte de autorização.
 */
export const perfilDaSessao = cache(async (): Promise<PerfilComAutenticacao | null> => {
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

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    ...(data as Profile),
    auth_email: user.email?.trim().toLowerCase() ?? "",
    must_change_password: user.app_metadata?.neosenses_force_password_change === true,
  };
});
