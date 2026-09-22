/**
 * Formato do roteiro e conferência da resposta da IA.
 *
 * Deliberadamente sem dependência do cliente de IA: validar o que voltou é
 * lógica pura, e mantê-la separada permite testá-la sem nenhuma chamada de
 * rede — que é justamente a parte que precisa de teste, porque é ela que
 * impede um id alucinado de virar link.
 */

/** Limite de dias que o roteiro não pode ultrapassar. */
export interface FaixaDeDias {
  min: number;
  max: number;
}

export interface TrechoRoteiro {
  de: number;
  ate: number;
  titulo: string;
  descricao: string;
  /**
   * "neosenses" é uma experiência do catálogo, com id conferido.
   * "extensao" é sugestão livre — dias antes, depois ou entre experiências.
   */
  tipo: "neosenses" | "extensao";
  experienceId: string | null;
  /** Preenchido pelo código a partir do catálogo, nunca pela IA. */
  url?: string | null;
  local?: string | null;
}

export interface Roteiro {
  titulo: string;
  resumo: string;
  porQueCombina: string;
  trechos: TrechoRoteiro[];
  aPreparar: string[];
  observacao: string | null;
}

export interface ExperienciaDisponivel {
  id: string;
  titulo: string;
  slug: string;
  destino: string;
  pais: string;
  dias: number | null;
  precoTexto: string;
  resumo: string;
  intencoes: string[];
  dificuldade: string;
  proximasDatas: string[];
}

/**
 * Extrai o JSON mesmo quando vem embrulhado.
 *
 * Modelo instruído a responder só JSON às vezes envolve em ```json, e uma
 * resposta perfeitamente boa seria descartada por causa da cerca.
 */
export function extrairJson(texto: string): unknown {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(limpo);
  } catch {
    // Última tentativa: do primeiro { até o último }.
    const inicio = limpo.indexOf("{");
    const fim = limpo.lastIndexOf("}");
    if (inicio >= 0 && fim > inicio) {
      try {
        return JSON.parse(limpo.slice(inicio, fim + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function texto(valor: unknown, maximo: number): string {
  if (typeof valor !== "string") return "";
  return valor.trim().slice(0, maximo);
}

/**
 * Valida e normaliza o que a IA devolveu, cruzando com o catálogo.
 * Retorna null quando a resposta não é aproveitável.
 */
export function conferirRoteiro(
  bruto: unknown,
  experiencias: ExperienciaDisponivel[],
  /** Null quando a pessoa não fixou um tempo — aí não há teto a checar. */
  faixa: FaixaDeDias | null
): Roteiro | null {
  if (!bruto || typeof bruto !== "object") return null;

  const r = bruto as Record<string, unknown>;
  const porId = new Map(experiencias.map((e) => [e.id, e]));

  const trechosBrutos = Array.isArray(r.trechos) ? r.trechos : [];
  const trechos: TrechoRoteiro[] = [];

  for (const item of trechosBrutos.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;

    const titulo = texto(t.titulo, 120);
    const descricao = texto(t.descricao, 800);
    if (!titulo) continue;

    const de = Number(t.de);
    const ate = Number(t.ate);
    if (!Number.isFinite(de) || de < 1) continue;

    const idInformado = typeof t.experienceId === "string" ? t.experienceId : null;
    const experiencia = idInformado ? porId.get(idInformado) : undefined;

    // Marcado como NeoSenses mas com id que não existe: vira sugestão livre.
    // Sem isto, um id alucinado apareceria como experiência real e o link
    // levaria a lugar nenhum.
    const ehReal = t.tipo === "neosenses" && !!experiencia;

    trechos.push({
      de: Math.round(de),
      ate: Number.isFinite(ate) && ate >= de ? Math.round(ate) : Math.round(de),
      titulo,
      descricao,
      tipo: ehReal ? "neosenses" : "extensao",
      experienceId: ehReal ? experiencia!.id : null,
      url: ehReal ? `/experiencias/${experiencia!.slug}` : null,
      local: ehReal ? [experiencia!.destino, experiencia!.pais].filter(Boolean).join(", ") : null,
    });
  }

  if (trechos.length === 0) return null;

  trechos.sort((a, b) => a.de - b.de);

  // Estourar o tempo informado invalida o roteiro inteiro: a pessoa disse
  // quantos dias tem, e um plano maior que isso não serve para ela.
  const ultimoDia = Math.max(...trechos.map((t) => t.ate));
  if (faixa && ultimoDia > faixa.max + 2) {
    console.warn(`[journey] roteiro com ${ultimoDia} dias excede o limite de ${faixa.max}`);
    return null;
  }

  const aPreparar = Array.isArray(r.aPreparar)
    ? r.aPreparar.map((i) => texto(i, 200)).filter(Boolean).slice(0, 8)
    : [];

  const titulo = texto(r.titulo, 90) || "Seu roteiro NeoSenses";
  const resumo = texto(r.resumo, 700);
  if (!resumo) return null;

  return {
    titulo,
    resumo,
    porQueCombina: texto(r.porQueCombina, 900),
    trechos,
    aPreparar,
    observacao: texto(r.observacao, 400) || null,
  };
}
