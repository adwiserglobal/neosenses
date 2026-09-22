"use server";

/**
 * Cadastro de destinos, com assistente de IA.
 *
 * Como toda ação do painel, começa por `exigirPapel`: Server Action é um
 * endpoint HTTP público com outro nome, e o layout do /admin não protege quem
 * chama direto.
 *
 * ── Onde o custo de IA cai ────────────────────────────────────────────────
 *
 * Só aqui, no cadastro, com uma pessoa da equipe esperando na frente da tela.
 * O visitante lê do banco e nunca dispara chamada nenhuma. É o que permite
 * enriquecer o conteúdo sem pesar no site nem na cota.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { exigirPapel } from "./auth";
import { generateAIResponse, detectAIConfig, AIError } from "@/lib/ai/provider";
import {
  conferirSugestao,
  promptDestino,
  SISTEMA_DESTINO,
  type Ressalva,
  type SugestaoDestino,
} from "@/lib/ai/destino";
import { buscarImagens, type ImagemEncontrada } from "@/lib/ai/imagens";

export interface ResultadoSugestao {
  success: boolean;
  error?: string;
  sugestao?: SugestaoDestino;
  ressalvas?: Ressalva[];
}

export interface ResultadoSalvar {
  success: boolean;
  error?: string;
  campo?: string;
  id?: string;
}

function conectar() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return null;
  return createClient<Database>(url, chave, { auth: { persistSession: false } });
}

const SEM_BANCO = "Sem conexão com o banco. Confira o diagnóstico em Supabase.";

function limpar(valor: FormDataEntryValue | null, max: number): string {
  if (typeof valor !== "string") return "";
  let saida = "";
  for (const ch of valor) {
    const c = ch.codePointAt(0)!;
    if (c >= 32 || c === 9 || c === 10 || c === 13) saida += ch;
  }
  return saida.trim().slice(0, max);
}

function numeroOuNulo(valor: FormDataEntryValue | null): number | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ── Assistente ─────────────────────────────────────────────────────────────
/**
 * Monta o rascunho da ficha a partir do nome do lugar.
 *
 * Devolve sempre o que deu para aproveitar, mais a lista do que precisa de
 * conferência humana. Nada é salvo aqui — quem salva é `salvarDestino`,
 * depois de a pessoa revisar.
 */
export async function sugerirDestino(
  lugar: string,
  contexto?: string
): Promise<ResultadoSugestao> {
  await exigirPapel(["admin", "editor"]);

  const nome = lugar?.trim();
  if (!nome || nome.length < 2) {
    return { success: false, error: "Informe o lugar. Ex.: Kyoto, Japão." };
  }

  const config = detectAIConfig();
  if (!config) {
    return { success: false, error: "Nenhum provedor de IA configurado." };
  }

  try {
    const resposta = await generateAIResponse(
      [
        { role: "system", content: SISTEMA_DESTINO },
        { role: "user", content: promptDestino(nome, contexto) },
      ],
      config,
      // 3072 e não 2048: medido, o JSON de quinze campos com copy e avisos
      // chega perto do limite, e o raciocínio interno do Gemini sai deste
      // mesmo orçamento. Cortado no meio, ele falha no parse sem dizer por
      // quê — foi o que aconteceu no teste com um lugar de nome comprido.
      { json: true, maxTokens: 3072, temperature: 0.4 }
    );

    let bruto: unknown;
    try {
      // Modelo às vezes embrulha o JSON em cerca de código, mesmo com
      // `json: true`.
      const texto = resposta.content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      bruto = JSON.parse(texto);
    } catch {
      console.error("[destino] resposta não era JSON:", resposta.content.slice(0, 200));
      return { success: false, error: "A IA respondeu num formato inesperado. Tente de novo." };
    }

    const conferido = conferirSugestao(bruto);
    if (!conferido) {
      return { success: false, error: "A IA não reconheceu esse lugar. Tente com o país junto." };
    }

    return {
      success: true,
      sugestao: conferido.sugestao,
      ressalvas: conferido.ressalvas,
    };
  } catch (err) {
    if (err instanceof AIError) {
      const mensagens: Record<string, string> = {
        AI_RATE_LIMIT: "Cota da IA esgotada no momento. Tente em alguns minutos.",
        AI_TIMEOUT: "A IA demorou demais para responder. Tente de novo.",
        AI_AUTH_FAILURE: "A chave da IA foi recusada. Confira em /admin/supabase.",
      };
      return { success: false, error: mensagens[err.code] ?? "A IA falhou. Tente de novo." };
    }
    console.error("[destino] erro inesperado:", err);
    return { success: false, error: "Não consegui montar a ficha agora." };
  }
}

