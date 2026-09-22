"use server";

/**
 * Server Actions dos formulários públicos.
 *
 * Duas coisas que estavam erradas antes e não podem voltar:
 *
 *   1. Usavam a chave pública. O RLS bloqueia escrita anônima, então todo
 *      lead falhava com erro 42501 — o formulário parecia funcionar e o
 *      contato se perdia. Aqui a escrita usa service_role, no servidor.
 *
 *   2. A página de contato nem chamava isto: simulava o envio com um
 *      setTimeout e mostrava "Mensagem enviada!".
 *
 * Validação acontece aqui, não no formulário: checagem só no navegador é
 * decoração, qualquer um manda POST direto.
 */

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { identificar, verificarLimite, LIMITE_FORMULARIO } from "@/lib/limite";
import { avisarEquipeDeLead, confirmarContato } from "@/lib/email";

// ── Conexão ────────────────────────────────────────────────────────────────
function conectar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    // Sem service_role nada grava. Falhar alto: lead perdido em silêncio é
    // pior do que erro na tela.
    console.error(
      "[forms] SUPABASE_SERVICE_ROLE_KEY ausente — formulários não conseguem gravar"
    );
    return null;
  }
  return createClient<Database>(url, chave, { auth: { persistSession: false } });
}

// ── Resultado ──────────────────────────────────────────────────────────────
export interface ResultadoFormulario {
  success: boolean;
  error?: string;
  campo?: string;
  referencia?: string;
}

const ERRO_GENERICO =
  "Não conseguimos enviar agora. Tente novamente ou fale com a gente pelo WhatsApp.";

// ── Validação ──────────────────────────────────────────────────────────────
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function textoLimpo(valor: unknown, max: number): string {
  if (typeof valor !== "string") return "";
  let saida = "";
  for (const ch of valor) {
    const c = ch.codePointAt(0)!;
    const ehQuebraOuTab = c === 9 || c === 10 || c === 13;
    if (c >= 32 && c !== 127) saida += ch;
    else if (ehQuebraOuTab) saida += ch;
  }
  return saida.trim().slice(0, max);
}

function validarContato(nome: string, email: string, telefone: string) {
  if (nome.length < 2) return { campo: "name", error: "Informe seu nome." };
  if (!email && !telefone) {
    return { campo: "email", error: "Informe e-mail ou telefone para retornarmos." };
  }
  if (email && !RE_EMAIL.test(email)) {
    return { campo: "email", error: "Esse e-mail não parece válido." };
  }
  // Telefone brasileiro tem 10 ou 11 dígitos com DDD; com país, até 13.
  if (telefone) {
    const digitos = telefone.replace(/\D/g, "");
    if (digitos.length < 10 || digitos.length > 13) {
      return { campo: "phone", error: "Confira o telefone com DDD." };
    }
  }
  return null;
}

// ── Limite de envios ───────────────────────────────────────────────────────
// Fica em src/lib/limite.ts e conta por IP, nunca pelo e-mail informado.
//
// A versão anterior usava `email || telefone` como chave. Esses valores vêm
// do próprio formulário: bastava trocar o e-mail a cada envio para zerar o
// contador. É o mesmo defeito que existia no limitador do chat, e pelo mesmo
// motivo — identidade declarada pelo cliente não serve para limitar o cliente.

// ── Lead ───────────────────────────────────────────────────────────────────
export interface DadosLead {
  nome: string;
  email?: string;
  telefone?: string;
  pais?: string;
  experienciaId?: string;
  destinoDesejado?: string;
  orcamento?: string;
  mesDesejado?: string;
  viajantes?: number;
  mensagem?: string;
  origem?: "website" | "whatsapp" | "concierge" | "journey_builder" | "referral" | "social" | "other";
  /** Campo isca: preenchido só por robô. Nunca exibir ao visitante. */
  armadilha?: string;
}

