"use server";

/**
 * Autenticação da equipe.
 *
 * O login normal usa Supabase Auth. Para a primeira instalação, se
 * ADMIN_EMAIL e ADMIN_PASSWORD estiverem definidos no ambiente, o login com
 * essas credenciais cria/atualiza a conta no Supabase Auth e garante o papel
 * de admin usando a service_role. A senha nunca fica no repositório.
 */

import { redirect } from "next/navigation";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/models";

export interface ResultadoLogin {
  success: boolean;
  error?: string;
}

interface ResultadoBootstrap {
  executado: boolean;
  success: boolean;
  error?: string;
}

function credenciaisBootstrapCorrespondem(email: string, senha: string): boolean {
  const emailAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senhaAdmin = process.env.ADMIN_PASSWORD;

  return Boolean(
    emailAdmin &&
      senhaAdmin &&
      email === emailAdmin &&
      senha === senhaAdmin
  );
}

/**
 * Cria ou repara o administrador configurado no ambiente.
 *
 * Importante: isto também precisa rodar quando a conta JÁ existe no Auth.
 * Antes, o bootstrap só era executado se signInWithPassword falhasse. Se a
 * conta existia e a senha estava correta, o login dava certo, mas um profile
 * ausente/com role viewer fazia /admin redirecionar imediatamente para /login.
 */
async function bootstrapAdmin(email: string, senha: string): Promise<ResultadoBootstrap> {
  if (!credenciaisBootstrapCorrespondem(email, senha)) {
    return { executado: false, success: false };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[auth] bootstrap sem configuração Supabase:", err);
    return {
      executado: true,
      success: false,
      error:
        "Supabase incompleto no servidor. Confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Vercel.",
    };
  }

  const { data: lista, error: erroLista } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (erroLista) {
    console.error("[auth] não foi possível listar usuários:", erroLista.message);
    return {
      executado: true,
      success: false,
      error: "A service_role foi encontrada, mas o Supabase Auth recusou a operação.",
    };
  }

  let usuario = lista.users.find((u) => u.email?.toLowerCase() === email);

  if (!usuario) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { full_name: "Administrador NeoSenses" },
    });

    if (error || !data.user) {
      console.error("[auth] criação do primeiro admin:", error?.message);
      return {
        executado: true,
        success: false,
        error: "Não foi possível criar a conta administrativa no Supabase Auth.",
      };
    }

    usuario = data.user;
  } else {
    const { error } = await admin.auth.admin.updateUserById(usuario.id, {
      password: senha,
      email_confirm: true,
    });

    if (error) {
      console.error("[auth] atualização do admin bootstrap:", error.message);
      return {
        executado: true,
        success: false,
        error: "A conta existe, mas não foi possível atualizar a credencial administrativa.",
      };
    }
  }

  // A migration 012 fornece a promoção idempotente e reconstrói o profile se
  // a conta existir no Auth mas o registro em public.profiles estiver ausente.
  const rpc = admin.rpc as unknown as (
    nome: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { error: erroPromocao } = await rpc("promover_admin", {
    email_alvo: email,
  });

  if (erroPromocao) {
    console.error("[auth] promoção para admin:", erroPromocao.message);
    return {
      executado: true,
      success: false,
      error:
        "A conta existe, mas o banco ainda não conseguiu conceder acesso de administrador. Aplique a migration 012_promocao_de_admin.sql.",
    };
  }

  return { executado: true, success: true };
}

export async function entrar(email: string, senha: string): Promise<ResultadoLogin> {
  const limpo = email.trim().toLowerCase();
  if (!limpo || !senha) {
    return { success: false, error: "Informe e-mail e senha." };
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (err) {
    console.error("[auth] configuração Supabase inválida:", err);
    return {
      success: false,
      error:
        "Supabase não está totalmente configurado. Confira URL e anon key no Vercel.",
    };
  }

  // Sempre tenta reparar/promover o usuário configurado como ADMIN_EMAIL,
  // mesmo quando ele já existe e a senha já funciona. Isso evita o loop
  // /login -> /admin -> /login causado por profile ausente ou role viewer.
  const bootstrap = await bootstrapAdmin(limpo, senha);
  if (bootstrap.executado && !bootstrap.success) {
    return { success: false, error: bootstrap.error };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: limpo,
    password: senha,
  });

  if (error) {
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

  return (data as Profile) ?? null;
}

/** Exige sessão com um dos papéis. */
export async function exigirPapel(papeis: UserRole[] = ["admin"]): Promise<Profile> {
  const perfil = await usuarioAtual();

  if (!perfil) redirect("/login?redirect=/admin");
  if (!perfil.is_active) redirect("/login?erro=conta-inativa");
  if (!papeis.includes(perfil.role)) redirect("/login?erro=sem-permissao");

  return perfil;
}
