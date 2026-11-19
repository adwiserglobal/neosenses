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

  // RPC sem erro não basta: confirma que o perfil realmente recebeu o papel
  // administrativo. Auth e public.profiles precisam terminar consistentes.
  const { data: perfil, error: erroPerfil } = await admin
    .from("profiles")
    .select("role, is_active")
    .ilike("email", email)
    .maybeSingle();

  if (erroPerfil || !perfil || perfil.role !== "admin" || perfil.is_active !== true) {
    console.error("[auth] perfil não foi promovido após RPC:", erroPerfil?.message ?? "perfil ainda não é admin");
    return { success: false, error: "A autenticação foi criada, mas o perfil administrativo não foi confirmado." };
  }

  return { success: true };
}

async function garantirPerfilAdmin(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const { data: perfil, error } = await admin
    .from("profiles")
    .select("role, is_active")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[auth] não foi possível verificar o perfil:", error.message);
    return { success: false, error: "Não foi possível verificar as permissões da conta." };
  }

  if (perfil?.role === "admin" && perfil.is_active === true) {
    return { success: true };
  }

  return promoverAdmin(admin, email);
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
    // Nunca sobrescrever a senha pessoal. Ainda assim, reparar divergência
    // entre app_metadata e public.profiles sem tocar na senha atual.
    const promocao = await garantirPerfilAdmin(admin, email);
    return { executado: false, success: promocao.success, error: promocao.error };
  }

  const appMetadata = {
    ...(usuarioExistente?.app_metadata ?? {}),
    neosenses_internal_admin: true,
    // Só marca como completo DEPOIS de confirmar o perfil administrativo.
    neosenses_admin_bootstrap_complete: false,
    neosenses_force_password_change: credencial.forcePasswordChange,
  };

  let userId = usuarioExistente?.id;

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
    const { data: criacao, error } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      app_metadata: appMetadata,
      user_metadata: { full_name: credencial.fullName },
    });

    if (error || !criacao.user) {
      console.error("[auth] criação da conta interna:", error?.message ?? "Auth não retornou usuário");
      return {
        executado: true,
        success: false,
        error: "Não foi possível criar a conta no Supabase Auth.",
      };
    }
    userId = criacao.user.id;
  }

  const promocao = await promoverAdmin(admin, email);
  if (!promocao.success) {
    return {
      executado: true,
      success: false,
      error: promocao.error,
    };
  }

  if (!userId) {
    return { executado: true, success: false, error: "Não foi possível identificar a conta provisionada." };
  }

  const { data: usuarioFinal, error: erroLeituraFinal } = await admin.auth.admin.getUserById(userId);
  if (erroLeituraFinal || !usuarioFinal.user) {
    console.error("[auth] leitura após promoção:", erroLeituraFinal?.message);
    return { executado: true, success: false, error: "Não foi possível concluir o provisionamento da conta." };
  }

  const { error: erroConcluir } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(usuarioFinal.user.app_metadata ?? {}),
      neosenses_internal_admin: true,
      neosenses_admin_bootstrap_complete: true,
      neosenses_force_password_change: credencial.forcePasswordChange,
    },
  });

  if (erroConcluir) {
    console.error("[auth] conclusão do bootstrap:", erroConcluir.message);
    return { executado: true, success: false, error: "O perfil foi promovido, mas não foi possível concluir o provisionamento." };
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
    // Versões anteriores podiam marcar o Auth como concluído sem promover
    // public.profiles. Confirma/repara essa divergência sem alterar a senha.
    return garantirPerfilAdmin(admin, email);
  }

  const { error: erroAtualizacao } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(data.user.app_metadata ?? {}),
      neosenses_internal_admin: true,
      neosenses_admin_bootstrap_complete: false,
      neosenses_force_password_change: credencial.forcePasswordChange,
    },
  });

  if (erroAtualizacao) {
    console.error("[auth] não foi possível preparar o provisionamento:", erroAtualizacao.message);
    return { success: false, error: "Não foi possível preparar a configuração da conta." };
  }

  const promocao = await promoverAdmin(admin, email);
  if (!promocao.success) return promocao;

  const { data: usuarioFinal, error: erroLeituraFinal } = await admin.auth.admin.getUserById(userId);
  if (erroLeituraFinal || !usuarioFinal.user) {
    console.error("[auth] leitura ao finalizar provisionamento:", erroLeituraFinal?.message);
    return { success: false, error: "Não foi possível concluir a configuração da conta." };
  }

  const { error: erroConcluir } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(usuarioFinal.user.app_metadata ?? {}),
      neosenses_internal_admin: true,
      neosenses_admin_bootstrap_complete: true,
      neosenses_force_password_change: credencial.forcePasswordChange,
    },
  });

  if (erroConcluir) {
    console.error("[auth] conclusão do provisionamento:", erroConcluir.message);
    return { success: false, error: "O perfil foi promovido, mas não foi possível concluir a configuração da conta." };
  }

  return { success: true };
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

  // Primeiro tenta a autenticação normal. O PBKDF2 de 600 mil iterações só
  // roda quando o login falha, não em todo acesso normal ao painel.
  let credencial: CredencialBootstrap | null = null;
  let tentativa = await supabase.auth.signInWithPassword({
    email: limpo,
    password: senha,
  });

  if (tentativa.error) {
    credencial = await credencialCorrespondente(limpo, senha);
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

  // Contas antigas podem autenticar antes de terminar o primeiro bootstrap.
  // Só nesses casos calculamos o verificador da senha provisória.
  if (usuario.app_metadata?.neosenses_admin_bootstrap_complete !== true) {
    credencial ??= await credencialCorrespondente(limpo, senha);

    if (!credencial) {
      await supabase.auth.signOut();
      return { success: false, error: "Esta conta ainda não concluiu a configuração do acesso interno. Entre em contato com o administrador." };
    }

    const provisionamento = await marcarCredencialComoProvisionada(
      usuario.id,
      limpo,
      credencial
    );

    if (!provisionamento.success) {
      await supabase.auth.signOut();
      return { success: false, error: provisionamento.error };
    }

    // As claims JWT só refletem os metadados depois da renovação.
    const renovada = await supabase.auth.refreshSession();
    if (renovada.error || !renovada.data.user) {
      console.error("[auth] renovação após provisionamento:", renovada.error?.message);
      await supabase.auth.signOut();
      return { success: false, error: "A configuração foi salva. Entre novamente para continuar." };
    }
    usuario = renovada.data.user;
  }

  if (
    usuario.app_metadata?.neosenses_internal_admin !== true ||
    usuario.app_metadata?.neosenses_admin_bootstrap_complete !== true
  ) {
    await supabase.auth.signOut();
    return { success: false, error: "Esta conta ainda não está habilitada para o painel interno." };
  }

  const exigeTroca = usuario.app_metadata?.neosenses_force_password_change === true;

  // Repara divergência entre o Auth e profiles que tenha sobrado de uma
  // execução antiga do bootstrap. A verificação só lê o perfil quando loga.
  if (!exigeTroca) {
    const perfilAdmin = await garantirPerfilAdmin(createAdminClient(), limpo);
    if (!perfilAdmin.success) {
      await supabase.auth.signOut();
      return { success: false, error: perfilAdmin.error ?? "Não foi possível liberar o perfil administrativo." };
    }
  }

  return {
    success: true,
    requiresPasswordChange: exigeTroca,
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
      error: "A senha foi alterada, mas a validação final não concluiu. Entre novamente com a senha nova.",
    };
  }

  // A senha inicial só é considerada concluída quando profiles também está
  // no papel administrativo. Corrige a janela que deixava o Auth completo,
  // mas o perfil ainda como viewer.
  const promocao = await garantirPerfilAdmin(admin, usuario.email!.trim().toLowerCase());
  if (!promocao.success) {
    console.error("[auth] perfil admin após troca inicial:", promocao.error);
    return {
      success: false,
      error: "Sua nova senha foi salva, mas o perfil do painel ainda não foi liberado. Tente entrar novamente ou contate o administrador.",
    };
  }

  // Reemite o JWT sem a flag de troca pendente para liberar RLS e Server Actions.
  const renovada = await supabase.auth.refreshSession();
  if (renovada.error) {
    console.error("[auth] não foi possível renovar a sessão após a troca inicial:", renovada.error.message);
    // A senha e os metadados já foram salvos; sem sessão renovada, força novo
    // login para que o próximo JWT já carregue o marcador atualizado.
    await supabase.auth.signOut();
    return { success: true };
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
  if (
    !perfil ||
    !emailInternoAutorizado(perfil.auth_email) ||
    !perfil.internal_admin ||
    !perfil.bootstrap_complete
  ) return null;
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
