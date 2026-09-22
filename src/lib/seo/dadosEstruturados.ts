/**
 * Dados estruturados (JSON-LD) para os buscadores.
 *
 * Por que importa para este negócio: quem procura "retiro de meditação no
 * Peru" está numa busca de intenção alta, e o buscador só mostra data, preço
 * e avaliação no resultado quando o site declara isso de forma estruturada.
 * Sem esses blocos, a NeoSenses aparece como link comum ao lado de
 * concorrentes que aparecem com o card completo.
 *
 * Regra que vale aqui como no Concierge: só declarar o que existe no banco.
 * Marcar preço ou vaga que não existe é motivo de penalização, e o buscador
 * confere contra o conteúdo visível da página.
 */

import type { ExperienceWithRelations, I18nField } from "@/types/models";
import { t } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.neosenses.com.br";
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511947188319";

/** A empresa. Vai no layout, uma vez só. */
export function organizacao() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${BASE}/#organizacao`,
    name: "NeoSenses",
    description:
      "Experiências de viagem transformadoras e jornadas espirituais: retiros, peregrinações e imersões em grupos pequenos.",
    url: BASE,
    telephone: `+${WHATSAPP}`,
    email: "contato@neosenses.com.br",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Alegre, 928",
      addressLocality: "São Caetano do Sul",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    areaServed: "BR",
    knowsLanguage: ["pt-BR", "en", "es"],
  };
}

/**
 * Uma experiência, como produto turístico.
 *
 * TouristTrip é o tipo que descreve viagem organizada, e aceita as saídas
 * como ofertas — é o que faz o buscador exibir data e valor no resultado.
 */
export function experiencia(exp: ExperienceWithRelations) {
  const titulo = t(exp.title as I18nField, "pt");
  const slug = t(exp.slug as I18nField, "pt");
  const resumo = t(exp.short_description as I18nField, "pt");
  const destino = exp.destination ? t(exp.destination.name as I18nField, "pt") : null;
  const pais = exp.destination?.country ? t(exp.destination.country.name as I18nField, "pt") : null;

  const hoje = new Date().toISOString().slice(0, 10);
  const saidas = (exp.dates ?? []).filter((d) => d.status === "published" && d.start_date >= hoje);

  // Uma oferta por saída, com a vaga real. Sem saída publicada não se declara
  // oferta nenhuma — melhor aparecer sem preço do que com preço inventado.
  const ofertas = saidas.map((d) => {
    const restantes = d.spots_total === null ? null : Math.max(0, d.spots_total - d.spots_taken);
    return {
      "@type": "Offer",
      url: `${BASE}/experiencias/${slug}`,
      price: d.price ?? exp.price_from ?? undefined,
      priceCurrency: exp.price_currency || "BRL",
      availability:
        restantes === 0
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      validFrom: d.start_date,
      ...(restantes !== null ? { inventoryLevel: { "@type": "QuantitativeValue", value: restantes } } : {}),
    };
  });

  const dados: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${BASE}/experiencias/${slug}#viagem`,
    name: titulo,
    url: `${BASE}/experiencias/${slug}`,
    provider: { "@id": `${BASE}/#organizacao` },
  };

  if (resumo) dados.description = resumo;
  if (exp.hero_image) dados.image = exp.hero_image;

  if (destino) {
    dados.itinerary = {
      "@type": "Place",
      name: destino,
      ...(pais ? { address: { "@type": "PostalAddress", addressCountry: pais } } : {}),
    };
  }

  if (exp.duration_days) {
    // ISO 8601: P12D = doze dias.
    dados.subjectOf = { "@type": "Trip", name: titulo };
    dados.touristType = "Viajante em busca de experiência transformadora";
  }

  if (ofertas.length > 0) dados.offers = ofertas;

  if (exp.group_size_max) {
    dados.maximumAttendeeCapacity = exp.group_size_max;
  }

  return dados;
}

/**
 * Roteiro dia a dia como ItemList.
 * Só faz sentido quando há itinerário cadastrado.
 */
export function roteiro(exp: ExperienceWithRelations) {
  const dias = exp.itinerary ?? [];
  if (dias.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Roteiro — ${t(exp.title as I18nField, "pt")}`,
    numberOfItems: dias.length,
    itemListElement: dias.map((d) => ({
      "@type": "ListItem",
      position: d.day_number,
      name: t(d.title as I18nField, "pt"),
      ...(d.description ? { description: t(d.description as I18nField, "pt").slice(0, 300) } : {}),
    })),
  };
}

/** Perguntas frequentes. O buscador exibe como sanfona no resultado. */
export function perguntasFrequentes(
  perguntas: Array<{ question: unknown; answer: unknown }>
) {
  const itens = perguntas
    .map((p) => ({ q: t(p.question as I18nField, "pt"), a: t(p.answer as I18nField, "pt") }))
    .filter((p) => p.q && p.a);

  if (itens.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: itens.map((p) => ({
      "@type": "Question",
      name: p.q,
      acceptedAnswer: { "@type": "Answer", text: p.a },
    })),
  };
}

/** Trilha de navegação. Ajuda o buscador a entender a hierarquia. */
export function trilha(itens: Array<{ nome: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.nome,
      item: `${BASE}${item.url}`,
    })),
  };
}
