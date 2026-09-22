"use server";

/**
 * Ações do painel administrativo.
 *
 * Toda função aqui começa por `exigirPapel`. Server Action é um endpoint HTTP
 * público com outro nome: quem descobrir o identificador consegue chamá-la
 * direto, sem passar pela tela. Confiar no layout do /admin para proteger
 * seria proteger a porta e deixar a janela aberta.
 *
 * A escrita usa a chave de serviço porque as policies de admin dependem de
 * `auth.uid()`, e o que decide o acesso é a checagem de papel logo acima —
 * feita no servidor, contra o banco, a cada chamada.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { exigirPapel } from "./auth";
import type { ExperienceStatus } from "@/types/models";

export interface Resultado {
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

// ── Texto ──────────────────────────────────────────────────────────────────
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

/**
 * Monta o campo multi-idioma preservando o que já existia.
 *
 * O formulário edita só o português. Sobrescrever o objeto inteiro apagaria
 * as traduções em inglês e espanhol a cada salvamento — perda silenciosa, que
 * só apareceria quando alguém abrisse o site em outro idioma.
 */
function mesclarI18n(atual: unknown, textoPt: string): Record<string, string> {
  const base = atual && typeof atual === "object" ? { ...(atual as Record<string, string>) } : {};
  if (textoPt) base.pt = textoPt;
  else delete base.pt;
  return base;
}

