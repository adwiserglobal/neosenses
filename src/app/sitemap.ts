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
  const agora = new Date();

  const paginasMigradas: MetadataRoute.Sitemap = migratedExperiences.map((experience) => ({
    url: `${BASE}/experiencias/${experience.slug}`,
    lastModified: agora,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const fixas: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: agora, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/experiencias`, lastModified: agora, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${BASE}/experiencias/marrocos-com-neosenses`,
      lastModified: agora,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...paginasMigradas,
    { url: `${BASE}/planejar`, lastModified: agora, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/destinos`, lastModified: agora, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${BASE}/para-facilitadores`,
      lastModified: agora,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${BASE}/blog`, lastModified: agora, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/sobre`, lastModified: agora, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contato`, lastModified: agora, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contato/faq`, lastModified: agora, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/legal/privacidade`, lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/legal/termos`, lastModified: agora, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = criarClientePublico();

    const [experiencias, destinos, posts, categorias] = await Promise.all([
      supabase.from("experiences").select("slug, updated_at").eq("status", "published"),
      supabase.from("destinations").select("slug, updated_at").eq("is_active", true),
      supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
      supabase.from("categories").select("slug").eq("is_active", true),
    ]);

    const pt = (campo: unknown): string | null => {
      if (!campo || typeof campo !== "object") return null;
      const o = campo as Record<string, string>;
      return o.pt || o.en || null;
    };

    const slugsFixos = new Set([
      "marrocos-com-neosenses",
      ...migratedExperiences.map((experience) => experience.slug),
    ]);

    const doCatalogo: MetadataRoute.Sitemap = (experiencias.data ?? [])
      .map((e) => pt(e.slug))
      .filter((s): s is string => !!s && !slugsFixos.has(s))
      .map((slug) => ({
        url: `${BASE}/experiencias/${slug}`,
        lastModified: agora,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }));

    const porCategoria: MetadataRoute.Sitemap = (categorias.data ?? []).map((c) => ({
      url: `${BASE}/experiencias?categoria=${c.slug}`,
      lastModified: agora,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const slugsDeDestino = (destinos.data ?? [])
      .map((d) => pt(d.slug))
      .filter((s): s is string => !!s);

    const paginasDeDestino: MetadataRoute.Sitemap = slugsDeDestino.map((slug) => ({
      url: `${BASE}/destinos/${slug}`,
      lastModified: agora,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

    const porDestino: MetadataRoute.Sitemap = slugsDeDestino.map((slug) => ({
      url: `${BASE}/experiencias?destino=${slug}`,
      lastModified: agora,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const doBlog: MetadataRoute.Sitemap = (posts.data ?? [])
      .map((p) => ({ slug: pt(p.slug), atualizado: p.updated_at }))
      .filter((p): p is { slug: string; atualizado: string } => !!p.slug)
      .map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: p.atualizado ? new Date(p.atualizado) : agora,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    return [
      ...fixas,
      ...doCatalogo,
      ...paginasDeDestino,
      ...porCategoria,
      ...porDestino,
      ...doBlog,
    ];
  } catch (err) {
    console.error("[sitemap] falha ao ler o catálogo:", err instanceof Error ? err.message : err);
    return fixas;
  }
}
