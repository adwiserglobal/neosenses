"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/actions/auth";
import {
  baixarImagemPublica,
  extrairPagina,
  estruturarExperiencia,
  type ExperienciaEstruturada,
} from "@/lib/importacao/experiencia";

export interface ResultadoImportacaoExperiencia {
  success: boolean;
  error?: string;
  id?: string;
  titulo?: string;
  slug?: string;
  plataforma?: string;
  aviso?: string;
  itens?: {
    imagens: number;
    roteiro: number;
    destaques: number;
    inclusoes: number;
    faqs: number;
    datas: number;
  };
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugBase(texto: string): string {
  return normalizar(texto).replace(/\s+/g, "-").slice(0, 80) || `experiencia-${Date.now()}`;
}

async function slugUnico(supabase: ReturnType<typeof createAdminClient>, desejado: string): Promise<string> {
  const base = slugBase(desejado);
  const { data } = await supabase.from("experiences").select("slug").limit(5000);
  const usados = new Set(
    (data ?? [])
      .map((x) => {
        const s = x.slug as unknown;
        return s && typeof s === "object" ? String((s as Record<string, unknown>).pt ?? "") : "";
      })
      .filter(Boolean)
  );
  if (!usados.has(base)) return base;
  for (let i = 2; i < 10_000; i++) {
    const candidato = `${base.slice(0, 74)}-${i}`;
    if (!usados.has(candidato)) return candidato;
  }
  return `${base.slice(0, 60)}-${Date.now()}`;
}

async function categoriaCompativel(
  supabase: ReturnType<typeof createAdminClient>,
  hint: string,
  titulo: string
): Promise<string | null> {
  const { data } = await supabase.from("categories").select("id, name, slug").eq("is_active", true);
  if (!data?.length) return null;
  const alvo = normalizar(`${hint} ${titulo}`);
  if (!alvo) return null;

  let melhor: { id: string; pontos: number } | null = null;
  for (const c of data) {
    const nome = c.name && typeof c.name === "object" ? String((c.name as Record<string, unknown>).pt ?? "") : "";
    const termos = normalizar(`${c.slug} ${nome}`).split(" ").filter((x) => x.length > 3);
    const pontos = termos.reduce((s, termo) => s + (alvo.includes(termo) ? 1 : 0), 0);
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { id: c.id, pontos };
  }
  return melhor?.id ?? null;
}

function extensao(tipo: string): string {
  return ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  } as Record<string, string>)[tipo] ?? "jpg";
}

async function copiarImagens(
  supabase: ReturnType<typeof createAdminClient>,
  experienceId: string,
  estrutura: ExperienciaEstruturada
): Promise<{ mapa: Map<string, string>; urls: string[] }> {
  const originais = Array.from(
    new Set([...(estrutura.heroImage ? [estrutura.heroImage] : []), ...estrutura.imagens])
  ).slice(0, 8);
  const mapa = new Map<string, string>();

  await Promise.all(
    originais.map(async (origem, indice) => {
      const arquivo = await baixarImagemPublica(origem);
      if (!arquivo) return;
      const caminho = `${experienceId}/${String(indice + 1).padStart(2, "0")}.${extensao(arquivo.contentType)}`;
      const { error } = await supabase.storage
        .from("experiencias-importadas")
        .upload(caminho, arquivo.bytes, { contentType: arquivo.contentType, upsert: true, cacheControl: "31536000" });
      if (error) return;
      const { data } = supabase.storage.from("experiencias-importadas").getPublicUrl(caminho);
      if (data.publicUrl) mapa.set(origem, data.publicUrl);
    })
  );

  return { mapa, urls: originais.map((u) => mapa.get(u) ?? u) };
}

function pt(texto: string): Record<string, string> | null {
  return texto ? { pt: texto } : null;
}

