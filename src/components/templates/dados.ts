/**
 * Traduz uma experiência do banco para o que os layouts desenham.
 *
 * Existe para que os quatro templates não repitam quatro vezes a mesma
 * leitura de campo i18n, o mesmo agrupamento de destaques e o mesmo
 * cálculo de "tem conteúdo?". Quando um layout novo entrar, ele consome
 * este objeto e não o schema — e uma coluna renomeada quebra em um lugar
 * só, com erro de compilação.
 */

import { t } from "@/lib/utils";
import type { ExperienceWithRelations, I18nField, PageTemplate } from "@/types/models";
import type { ItemDeGrade } from "./blocos";

export interface GradeNomeada {
  chave: string;
  titulo: string;
  itens: ItemDeGrade[];
}

export interface DadosDaPagina {
  titulo: string;
  /** Seções 1 a 8 do esqueleto padrão (documento de reformulação, passo 5). */
  subtitulo: string;
  periodo: string;
  resumo: string;
  porQueCriamos: string;
  descricao: string;
  propostaDeValor: string;
  apenasRelaxe: string;
  equipe: Array<{ id: string; nome: string; papel: string; bio?: string; foto?: string | null }>;
  paraQuem: string;
  chapeu: string;
  destino: string;
  pais: string;
  categoria: string;
  capa: string | null;
  /** Fotos além da capa, para as faixas entre seções. */
  fotos: string[];
  ehFacilitador: boolean;
  fechamento: { titulo: string; texto: string } | null;
  parceria: { facilitador: string[]; neosenses: string[] };
  grades: GradeNomeada[];
  etapas: Array<{
    id: string;
    numero: number;
    titulo: string;
    descricao?: string;
    local?: string | null;
    imagem?: string | null;
  }>;
  perguntas: Array<{ id: string; pergunta: string; resposta: string }>;
  mensagemWhatsApp: string;
}

/**
 * Rótulo de cada grade quando o conteúdo não trouxe um.
 *
 * A chave vem do campo `grupo`, texto livre de propósito: página nova
 * inventa a grade que precisar sem migration. Chave desconhecida cai no
 * próprio nome capitalizado em vez de sumir da página.
 */
const TITULO_PADRAO: Record<string, string> = {
  motivos: "Por que este território",
  territorios: "Lugares de força",
  vivencias: "Vivências que podem compor a jornada",
  diferenciais: "O que torna esta jornada diferente",
  praticas: "O que o roteiro pode abrir espaço para",
  formatos: "Formatos possíveis",
};

function tituloDaGrade(chave: string | null, doBanco: string): string {
  if (doBanco) return doBanco;
  if (!chave) return "Destaques";
  return TITULO_PADRAO[chave] ?? chave.charAt(0).toUpperCase() + chave.slice(1);
}

export function montarDados(
  experiencia: ExperienceWithRelations,
  fotosExtras: string[] = []
): DadosDaPagina {
  const titulo = t(experiencia.title as I18nField, "pt");
  const destino = experiencia.destination ? t(experiencia.destination.name as I18nField, "pt") : "";
  const pais = experiencia.destination?.country
    ? t(experiencia.destination.country.name as I18nField, "pt")
    : "";
  const categoria = experiencia.category ? t(experiencia.category.name as I18nField, "pt") : "";
  const ehFacilitador = experiencia.audience === "facilitador";

  // Chapéu: o que estiver cadastrado; senão, o que descreve a página para
  // quem a lê. Numa página de facilitador a categoria ("Retiros") diz a
  // coisa errada — ela nomeia o produto, não a proposta.
  const chapeuCadastrado = t(experiencia.hero_kicker as I18nField, "pt");
  const chapeu =
    chapeuCadastrado ||
    (ehFacilitador
      ? ["Para terapeutas e facilitadoras", destino || pais].filter(Boolean).join(" · ")
      : [categoria, destino].filter(Boolean).join(" · "));

  // Agrupa os destaques preservando a ordem em que os grupos aparecem —
  // `sort_order` já veio ordenado da consulta, então o primeiro item de
  // cada grupo define a posição da grade na página.
  const grades: GradeNomeada[] = [];
  const porChave = new Map<string, GradeNomeada>();
  for (const h of experiencia.highlights ?? []) {
    const chave = h.grupo ?? "";
    let grade = porChave.get(chave);
    if (!grade) {
      grade = {
        chave,
        titulo: tituloDaGrade(h.grupo, t(h.grupo_titulo as I18nField, "pt")),
        itens: [],
      };
      porChave.set(chave, grade);
      grades.push(grade);
    }
    // `h.icon` não é lido: guardava os símbolos decorativos que saíram das
    // grades. O campo continua no banco para não perder o que foi cadastrado,
    // mas nada o renderiza.
    grade.itens.push({
      id: h.id,
      titulo: t(h.title as I18nField, "pt"),
      descricao: t(h.description as I18nField, "pt") || undefined,
    });
  }

  const parceria = { facilitador: [] as string[], neosenses: [] as string[] };
  for (const p of experiencia.partnership ?? []) {
    const texto = t(p.text as I18nField, "pt");
    if (!texto) continue;
    if (p.side === "facilitador") parceria.facilitador.push(texto);
    else parceria.neosenses.push(texto);
  }

  const fechamentoTitulo = t(experiencia.closing_title as I18nField, "pt");

  return {
    titulo,
    subtitulo: t(experiencia.subtitle as I18nField, "pt"),
    periodo: t(experiencia.period_label as I18nField, "pt"),
    resumo: t(experiencia.short_description as I18nField, "pt"),
    porQueCriamos: t(experiencia.why_created as I18nField, "pt"),
    descricao: t(experiencia.description as I18nField, "pt"),
    propostaDeValor: t(experiencia.value_proposition as I18nField, "pt"),
    apenasRelaxe: t(experiencia.relax_text as I18nField, "pt"),
    equipe: (experiencia.facilitators ?? []).map((f) => ({
      id: f.id,
      nome: f.name,
      papel: f.papel || "facilitator",
      bio: t(f.short_bio as I18nField, "pt") || undefined,
      foto: f.photo,
    })),
    paraQuem: t(experiencia.who_is_this_for as I18nField, "pt"),
    chapeu,
    destino,
    pais,
    categoria,
    capa: experiencia.hero_image,
    fotos: fotosExtras,
    ehFacilitador,
    fechamento: fechamentoTitulo
      ? { titulo: fechamentoTitulo, texto: t(experiencia.closing_text as I18nField, "pt") }
      : null,
    parceria,
    grades,
    etapas: (experiencia.itinerary ?? []).map((d) => ({
      id: d.id,
      numero: d.day_number,
      titulo: t(d.title as I18nField, "pt"),
      descricao: t(d.description as I18nField, "pt") || undefined,
      local: d.location,
      imagem: d.image,
    })),
    perguntas: (experiencia.faqs ?? []).map((f) => ({
      id: f.id,
      pergunta: t(f.question as I18nField, "pt"),
      resposta: t(f.answer as I18nField, "pt"),
    })),
    mensagemWhatsApp: ehFacilitador
      ? `Olá! Quero levar meu grupo para "${titulo}". Podemos conversar sobre como montar essa jornada?`
      : `Olá! Tenho interesse na experiência "${titulo}". Pode me contar mais?`,
  };
}

