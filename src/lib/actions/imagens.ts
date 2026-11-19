"use server";

/**
 * Gerenciamento de imagens estruturais do site.
 * Uploads usam URL assinada e apenas membros internos autorizados podem
 * solicitar o upload ou trocar as referências públicas.
 */

import { revalidatePath } from "next/cache";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/actions/auth";
import { SITE_IMAGE_REGISTRY } from "@/lib/site-images";
import type { Json } from "@/types/database";

const BUCKET = "experience-images";
const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const TAMANHO_MAXIMO = 8 * 1024 * 1024;

function nomeSeguro(nome: string): string {
  const extensao = nome.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  const base = nome
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "imagem";
  return `${base}.${extensao}`;
}

export async function prepararUploadImagemSite(
  chave: string,
  nome: string,
  tipo: string,
  tamanho: number
): Promise<{
  success: boolean;
  error?: string;
  bucket?: string;
  path?: string;
  token?: string;
  url?: string;
}> {
  await exigirPapel(["admin", "editor"]);

  if (!SITE_IMAGE_REGISTRY.some((imagem) => imagem.key === chave)) {
    return { success: false, error: "Imagem não reconhecida." };
  }
  if (!TIPOS_PERMITIDOS.has(tipo)) {
    return { success: false, error: "Use uma imagem JPG, PNG, WebP ou AVIF." };
  }
  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > TAMANHO_MAXIMO) {
    return { success: false, error: "A imagem editada precisa ter no máximo 8 MB." };
  }

  const admin = createAdminClient();
  const atual = await admin.storage.getBucket(BUCKET);

  if (!atual.data) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: TAMANHO_MAXIMO,
      allowedMimeTypes: Array.from(TIPOS_PERMITIDOS),
    });
    if (error && !/already|exist/i.test(error.message)) {
      console.error("[admin] criar bucket de imagens do site:", error.message);
      return { success: false, error: "Não foi possível preparar o envio da imagem." };
    }
  }

  const caminho = `site/${chave}/${crypto.randomUUID()}-${nomeSeguro(nome)}`;
  const assinatura = await admin.storage.from(BUCKET).createSignedUploadUrl(caminho);

  if (assinatura.error || !assinatura.data) {
    console.error("[admin] assinar imagem do site:", assinatura.error?.message);
    return { success: false, error: "Não foi possível preparar o envio da imagem." };
  }

  const { data: publica } = admin.storage.from(BUCKET).getPublicUrl(caminho);
  return {
    success: true,
    bucket: BUCKET,
    path: caminho,
    token: assinatura.data.token,
    url: publica.publicUrl,
  };
}

export async function salvarImagemDoSite(
  chave: string,
  url: string
): Promise<{ success: boolean; error?: string }> {
  await exigirPapel(["admin", "editor"]);

  if (!SITE_IMAGE_REGISTRY.some((imagem) => imagem.key === chave)) {
    return { success: false, error: "Imagem não reconhecida." };
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const prefixo = base ? `${base}/storage/v1/object/public/${BUCKET}/site/${chave}/` : "";
  if (!prefixo || !url.startsWith(prefixo) || url.length > 2048) {
    return { success: false, error: "O endereço da imagem não pertence ao armazenamento autorizado." };
  }

  const admin = createAdminClient();
  const { data: registro, error: erroLeitura } = await admin
    .from("settings")
    .select("value")
    .eq("key", "site_images")
    .maybeSingle();

  if (erroLeitura) {
    console.error("[admin] ler imagens do site:", erroLeitura.message);
    return { success: false, error: "Não foi possível carregar as imagens atuais." };
  }

  const atuais =
    registro?.value && typeof registro.value === "object" && !Array.isArray(registro.value)
      ? (registro.value as Record<string, Json>)
      : {};

  const novas = { ...atuais, [chave]: url } as Json;
  const supabase = await createServerSupabaseClient();
  const { data: sessao } = await supabase.auth.getUser();

  const { error } = await admin.from("settings").upsert(
    {
      key: "site_images",
      value: novas,
      description: "Sobrescritas das imagens estruturais editáveis do site NeoSenses.",
      is_public: true,
      updated_by: sessao.user?.id ?? null,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin] salvar imagem do site:", error.message);
    return { success: false, error: "Não foi possível publicar a imagem. Tente novamente." };
  }

  revalidatePath("/", "page");
  revalidatePath("/sobre", "page");
  revalidatePath("/para-facilitadores", "page");
  revalidatePath("/admin/imagens");
  return { success: true };
}