export async function importarExperienciaDeUrl(url: string): Promise<ResultadoImportacaoExperiencia> {
  await exigirPapel(["admin", "editor"]);

  if (!url?.trim()) return { success: false, error: "Cole o link da página que deseja importar." };

  let pagina;
  try {
    pagina = await extrairPagina(url);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Não consegui abrir essa página." };
  }

  const estrutura = await estruturarExperiencia(pagina);
  const supabase = createAdminClient();
  const slug = await slugUnico(supabase, estrutura.slug || estrutura.titulo);
  const categoryId = await categoriaCompativel(supabase, estrutura.categoryHint, estrutura.titulo);
  const moedaEhReal = estrutura.currency === "BRL";
  const grupoMin = estrutura.groupMin;
  const grupoMax = grupoMin && estrutura.groupMax && estrutura.groupMax < grupoMin ? grupoMin : estrutura.groupMax;

  const metadataInicial = {
    importacao: {
      source_url: pagina.url,
      canonical: pagina.canonical,
      plataforma: pagina.plataforma,
      imported_at: new Date().toISOString(),
      ai: estrutura.ai ?? null,
      aviso: estrutura.avisoIA ?? null,
      imagens_origem: estrutura.imagens,
    },
    imagens_originais: estrutura.imagens,
  };

  const registro = {
    title: { pt: estrutura.titulo },
    slug: { pt: slug },
    short_description: pt(estrutura.resumo),
    description: pt(estrutura.descricao),
    who_is_this_for: pt(estrutura.paraQuem),
    hero_kicker: pt(estrutura.heroKicker),
    subtitle: pt(estrutura.subtitulo),
    period_label: pt(estrutura.periodo),
    why_created: pt(estrutura.porQueCriamos),
    value_proposition: pt(estrutura.propostaDeValor),
    relax_text: pt(estrutura.relaxText),
    closing_title: pt(estrutura.closingTitle),
    closing_text: pt(estrutura.closingText),
    audience: estrutura.audience,
    template: estrutura.template,
    category_id: categoryId,
    destination_id: null,
    duration_days: estrutura.durationDays,
    group_size_min: grupoMin,
    group_size_max: grupoMax,
    difficulty: estrutura.difficulty,
    physical_demand: estrutura.physicalDemand,
    price_from: moedaEhReal ? estrutura.priceFrom : null,
    price_currency: "BRL",
    price_note:
      !moedaEhReal && estrutura.priceFrom
        ? { pt: `Preço encontrado na página de origem: ${estrutura.currency} ${estrutura.priceFrom}. Revisar e converter para BRL antes de publicar.` }
        : null,
    intentions: estrutura.intentions,
    hero_image: estrutura.heroImage,
    status: "draft",
    is_featured: false,
    seo: {
      title: pagina.titulo || estrutura.titulo,
      description: pagina.descricao || estrutura.resumo,
      canonical_original: pagina.canonical || pagina.url,
    },
    metadata: metadataInicial,
  };

  const { data: criada, error: erroCriar } = await supabase
    .from("experiences")
    .insert(registro as never)
    .select("id")
    .single();

  if (erroCriar || !criada) {
    console.error("[importador] criar experiência:", erroCriar?.message);
    return {
      success: false,
      error: `Li a página, mas não consegui criar a experiência no banco${erroCriar?.message ? `: ${erroCriar.message}` : "."}`,
    };
  }

  const id = criada.id;
  const avisos: string[] = [];

  // Copia as imagens principais para o Storage. Se algum host bloquear download,
  // a URL original continua funcionando como fallback.
  const imagensCopiadas = await copiarImagens(supabase, id, estrutura);
  const heroFinal = estrutura.heroImage ? imagensCopiadas.mapa.get(estrutura.heroImage) ?? estrutura.heroImage : imagensCopiadas.urls[0] ?? null;
  const metadataFinal = {
    ...metadataInicial,
    imagens_originais: imagensCopiadas.urls.length ? imagensCopiadas.urls : estrutura.imagens,
  };
  const { error: erroMidia } = await supabase
    .from("experiences")
    .update({ hero_image: heroFinal, metadata: metadataFinal } as never)
    .eq("id", id);
  if (erroMidia) avisos.push("A experiência foi criada, mas não consegui atualizar todas as imagens copiadas.");

  const mapa = imagensCopiadas.mapa;
  const tarefas: Array<Promise<{ error: { message: string } | null }>> = [];

  if (estrutura.itinerary.length) {
    tarefas.push(
      supabase.from("itinerary_days").insert(
        estrutura.itinerary.map((item, i) => ({
          experience_id: id,
          day_number: item.dia,
          title: { pt: item.titulo },
          description: pt(item.descricao ?? ""),
          location: item.local || null,
          image: item.imagem ? mapa.get(item.imagem) ?? item.imagem : null,
          sort_order: i,
        })) as never
      ) as unknown as Promise<{ error: { message: string } | null }>
    );
  }

  if (estrutura.highlights.length) {
    tarefas.push(
      supabase.from("experience_highlights").insert(
        estrutura.highlights.map((item, i) => ({
          experience_id: id,
          title: { pt: item.titulo },
          description: pt(item.descricao ?? ""),
          grupo: item.grupo || null,
          grupo_titulo: pt(item.grupoTitulo ?? ""),
          sort_order: i,
        })) as never
      ) as unknown as Promise<{ error: { message: string } | null }>
    );
  }

  if (estrutura.inclusions.length) {
    tarefas.push(
      supabase.from("experience_inclusions").insert(
        estrutura.inclusions.map((item, i) => ({
          experience_id: id,
          text: { pt: item.texto },
          is_included: item.incluido,
          sort_order: i,
        })) as never
      ) as unknown as Promise<{ error: { message: string } | null }>
    );
  }

  if (estrutura.faqs.length) {
    tarefas.push(
      supabase.from("experience_faqs").insert(
        estrutura.faqs.map((item, i) => ({
          experience_id: id,
          question: { pt: item.pergunta },
          answer: { pt: item.resposta },
          sort_order: i,
        })) as never
      ) as unknown as Promise<{ error: { message: string } | null }>
    );
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const datasValidas = estrutura.dates.filter((d) => d.inicio >= hoje);
  if (datasValidas.length) {
    tarefas.push(
      supabase.from("experience_dates").insert(
        datasValidas.map((item) => ({
          experience_id: id,
          start_date: item.inicio,
          end_date: item.fim,
          price: moedaEhReal ? item.preco ?? null : null,
          spots_total: item.vagas ?? null,
          spots_taken: 0,
          status: "published",
          meeting_point: {},
        })) as never
      ) as unknown as Promise<{ error: { message: string } | null }>
    );
  }

  const respostas = await Promise.all(tarefas);
  for (const r of respostas) if (r.error) avisos.push(r.error.message);
  if (estrutura.avisoIA) avisos.push(estrutura.avisoIA);
  if (!categoryId) avisos.push("Não identifiquei com segurança uma categoria; revise antes de publicar.");
  if (!moedaEhReal && estrutura.priceFrom) avisos.push("O preço da origem não estava em BRL e ficou pendente de revisão.");

  revalidatePath("/admin/experiencias");
  revalidatePath("/experiencias");
  revalidatePath("/");

  return {
    success: true,
    id,
    titulo: estrutura.titulo,
    slug,
    plataforma: pagina.plataforma,
    aviso: avisos.length ? Array.from(new Set(avisos)).join(" ") : undefined,
    itens: {
      imagens: imagensCopiadas.urls.length,
      roteiro: estrutura.itinerary.length,
      destaques: estrutura.highlights.length,
      inclusoes: estrutura.inclusions.length,
      faqs: estrutura.faqs.length,
      datas: datasValidas.length,
    },
  };
}
