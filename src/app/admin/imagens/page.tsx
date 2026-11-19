import type { Metadata } from "next";
import { exigirPapel } from "@/lib/actions/auth";
import { lerImagensDoSite } from "@/lib/dal/content";
import { SITE_IMAGE_REGISTRY } from "@/lib/site-images";
import { ImagensSiteManager } from "@/components/admin/ImagensSiteManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imagens do site | NeoSenses",
  robots: { index: false, follow: false },
};

export default async function ImagensDoSitePage() {
  await exigirPapel(["admin", "editor"]);
  const sobrescritas = await lerImagensDoSite();

  const items = SITE_IMAGE_REGISTRY.map((imagem) => ({
    ...imagem,
    url: sobrescritas[imagem.key] ?? imagem.fallback,
  }));

  return <ImagensSiteManager initialItems={items} />;
}
