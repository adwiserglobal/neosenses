/**
 * Leitura de facilitadores, depoimentos, perguntas frequentes, configuração
 * e guias de viagem.
 *
 * Roda no servidor, com a chave pública sob RLS.
 */

import { criarClientePublico } from "@/lib/supabase/server";
import type { Facilitator, Testimonial, Faq, TravelGuide, GuideTopic } from "@/types/models";

export async function listarFacilitadores(): Promise<Facilitator[]> {
  const supabase = criarClientePublico();

  const { data, error } = await supabase
    .from("facilitators")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) console.error("[dal] facilitadores:", error.message);
  return (data ?? []) as Facilitator[];
}

export async function listarDepoimentos(limite = 6): Promise<Testimonial[]> {
  const supabase = criarClientePublico();

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(limite);

  if (error) console.error("[dal] depoimentos:", error.message);
  return (data ?? []) as Testimonial[];
}

export async function listarPerguntasFrequentes(categoria?: string): Promise<Faq[]> {
  const supabase = criarClientePublico();

  let query = supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (categoria) query = query.eq("category", categoria);

  const { data, error } = await query;
  if (error) console.error("[dal] perguntas frequentes:", error.message);
  return (data ?? []) as Faq[];
}

/**
 * Guias de viagem, opcionalmente por tópico ou destino.
 *
 * Os guias globais entram sempre; os de destino se somam quando um destino é
 * informado. É o mesmo conteúdo que o Concierge usa — editar no admin reflete
 * nos dois lugares.
 */
export async function listarGuias(opcoes?: {
  topicos?: GuideTopic[];
  destinoId?: string;
  apenasIniciantes?: boolean;
  limite?: number;
}): Promise<TravelGuide[]> {
  const { topicos, destinoId, apenasIniciantes, limite = 20 } = opcoes ?? {};
  const supabase = criarClientePublico();

  let query = supabase.from("travel_guides").select("*").eq("is_active", true);

  if (topicos?.length) query = query.in("topic", topicos);
  if (apenasIniciantes) query = query.eq("for_beginners", true);
  if (destinoId) query = query.or(`scope.eq.global,destination_id.eq.${destinoId}`);
  else query = query.eq("scope", "global");

  const { data, error } = await query
    .order("priority", { ascending: true })
    .order("sort_order", { ascending: true })
    .limit(limite);

  if (error) {
    console.error("[dal] guias de viagem:", error.message);
    return [];
  }
  return (data ?? []) as TravelGuide[];
}

/**
 * Configurações públicas do site.
 *
 * Só chaves marcadas com `is_public` são visíveis — o RLS cuida disso, mas o
 * filtro fica explícito aqui para quem lê o código não precisar deduzir.
 */
export async function lerConfiguracoesPublicas(): Promise<Record<string, unknown>> {
  const supabase = criarClientePublico();

  const { data, error } = await supabase.from("settings").select("key, value").eq("is_public", true);

  if (error || !data) {
    if (error) console.error("[dal] configurações:", error.message);
    return {};
  }

  return Object.fromEntries(data.map((s) => [s.key, s.value]));
}

export async function funcionalidadeAtiva(chave: string): Promise<boolean> {
  const supabase = criarClientePublico();

  const { data } = await supabase.from("feature_flags").select("enabled").eq("key", chave).maybeSingle();
  return data?.enabled ?? false;
}
