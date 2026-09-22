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
 * ── O que este módulo NÃO resolve ─────────────────────────────────────────
 *
 * O contador vive na memória do processo. Em serverless, cada instância tem
 * o seu, e o teto real vira (limite × instâncias). Serve para conter abuso
 * casual e engano; não substitui limitador compartilhado. Antes de abrir o
 * site para tráfego real, mover para Postgres ou Redis.
 */

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
  const encaminhado = cabecalhos.get("x-forwarded-for");
  if (encaminhado) {
    const primeiro = encaminhado.split(",")[0].trim();
    if (primeiro) return primeiro.slice(0, 45);
  }
  return (cabecalhos.get("x-real-ip") || "sem-ip").slice(0, 45);
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

/** Geração de roteiro: chamada longa, contexto grande, custo alto por unidade. */
export const LIMITE_ROTEIRO: Regra = { nome: "roteiro", maximo: 5, janelaMs: 3_600_000 };

/** Formulários: conter robô de spam sem atrapalhar quem erra e reenvia. */
export const LIMITE_FORMULARIO: Regra = { nome: "formulario", maximo: 8, janelaMs: 3_600_000 };