/**
 * As imagens que o site antigo tinha para esta experiência.
 *
 * São 131 no total, guardadas em `metadata.imagens_originais` pela
 * migração de conteúdo. Elas nunca chegaram à galeria porque `gallery`
 * aponta para ids de `media`, e ninguém cadastrou essas fotos lá. Aqui
 * elas viram as faixas de foto da página — a alternativa era uma página
 * longa com uma única imagem no topo.
 *
 * A capa sai da lista: repetida logo abaixo do topo, parece defeito.
 */
export function fotosDaExperiencia(experiencia: ExperienceWithRelations, limite = 6): string[] {
  const meta = experiencia.metadata as { imagens_originais?: unknown } | null;
  const originais = Array.isArray(meta?.imagens_originais) ? meta.imagens_originais : [];

  const vistas = new Set<string>();
  if (experiencia.hero_image) vistas.add(experiencia.hero_image);

  const fotos: string[] = [];
  for (const u of originais) {
    // Endereço absoluto (site antigo) ou caminho servido daqui
    // (`/images/...`). Aceitar só `http` deixava as páginas de
    // facilitador sem nenhuma faixa de foto, em silêncio: as imagens
    // delas moram em `public/` e começam com barra.
    if (typeof u !== "string") continue;
    if (!u.startsWith("http") && !u.startsWith("/")) continue;
    if (vistas.has(u)) continue;
    vistas.add(u);
    fotos.push(u);
    if (fotos.length >= limite) break;
  }
  return fotos;
}

/**
 * O layout a usar.
 *
 * Duas quedas para o clássico, ambas por falta de conteúdo e não por erro:
 *
 * - valor desconhecido. O enum do banco já impede lixo, mas um template
 *   novo publicado antes do deploy do layout deve mostrar a página velha,
 *   não uma tela em branco.
 * - `roteiro` sem nenhuma etapa cadastrada. O layout inteiro se organiza
 *   em torno do dia a dia; sem ele sobra a descrição solta num desenho
 *   que reservou metade da página para o que não existe — pior que o
 *   clássico, que ao menos põe as datas ao lado do texto.
 */
export function layoutDe(experiencia: ExperienceWithRelations): PageTemplate {
  const t = experiencia.template;
  const paraFacilitador = experiencia.audience === "facilitador";

  // Público e layout têm que combinar. O painel já impede a combinação
  // errada, mas o banco aceita — e um `classico` marcado como facilitador
  // desenharia a barra de reserva, com "próximas saídas" vazio e botão de
  // vaga, para quem ainda vai formar o grupo.
  if (paraFacilitador) return t === "convite" ? "convite" : "territorio";
  if (t === "territorio" || t === "convite") return "classico";

  if (t === "roteiro") return (experiencia.itinerary ?? []).length > 0 ? "roteiro" : "classico";
  return "classico";
}
