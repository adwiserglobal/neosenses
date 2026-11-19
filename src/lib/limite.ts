/**
 * Limite de uso das rotas de IA.
 *
 * ── O erro que este módulo corrige ────────────────────────────────────────
 *
 * A versão anterior montava a chave como `${ip}|${sessionId}`, com o
 * sessionId vindo do corpo do POST. Trocar o sessionId a cada requisição
 * criava uma chave nova, com contador zerado: o limite nunca era atingido.
 * O comentário no código dizia justamente que a sessão "é trocada por quem
 * quiser furar o limite" — e mesmo assim ela entrava na chave.
 *
 * Aqui a chave é o IP, e só o IP. Sessão serve para gravar a conversa, não
 * para decidir quem pode gastar cota de IA.
 *
 * ── Estratégia de contagem ────────────────────────────────────────────────
 *
 * As rotas de IA usam um contador atômico compartilhado no Postgres via RPC.
 * A chave é HMAC, sem armazenar IP em texto puro. O contador em memória fica
 * como fallback apenas para desenvolvimento local e para os formulários
 * legados que ainda usam verificarLimite().
 */

import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export interface Regra {
  /** Quantas requisições cabem na janela. */
  maximo: number;
  janelaMs: number;
  /** Aparece no log, para saber qual limite disparou. */
  nome: string;
}

interface Contador {
  total: number;
  expiraEm: number;
}

const contadores = new Map<string, Contador>();

/** Teto de chaves guardadas. Acima disso, as mais antigas saem. */
const MAX_CHAVES = 20_000;

/**
 * Remove o que venceu e, se ainda estiver grande, descarta as entradas mais
 * antigas.
 *
 * A versão anterior fazia `clear()` no mapa inteiro ao estourar o tamanho —
 * o que zerava justamente o contador de quem estava abusando. Bastava gerar
 * chaves suficientes para limpar o próprio registro.
 */
function podar(agora: number) {
  for (const [chave, c] of contadores) {
    if (c.expiraEm < agora) contadores.delete(chave);
  }

  if (contadores.size <= MAX_CHAVES) return;

  const porValidade = [...contadores.entries()].sort((a, b) => a[1].expiraEm - b[1].expiraEm);
  const remover = contadores.size - MAX_CHAVES;
  for (let i = 0; i < remover; i++) contadores.delete(porValidade[i][0]);
}

/**
 * Identidade para fins de limite: o IP.
 *
 * Só o primeiro salto de `x-forwarded-for` — os seguintes são informados pelo
 * cliente e podem ser forjados. Sem proxy conhecido, cai em "sem-ip", que faz
 * todo mundo dividir o mesmo balde: mais restritivo que o necessário, e não o
 * contrário.
 */
export function identificar(cabecalhos: Headers): string {
  // A Vercel normaliza x-real-ip no proxy de entrada. Ele tem precedência
  // sobre x-forwarded-for, cujo primeiro item pode ser enviado pelo cliente.
  const real = cabecalhos.get("x-real-ip")?.trim().replace(/^::ffff:/i, "");
  if (real && isIP(real)) return real;

  const encaminhado = cabecalhos.get("x-forwarded-for");
  if (encaminhado) {
    const primeiro = encaminhado.split(",")[0].trim().replace(/^::ffff:/i, "");
    if (isIP(primeiro)) return primeiro;
  }
  return "sem-ip";
}

/**
 * Contagem compartilhada e atômica no Postgres do Supabase.
 * A chave do bucket é HMAC com a service role: o banco não recebe nem armazena
 * IP, e um vazamento da tabela não permite enumerar as identidades facilmente.
 *
 * Em produção, indisponibilidade do contador bloqueia a chamada de IA com 503.
 * Em desenvolvimento local sem service role, usa o contador em memória.
 */
export class LimiteCompartilhadoIndisponivel extends Error {
  constructor() {
    super("O serviço de controle de uso está indisponível.");
    this.name = "LimiteCompartilhadoIndisponivel";
  }
}

export async function verificarLimiteCompartilhado(
  identidade: string,
  regra: Regra
): Promise<Veredito> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    if (process.env.NODE_ENV === "production") {
      throw new LimiteCompartilhadoIndisponivel();
    }
    return verificarLimite(identidade, regra);
  }

  const bucketHash = createHmac("sha256", serviceRole)
    .update(`${regra.nome}:${identidade}`)
    .digest("hex");

  try {
    const response = await fetch(`${url}/rest/v1/rpc/consume_ai_rate_limit`, {
      method: "POST",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_bucket_hash: bucketHash,
        p_limit: regra.maximo,
        p_window_seconds: Math.ceil(regra.janelaMs / 1000),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload: unknown = await response.json();
    const resultado = Array.isArray(payload) ? payload[0] : payload;

    if (
      !resultado ||
      typeof resultado !== "object" ||
      typeof (resultado as Record<string, unknown>).allowed !== "boolean"
    ) {
      throw new Error("Resposta inválida do limitador");
    }

    const dados = resultado as Record<string, unknown>;
    return {
      permitido: dados.allowed as boolean,
      esperarSegundos: Math.max(0, Number(dados.retry_after_seconds) || 0),
    };
  } catch {
    throw new LimiteCompartilhadoIndisponivel();
  }
}

export interface Veredito {
  permitido: boolean;
  /** Segundos até liberar. Vira o cabeçalho Retry-After. */
  esperarSegundos: number;
}

export function verificarLimite(identidade: string, regra: Regra): Veredito {
  const agora = Date.now();
  if (contadores.size > 500) podar(agora);

  const chave = `${regra.nome}:${identidade}`;
  const atual = contadores.get(chave);

  if (!atual || atual.expiraEm < agora) {
    contadores.set(chave, { total: 1, expiraEm: agora + regra.janelaMs });
    return { permitido: true, esperarSegundos: 0 };
  }

  atual.total += 1;

  if (atual.total > regra.maximo) {
    return {
      permitido: false,
      esperarSegundos: Math.max(1, Math.ceil((atual.expiraEm - agora) / 1000)),
    };
  }

  return { permitido: true, esperarSegundos: 0 };
}

/** Usado pelos testes para partir de um estado conhecido. */
export function limparContadores() {
  contadores.clear();
}

/** Só para inspeção em teste. */
export function totalDeChaves(): number {
  return contadores.size;
}

// ── Regras em uso ──────────────────────────────────────────────────────────
export const LIMITE_CHAT: Regra = { nome: "chat", maximo: 20, janelaMs: 60_000 };
export const LIMITE_CHAT_HORA: Regra = { nome: "chat-hora", maximo: 80, janelaMs: 3_600_000 };

/** Geração de roteiro: chamada longa, contexto grande, custo alto por unidade. */
export const LIMITE_ROTEIRO: Regra = { nome: "roteiro", maximo: 5, janelaMs: 3_600_000 };
export const LIMITE_ROTEIRO_DIA: Regra = { nome: "roteiro-dia", maximo: 12, janelaMs: 86_400_000 };

/** Redação de artigos consome mais tokens; limites por usuário e por IP. */
export const LIMITE_BLOG_USUARIO: Regra = { nome: "blog-usuario", maximo: 8, janelaMs: 3_600_000 };
export const LIMITE_BLOG_IP: Regra = { nome: "blog-ip", maximo: 24, janelaMs: 3_600_000 };

/** Formulários: conter robô de spam sem atrapalhar quem erra e reenvia. */
export const LIMITE_FORMULARIO: Regra = { nome: "formulario", maximo: 8, janelaMs: 3_600_000 };
