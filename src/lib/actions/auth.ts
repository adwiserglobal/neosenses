"use server";

/**
 * Autenticação da equipe.
 *
 * Só existe login para o painel; o site público não tem conta de visitante.
 *
 * O papel vem de `profiles.role` e é lido no servidor a cada verificação.
 * Guardar papel em cookie ou no metadata do token deixaria a promoção a
 * admin ao alcance de quem edita o próprio token.
 */

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/models";

export interface ResultadoLogin {
  success: boolean;
  error?: string;
}

export async function entrar(email: string, senha: string): Promise<ResultadoLogin> {
  const limpo = email.trim().toLowerCase();
  if (!limpo || !senha) {
    return { success: false, error: "Informe e-mail e senha." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email: limpo, password: senha });

  if (error) {
    // Mensagem única para credencial errada e conta inexistente: distinguir as
    // duas revela quais e-mails têm conta.
    console.warn(`[auth] login recusado para ${limpo}: ${error.message}`);
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  return { success: true };
}

export async function sair() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Perfil de quem está logado, ou null. Não redireciona. */
export async function usuarioAtual(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();

  // getUser valida o token no servidor. getSession lê o cookie sem validar e
  // não serve para decidir acesso.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return (data as Profile) ?? null;
}

/**
 * Exige sessão com um dos papéis. Redireciona quando não atende.
 * Usar em layout de área restrita, não em componente solto.
 */
export async function exigirPapel(papeis: UserRole[] = ["admin"]): Promise<Profile> {
  const perfil = await usuarioAtual();

  if (!perfil) redirect("/login?redirect=/admin");
  if (!perfil.is_active) redirect("/login?erro=conta-inativa");
  if (!papeis.includes(perfil.role)) redirect("/login?erro=sem-permissao");

  return perfil;
}
