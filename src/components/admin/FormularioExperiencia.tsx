"use client";

/**
 * Formulário de experiência.
 *
 * Edita o português. Inglês e espanhol são preservados no salvamento — o
 * formulário nunca sobrescreve idioma que não mostra.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { salvarExperiencia } from "@/lib/actions/admin";
import { t } from "@/lib/utils";
import type { Category, DestinationWithCountry, ExperienceWithRelations, I18nField } from "@/types/models";

interface Props {
  experiencia?: ExperienceWithRelations | null;
  categorias: Category[];
  destinos: DestinationWithCountry[];
}

/** Mesmos valores do array `intentions`, usados pelo Journey Builder. */
const INTENCOES = [
  { valor: "meditacao", rotulo: "Meditação" },
  { valor: "natureza", rotulo: "Natureza" },
  { valor: "cultura_local", rotulo: "Cultura local" },
  { valor: "autoconhecimento", rotulo: "Autoconhecimento" },
  { valor: "descanso", rotulo: "Descanso" },
  { valor: "aventura", rotulo: "Aventura" },
  { valor: "yoga", rotulo: "Yoga" },
  { valor: "cerimonias", rotulo: "Cerimônias" },
  { valor: "historia", rotulo: "História" },
];

const DIFICULDADES = [
  { valor: "beginner", rotulo: "Leve" },
  { valor: "intermediate", rotulo: "Moderada" },
  { valor: "advanced", rotulo: "Exigente" },
  { valor: "all_levels", rotulo: "Todos os níveis" },
];

/**
 * Público e layout — os dois campos que mudam a página inteira.
 *
 * Sem eles no painel, os quatro layouts só existiriam por script: toda
 * experiência criada aqui nasceria clássica e para viajante, sem jeito de
 * mudar. As descrições dizem QUANDO usar cada um, porque o nome sozinho
 * não conta (a diferença entre "roteiro" e "clássico" é quanta coisa o
 * conteúdo tem, não o gosto de quem cadastra).
 */
const PUBLICOS = [
  {
    valor: "viajante",
    rotulo: "Viajante — vende vaga",
    ajuda: "Tem data, vaga e botão de reserva. Aparece no catálogo /experiencias.",
  },
  {
    valor: "facilitador",
    rotulo: "Facilitadora — leva o próprio grupo",
    ajuda:
      "Sem data e sem vaga: o caminho é a conversa com a consultora. Aparece em /para-facilitadores e FICA FORA do catálogo.",
  },
];

const LAYOUTS = [
  {
    valor: "classico",
    rotulo: "Clássico",
    ajuda: "Coluna de conteúdo com as datas e a reserva ao lado. Serve à jornada curta.",
    publico: "viajante",
  },
  {
    valor: "roteiro",
    rotulo: "Roteiro dia a dia",
    ajuda:
      "O dia a dia vira o eixo da página. Só faz sentido com o roteiro cadastrado — sem nenhum dia, a página cai para o Clássico sozinha.",
    publico: "viajante",
  },
  {
    valor: "territorio",
    rotulo: "Território (completo)",
    ajuda:
      "Territórios, vivências e o bloco de parceria. É o layout dos modelos de Peru, Marrocos e Amazônia.",
    publico: "facilitador",
  },
  {
    valor: "convite",
    rotulo: "Convite (enxuto)",
    ajuda:
      "Imagem grande, texto curto e uma conversa. Para quando o conteúdo ainda é pouco — o completo com pouca coisa parece site em construção.",
    publico: "facilitador",
  },
];

