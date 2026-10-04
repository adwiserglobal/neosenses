import { NextRequest, NextResponse } from "next/server";
import { usuarioAtual } from "@/lib/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "blog-images";
const LIMITE = 8 * 1024 * 1024;
const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};

function assinaturaValida(buffer: Uint8Array, mime: string) {
  if (mime === "image/jpeg")
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => buffer[i] === b);
  if (mime === "image/webp")
    return String.fromCharCode(...buffer.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...buffer.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(req: NextRequest) {
  const perfil = await usuarioAtual();
  if (!perfil || !perfil.is_active || !["admin", "editor"].includes(perfil.role))
    return NextResponse.json({ error: "Faça login para enviar imagens." }, { status: 401 });

  let arquivo: File;
  try {
    const dados = await req.formData();
    const enviado = dados.get("file");
    if (!(enviado instanceof File)) throw new Error("Arquivo ausente");
    arquivo = enviado;
  } catch {
    return NextResponse.json({ error: "Selecione uma imagem JPG, PNG ou WebP." }, { status: 400 });
  }
  if (!TIPOS[arquivo.type] || arquivo.size === 0 || arquivo.size > LIMITE)
    return NextResponse.json({ error: "Envie JPG, PNG ou WebP com até 8 MB." }, { status: 400 });

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  if (!assinaturaValida(bytes, arquivo.type))
    return NextResponse.json({ error: "Este arquivo não é uma imagem válida." }, { status: 400 });

  let admin;
  try { admin = createAdminClient(); }
  catch { return NextResponse.json({ error: "Storage do Supabase não está configurado." }, { status: 503 }); }

  // Provisionamento idempotente do bucket: nenhum passo manual extra para a dona.
  const { data: existente } = await admin.storage.getBucket(BUCKET);
  if (!existente) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true, fileSizeLimit: LIMITE, allowedMimeTypes: Object.keys(TIPOS),
    });
    if (error && !/already exists|duplicate/i.test(error.message)) {
      console.error("[blog] criar bucket:", error.message);
      return NextResponse.json({ error: "Não foi possível preparar a biblioteca de imagens." }, { status: 503 });
    }
  }

  const nome = `${perfil.id}/${crypto.randomUUID()}.${TIPOS[arquivo.type]}`;
  const { error } = await admin.storage.from(BUCKET).upload(nome, bytes, {
    contentType: arquivo.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[blog] enviar imagem:", error.message);
    return NextResponse.json({ error: "Não foi possível enviar a imagem. Tente novamente." }, { status: 502 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(nome);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
