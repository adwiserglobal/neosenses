/**
 * Mapa do site.
 *
 * /admin, /login e /roteiro/[token] ficam fora de propósito: painel e roteiro
 * pessoal não são conteúdo de site.
 */

import type { MetadataRoute } from "next";
import { criarClientePublico } from "@/lib/supabase/server";
import { migratedExperiences } from "@/content/migratedExperiences";

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.neosenses.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas não recebem lastModified artificial: assim não afirmamos
  // ao Google que todo o site mudou a cada regeneração do sitemap.
  const paginasMigradas: MetadataRoute.Sitemap = migratedExperiences
    .filter((experience) => experience.slug !== "marrocos")
    .map((experience) => ({
      url: `${BASE}/experiencias/${experience.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  const fixas: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/experiencias`, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${BASE}/experiencias/marrocos-com-neosenses`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...paginasMigradas,
    { url: `${BASE}/planejar`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/destinos`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/para-facilitadores`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/sobre`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contato`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contato/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/legal/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/termos`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = criarClientePublico();
    const [experiencias, destinos, posts] = await Promise.all([
      supabase.from("experiences").select("slug, updated_at").eq("status", "published"),
      supabase.from("destinations").select("slug, updated_at").eq("is_active", true),
      supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
    ]);

    const pt = (campo: unknown): string | null => {
      if (typeof campo === "string") return campo;
      if (!campo || typeof campo !== "object") return null;
      const o = campo as Record<string, string>;
      return o.pt || o.en || null;
    };

    // Marrocos tem uma única página oficial: a landing espelhada da Netlify.
    const slugsFixos = new Set([
      "marrocos",
      "marrocos-com-neosenses",
      ...migratedExperiences.map((experience) => experience.slug),
    ]);

    const doCatalogo: MetadataRoute.Sitemap = (experiencias.data ?? [])
      .map((e) => ({ slug: pt(e.slug), atualizado: e.updated_at }))
      .filter((e): e is { slug: string; atualizado: string } => !!e.slug && !slugsFixos.has(e.slug))
      .map((e) => ({
        url: `${BASE}/experiencias/${e.slug}`,
        ...(e.atualizado ? { lastModified: new Date(e.atualizado) } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }));

    const paginasDeDestino: MetadataRoute.Sitemap = (destinos.data ?? [])
      .map((d) => ({ slug: pt(d.slug), atualizado: d.updated_at }))
      .filter((d): d is { slug: string; atualizado: string } => !!d.slug)
      .map((d) => ({
        url: `${BASE}/destinos/${d.slug}`,
        ...(d.atualizado ? { lastModified: new Date(d.atualizado) } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }));

    const doBlog: MetadataRoute.Sitemap = (posts.data ?? [])
      .map((p) => ({ slug: pt(p.slug), atualizado: p.updated_at }))
      .filter((p): p is { slug: string; atualizado: string } => !!p.slug)
      .map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        ...(p.atualizado ? { lastModified: new Date(p.atualizado) } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    // URLs de filtros (?categoria e ?destino) são estados do catálogo, não
    // landing pages próprias. Não devem competir com o canonical /experiencias.
    return [...fixas, ...doCatalogo, ...paginasDeDestino, ...doBlog];
  } catch (err) {
    console.error("[sitemap] falha ao ler o catálogo:", err instanceof Error ? err.message : err);
    return fixas;
  }
}