export async function criarLead(dados: DadosLead): Promise<ResultadoFormulario> {
  // Robô que preenche todos os campos do HTML cai aqui. Responder "success"
  // evita que ele detecte a checagem e tente de novo por outro caminho.
  if (dados.armadilha) {
    console.warn("[forms] envio automatizado descartado");
    return { success: true };
  }

  const nome = textoLimpo(dados.nome, 120);
  const email = textoLimpo(dados.email, 160).toLowerCase();
  const telefone = textoLimpo(dados.telefone, 30);

  const invalido = validarContato(nome, email, telefone);
  if (invalido) return { success: false, ...invalido };

  const limite = verificarLimite(identificar(await headers()), LIMITE_FORMULARIO);
  if (!limite.permitido) {
    return {
      success: false,
      error: "Você já nos enviou várias mensagens. Aguarde um pouco ou fale pelo WhatsApp.",
    };
  }

  const supabase = conectar();
  if (!supabase) return { success: false, error: ERRO_GENERICO };

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: nome,
      email: email || null,
      phone: telefone || null,
      country: textoLimpo(dados.pais, 80) || null,
      experience_id: dados.experienciaId ?? null,
      preferred_destination: textoLimpo(dados.destinoDesejado, 120) || null,
      budget: textoLimpo(dados.orcamento, 60) || null,
      desired_month: textoLimpo(dados.mesDesejado, 40) || null,
      travelers_count:
        Number.isInteger(dados.viajantes) && dados.viajantes! > 0 ? dados.viajantes! : null,
      message: textoLimpo(dados.mensagem, 2000) || null,
      source: dados.origem ?? "website",
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[forms] gravar lead:", error.message);
    return { success: false, error: ERRO_GENERICO };
  }

  console.log(`[forms] lead ${data.id} registrado (${dados.origem ?? "website"})`);

  // Mesmo princípio do interesse: o lead está gravado, e-mail é consequência.
  await Promise.allSettled([
    avisarEquipeDeLead({
      nome,
      email,
      telefone,
      mensagem: textoLimpo(dados.mensagem, 2000),
      origem: dados.origem === "journey_builder" ? "Montou um roteiro" : "Formulário do site",
    }),
    email ? confirmarContato({ para: email, nome }) : Promise.resolve(false),
  ]);

  return { success: true };
}

// ── Contato ────────────────────────────────────────────────────────────────
export interface DadosContato {
  nome: string;
  email: string;
  telefone?: string;
  assunto?: string;
  mensagem: string;
  armadilha?: string;
}

export async function enviarContato(dados: DadosContato): Promise<ResultadoFormulario> {
  const mensagem = textoLimpo(dados.mensagem, 2000);
  if (mensagem.length < 10) {
    return { success: false, campo: "message", error: "Conte um pouco mais no recado." };
  }

  const assunto = textoLimpo(dados.assunto, 120);

  return criarLead({
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    mensagem: assunto ? `[${assunto}] ${mensagem}` : mensagem,
    origem: "website",
    armadilha: dados.armadilha,
  });
}