export function FormularioExperiencia({ experiencia, categorias, destinos }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const atual = {
    titulo: t(experiencia?.title as I18nField, "pt"),
    slug: t(experiencia?.slug as I18nField, "pt"),
    resumo: t(experiencia?.short_description as I18nField, "pt"),
    descricao: t(experiencia?.description as I18nField, "pt"),
    paraQuem: t(experiencia?.who_is_this_for as I18nField, "pt"),
    chapeu: t(experiencia?.hero_kicker as I18nField, "pt"),
    subtitulo: t(experiencia?.subtitle as I18nField, "pt"),
    periodo: t(experiencia?.period_label as I18nField, "pt"),
    porQueCriamos: t(experiencia?.why_created as I18nField, "pt"),
    propostaDeValor: t(experiencia?.value_proposition as I18nField, "pt"),
    apenasRelaxe: t(experiencia?.relax_text as I18nField, "pt"),
    fechamentoTitulo: t(experiencia?.closing_title as I18nField, "pt"),
    fechamentoTexto: t(experiencia?.closing_text as I18nField, "pt"),
  };

  // O layout escolhido acompanha o público: marcar "facilitadora" e deixar
  // o layout em "clássico" produz uma página com barra de reserva vazia
  // para quem não vai reservar nada.
  const [publico, setPublico] = useState<string>(experiencia?.audience ?? "viajante");
  const [layout, setLayout] = useState<string>(experiencia?.template ?? "classico");

  function trocarPublico(novo: string) {
    setPublico(novo);
    const combina = LAYOUTS.find((l) => l.valor === layout)?.publico === novo;
    if (!combina) setLayout(novo === "facilitador" ? "territorio" : "classico");
  }

  const intencoesAtuais = new Set(experiencia?.intentions ?? []);

  function enviar(dados: FormData) {
    setErro(null);
    setCampoComErro(null);
    setSalvo(false);

    iniciar(async () => {
      const r = await salvarExperiencia(dados);

      if (!r.success) {
        setErro(r.error ?? "Não foi possível salvar.");
        setCampoComErro(r.campo ?? null);
        // Rola até o topo: o erro pode estar num campo fora da tela.
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setSalvo(true);
      if (!experiencia && r.id) router.push(`/admin/experiencias/${r.id}`);
      else router.refresh();
    });
  }

  const classe = (campo: string) =>
    `w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
      campoComErro === campo
        ? "border-red-400 focus:ring-red-500/20"
        : "border-border focus:border-secondary-500 focus:ring-secondary-500/20"
    }`;

  return (
    <form action={enviar} className="space-y-8">
      {experiencia && <input type="hidden" name="id" value={experiencia.id} />}

      {erro && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {erro}
        </div>
      )}
      {salvo && !erro && (
        <div role="status" className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Salvo.
        </div>
      )}

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <legend className="px-2 font-heading text-lg text-primary-700">Identificação</legend>

        <div>
          <label htmlFor="title_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
            Título *
          </label>
          <input
            id="title_pt"
            name="title_pt"
            defaultValue={atual.titulo}
            required
            maxLength={160}
            className={classe("title_pt")}
          />
        </div>

        <div>
          <label htmlFor="slug_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
            Endereço da página
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-text-muted">/experiencias/</span>
            <input
              id="slug_pt"
              name="slug_pt"
              defaultValue={atual.slug}
              maxLength={90}
              placeholder="gerado a partir do título"
              className={classe("slug_pt")}
            />
          </div>
          {experiencia && (
            <p className="mt-1 text-xs text-amber-700">
              Mudar o endereço quebra links já compartilhados desta página.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="short_description_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
            Resumo
          </label>
          <textarea
            id="short_description_pt"
            name="short_description_pt"
            defaultValue={atual.resumo}
            rows={3}
            maxLength={500}
            className={`resize-none ${classe("short_description_pt")}`}
          />
          <p className="mt-1 text-xs text-text-muted">
            Aparece no card, na busca e é o que o Concierge usa ao recomendar. Obrigatório para publicar.
          </p>
        </div>

        <div>
          <label htmlFor="description_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
            Descrição completa
          </label>
          <textarea
            id="description_pt"
            name="description_pt"
            defaultValue={atual.descricao}
            rows={10}
            maxLength={8000}
            className={`resize-y ${classe("description_pt")}`}
          />
        </div>

        <div>
          <label htmlFor="who_is_this_for_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
            Para quem é esta jornada
          </label>
          <textarea
            id="who_is_this_for_pt"
            name="who_is_this_for_pt"
            defaultValue={atual.paraQuem}
            rows={4}
            maxLength={2000}
            placeholder="Para quem busca… E não é para quem espera…"
            className={`resize-y ${classe("who_is_this_for_pt")}`}
          />
          <p className="mt-1 text-xs text-text-muted">
            Dizer para quem <strong>não</strong> é evita frustração e ajuda quem está decidindo.
            Aparece em destaque na página.
          </p>
        </div>

        {/* ── O esqueleto de 8 seções ─────────────────────────────────── */}
        <fieldset className="rounded-xl border border-border bg-warm-gray/25 p-5">
          <legend className="px-2 text-sm font-semibold text-primary-700">
            As seções da página, na ordem do padrão
          </legend>
          <p className="mb-5 text-xs text-text-muted">
            Toda página de roteiro segue a mesma ordem: título, introdução, por que criamos,
            o que é, por que participar, a jornada dia a dia, apenas relaxe e quem conduz.
            Seção sem texto não é desenhada — nada aqui é obrigatório para salvar, mas o que
            ficar vazio some da página.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="subtitle_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
                Subtítulo <span className="font-normal text-text-muted">(seção 1)</span>
              </label>
              <input
                id="subtitle_pt"
                name="subtitle_pt"
                defaultValue={atual.subtitulo}
                maxLength={200}
                placeholder="As Três Faces do Divino"
                className={classe("subtitle_pt")}
              />
            </div>

            <div>
              <label
                htmlFor="period_label_pt"
                className="mb-1.5 block text-sm font-medium text-primary-700"
              >
                Período <span className="font-normal text-text-muted">(seção 1)</span>
              </label>
              <input
                id="period_label_pt"
                name="period_label_pt"
                defaultValue={atual.periodo}
                maxLength={120}
                placeholder="De 12/05 a 19/05"
                className={classe("period_label_pt")}
              />
              <p className="mt-1 text-xs text-text-muted">
                Texto livre para o topo. As saídas com vaga continuam vindo da aba de datas.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="why_created_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
              Por que criamos esta jornada <span className="font-normal text-text-muted">(seção 3)</span>
            </label>
            <textarea
              id="why_created_pt"
              name="why_created_pt"
              defaultValue={atual.porQueCriamos}
              rows={4}
              maxLength={4000}
              placeholder="O propósito e a intenção de colocar esta experiência no mundo."
              className={`resize-y ${classe("why_created_pt")}`}
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="value_proposition_pt"
              className="mb-1.5 block text-sm font-medium text-primary-700"
            >
              Por que participar <span className="font-normal text-text-muted">(seção 5)</span>
            </label>
            <textarea
              id="value_proposition_pt"
              name="value_proposition_pt"
              defaultValue={atual.propostaDeValor}
              rows={3}
              maxLength={2000}
              placeholder="O texto de abertura. Os itens em lista ficam nos destaques."
              className={`resize-y ${classe("value_proposition_pt")}`}
            />
          </div>

          <div className="mt-5">
            <label htmlFor="relax_text_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
              Apenas relaxe <span className="font-normal text-text-muted">(seção 7)</span>
            </label>
            <textarea
              id="relax_text_pt"
              name="relax_text_pt"
              defaultValue={atual.apenasRelaxe}
              rows={4}
              maxLength={4000}
              placeholder="Preciso ter experiência? E se eu for sozinha? Como funciona a logística?"
              className={`resize-y ${classe("relax_text_pt")}`}
            />
            <p className="mt-1 text-xs text-text-muted">
              Quebra de objeção. As perguntas uma a uma ficam nas perguntas frequentes.
            </p>
          </div>
        </fieldset>

        {/* ── Público e layout ────────────────────────────────────────── */}
        <fieldset className="rounded-xl border border-secondary-200 bg-secondary-50/40 p-5">
          <legend className="px-2 text-sm font-semibold text-primary-700">
            Para quem é a página, e como ela se organiza
          </legend>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="audience" className="mb-1.5 block text-sm font-medium text-primary-700">
                Público
              </label>
              <select
                id="audience"
                name="audience"
                value={publico}
                onChange={(e) => trocarPublico(e.target.value)}
                className={classe("audience")}
              >
                {PUBLICOS.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.rotulo}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-text-muted">
                {PUBLICOS.find((p) => p.valor === publico)?.ajuda}
              </p>
            </div>

            <div>
              <label htmlFor="template" className="mb-1.5 block text-sm font-medium text-primary-700">
                Layout da página
              </label>
              <select
                id="template"
                name="template"
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className={classe("template")}
              >
                {LAYOUTS.filter((l) => l.publico === publico).map((l) => (
                  <option key={l.valor} value={l.valor}>
                    {l.rotulo}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-text-muted">
                {LAYOUTS.find((l) => l.valor === layout)?.ajuda}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="hero_kicker_pt" className="mb-1.5 block text-sm font-medium text-primary-700">
              Chapéu do topo
            </label>
            <input
              id="hero_kicker_pt"
              name="hero_kicker_pt"
              defaultValue={atual.chapeu}
              maxLength={120}
              placeholder="Parceria para terapeutas e facilitadoras · Peru"
              className={classe("hero_kicker_pt")}
            />
            <p className="mt-1 text-xs text-text-muted">
              A linha curta em caixa alta acima do título. Vazio, o layout usa a categoria (viajante)
              ou o destino (facilitadora).
            </p>
          </div>

          <div className="mt-5 grid gap-5">
            <div>
              <label
                htmlFor="closing_title_pt"
                className="mb-1.5 block text-sm font-medium text-primary-700"
              >
                Título do convite final
              </label>
              <input
                id="closing_title_pt"
                name="closing_title_pt"
                defaultValue={atual.fechamentoTitulo}
                maxLength={200}
                placeholder="Sinta o chamado do Peru Sagrado"
                className={classe("closing_title_pt")}
              />
              <p className="mt-1 text-xs text-text-muted">
                Vazio, o bloco de fechamento não é desenhado. É de propósito: um convite genérico no
                fim de uma página específica soa como rodapé de modelo.
              </p>
            </div>

            <div>
              <label
                htmlFor="closing_text_pt"
                className="mb-1.5 block text-sm font-medium text-primary-700"
              >
                Texto do convite final
              </label>
              <textarea
                id="closing_text_pt"
                name="closing_text_pt"
                defaultValue={atual.fechamentoTexto}
                rows={3}
                maxLength={2000}
                className={`resize-y ${classe("closing_text_pt")}`}
              />
            </div>
          </div>
        </fieldset>

        <div>
          <label htmlFor="hero_image" className="mb-1.5 block text-sm font-medium text-primary-700">
            Imagem de capa (endereço)
          </label>
          <input
            id="hero_image"
            name="hero_image"
            type="url"
            defaultValue={experiencia?.hero_image ?? ""}
            placeholder="https://…"
            maxLength={500}
            className={classe("hero_image")}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <legend className="px-2 font-heading text-lg text-primary-700">Classificação</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category_id" className="mb-1.5 block text-sm font-medium text-primary-700">
              Categoria
            </label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={experiencia?.category_id ?? ""}
              className={classe("category_id")}
            >
              <option value="">—</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.name as I18nField, "pt")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="destination_id" className="mb-1.5 block text-sm font-medium text-primary-700">
              Destino
            </label>
            <select
              id="destination_id"
              name="destination_id"
              defaultValue={experiencia?.destination_id ?? ""}
              className={classe("destination_id")}
            >
              <option value="">—</option>
              {destinos.map((d) => (
                <option key={d.id} value={d.id}>
                  {t(d.name as I18nField, "pt")}
                  {d.country ? ` · ${t(d.country.name as I18nField, "pt")}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text-muted">
              Obrigatório para publicar. É daqui que vêm clima, altitude e as dicas do destino.
            </p>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-primary-700">Indicada para</span>
          <div className="flex flex-wrap gap-2">
            {INTENCOES.map((i) => (
              <label
                key={i.valor}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:border-secondary-300 has-[:checked]:border-secondary-500 has-[:checked]:bg-secondary-50"
              >
                <input
                  type="checkbox"
                  name="intentions"
                  value={i.valor}
                  defaultChecked={intencoesAtuais.has(i.valor)}
                  className="accent-secondary-500"
                />
                {i.rotulo}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted">
            É o que o montador de roteiro usa para casar a experiência com o que a pessoa procura.
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <legend className="px-2 font-heading text-lg text-primary-700">Formato e valores</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="duration_days" className="mb-1.5 block text-sm font-medium text-primary-700">
              Duração (dias)
            </label>
            <input
              id="duration_days"
              name="duration_days"
              type="number"
              min={1}
              max={365}
              defaultValue={experiencia?.duration_days ?? ""}
              className={classe("duration_days")}
            />
          </div>
          <div>
            <label htmlFor="group_size_min" className="mb-1.5 block text-sm font-medium text-primary-700">
              Grupo mínimo
            </label>
            <input
              id="group_size_min"
              name="group_size_min"
              type="number"
              min={1}
              defaultValue={experiencia?.group_size_min ?? ""}
              className={classe("group_size_min")}
            />
          </div>
          <div>
            <label htmlFor="group_size_max" className="mb-1.5 block text-sm font-medium text-primary-700">
              Grupo máximo
            </label>
            <input
              id="group_size_max"
              name="group_size_max"
              type="number"
              min={1}
              defaultValue={experiencia?.group_size_max ?? ""}
              className={classe("group_size_max")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="price_from" className="mb-1.5 block text-sm font-medium text-primary-700">
              A partir de (R$)
            </label>
            <input
              id="price_from"
              name="price_from"
              type="number"
              min={0}
              step="0.01"
              defaultValue={experiencia?.price_from ?? ""}
              className={classe("price_from")}
            />
          </div>
          <div>
            <label htmlFor="difficulty" className="mb-1.5 block text-sm font-medium text-primary-700">
              Esforço físico
            </label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue={experiencia?.difficulty ?? "all_levels"}
              className={classe("difficulty")}
            >
              {DIFICULDADES.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort_order" className="mb-1.5 block text-sm font-medium text-primary-700">
              Ordem na listagem
            </label>
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={experiencia?.sort_order ?? 0}
              className={classe("sort_order")}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <legend className="px-2 font-heading text-lg text-primary-700">Publicação</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-primary-700">
              Situação
            </label>
            <select
              id="status"
              name="status"
              defaultValue={experiencia?.status ?? "draft"}
              className={classe("status")}
            >
              <option value="draft">Rascunho — não aparece no site</option>
              <option value="published">No ar — visível para todos</option>
              <option value="sold_out">Esgotada</option>
              <option value="archived">Arquivada</option>
            </select>
          </div>

          <label className="flex items-center gap-3 self-end pb-2.5">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={experiencia?.is_featured ?? false}
              className="h-4 w-4 accent-secondary-500"
            />
            <span className="text-sm text-primary-700">Destacar na home</span>
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-primary-700 px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-60"
        >
          {pendente ? "Salvando…" : experiencia ? "Salvar alterações" : "Criar experiência"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/experiencias")}
          className="text-sm text-text-muted underline underline-offset-4 hover:text-primary-700"
        >
          Voltar à lista
        </button>
      </div>
    </form>
  );
}
