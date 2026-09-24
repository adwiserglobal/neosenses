import {
  migratedExperiences,
  type MigratedExperience,
} from "@/content/migratedExperiences";

/**
 * Conhecimento de primeira parte que já vive no próprio site.
 *
 * O Concierge normalmente enriquece a resposta com o Supabase. Porém o site
 * também possui páginas de experiências migradas que continuam publicadas
 * mesmo quando o banco não está configurado no runtime do Netlify. Este módulo
 * impede que a IA diga "não tenho os roteiros" enquanto o visitante está
 * literalmente navegando por eles.
 */

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ");
}

function termosDaPergunta(pergunta: string): string[] {
  const ignorar = new Set([
    "quais",
    "qual",
    "temos",
    "voces",
    "vcs",
    "disponiveis",
    "disponivel",
    "roteiro",
    "roteiros",
    "viagem",
    "viagens",
    "experiencia",
    "experiencias",
    "jornada",
    "jornadas",
    "sobre",
    "para",
    "como",
    "pode",
    "podem",
    "fazer",
    "quero",
    "saber",
    "mais",
  ]);

  return normalizar(pergunta)
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !ignorar.has(t));
}

function pedeCatalogo(pergunta: string): boolean {
  const p = normalizar(pergunta);
  return (
    /\b(quais|lista|listar|catalogo|opcoes)\b/.test(p) &&
    /\b(roteiros?|viagens?|experiencias?|jornadas?|retiros?|destinos?)\b/.test(p)
  ) || /\b(o que|oq)\s+(voces|vcs)\s+(tem|oferecem)\b/.test(p);
}

function pedeRoteiroDetalhado(pergunta: string): boolean {
  const p = normalizar(pergunta);
  return /\b(roteiro|itinerario|programacao|dia a dia|dias|etapas)\b/.test(p) && !pedeCatalogo(pergunta);
}

function slugDaPagina(sourcePage: string): string | null {
  return sourcePage.match(/\/experiencias\/([^/?#]+)/)?.[1] ?? null;
}

function scoreExperiencia(exp: MigratedExperience, pergunta: string, sourcePage: string): number {
  const slugPagina = slugDaPagina(sourcePage);
  let score = slugPagina === exp.slug ? 100 : 0;

  const alvo = normalizar(
    [
      exp.slug.replace(/-/g, " "),
      exp.title,
      exp.subtitle,
      exp.destination,
      exp.country,
      exp.kicker,
      exp.summary,
      exp.highlights.map((h) => h.title).join(" "),
    ].join(" ")
  );

  for (const termo of termosDaPergunta(pergunta)) {
    if (alvo.includes(termo)) score += termo.length >= 6 ? 3 : 1;
  }

  return score;
}

function linhaResumo(exp: MigratedExperience): string {
  return [
    `### ${exp.title}`,
    `${exp.destination} · ${exp.country}`,
    exp.summary,
    `Situação de saída: ${exp.period}.`,
    `Página: /experiencias/${exp.slug}`,
  ].join("\n");
}

function detalheExperiencia(exp: MigratedExperience): string {
  const partes = [linhaResumo(exp)];

  if (exp.why) partes.push(`Por que essa jornada existe: ${exp.why}`);
  if (exp.value) partes.push(`Proposta: ${exp.value}`);
  if (exp.forWhom) partes.push(`Para quem: ${exp.forWhom}`);

  if (exp.highlights.length > 0) {
    partes.push(
      `Destaques:\n${exp.highlights
        .slice(0, 8)
        .map((h) => `- ${h.title}: ${h.description}`)
        .join("\n")}`
    );
  }

  if (exp.itinerary.length > 0) {
    partes.push(
      `Roteiro dia a dia:\n${exp.itinerary
        .slice(0, 16)
        .map(
          (d) =>
            `- Dia ${d.day} — ${d.title}${d.location ? ` (${d.location})` : ""}: ${d.description}`
        )
        .join("\n")}`
    );
  } else {
    partes.push(
      "Roteiro dia a dia: ainda não há uma sequência completa confirmada nesta base. Use a visão geral e os destaques acima; não invente etapas."
    );
  }

  if (exp.notes?.length) {
    partes.push(`Observações de publicação:\n${exp.notes.map((n) => `- ${n}`).join("\n")}`);
  }

  return partes.join("\n");
}

/**
 * Retorna contexto confirmado do próprio site. Não afirma disponibilidade:
 * "publicado" significa que existe uma página/experiência no site, enquanto
 * datas, vagas e valores continuam dependendo dos dados explicitamente
 * presentes no contexto.
 */
export function buildSiteKnowledgeContext(
  pergunta: string,
  sourcePage: string
): string {
  if (migratedExperiences.length === 0) return "";

  const ordenadas = migratedExperiences
    .map((exp) => ({ exp, score: scoreExperiencia(exp, pergunta, sourcePage) }))
    .sort((a, b) => b.score - a.score);

  const catalogo = pedeCatalogo(pergunta);
  const detalhado = pedeRoteiroDetalhado(pergunta);
  const relevantes = ordenadas.filter((x) => x.score > 0);

  let selecionadas: MigratedExperience[];
  if (catalogo) {
    selecionadas = ordenadas.map((x) => x.exp);
  } else if (relevantes.length > 0) {
    selecionadas = relevantes.slice(0, detalhado ? 2 : 3).map((x) => x.exp);
  } else {
    // Mesmo numa pergunta genérica ("o que você pode fazer?"), o Concierge
    // precisa saber o que existe no site para conseguir explicar suas opções.
    selecionadas = ordenadas.map((x) => x.exp);
  }

  const corpo = selecionadas
    .map((exp) => {
      const ehFoco = !catalogo && (detalhado || ordenadas[0]?.exp.slug === exp.slug) && ordenadas[0]?.score > 0;
      return ehFoco ? detalheExperiencia(exp) : linhaResumo(exp);
    })
    .join("\n\n");

  return `CONHECIMENTO CONFIRMADO DO SITE NEOSENSES
Este bloco vem das páginas publicadas da própria NeoSenses. Trate-o como fonte de primeira parte.
IMPORTANTE: a existência de uma página não confirma vaga, preço atual ou data de saída. Quando o campo de período disser "sob consulta", diga exatamente isso.
Nunca diga que "não tem acesso aos roteiros" se a informação pedida estiver neste bloco.

${corpo}`;
}
