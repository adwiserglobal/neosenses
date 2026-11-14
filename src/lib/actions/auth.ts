"use server";

/**
 * Autenticação do painel interno NeoSenses.
 *
 * A lista autorizada é fixa no servidor. O bootstrap usa apenas credenciais
 * armazenadas como variável secreta na Vercel e grava um marcador em app_metadata,
 * que não pode ser alterado pelo próprio usuário. Assim, a senha provisória não
 * volta a redefinir a senha depois da primeira utilização.
 */

import { redirect } from "next/navigation";
import { pbkdf2, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  createAdminClient,
  createServerSupabaseClient,
} from "@/lib/supabase/server";
import { perfilDaSessao, type PerfilComAutenticacao } from "@/lib/auth/usuario";
import { emailInternoAutorizado } from "@/lib/auth/access";
import type { UserRole } from "@/types/models";

export interface ResultadoLogin {
  success: boolean;
  error?: string;
  requiresPasswordChange?: boolean;
}

interface CredencialBootstrap {
  email: string;
  salt: string;
  passwordHash: string;
  fullName: string;
  forcePasswordChange: boolean;
}

const derivarSenha = promisify(pbkdf2);
const ITERACOES_HASH_BOOTSTRAP = 600_000;

interface ResultadoBootstrap {
  executado: boolean;
  success: boolean;
  forcePasswordChange?: boolean;
  error?: string;
}

function credenciaisBootstrap(): CredencialBootstrap[] {
  const bruto = process.env.INTERNAL_ADMIN_BOOTSTRAP_USERS;
  if (!bruto) return [];

  try {
    const dados: unknown = JSON.parse(bruto);
    if (!Array.isArray(dados)) return [];

    return dados.flatMap((item: unknown) => {
      if (!item || typeof item !== "object") return [];
      const registro = item as Record<string, unknown>;
      if (
        typeof registro.email !== "string" ||
        typeof registro.salt !== "string" ||
        typeof registro.passwordHash !== "string" ||
        !emailInternoAutorizado(registro.email)
      ) return [];

      return [{
        email: registro.email.trim().toLowerCase(),
        salt: registro.salt,
        passwordHash: registro.passwordHash,
        fullName: typeof registro.fullName === "string" ? registro.fullName : "",
        forcePasswordChange: registro.forcePasswordChange === true,
      }];
    });
  } catch {
    console.error("[auth] INTERNAL_ADMIN_BOOTSTRAP_USERS contém JSON inválido.");
    return [];
  }
}

async function credencialCorrespondente(
  email: string,
  senha: string
): Promise<CredencialBootstrap | null> {
  const item = credenciaisBootstrap().find((credencial) => credencial.email === email);
  if (!item) return null;

  try {
    const candidato = await derivarSenha(
      senha,
      Buffer.from(item.salt, "base64"),
      ITERACOES_HASH_BOOTSTRAP,
      64,
      "sha512"
    );
    const esperado = Buffer.from(item.passwordHash, "base64");
    return candidato.length === esperado.length && timingSafeEqual(candidato, esperado)
      ? item
      : null;
  } catch {
    return null;
  }
}