// ── Imagens ────────────────────────────────────────────────────────────────
export interface ResultadoImagens {
  success: boolean;
  error?: string;
  imagens?: ImagemEncontrada[];
}

/**
 * Procura três fotos do lugar no Wikimedia Commons.
 *
 * Separado de `sugerirDestino` de propósito: quando a busca traz foto ruim —
 * e traz —, dá para tentar outro termo sem refazer a ficha inteira e gastar
 * outra chamada de IA.
 *
 * Três, e não uma, porque a página alterna entre elas. Uma foto só numa
 * página que a pessoa revisita fica velha rápido.
 */
export async function sugerirImagens(termo: string): Promise<ResultadoImagens> {
  await exigirPapel(["admin", "editor"]);

  const limpo = termo?.trim();
  if (!limpo || limpo.length < 2) {
    return { success: false, error: "Informe o lugar para procurar as fotos." };
  }

  const imagens = await buscarImagens(limpo, 3);

  if (!imagens.length) {
    return {
      success: false,
      error:
        "Nenhuma foto de licença livre para este termo. Tente o nome em inglês, ou com o país junto.",
    };
  }

  return { success: true, imagens };
}

// ── Gravação ───────────────────────────────────────────────────────────────
/**
 * Cria ou atualiza o destino a partir do formulário revisado.
 *
 * O país é criado se ainda não existir — o admin não precisa cadastrar Japão
 * antes de cadastrar Kyoto.
 */