// ── Newsletter ─────────────────────────────────────────────────────────────
export async function assinarNewsletter(
  email: string,
  nome?: string,
  origem?: string
): Promise<ResultadoFormulario> {
  const limpo = textoLimpo(email, 160).toLowerCase();
  if (!RE_EMAIL.test(limpo)) {
    return { success: false, campo: "email", error: "Esse e-mail não parece válido." };
  }

  const supabase = conectar();
  if (!supabase) return { success: false, error: ERRO_GENERICO };

  // Reinscrição de quem já saiu precisa reativar, não falhar por duplicidade.
  const { error } = await supabase.from("newsletter_subscribers").upsert(
    {
      email: limpo,
      name: textoLimpo(nome, 120) || null,
      source: textoLimpo(origem, 60) || "site",
      is_active: true,
      unsubscribed_at: null,
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("[forms] newsletter:", error.message);
    return { success: false, error: ERRO_GENERICO };
  }

  return { success: true };
}

// ── Interesse numa saída ───────────────────────────────────────────────────
/**
 * "Quero esta data".
 *
 * Não é reserva: não há pagamento nem compromisso, e por isso não cria
 * registro em `bookings`. Reserva é decisão da equipe, no contato — criar uma
 * automaticamente encheria o painel de reservas pendentes que nunca existiram
 * e estragaria qualquer contagem de conversão.
 *
 * Grava em `experience_interests` e também um lead, para a equipe ver tudo
 * num lugar só.
 */
export interface DadosInteresse {
  nome: string;
  email: string;
  telefone?: string;
  experienciaId: string;
  dataId?: string;
  viajantes: number;
  mensagem?: string;
  armadilha?: string;
}

export interface ResultadoInteresse extends ResultadoFormulario {
  /** true quando a saída escolhida já estava lotada. Muda a mensagem na tela. */
  listaDeEspera?: boolean;
}

export async function registrarInteresse(dados: DadosInteresse): Promise<ResultadoInteresse> {
  if (dados.armadilha) return { success: true };

  const nome = textoLimpo(dados.nome, 120);
  const email = textoLimpo(dados.email, 160).toLowerCase();
  const telefone = textoLimpo(dados.telefone, 30);

  const invalido = validarContato(nome, email, telefone);
  if (invalido) return { success: false, ...invalido };
  if (!email) {
    return { success: false, campo: "email", error: "Precisamos do e-mail para retornar." };
  }

  const limite = verificarLimite(identificar(await headers()), LIMITE_FORMULARIO);
  if (!limite.permitido) {
    return { success: false, error: "Você já nos enviou várias mensagens. Aguarde um pouco." };
  }

  const viajantes = Number.isInteger(dados.viajantes) && dados.viajantes > 0 ? dados.viajantes : 1;

  const supabase = conectar();
  if (!supabase) return { success: false, error: ERRO_GENERICO };

  // A experiência precisa existir e estar publicada. Sem esta checagem, um
  // POST forjado registra interesse em rascunho ou em id inventado.
  const { data: experiencia } = await supabase
    .from("experiences")
    .select("id")
    .eq("id", dados.experienciaId)
    .eq("status", "published")
    .maybeSingle();

  if (!experiencia) {
    return { success: false, error: "Experiência indisponível. Atualize a página e tente de novo." };
  }

  // A lotação é conferida aqui, no servidor, e não recebida do formulário.
  // Quem manda o POST direto poderia declarar "não estou na espera" e furar
  // a fila de uma turma cheia.
  let listaDeEspera = false;
  let dataId: string | null = null;

  if (dados.dataId) {
    const { data: saida } = await supabase
      .from("experience_dates")
      .select("id, spots_total, spots_taken, status")
      .eq("id", dados.dataId)
      .eq("experience_id", experiencia.id)
      .maybeSingle();

    if (saida && saida.status === "published") {
      dataId = saida.id;
      listaDeEspera =
        saida.spots_total !== null && saida.spots_total - saida.spots_taken <= 0;
    }
    // Data que não existe ou não pertence a esta experiência é ignorada: o
    // interesse vale para a experiência mesmo assim.
  }

  const { data: lead, error: erroLead } = await supabase
    .from("leads")
    .insert({
      name: nome,
      email,
      phone: telefone || null,
      experience_id: experiencia.id,
      travelers_count: viajantes,
      message: textoLimpo(dados.mensagem, 2000) || null,
      source: "website",
      status: "new",
      metadata: { origem: listaDeEspera ? "lista_de_espera" : "interesse_em_data" },
    })
    .select("id")
    .single();

  if (erroLead) {
    console.error("[forms] lead do interesse:", erroLead.message);
    return { success: false, error: ERRO_GENERICO };
  }

  // upsert: a mesma pessoa clicando duas vezes atualiza em vez de duplicar.
  // O índice único (experiência + data + e-mail) resolve no banco, e sem ele
  // a contagem de demanda mentiria.
  const { error: erroInteresse } = await supabase.from("experience_interests").upsert(
    {
      experience_id: experiencia.id,
      experience_date_id: dataId,
      lead_id: lead.id,
      name: nome,
      email,
      phone: telefone || null,
      travelers_count: viajantes,
      message: textoLimpo(dados.mensagem, 2000) || null,
      lista_de_espera: listaDeEspera,
      origem: "site",
    } as never,
    { onConflict: "experience_id,experience_date_id,email" }
  );

  if (erroInteresse) {
    // O lead entrou; a pessoa será atendida. Não faz sentido dizer que falhou.
    console.error("[forms] registrar interesse:", erroInteresse.message);
  }

  // Avisos por e-mail em paralelo e sem `await` bloqueante no resultado: o
  // lead já está gravado, e a pessoa não pode esperar o SMTP para ver a tela
  // de confirmação. Falha de envio vira log, nunca erro na tela.
  await Promise.allSettled([
    avisarEquipeDeLead({
      nome,
      email,
      telefone,
      mensagem: textoLimpo(dados.mensagem, 2000),
      origem: listaDeEspera ? "Lista de espera" : "Interesse numa saída",
      listaDeEspera,
    }),
    confirmarContato({ para: email, nome, listaDeEspera }),
  ]);

  console.log(
    `[forms] interesse registrado${listaDeEspera ? " (lista de espera)" : ""} — experiência ${experiencia.id}`
  );

  return { success: true, listaDeEspera };
}
