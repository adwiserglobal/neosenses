/**
 * Cópia de segurança de uma página espelhada.
 *
 * O espelho mostra o site original ao vivo, num iframe. Se esse site sair do ar
 * (ou proibir ser exibido dentro de outro), a página da NeoSenses ficaria em
 * branco. Por isso, na hora da importação guardamos o texto e as fotos aqui, e a
 * rota pública cai para esta cópia sozinha quando a origem não responde.
 * Nada disso exige ação de quem administra.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { baixarImagemPublica, type PaginaExtraida } from "@/lib/importacao/experiencia";

const BUCKET = "espelhos";
const MAX_FOTOS = 12;
const MAX_TEXTO_COPIA = 12_000;

const EXTENSAO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export interface CopiaDaPagina {
  capturado_em: string;
  texto: string;
  /** Fotos já hospedadas no Storage da NeoSenses. A primeira é a capa. */
  fotos: string[];
}

/** Lê a cópia gravada em `metadata.external_mirror.copia`, se houver e for válida. */
export function lerCopia(bloco: unknown): CopiaDaPagina | null {
  if (!bloco || typeof bloco !== "object") return null;
  const copia = (bloco as Record<string, unknown>).copia;
  if (!copia || typeof copia !== "object") return null;
  const c = copia as Record<string, unknown>;
  const fotos = Array.isArray(c.fotos)
    ? c.fotos.filter((f): f is string => typeof f === "string" && /^https?:\/\//i.test(f))
    : [];
  const texto = typeof c.texto === "string" ? c.texto : "";
  if (!texto && fotos.length === 0) return null;
  return {
    capturado_em: typeof c.capturado_em === "string" ? c.capturado_em : "",
    texto,
    fotos,
  };
}

/**
 * Guarda texto e fotos da página. Nunca lança: uma cópia que falha não pode
 * impedir a importação, só deixa a página sem plano B.
 */
export async function guardarCopia(
  pagina: PaginaExtraida,
  pasta: string
): Promise<CopiaDaPagina | null> {
  try {
    const admin = createAdminClient();

    const { data: existente } = await admin.storage.getBucket(BUCKET);
    if (!existente) {
      const { error } = await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 8_388_608,
        allowedMimeTypes: Object.keys(EXTENSAO),
      });
      if (error && !/already|exist|duplicate/i.test(error.message)) {
        console.error("[espelho] criar bucket da cópia:", error.message);
        return null;
      }
    }

    // Capa primeiro, depois as demais, sem repetir.
    const origens = Array.from(
      new Set([pagina.imagemSocial, ...pagina.imagens].filter((u): u is string => !!u))
    ).slice(0, MAX_FOTOS);

    const baixadas = await Promise.all(
      origens.map(async (origem, i) => {
        const img = await baixarImagemPublica(origem);
        if (!img) return null;
        const caminho = `${pasta}/${i}-${crypto.randomUUID()}.${EXTENSAO[img.contentType] ?? "jpg"}`;
        const { error } = await admin.storage.from(BUCKET).upload(caminho, img.bytes, {
          contentType: img.contentType,
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) {
          console.error("[espelho] enviar foto da cópia:", error.message);
          return null;
        }
        return admin.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
      })
    );

    const fotos = baixadas.filter((u): u is string => !!u);
    const texto = pagina.texto.slice(0, MAX_TEXTO_COPIA);
    if (!texto && fotos.length === 0) return null;

    return { capturado_em: new Date().toISOString(), texto, fotos };
  } catch (err) {
    console.error("[espelho] guardar cópia:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * A origem está de pé e aceita ser exibida num iframe?
 *
 * Falha para o lado seguro: na dúvida (erro, timeout, 4xx/5xx, cabeçalho que
 * proíbe o enquadramento) devolve false e a página usa a cópia.
 */
export async function origemDisponivel(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(5_000),
      headers: { "User-Agent": "NeoSensesCheck/1.0 (+https://neosenses.com.br)" },
      // Cache de 10 min: `no-store` tornaria a rota dinâmica e o `revalidate`
      // da página deixaria de valer.
      next: { revalidate: 600 },
    });
    // Só os cabeçalhos importam; descarta o corpo.
    void res.body?.cancel();

    if (res.status >= 400) return false;

    const xfo = (res.headers.get("x-frame-options") ?? "").toLowerCase();
    if (xfo.includes("deny") || xfo.includes("sameorigin")) return false;

    const csp = res.headers.get("content-security-policy") ?? "";
    const ancestrais = /frame-ancestors\s+([^;]+)/i.exec(csp)?.[1]?.trim().toLowerCase();
    if (ancestrais && !ancestrais.includes("*") && !ancestrais.includes("https:")) return false;

    return true;
  } catch {
    return false;
  }
}
