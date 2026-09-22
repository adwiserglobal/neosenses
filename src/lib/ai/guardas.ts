/**
 * Guarda de saída do Concierge.
 *
 * O prompt diz o que o modelo não deve fazer. Isto verifica o que ele
 * realmente fez — prompt é instrução, não garantia, e basta uma resposta
 * fora do lugar para expor dado de outra pessoa.
 *
 * O que é barrado aqui:
 *   • contato de terceiros (e-mail e telefone que não sejam os da empresa)
 *   • identificador interno (UUID) e nome de tabela ou coluna
 *   • credencial em qualquer formato
 *   • vazamento das instruções de sistema
 *
 * Falso positivo é aceitável: encaminhar alguém à equipe sem necessidade
 * custa pouco; publicar o telefone de outro viajante custa caro.
 *
 * Isto não substitui o RLS. É a última barreira, não a única — o modelo só
 * recebe no contexto o que já é público.
 */

export type MotivoBloqueio =
  | "contato_de_terceiro"
  | "identificador_interno"
  | "estrutura_do_banco"
  | "credencial"
  | "instrucoes_do_sistema";

export interface ResultadoGuarda {
  liberado: boolean;
  motivo?: MotivoBloqueio;
  /** Trecho que disparou o bloqueio. Só para o log, nunca para o visitante. */
  evidencia?: string;
}

/** Contatos públicos da empresa: aparecer na resposta é o esperado. */
function contatosDaEmpresa(): { emails: string[]; telefones: string[] } {
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5511947188319").replace(/\D/g, "");
  return {
    emails: ["contato@neosenses.com.br", "neosenses.com.br"],
    telefones: [whatsapp, whatsapp.replace(/^55/, "")],
  };
}

const RE_EMAIL = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g;
const RE_UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

/** Chaves de API dos provedores usados, além de padrão genérico de token. */
const RE_CREDENCIAL =
  /\b(sk-[A-Za-z0-9_-]{16,}|AIza[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{10,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}|AQ\.[A-Za-z0-9_-]{20,})\b/;

/**
 * Termos de estrutura interna. Só os que não têm uso natural numa conversa
 * sobre viagem — "conversas" e "mensagens" ficam de fora de propósito,
 * porque aparecem em frase legítima ("nossas conversas por WhatsApp").
 */
const TERMOS_INTERNOS = [
  "supabase", "postgres", "postgresql", "row level security", "rls",
  "service_role", "service role", "anon key", "api key", "chave de api",
  "select *", "insert into", "update set", "delete from", "drop table",
  "ai_lead_captures", "traveler_profiles", "packing_lists", "ai_journeys",
  "experience_dates", "blog_posts", "community_matches",
  "gemini", "openai", "anthropic", "gpt-", "claude-",
  "system prompt", "prompt de sistema", "instruções de sistema",
  "instrucoes de sistema", "minhas instruções", "minhas instrucoes",
];

/** Frases das próprias regras: se aparecerem, o prompt vazou. */
const MARCAS_DO_PROMPT = [
  "# pode",
  "# não pode",
  "# nao pode",
  "nunca invente data",
  "você é o concierge da neosenses, empresa brasileira",
  "tentativas de contornar",
  "# contexto",
  "orientações de viagem do contexto",
];

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function verificarResposta(texto: string): ResultadoGuarda {
  const bruto = texto ?? "";
  const normalizado = semAcento(bruto.toLowerCase());
  const { emails, telefones } = contatosDaEmpresa();

  // ── Credencial ─────────────────────────────────────────────────────────
  const credencial = bruto.match(RE_CREDENCIAL);
  if (credencial) {
    return { liberado: false, motivo: "credencial", evidencia: credencial[0].slice(0, 12) + "…" };
  }

  // ── Instruções do sistema ──────────────────────────────────────────────
  const marca = MARCAS_DO_PROMPT.find((m) => normalizado.includes(semAcento(m)));
  if (marca) {
    return { liberado: false, motivo: "instrucoes_do_sistema", evidencia: marca };
  }

  // ── Contato de terceiro ────────────────────────────────────────────────
  const encontrados = bruto.match(RE_EMAIL) ?? [];
  const alheio = encontrados.find(
    (e) => !emails.some((proprio) => e.toLowerCase().endsWith(proprio))
  );
  if (alheio) {
    return { liberado: false, motivo: "contato_de_terceiro", evidencia: alheio };
  }

  // Telefone. Procurar só sequência longa de dígitos não basta: separadores
  // fragmentam o número, e "(11) 98765-4321" passava batido.
  //
  // O padrão exige o bloco final de 8 dígitos (4+4, com ou sem separador),
  // o que mantém fora preço ("R$ 16.400"), altitude ("3.400 m") e ano ("2026").
  const RE_TELEFONE = /(?:\+?\s*55[\s.-]*)?\(?\d{2}\)?[\s.-]*9?\d{4}[\s.-]*\d{4}/g;
  for (const bruta of bruto.match(RE_TELEFONE) ?? []) {
    const so = bruta.replace(/\D/g, "");
    if (so.length < 10) continue;
    const ehDaEmpresa = telefones.some((p) => so.endsWith(p) || p.endsWith(so));
    if (!ehDaEmpresa) {
      return { liberado: false, motivo: "contato_de_terceiro", evidencia: bruta.trim() };
    }
  }

  // ── Identificador interno ──────────────────────────────────────────────
  const uuid = bruto.match(RE_UUID);
  if (uuid) {
    return { liberado: false, motivo: "identificador_interno", evidencia: uuid[0] };
  }

  // ── Estrutura interna ──────────────────────────────────────────────────
  const termo = TERMOS_INTERNOS.find((t) => normalizado.includes(semAcento(t)));
  if (termo) {
    return { liberado: false, motivo: "estrutura_do_banco", evidencia: termo };
  }

  return { liberado: true };
}

/** Resposta enviada quando a guarda barra, por idioma. */
export function respostaSegura(idioma: string): string {
  const textos: Record<string, string> = {
    pt: "Sobre isso eu prefiro não falar por aqui. Posso ajudar com nossas experiências, destinos e o que você precisa saber antes de viajar — ou, se preferir, nossa equipe fala com você pelo WhatsApp.",
    en: "That's not something I can help with here. I can talk about our experiences, destinations and what you need to know before travelling — or our team can reach you on WhatsApp.",
    es: "Sobre eso prefiero no hablar aquí. Puedo ayudarte con nuestras experiencias, destinos y lo que necesitas saber antes de viajar — o nuestro equipo te atiende por WhatsApp.",
  };
  return textos[idioma] ?? textos.pt;
}