export async function salvarDestino(dados: FormData): Promise<ResultadoSalvar> {
  await exigirPapel(["admin", "editor"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const nome = limpar(dados.get("nome"), 120);
  if (!nome) return { success: false, error: "O nome é obrigatório.", campo: "nome" };

  const pais = limpar(dados.get("pais"), 80);
  if (!pais) return { success: false, error: "O país é obrigatório.", campo: "pais" };

  const id = limpar(dados.get("id"), 40);
  const slugInformado = limpar(dados.get("slug"), 60);
  const slug = gerarSlug(slugInformado || nome);
  if (!slug) return { success: false, error: "Não consegui gerar o endereço.", campo: "slug" };

  // ── País ─────────────────────────────────────────────────────────────────
  const slugPais = gerarSlug(pais);
  const { data: paisExistente } = await supabase
    .from("countries")
    .select("id")
    .eq("slug", slugPais)
    .maybeSingle();

  let countryId = paisExistente?.id;

  if (!countryId) {
    const codigo = limpar(dados.get("paisCodigo"), 2).toUpperCase();
    const { data: criado, error } = await supabase
      .from("countries")
      .insert({
        name: { pt: pais },
        slug: slugPais,
        // `code` é NOT NULL no schema; sem informação, fica o traço em vez de
        // inventar um ISO que não existe.
        code: codigo.length === 2 ? codigo : "--",
        sort_order: 99,
      } as never)
      .select("id")
      .single();

    if (error || !criado) {
      console.error("[destino] falha ao criar país:", error?.message);
      return { success: false, error: "Não consegui cadastrar o país.", campo: "pais" };
    }
    countryId = criado.id;
  }

  // ── Clima ────────────────────────────────────────────────────────────────
  // Só entra o que foi preenchido: objeto com campos nulos vira ruído no
  // contexto do Concierge, que passa a citar "temperatura: null".
  const clima: Record<string, unknown> = {};
  const tipo = limpar(dados.get("climaTipo"), 30);
  const tmin = numeroOuNulo(dados.get("tempMinC"));
  const tmax = numeroOuNulo(dados.get("tempMaxC"));
  const chuva = limpar(dados.get("estacaoChuvosa"), 40);
  if (tipo) clima.tipo = tipo;
  if (tmin !== null) clima.temp_min_c = tmin;
  if (tmax !== null) clima.temp_max_c = tmax;
  if (chuva) clima.estacao_chuvosa = chuva;

  // ── Galeria ──────────────────────────────────────────────────────────────
  // As fotos escolhidas viram registros em `media`, com autor e licença no
  // metadata. Crédito guardado longe da imagem é crédito que some na primeira
  // refatoração — e aí o site publica foto de terceiro sem atribuição.
  const galeria = await gravarGaleria(supabase, dados.get("galeria"), nome);

  const registro = {
    country_id: countryId,
    name: { pt: nome },
    slug: { pt: slug },
    description: { pt: limpar(dados.get("descricao"), 600) },
    hero_image: limpar(dados.get("heroImage"), 300) || null,
    ...(galeria.length ? { gallery: galeria } : {}),
    latitude: numeroOuNulo(dados.get("latitude")),
    longitude: numeroOuNulo(dados.get("longitude")),
    altitude_m: numeroOuNulo(dados.get("altitudeM")),
    timezone: limpar(dados.get("timezone"), 60) || null,
    climate: clima,
    is_active: dados.get("ativo") === "on",
  };

  const { data, error } = id
    ? await supabase.from("destinations").update(registro as never).eq("id", id).select("id").single()
    : await supabase.from("destinations").insert(registro as never).select("id").single();

  if (error) {
    console.error("[destino] falha ao salvar:", error.message);
    return { success: false, error: "Não consegui salvar o destino." };
  }

  revalidatePath("/admin/destinos");
  revalidatePath("/destinos");
  return { success: true, id: data?.id };
}

/**
 * Grava as fotos escolhidas em `media` e devolve os ids para `gallery`.
 *
 * Idempotente por URL: salvar o mesmo destino duas vezes não duplica a
 * biblioteca de mídia.
 */
async function gravarGaleria(
  supabase: ReturnType<typeof conectar>,
  bruto: FormDataEntryValue | null,
  nomeDoDestino: string
): Promise<string[]> {
  if (!supabase || typeof bruto !== "string" || !bruto.trim()) return [];

  let escolhidas: ImagemEncontrada[];
  try {
    const lido = JSON.parse(bruto);
    if (!Array.isArray(lido)) return [];
    escolhidas = lido.slice(0, 6);
  } catch {
    console.warn("[destino] galeria veio num formato inesperado");
    return [];
  }

  const ids: string[] = [];

  for (const img of escolhidas) {
    const url = typeof img?.url === "string" ? img.url.slice(0, 2000) : "";
    // Só https: o site é servido por https, e imagem em http vira aviso de
    // conteúdo misto no navegador.
    if (!url.startsWith("https://")) continue;

    const { data: existente } = await supabase
      .from("media")
      .select("id")
      .eq("url", url)
      .maybeSingle();

    if (existente?.id) {
      ids.push(existente.id);
      continue;
    }

    const nomeArquivo = (img.titulo || url.split("/").pop() || "imagem.jpg").slice(0, 200);
    const { data: criado, error } = await supabase
      .from("media")
      .insert({
        filename: nomeArquivo,
        original_filename: nomeArquivo,
        mime_type: /\.png$/i.test(nomeArquivo) ? "image/png" : "image/jpeg",
        type: "image",
        url,
        width: typeof img.largura === "number" ? img.largura : null,
        height: typeof img.altura === "number" ? img.altura : null,
        alt_text: { pt: `${nomeDoDestino} — ${nomeArquivo.replace(/\.\w+$/, "")}`.slice(0, 300) },
        caption: { pt: String(img.credito ?? "").slice(0, 300) },
        folder: "/destinos",
        metadata: {
          fonte: "wikimedia-commons",
          autor: String(img.autor ?? "").slice(0, 200),
          licenca: String(img.licenca ?? "").slice(0, 60),
          pagina_fonte: String(img.paginaFonte ?? "").slice(0, 500),
        },
      } as never)
      .select("id")
      .single();

    if (error) {
      console.error("[destino] falha ao gravar imagem:", error.message);
      continue;
    }
    if (criado?.id) ids.push(criado.id);
  }

  return ids;
}

/** Liga e desliga sem abrir o formulário. */
export async function alternarDestino(id: string, ativo: boolean): Promise<ResultadoSalvar> {
  await exigirPapel(["admin", "editor"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const { error } = await supabase
    .from("destinations")
    .update({ is_active: ativo } as never)
    .eq("id", id);

  if (error) return { success: false, error: "Não consegui alterar." };

  revalidatePath("/admin/destinos");
  revalidatePath("/destinos");
  return { success: true };
}