async function promoverAdmin(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const rpc = admin.rpc as unknown as (
    nome: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { error } = await rpc("promover_admin", { email_alvo: email });
  if (error) {
    console.error("[auth] promoção do acesso interno:", error.message);
    return { success: false, error: "A conta existe, mas não foi possível liberar o painel." };
  }
  return { success: true };
}

/**
 * Provisiona a conta apenas uma vez. Se o marcador já existir, a credencial
 * provisória não pode redefinir a senha que a pessoa escolheu posteriormente.
 */
async function bootstrapAdmin(
  email: string,
  senha: string,
  credencial: CredencialBootstrap | null
): Promise<ResultadoBootstrap> {
  if (!credencial) return { executado: false, success: false };

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[auth] bootstrap sem configuração Supabase:", err);
    return {
      executado: true,
      success: false,
      error: "A configuração administrativa do Supabase está incompleta.",
    };
  }

  const { data: lista, error: erroLista } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (erroLista) {
    console.error("[auth] não foi possível consultar usuários:", erroLista.message);
    return {
      executado: true,
      success: false,
      error: "Não foi possível verificar a conta no Supabase Auth.",
    };
  }

  const usuarioExistente = lista.users.find(
    (usuario) => usuario.email?.toLowerCase() === email
  );

  if (usuarioExistente?.app_metadata?.neosenses_admin_bootstrap_complete === true) {
    // O primeiro acesso já foi provisionado. Nunca reativar a senha temporária.
    return { executado: false, success: false };
  }

  const appMetadata = {
    ...(usuarioExistente?.app_metadata ?? {}),
    neosenses_internal_admin: true,
    neosenses_admin_bootstrap_complete: true,
    neosenses_force_password_change: credencial.forcePasswordChange,
  };

  if (usuarioExistente) {
    const { error } = await admin.auth.admin.updateUserById(usuarioExistente.id, {
      password: senha,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: {
        ...(usuarioExistente.user_metadata ?? {}),
        full_name: usuarioExistente.user_metadata?.full_name || credencial.fullName,
      },
    });

    if (error) {
      console.error("[auth] atualização inicial da conta:", error.message);
      return {
        executado: true,
        success: false,
        error: "A conta existe, mas não foi possível configurar o acesso.",
      };
    }
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: { full_name: credencial.fullName },
    });

    if (error) {
      console.error("[auth] criação da conta interna:", error.message);
      return {
        executado: true,
        success: false,
        error: "Não foi possível criar a conta no Supabase Auth.",
      };
    }
  }

  const promocao = await promoverAdmin(admin, email);
  if (!promocao.success) {
    return {
      executado: true,
      success: false,
      error: promocao.error,
    };
  }

  return {
    executado: true,
    success: true,
    forcePasswordChange: credencial.forcePasswordChange,
  };
}

async function marcarCredencialComoProvisionada(
  userId: string,
  email: string,
  credencial: CredencialBootstrap
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    console.error("[auth] não foi possível ler os metadados da conta:", error?.message);
    return { success: false, error: "Não foi possível concluir a configuração da conta." };
  }

  if (data.user.app_metadata?.neosenses_admin_bootstrap_complete === true) {
    return { success: true };
  }

  const { error: erroAtualizacao } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(data.user.app_metadata ?? {}),
      neosenses_internal_admin: true,
      neosenses_admin_bootstrap_complete: true,
      neosenses_force_password_change: credencial.forcePasswordChange,
    },
  });

  if (erroAtualizacao) {
    console.error("[auth] não foi possível concluir o provisionamento:", erroAtualizacao.message);
    return { success: false, error: "Não foi possível concluir a configuração da conta." };
  }

  const promocao = await promoverAdmin(admin, email);
  return promocao;
}

