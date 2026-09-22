/**
 * Aliases de domínio derivados do schema.
 *
 * `database.ts` é GERADO a partir do banco:
 *
 *   npx supabase gen types typescript --local > src/types/database.ts
 *
 * Editar aquele arquivo é trabalho perdido — a próxima geração sobrescreve.
 * Todo tipo escrito à mão mora aqui e se apoia no que foi gerado, para que
 * uma coluna renomeada apareça como erro de compilação em vez de virar
 * `undefined` em produção.
 */

import type { Database } from "./database";

type Tabelas = Database["public"]["Tables"];
type Linha<T extends keyof Tabelas> = Tabelas[T]["Row"];

// ── Texto multi-idioma ─────────────────────────────────────────────────────
/**
 * Campo traduzido, como gravado no banco: {"pt": "...", "en": "...", "es": "..."}
 *
 * O gerador tipa colunas JSONB como `Json`, que não diz nada sobre o formato.
 * Este alias documenta o contrato — nem todo idioma está sempre presente, daí
 * o Partial.
 */
export type I18nField = Partial<Record<"pt" | "en" | "es", string>>;

/** Lê um campo traduzido com fallback previsível. */
export function textoI18n(campo: unknown, idioma: string = "pt"): string {
  if (!campo) return "";
  if (typeof campo === "string") return campo;
  if (typeof campo === "object") {
    const o = campo as Record<string, string>;
    return o[idioma] || o.pt || o.en || Object.values(o).find(Boolean) || "";
  }
  return String(campo);
}

// ── Conteúdo ───────────────────────────────────────────────────────────────
export type Country = Linha<"countries">;
export type Destination = Linha<"destinations">;
export type Category = Linha<"categories">;
export type Facilitator = Linha<"facilitators">;
/**
 * Papel numa experiência, vindo de `experience_facilitators.role`.
 *
 * O documento de reformulação pede três blocos distintos em "Quem conduz":
 * quem facilita, o guia CADASTUR da NeoSenses e o anfitrião local. A mesma
 * pessoa pode ter papéis diferentes em jornadas diferentes, então o papel
 * mora na ligação e não no cadastro dela.
 */
export type PapelDoFacilitador = "facilitator" | "guia_neosenses" | "guia_local";
export type FacilitadorNaExperiencia = Facilitator & { papel: string };
export type Experience = Linha<"experiences">;
export type ExperienceDate = Linha<"experience_dates">;
export type ItineraryDay = Linha<"itinerary_days">;
export type ExperienceHighlight = Linha<"experience_highlights">;
export type ExperienceInclusion = Linha<"experience_inclusions">;
export type ExperienceFaq = Linha<"experience_faqs">;
export type ExperiencePartnership = Linha<"experience_partnership">;
export type Testimonial = Linha<"testimonials">;
export type Faq = Linha<"faqs">;
export type BlogPost = Linha<"blog_posts">;
export type BlogCategory = Linha<"blog_categories">;
export type Media = Linha<"media">;

// ── Conhecimento de viagem ─────────────────────────────────────────────────
export type TravelGuide = Linha<"travel_guides">;
export type PackingCatalogItem = Linha<"packing_catalog_items">;
export type GuideTopic = Database["public"]["Enums"]["guide_topic"];
export type GuideScope = Database["public"]["Enums"]["guide_scope"];
export type PackingCategory = Database["public"]["Enums"]["packing_category"];

// ── Pessoas e negócio ──────────────────────────────────────────────────────
export type Profile = Linha<"profiles">;
export type Lead = Linha<"leads">;
export type Booking = Linha<"bookings">;
export type Conversation = Linha<"conversations">;
export type Message = Linha<"messages">;

// ── Features de IA ─────────────────────────────────────────────────────────
export type AIJourney = Linha<"ai_journeys">;
export type PackingList = Linha<"packing_lists">;
export type PackingListItem = Linha<"packing_list_items">;
export type TravelerProfile = Linha<"traveler_profiles">;
export type CommunityMatch = Linha<"community_matches">;

// ── Enums de estado ────────────────────────────────────────────────────────
export type ExperienceStatus = Database["public"]["Enums"]["experience_status"];
export type ContentStatus = Database["public"]["Enums"]["content_status"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type TravelerType = Database["public"]["Enums"]["traveler_type"];

// ── Composições ────────────────────────────────────────────────────────────
export type DestinationWithCountry = Destination & {
  country: Country | null;
};

/**
 * Experiência com tudo que a página de detalhe mostra.
 *
 * Os relacionamentos são opcionais porque cada consulta traz um recorte —
 * a listagem não busca itinerário nem depoimento. Marcar como obrigatório
 * mentiria para quem usa o tipo.
 */
export type ExperienceWithRelations = Experience & {
  category?: Category | null;
  destination?: DestinationWithCountry | null;
  facilitators?: FacilitadorNaExperiencia[];
  dates?: ExperienceDate[];
  itinerary?: ItineraryDay[];
  highlights?: ExperienceHighlight[];
  inclusions?: ExperienceInclusion[];
  faqs?: ExperienceFaq[];
  testimonials?: Testimonial[];
  /** Só as páginas de facilitador preenchem; nas outras vem vazio. */
  partnership?: ExperiencePartnership[];
};

// ── Layout de página ───────────────────────────────────────────────────────
export type PageTemplate = Database["public"]["Enums"]["page_template"];
export type AudienceType = Database["public"]["Enums"]["audience_type"];
export type PartnershipSide = Database["public"]["Enums"]["partnership_side"];

export type BlogPostWithRelations = BlogPost & {
  category?: BlogCategory | null;
  author?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};