/** Slug a partir do título, quando quem cadastra não informa um. */
function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── Experiências ───────────────────────────────────────────────────────────
export async function salvarExperiencia(dados: FormData): Promise<Resultado> {
  await exigirPapel(["admin", "editor"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const id = limpar(dados.get("id"), 40) || null;
  const titulo = limpar(dados.get("title_pt"), 160);
  const resumo = limpar(dados.get("short_description_pt"), 500);
  const descricao = limpar(dados.get("description_pt"), 8000);
  const status = limpar(dados.get("status"), 20) as ExperienceStatus;

  if (titulo.length < 3) {
    return { success: false, campo: "title_pt", error: "O título é obrigatório." };
  }
  if (!["draft", "published", "archived", "sold_out"].includes(status)) {
    return { success: false, campo: "status", error: "Situação inválida." };
  }

  const slugInformado = limpar(dados.get("slug_pt"), 90);
  const slug = gerarSlug(slugInformado || titulo);
  if (!slug) {
    return { success: false, campo: "slug_pt", error: "Não consegui gerar um endereço a partir do título." };
  }

  const duracao = numeroOuNulo(dados.get("duration_days"));
  const preco = numeroOuNulo(dados.get("price_from"));
  const grupoMin = numeroOuNulo(dados.get("group_size_min"));
  const grupoMax = numeroOuNulo(dados.get("group_size_max"));

  if (duracao !== null && (duracao < 1 || duracao > 365)) {
    return { success: false, campo: "duration_days", error: "Duração fora do razoável." };
  }
  if (preco !== null && preco < 0) {
    return { success: false, campo: "price_from", error: "Valor não pode ser negativo." };
  }
  if (grupoMin !== null && grupoMax !== null && grupoMin > grupoMax) {
    return { success: false, campo: "group_size_min", error: "O mínimo do grupo é maior que o máximo." };
  }

  // Publicar sem o essencial gera página vazia no ar e o Concierge
  // recomendando algo que ninguém consegue avaliar.
  if (status === "published") {
    if (!resumo) {
      return { success: false, campo: "short_description_pt", error: "Para publicar, escreva o resumo." };
    }
    // Destino é obrigatório no funil do viajante, onde o cartão do
    // catálogo e o filtro por destino dependem dele. No de facilitador
    // não: a jornada da Amazônia acontece no Lago do Acajatuba, que não é
    // um dos destinos cadastrados, e exigir um faria escolher o errado.
    if (dados.get("audience") !== "facilitador" && !dados.get("destination_id")) {
      return { success: false, campo: "destination_id", error: "Para publicar, escolha o destino." };
    }
  }

  const intencoes = dados
    .getAll("intentions")
    .map((v) => limpar(v, 40))
    .filter(Boolean);

  const campos = {
    short_description: null as unknown,
    description: null as unknown,
    who_is_this_for: null as unknown,
    title: null as unknown,
    slug: null as unknown,
    hero_kicker: null as unknown,
    closing_title: null as unknown,
    closing_text: null as unknown,
    subtitle: null as unknown,
    period_label: null as unknown,
    why_created: null as unknown,
    value_proposition: null as unknown,
    relax_text: null as unknown,
  };

  // Ao editar, lê os valores atuais para não perder as traduções.
  if (id) {
    const { data } = await supabase
      .from("experiences")
      .select(
        "title, slug, short_description, description, who_is_this_for, hero_kicker, closing_title, closing_text, subtitle, period_label, why_created, value_proposition, relax_text"
      )
      .eq("id", id)
      .maybeSingle();
    if (data) {
      campos.title = data.title;
      campos.slug = data.slug;
      campos.short_description = data.short_description;
      campos.description = data.description;
      campos.who_is_this_for = data.who_is_this_for;
      campos.hero_kicker = data.hero_kicker;
      campos.closing_title = data.closing_title;
      campos.closing_text = data.closing_text;
      campos.subtitle = data.subtitle;
      campos.period_label = data.period_label;
      campos.why_created = data.why_created;
      campos.value_proposition = data.value_proposition;
      campos.relax_text = data.relax_text;
    }
  }

  // Público e layout. Valor fora da lista cai no padrão em vez de ir para
  // o banco: o enum recusaria com um erro que o painel não sabe explicar.
  const PUBLICOS = ["viajante", "facilitador"];
  const LAYOUTS = ["classico", "roteiro", "territorio", "convite"];
  const publicoEnviado = limpar(dados.get("audience"), 20);
  const layoutEnviado = limpar(dados.get("template"), 20);
  const audience = PUBLICOS.includes(publicoEnviado) ? publicoEnviado : "viajante";
  const template = LAYOUTS.includes(layoutEnviado) ? layoutEnviado : "classico";

  const registro = {
    title: mesclarI18n(campos.title, titulo),
    slug: mesclarI18n(campos.slug, slug),
    short_description: mesclarI18n(campos.short_description, resumo),
    description: mesclarI18n(campos.description, descricao),
    who_is_this_for: mesclarI18n(campos.who_is_this_for, limpar(dados.get("who_is_this_for_pt"), 2000)),
    hero_kicker: mesclarI18n(campos.hero_kicker, limpar(dados.get("hero_kicker_pt"), 120)),
    closing_title: mesclarI18n(campos.closing_title, limpar(dados.get("closing_title_pt"), 200)),
    closing_text: mesclarI18n(campos.closing_text, limpar(dados.get("closing_text_pt"), 2000)),
    // As seções 1, 3, 5 e 7 do esqueleto obrigatório (documento, passo 5).
    subtitle: mesclarI18n(campos.subtitle, limpar(dados.get("subtitle_pt"), 200)),
    period_label: mesclarI18n(campos.period_label, limpar(dados.get("period_label_pt"), 120)),
    why_created: mesclarI18n(campos.why_created, limpar(dados.get("why_created_pt"), 4000)),
    value_proposition: mesclarI18n(
      campos.value_proposition,
      limpar(dados.get("value_proposition_pt"), 2000)
    ),
    relax_text: mesclarI18n(campos.relax_text, limpar(dados.get("relax_text_pt"), 4000)),
    audience: audience as never,
    template: template as never,
    category_id: limpar(dados.get("category_id"), 40) || null,
    destination_id: limpar(dados.get("destination_id"), 40) || null,
    duration_days: duracao,
    group_size_min: grupoMin,
    group_size_max: grupoMax,
    difficulty: (limpar(dados.get("difficulty"), 20) || "all_levels") as never,
    price_from: preco,
    price_currency: limpar(dados.get("price_currency"), 5) || "BRL",
    hero_image: limpar(dados.get("hero_image"), 500) || null,
    intentions: intencoes,
    physical_demand: numeroOuNulo(dados.get("physical_demand")),
    status,
    is_featured: dados.get("is_featured") === "on",
    sort_order: numeroOuNulo(dados.get("sort_order")) ?? 0,
    // Carimba a primeira publicação; reeditar não altera a data original.
    ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
  };

  const resposta = id
    ? await supabase.from("experiences").update(registro as never).eq("id", id).select("id").single()
    : await supabase.from("experiences").insert(registro as never).select("id").single();

  if (resposta.error) {
    console.error("[admin] salvar experiência:", resposta.error.message);
    // Slug repetido é o erro mais comum de quem duplica um cadastro.
    if (resposta.error.message.includes("duplicate") || resposta.error.code === "23505") {
      return { success: false, campo: "slug_pt", error: "Já existe uma experiência com esse endereço." };
    }
    return { success: false, error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/experiencias");
  revalidatePath("/admin/experiencias");
  revalidatePath("/");

  return { success: true, id: resposta.data.id };
}

export async function alterarSituacao(id: string, status: ExperienceStatus): Promise<Resultado> {
  await exigirPapel(["admin", "editor"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const { error } = await supabase
    .from("experiences")
    .update({ status, ...(status === "published" ? { published_at: new Date().toISOString() } : {}) } as never)
    .eq("id", id);

  if (error) {
    console.error("[admin] alterar situação:", error.message);
    return { success: false, error: "Não foi possível alterar." };
  }

  revalidatePath("/experiencias");
  revalidatePath("/admin/experiencias");
  revalidatePath("/");
  return { success: true };
}

// ── Datas ──────────────────────────────────────────────────────────────────
export async function salvarData(dados: FormData): Promise<Resultado> {
  await exigirPapel(["admin", "editor"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const id = limpar(dados.get("id"), 40) || null;
  const experienceId = limpar(dados.get("experience_id"), 40);
  const inicio = limpar(dados.get("start_date"), 10);
  const fim = limpar(dados.get("end_date"), 10);

  if (!experienceId) return { success: false, error: "Experiência não informada." };

  const dataValida = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
  if (!dataValida(inicio)) return { success: false, campo: "start_date", error: "Data de início inválida." };
  if (!dataValida(fim)) return { success: false, campo: "end_date", error: "Data de fim inválida." };
  if (fim < inicio) {
    return { success: false, campo: "end_date", error: "O fim não pode ser antes do início." };
  }

  const total = numeroOuNulo(dados.get("spots_total"));
  const ocupadas = numeroOuNulo(dados.get("spots_taken")) ?? 0;
  if (total !== null && ocupadas > total) {
    return { success: false, campo: "spots_taken", error: "Há mais vagas ocupadas que o total." };
  }

  // Ponto de encontro em JSONB. É o que o Concierge responde quando alguém
  // pergunta onde o grupo se encontra — vazio significa "a equipe confirma".
  const local = limpar(dados.get("meeting_local"), 200);
  const endereco = limpar(dados.get("meeting_endereco"), 300);
  const horario = limpar(dados.get("meeting_horario"), 100);
  const instrucoes = limpar(dados.get("meeting_instrucoes"), 1000);

  const pontoDeEncontro: Record<string, unknown> = {};
  if (local) pontoDeEncontro.local = local;
  if (endereco) pontoDeEncontro.endereco = endereco;
  if (horario) pontoDeEncontro.horario = horario;
  if (instrucoes) pontoDeEncontro.instrucoes = { pt: instrucoes };

  const registro = {
    experience_id: experienceId,
    start_date: inicio,
    end_date: fim,
    price: numeroOuNulo(dados.get("price")),
    spots_total: total,
    spots_taken: ocupadas,
    meeting_point: pontoDeEncontro,
    status: (limpar(dados.get("status"), 20) || "published") as never,
  };

  const resposta = id
    ? await supabase.from("experience_dates").update(registro as never).eq("id", id)
    : await supabase.from("experience_dates").insert(registro as never);

  if (resposta.error) {
    console.error("[admin] salvar data:", resposta.error.message);
    return { success: false, error: "Não foi possível salvar a data." };
  }

  revalidatePath("/experiencias");
  revalidatePath(`/admin/experiencias/${experienceId}`);
  return { success: true };
}

export async function excluirData(id: string, experienceId: string): Promise<Resultado> {
  await exigirPapel(["admin", "editor"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  // Data com reserva não some: apagar apagaria o vínculo de quem já comprou.
  // Arquivar tira do site e preserva o histórico.
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("experience_date_id", id);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("experience_dates")
      .update({ status: "archived" } as never)
      .eq("id", id);

    if (error) return { success: false, error: "Não foi possível arquivar a data." };
    revalidatePath(`/admin/experiencias/${experienceId}`);
    return { success: true, error: `Esta data tem ${count} reserva(s), então foi arquivada em vez de excluída.` };
  }

  const { error } = await supabase.from("experience_dates").delete().eq("id", id);
  if (error) {
    console.error("[admin] excluir data:", error.message);
    return { success: false, error: "Não foi possível excluir." };
  }

  revalidatePath("/experiencias");
  revalidatePath(`/admin/experiencias/${experienceId}`);
  return { success: true };
}

// ── Depoimentos ────────────────────────────────────────────────────────────
/**
 * Prova social.
 *
 * O site não tem um depoimento, um rosto nem um nome. Numa compra de quinze a
 * quarenta mil reais, de uma empresa desconhecida, para viajar com estranhos,
 * é provavelmente o que mais falta — mais que qualquer ajuste de página.
 *
 * A home e a página da experiência já sabem exibir; faltava por onde
 * cadastrar.
 */
export async function salvarDepoimento(dados: FormData): Promise<Resultado> {
  await exigirPapel(["admin", "editor"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const id = limpar(dados.get("id"), 40) || null;
  const nome = limpar(dados.get("name"), 120);
  const depoimento = limpar(dados.get("quote_pt"), 1500);

  if (nome.length < 2) {
    return { success: false, campo: "name", error: "Informe quem escreveu." };
  }
  if (depoimento.length < 20) {
    return { success: false, campo: "quote_pt", error: "O depoimento está curto demais." };
  }

  const nota = numeroOuNulo(dados.get("rating"));
  if (nota !== null && (nota < 1 || nota > 5)) {
    return { success: false, campo: "rating", error: "A nota vai de 1 a 5." };
  }

  const status = limpar(dados.get("status"), 20);
  if (!["draft", "published", "archived"].includes(status)) {
    return { success: false, campo: "status", error: "Situação inválida." };
  }

  // Preserva traduções, como no cadastro de experiência.
  let quoteAtual: unknown = null;
  if (id) {
    const { data } = await supabase.from("testimonials").select("quote").eq("id", id).maybeSingle();
    quoteAtual = data?.quote ?? null;
  }

  const registro = {
    name: nome,
    quote: mesclarI18n(quoteAtual, depoimento),
    location: limpar(dados.get("location"), 120) || null,
    photo: limpar(dados.get("photo"), 500) || null,
    experience_id: limpar(dados.get("experience_id"), 40) || null,
    rating: nota,
    is_featured: dados.get("is_featured") === "on",
    status: status as never,
    sort_order: numeroOuNulo(dados.get("sort_order")) ?? 0,
  };

  const resposta = id
    ? await supabase.from("testimonials").update(registro as never).eq("id", id)
    : await supabase.from("testimonials").insert(registro as never);

  if (resposta.error) {
    console.error("[admin] salvar depoimento:", resposta.error.message);
    return { success: false, error: "Não foi possível salvar." };
  }

  revalidatePath("/");
  revalidatePath("/admin/depoimentos");
  revalidatePath("/experiencias", "layout");
  return { success: true };
}

export async function excluirDepoimento(id: string): Promise<Resultado> {
  await exigirPapel(["admin"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) {
    console.error("[admin] excluir depoimento:", error.message);
    return { success: false, error: "Não foi possível excluir." };
  }

  revalidatePath("/");
  revalidatePath("/admin/depoimentos");
  return { success: true };
}

// ── Dados da empresa ───────────────────────────────────────────────────────
/** Chaves editáveis pela tela de configurações. */
const CHAVES_DA_EMPRESA = [
  "empresa.razao_social",
  "empresa.cnpj",
  "empresa.cadastur",
  "empresa.endereco",
  "empresa.fundacao",
  "site.email",
  "site.whatsapp",
] as const;

/**
 * Valida CNPJ pelos dígitos verificadores.
 *
 * Não é frescura: é uma página de contrato. CNPJ digitado errado num Termo de
 * Uso é pior que campo vazio — a página fica com cara de documento válido e
 * identifica outra empresa, ou nenhuma.
 */
function cnpjValido(bruto: string): boolean {
  const n = bruto.replace(/\D/g, "");
  if (n.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(n)) return false; // 00000000000000 e afins

  const digito = (base: string, pesoInicial: number): number => {
    let peso = pesoInicial;
    let soma = 0;
    for (const c of base) {
      soma += Number(c) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return (
    digito(n.slice(0, 12), 5) === Number(n[12]) && digito(n.slice(0, 13), 6) === Number(n[13])
  );
}

function formatarCnpj(bruto: string): string {
  const n = bruto.replace(/\D/g, "");
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`;
}

export async function salvarDadosDaEmpresa(dados: FormData): Promise<Resultado> {
  await exigirPapel(["admin"]);

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const cnpj = limpar(dados.get("empresa.cnpj"), 20);
  if (cnpj && !cnpjValido(cnpj)) {
    return { success: false, campo: "empresa.cnpj", error: "Esse CNPJ não confere. Verifique os números." };
  }

  const ano = limpar(dados.get("empresa.fundacao"), 4);
  const anoAtual = new Date().getFullYear();
  if (ano && (!/^\d{4}$/.test(ano) || Number(ano) < 1900 || Number(ano) > anoAtual)) {
    return { success: false, campo: "empresa.fundacao", error: `Informe um ano entre 1900 e ${anoAtual}.` };
  }

  const registros = CHAVES_DA_EMPRESA.map((chave) => {
    const bruto = limpar(dados.get(chave), 300);
    const valor = chave === "empresa.cnpj" && bruto ? formatarCnpj(bruto) : bruto;
    return { key: chave, value: valor as unknown, is_public: true };
  });

  const { error } = await supabase.from("settings").upsert(registros as never, { onConflict: "key" });

  if (error) {
    console.error("[admin] dados da empresa:", error.message);
    return { success: false, error: "Não foi possível salvar." };
  }

  // Estes valores aparecem no rodapé, nos Termos e na página Sobre.
  revalidatePath("/", "layout");
  revalidatePath("/legal/termos");
  revalidatePath("/sobre");

  return { success: true };
}

// ── Leads ──────────────────────────────────────────────────────────────────
export async function alterarSituacaoDoLead(id: string, status: string): Promise<Resultado> {
  await exigirPapel(["admin"]);

  const permitidos = ["new", "contacted", "qualified", "converted", "lost"];
  if (!permitidos.includes(status)) return { success: false, error: "Situação inválida." };

  const supabase = conectar();
  if (!supabase) return { success: false, error: SEM_BANCO };

  const { error } = await supabase.from("leads").update({ status } as never).eq("id", id);
  if (error) {
    console.error("[admin] situação do lead:", error.message);
    return { success: false, error: "Não foi possível atualizar." };
  }

  revalidatePath("/admin/leads");
  return { success: true };
}
