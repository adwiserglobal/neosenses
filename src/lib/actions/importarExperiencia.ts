"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/actions/auth";
import { extrairPagina } from "@/lib/importacao/experiencia";

export interface ResultadoImportacaoExperiencia {
  success: boolean;
  error?: string;
  id?: string;
  titulo?: string;
  slug?: string;
  plataforma?: string;
  sourceUrl?: string;
  aviso?: string;
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

async function slugUnico(
  supabase: ReturnType<typeof createAdminClient>,
  desejado: string
): Promise<string> {
  const base = slugBase(desejado);
  const { data } = await supabase.from("experiences").select("slug").limit(5000);
  const usados = new Set(
    (data ?? [])
      .map((x) => {
        const s = x.slug as unknown;
        return s && typeof s === "object"
          ? String((s as Record<string, unknown>).pt ?? "")
          : "";
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

function ultimoSegmento(url: string): string {
  try {
    const u = new URL(url);
    const segmento = u.pathname.split("/").filter(Boolean).pop();
    return segmento || u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Cria uma experiência em modo ESPELHO 1:1.
 *
 * Diferente do importador estruturado anterior, esta ação NÃO reorganiza o
 * conteúdo no template da NeoSenses. O cadastro guarda a URL da página de
 * origem e a rota pública passa a exibir aquela página inteira, isolada do
 * layout da NeoSenses. Assim animações, formulários, vídeos e scripts ficam a
 * cargo da própria página que a cliente já montou.
 */
export async function importarExperienciaDeUrl(
  url: string
): Promise<ResultadoImportacaoExperiencia> {
  await exigirPapel(["admin", "editor"]);

  if (!url?.trim()) {
    return { success: false, error: "Cole o link da página que deseja espelhar." };
  }

  let pagina;
  try {
    // Também valida SSRF/rede privada e confirma que a URL é uma página HTML pública.
    pagina = await extrairPagina(url);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Não consegui abrir essa página.",
    };
  }

  const supabase = createAdminClient();
  const titulo = pagina.titulo || ultimoSegmento(pagina.url) || "Experiência importada";
  const slug = await slugUnico(
    supabase,
    ultimoSegmento(pagina.canonical || pagina.url) || titulo
  );

  const metadata = {
    render_mode: "external_mirror",
    external_mirror: {
      version: 1,
      source_url: pagina.url,
      canonical_original: pagina.canonical,
      plataforma: pagina.plataforma,
      imported_at: new Date().toISOString(),
      live: true,
    },
  };

  const registro = {
    title: { pt: titulo },
    slug: { pt: slug },
    short_description: pagina.descricao ? { pt: pagina.descricao.slice(0, 500) } : null,
    description: null,
    hero_image: pagina.imagemSocial,
    audience: "viajante",
    template: "classico",
    status: "draft",
    is_featured: false,
    seo: {
      title: titulo,
      description: pagina.descricao || "",
      canonical_original: pagina.canonical || pagina.url,
    },
    metadata,
  };

  const { data: criada, error } = await supabase
    .from("experiences")
    .insert(registro as never)
    .select("id")
    .single();

  if (error || !criada) {
    console.error("[espelho] criar experiência:", error?.message);
    return {
      success: false,
      error: `Li a página, mas não consegui criar o espelho no banco${
        error?.message ? `: ${error.message}` : "."
      }`,
    };
  }

  revalidatePath("/admin/experiencias");
  revalidatePath("/experiencias");
  revalidatePath("/");

  return {
    success: true,
    id: criada.id,
    titulo,
    slug,
    plataforma: pagina.plataforma,
    sourceUrl: pagina.url,
    aviso:
      "Criado como espelho ao vivo. O conteúdo não foi convertido para o layout da NeoSenses; a página original inteira será exibida quando esta experiência for publicada.",
  };
}
