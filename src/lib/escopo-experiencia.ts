import { t } from "@/lib/utils";
import type { ExperienceWithRelations, I18nField } from "@/types/models";

export type EscopoExperiencia = "nacional" | "internacional" | "outros";

const TERMOS_BRASIL = [
  "brasil", "brasileiro", "brasileira", "chapada", "veadeiros", "amazonia",
  "amazonas", "bahia", "goias", "sao paulo", "rio de janeiro", "minas gerais",
  "parana", "santa catarina", "rio grande do sul", "pernambuco", "ceara",
  "para", "maranhao", "espirito santo", "mato grosso", "pantanal",
];

const TERMOS_INTERNACIONAIS = [
  "peru", "marrocos", "tailandia", "india", "nepal", "butao", "egito",
  "mexico", "turquia", "italia", "franca", "espanha", "portugal", "grecia",
  "japao", "indonesia", "bali", "islandia", "jordania", "israel", "tanzania",
  "africa do sul", "argentina", "chile", "bolivia", "colombia", "equador", "costa rica",
];

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Usa a escolha explícita do painel; registros antigos continuam com classificação automática. */
export function escopoDaExperiencia(exp: ExperienceWithRelations): EscopoExperiencia {
  const metadata = exp.metadata as { route_scope?: unknown } | null | undefined;
  if (metadata?.route_scope === "nacional" || metadata?.route_scope === "internacional") {
    return metadata.route_scope;
  }

  const destination = exp.destination as
    | { name?: unknown; country?: { name?: unknown; slug?: string | null } | null }
    | null | undefined;
  const paisNome = destination?.country?.name ? t(destination.country.name as I18nField, "pt") : "";
  const paisSlug = destination?.country?.slug ?? "";
  const titulo = t(exp.title as I18nField, "pt");
  const resumo = t(exp.short_description as I18nField, "pt");
  const alvo = normalizar(`${paisSlug} ${paisNome} ${titulo} ${resumo}`);

  if (TERMOS_BRASIL.some((termo) => alvo.includes(termo))) return "nacional";
  if (paisNome || paisSlug) return "internacional";
  if (TERMOS_INTERNACIONAIS.some((termo) => alvo.includes(termo))) return "internacional";
  return "outros";
}
