/**
 * /admin/experiencias — catálogo visual para a equipe operar.
 */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  CalendarClock,
  Clock3,
  ExternalLink,
  ImageIcon,
  MapPin,
  Pencil,
  Star,
} from "lucide-react";
import type { Database } from "@/types/database";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";
import { BotaoSituacao } from "./BotaoSituacao";
import { ImportarExperienciaUrl } from "@/components/admin/ImportarExperienciaUrl";

export const dynamic = "force-dynamic";
export const metadata = { title: "Experiências", robots: { index: false } };

const SITUACAO: Record<string, { rotulo: string; classe: string }> = {
  published: {
    rotulo: "No ar",
    classe: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  draft: {
    rotulo: "Rascunho",
    classe: "border-[#dcccae] bg-[#f2eadb] text-[#6d604f]",
  },
  sold_out: {
    rotulo: "Esgotada",
    classe: "border-amber-200 bg-amber-50 text-amber-800",
  },
  archived: {
    rotulo: "Arquivada",
    classe: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

function dadosDoEspelho(metadata: unknown): { sourceUrl: string; plataforma?: string } | null {
  if (!metadata || typeof metadata !== "object") return null;
  const meta = metadata as Record<string, unknown>;
  if (meta.render_mode !== "external_mirror") return null;
  const bloco = meta.external_mirror;
  if (!bloco || typeof bloco !== "object") return null;
  const sourceUrl = (bloco as Record<string, unknown>).source_url;
  if (typeof sourceUrl !== "string" || !/^https?:\/\//i.test(sourceUrl)) return null;
  const plataforma = (bloco as Record<string, unknown>).plataforma;
  return {
    sourceUrl,
    plataforma: typeof plataforma === "string" ? plataforma : undefined,
  };
}

function hostDaUrl(valor: string): string {
  try {
    return new URL(valor).hostname.replace(/^www\./, "");
  } catch {
    return valor;
  }
}

function formatarAtualizacao(valor: string | null | undefined): string {
  if (!valor) return "Data indisponível";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
    .format(data)
    .replace(".", "");
}

export default async function ListaExperiencias() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
        Não foi possível carregar as experiências. Verifique as variáveis do ambiente de produção.
      </div>
    );
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });
  const hoje = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("experiences")
    .select(
      `id, title, slug, short_description, status, is_featured, duration_days, price_from,
       destination_id, metadata, hero_image, updated_at, created_at,
       destination:destinations(name),
       experience_dates(id, start_date, status)`
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
        Erro ao carregar: {error.message}
      </div>
    );
  }

  const itens = data ?? [];
  const rascunhos = itens.filter((item) => item.status === "draft");
  const publicadas = itens.filter((item) => item.status === "published");
  const outras = itens.filter((item) => item.status !== "draft" && item.status !== "published");

  function card(exp: (typeof itens)[number]) {
    const titulo = t(exp.title as I18nField, "pt") || "(sem título)";
    const slug = t(exp.slug as I18nField, "pt");
    const espelho = dadosDoEspelho(exp.metadata);
    const destino = exp.destination
      ? t((exp.destination as { name: unknown }).name as I18nField, "pt")
      : "";

    const datasFuturas = ((exp.experience_dates ?? []) as Array<Record<string, unknown>>).filter(
      (d) => d.status === "published" && String(d.start_date) >= hoje
    ).length;

    const pendencias: string[] = [];
    if (!espelho) {
      if (!t(exp.short_description as I18nField, "pt")) pendencias.push("sem resumo");
      if (!exp.destination_id) pendencias.push("sem destino");
      if (!exp.duration_days) pendencias.push("sem duração");
      if (exp.status === "published" && datasFuturas === 0) pendencias.push("sem data futura");
    }

    const situacao = SITUACAO[exp.status] ?? SITUACAO.draft;
    const capa = typeof exp.hero_image === "string" && exp.hero_image.trim() ? exp.hero_image.trim() : null;

    return (
      <article
        key={exp.id}
        className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#ddcfbb] bg-[#fffaf3] shadow-[0_14px_38px_rgba(70,43,28,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c4a56d] hover:shadow-[0_20px_55px_rgba(70,43,28,0.11)]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[#4b1058]">
          {capa ? (
            // Imagens de experiências podem vir do upload interno ou de uma página
            // espelhada externa; <img> evita limitar a miniatura a hosts do Next Image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capa}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_70%_20%,rgba(224,169,46,0.34),transparent_28%),linear-gradient(135deg,#4b1058,#6c1578)]">
              <ImageIcon className="h-8 w-8 text-white/45" aria-hidden="true" />
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] backdrop-blur ${situacao.classe}`}>
                {situacao.rotulo}
              </span>
              {espelho && (
                <span className="rounded-full border border-[#e0b546]/50 bg-[#fff8df]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#765616] backdrop-blur">
                  Espelho 1:1
                </span>
              )}
            </div>

            {exp.is_featured && (
              <span
                title="Destaque na home"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4b1058]/90 text-[#f2cd70] shadow backdrop-blur"
              >
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="min-h-[88px]">
            <h2 className="font-heading text-xl leading-snug text-[#4b174e]">{titulo}</h2>

            {espelho ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7b6d63]">
                <span>{espelho.plataforma || "Site externo"}</span>
                <span className="text-[#b39f8c]">•</span>
                <span>{hostDaUrl(espelho.sourceUrl)}</span>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#74655b]">
                {destino && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#9a701b]" aria-hidden="true" />
                    {destino}
                  </span>
                )}
                {exp.duration_days && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-[#9a701b]" aria-hidden="true" />
                    {exp.duration_days} dias
                  </span>
                )}
                {exp.price_from && (
                  <span>R$ {Number(exp.price_from).toLocaleString("pt-BR")}</span>
                )}
              </div>
            )}
          </div>

          {pendencias.length > 0 && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              Falta: {pendencias.join(", ")}
            </p>
          )}

          <div className="mt-5 flex items-center gap-2 border-t border-[#eadfce] pt-4 text-xs text-[#817167]">
            <CalendarClock className="h-3.5 w-3.5 text-[#a4781d]" aria-hidden="true" />
            <span>Atualizado em {formatarAtualizacao(exp.updated_at || exp.created_at)}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/experiencias/${exp.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4d145b] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#641770]"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Editar
            </Link>

            {exp.status === "published" && slug && (
              <Link
                href={`/experiencias/${slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d7c8b3] bg-white/70 px-3.5 py-2.5 text-xs font-medium text-[#65564d] transition hover:border-[#a98542] hover:text-[#4d145b]"
              >
                Ver no site
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}

            {espelho && (
              <a
                href={espelho.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d7c8b3] bg-white/70 px-3.5 py-2.5 text-xs font-medium text-[#65564d] transition hover:border-[#a98542] hover:text-[#4d145b]"
              >
                Origem
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}

            <div className="ml-auto">
              <BotaoSituacao
                id={exp.id}
                situacaoAtual={exp.status}
                temPendencia={pendencias.length > 0}
              />
            </div>
          </div>
        </div>
      </article>
    );
  }

  function secao(
    titulo: string,
    descricao: string,
    lista: typeof itens,
    destaque = false
  ) {
    if (lista.length === 0) return null;

    return (
      <section
        className={
          destaque
            ? "rounded-[26px] border border-[#e3c86f] bg-[#fff7df]/55 p-5 md:p-6"
            : ""
        }
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl text-[#4b174e]">{titulo}</h2>
              <span className="rounded-full bg-[#eadfc8] px-2.5 py-1 text-[10px] font-bold tabular-nums text-[#71591f]">
                {lista.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#7c6b60]">{descricao}</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{lista.map(card)}</div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-[28px] bg-[#4b1058] text-white shadow-[0_24px_65px_rgba(64,20,72,0.16)]">
        <div className="relative flex flex-wrap items-end justify-between gap-6 px-7 py-8 md:px-9 md:py-9">
          <div
            aria-hidden="true"
            className="absolute inset-0 [background:radial-gradient(circle_at_92%_10%,rgba(225,172,48,0.25),transparent_27%),radial-gradient(circle_at_5%_100%,rgba(120,34,136,0.75),transparent_38%)]"
          />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f2cd70]">
              Catálogo
            </p>
            <h1 className="mt-2 font-heading text-3xl md:text-4xl">Experiências</h1>
            <p className="mt-2 text-sm text-white/65">
              {itens.length} cadastrada{itens.length === 1 ? "" : "s"} · {publicadas.length} no ar · {rascunhos.length} rascunho{rascunhos.length === 1 ? "" : "s"}
            </p>
          </div>

          <Link
            href="/admin/experiencias/nova"
            className="relative rounded-xl bg-[#e1ad34] px-5 py-3 text-sm font-semibold text-[#39270d] shadow-sm transition hover:bg-[#ecc153]"
          >
            Nova experiência
          </Link>
        </div>
      </header>

      <ImportarExperienciaUrl />

      {itens.length === 0 ? (
        <div className="rounded-[24px] border border-[#ddcfbb] bg-[#fffaf3] p-12 text-center shadow-sm">
          <p className="font-heading text-xl text-[#4b174e]">Nenhuma experiência cadastrada</p>
          <p className="mt-2 text-sm text-[#7c6b60]">
            Cole uma página pronta acima para espelhá-la ou cadastre uma experiência manualmente.
          </p>
        </div>
      ) : (
        <>
          {secao(
            "Rascunhos",
            "Itens ainda fora do site. Ficam no topo para você continuar de onde parou.",
            rascunhos,
            true
          )}

          {secao(
            "No ar",
            "Experiências publicadas e disponíveis no site.",
            publicadas
          )}

          {secao(
            "Outras situações",
            "Experiências esgotadas ou arquivadas.",
            outras
          )}
        </>
      )}
    </div>
  );
}