export async function entrar(email: string, senha: string): Promise<ResultadoLogin> {
  const limpo = email.trim().toLowerCase();
  if (!limpo || !senha) {
    return { success: false, error: "Informe e-mail e senha." };
  }

  if (!emailInternoAutorizado(limpo)) {
    return { success: false, error: "Este e-mail não tem autorização para acessar o painel." };
  }

  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (err) {
    console.error("[auth] configuração Supabase inválida:", err);
    return {
      success: false,
      error: "Supabase não está totalmente configurado. Confira URL e chave pública no Vercel.",
    };
  }

  const credencial = await credencialCorrespondente(limpo, senha);
  let tentativa = await supabase.auth.signInWithPassword({
    email: limpo,
    password: senha,
  });

  if (tentativa.error) {
    const bootstrap = await bootstrapAdmin(limpo, senha, credencial);

    if (bootstrap.executado && !bootstrap.success) {
      return { success: false, error: bootstrap.error };
    }

    if (bootstrap.success) {
      tentativa = await supabase.auth.signInWithPassword({
        email: limpo,
        password: senha,
      });
    }
  }

  if (tentativa.error || !tentativa.data.user) {
    console.warn("[auth] login recusado:", limpo);
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  let usuario = tentativa.data.user;

  // Também marca contas que já existiam e aceitaram a senha informada.
  if (
    credencial &&
    usuario.app_metadata?.neosenses_admin_bootstrap_complete !== true
  ) {
    const provisionamento = await marcarCredencialComoProvisionada(
      usuario.id,
      limpo,
      credencial
    );

    if (!provisionamento.success) {
      await supabase.auth.signOut();
      return { success: false, error: provisionamento.error };
    }

    const atualizado = await supabase.auth.getUser();
    if (atualizado.data.user) usuario = atualizado.data.user;
  }

  return {
    success: true,
    requiresPasswordChange:
      usuario.app_metadata?.neosenses_force_password_change === true ||
      (credencial?.forcePasswordChange === true &&
        usuario.app_metadata?.neosenses_admin_bootstrap_complete === true),
  };
}

export async function definirSenhaInicial(
  novaSenha: string,
  confirmacao: string
): Promise<ResultadoLogin> {
  if (novaSenha !== confirmacao) {
    return { success: false, error: "As senhas não coincidem." };
  }
  if (novaSenha.length < 12) {
    return { success: false, error: "Use uma senha com pelo menos 12 caracteres." };
  }
  if (novaSenha.length > 128) {
    return { success: false, error: "A senha deve ter no máximo 128 caracteres." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: sessao, error: erroSessao } = await supabase.auth.getUser();
  const usuario = sessao.user;

  if (erroSessao || !usuario || !emailInternoAutorizado(usuario.email)) {
    return { success: false, error: "Sua sessão expirou. Entre novamente." };
  }
  if (usuario.app_metadata?.neosenses_force_password_change !== true) {
    return { success: false, error: "Esta conta não precisa de uma troca inicial de senha." };
  }

  const { error: erroSenha } = await supabase.auth.updateUser({ password: novaSenha });
  if (erroSenha) {
    console.error("[auth] troca da senha inicial:", erroSenha.message);
    return { success: false, error: "Não foi possível atualizar a senha. Tente novamente." };
  }

  const admin = createAdminClient();
  const { error: erroMetadata } = await admin.auth.admin.updateUserById(usuario.id, {
    app_metadata: {
      ...(usuario.app_metadata ?? {}),
      neosenses_internal_admin: true,
      neosenses_admin_bootstrap_complete: true,
      neosenses_force_password_change: false,
    },
  });

  if (erroMetadata) {
    console.error("[auth] não foi possível encerrar a troca obrigatória:", erroMetadata.message);
    return {
      success: false,
      error: "A senha foi alterada, mas a validação final não concluiu. Envie a nova senha novamente.",
    };
  }

  return { success: true };
}

export async function sair() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Perfil de quem está logado, restrito à lista interna. */
export async function usuarioAtual(): Promise<PerfilComAutenticacao | null> {
  const perfil = await perfilDaSessao();
  if (!perfil || !emailInternoAutorizado(perfil.auth_email)) return null;
  return perfil;
}

/** Exige sessão, autorização por e-mail e o papel solicitado. */
export async function exigirPapel(papeis: UserRole[] = ["admin"]): Promise<PerfilComAutenticacao> {
  const perfil = await usuarioAtual();

  if (!perfil) redirect("/login?redirect=/admin");
  if (perfil.must_change_password) redirect("/primeiro-acesso");
  if (!perfil.is_active) redirect("/login?erro=conta-inativa");
  if (!papeis.includes(perfil.role)) redirect("/login?erro=sem-permissao");

  return perfil;
}
