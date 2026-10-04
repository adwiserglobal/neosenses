/**
 * /admin/experiencias/[id] — edição.
 *
 * Cadastro e saídas na mesma tela: quem publica uma experiência precisa das
 * duas coisas, e separar em telas faz alguém publicar sem data.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  Category,
  DestinationWithCountry,
  ExperienceDate,
  ExperienceWithRelations,
  I18nField,
} from "@/types/models";
import { t } from "@/lib/utils";
import { FormularioExperiencia } from "@/components/admin/FormularioExperiencia";
import { Datas } from "@/components/admin/Datas";

export const dynamic = "force-dynamic";

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Editar experiência", robots: { index: false } };

export default async function EditarExperiencia({ params }: Props) {
  const { id } = await params;
  if (!RE_UUID.test(id)) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return <p className="text-sm text-red-700">Sem conexão com o banco.</p>;
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });

  const [experiencia, categorias, destinos, datas, roteiro, destaques, perguntas, equipe] = await Promise.all([
    supabase.from("experiences").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("destinations").select("*, country:countries(*)").eq("is_active", true).order("sort_order"),
    supabase.from("experience_dates").select("*").eq("experience_id", id).order("start_date"),
    supabase.from("itinerary_days").select("id", { count: "exact", head: true }).eq("experience_id", id),
    supabase.from("experience_highlights").select("id", { count: "exact", head: true }).eq("experience_id", id),
    supabase.from("experience_faqs").select("id", { count: "exact", head: true }).eq("experience_id", id),
    supabase.from("experience_facilitators").select("id", { count: "exact", head: true }).eq("experience_id", id),
  ]);

  if (!experiencia.data) notFound();

  const registro = experiencia.data as unknown as ExperienceWithRelations;
  const titulo = t(registro.title as I18nField, "pt") || "(sem título)";
  const slug = t(registro.slug as I18nField, "pt");

  const espelho = (registro.metadata as { render_mode?: string } | null)?.render_mode === "external_mirror";
  const campo = (valor: unknown) => Boolean(t(valor as I18nField, "pt").trim());
  const periodo = campo(registro.period_label) ||
    (datas.data ?? []).some((data) => data.status === "published");
  const indicadores: Array<{ nome: string; ok: boolean | null; ajuda: string }> = [
    { nome: "1. Título, subtítulo e período",
      ok: campo(registro.title) && campo(registro.subtitle) && periodo,
      ajuda: "Preencha o título, subtítulo e período ou cadastre uma saída publicada." },
    { nome: "2. O roteiro ou retiro",
      ok: campo(registro.short_description), ajuda: "Preencha o resumo da experiência." },
    { nome: "3. Por que criamos",
      ok: campo(registro.why_created), ajuda: "Informe o propósito da jornada." },
    { nome: "4. O que é a experiência",
      ok: campo(registro.description), ajuda: "Preencha a descrição completa." },
    { nome: "5. Por que participar",
      ok: destaques.error ? null : campo(registro.value_proposition) || (destaques.count ?? 0) > 0,
      ajuda: "Preencha a proposta de valor ou os destaques." },
    { nome: "6. A jornada em sanfona",
      ok: roteiro.error ? null : (roteiro.count ?? 0) > 0,
      ajuda: "Cadastre as etapas do roteiro dia a dia." },
    { nome: "7. Apenas relaxe",
      ok: perguntas.error ? null : campo(registro.relax_text) || (perguntas.count ?? 0) > 0,
      ajuda: "Preencha o texto de acolhimento ou as perguntas frequentes." },
    { nome: "8. Quem conduz",
      ok: equipe.error ? null : (equipe.count ?? 0) > 0,
      ajuda: "Vincule ao roteiro as pessoas que conduzem a experiência." },
  ];
  const completas = indicadores.filter((item) => item.ok === true).length;


  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <Link href="/admin/experiencias" className="text-sm text-text-muted hover:text-primary-700">
          ← Experiências
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl text-primary-700">{titulo}</h1>
          {registro.status === "published" && slug && (
            <Link
              href={`/experiencias/${slug}`}
              target="_blank"
              className="text-sm text-secondary-600 underline underline-offset-4"
            >
              Ver no site ↗
            </Link>
          )}
        </div>
      </header>

      {!espelho && registro.audience === "viajante" && (
        <section aria-label="Revisão editorial" className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl text-primary-700">Revisão das 8 seções</h2>
            <span className="text-sm font-semibold text-primary-700">{completas}/8 completas</span>
          </div>
          <p className="mt-2 text-sm text-text-muted">
            Essa conferência não inventa conteúdo nem retira páginas publicadas do ar.
            Os textos ficam neste formulário; roteiro, FAQs e equipe precisam estar
            cadastrados nas tabelas relacionadas à experiência.
          </p>
          <ol className="mt-5 space-y-3">
            {indicadores.map((item) => (
              <li key={item.nome} className="flex items-start justify-between gap-4 border-t border-border pt-3">
                <div>
                  <p className="text-sm font-medium text-primary-700">{item.nome}</p>
                  {item.ok !== true && <p className="mt-0.5 text-xs text-text-muted">{item.ajuda}</p>}
                </div>
                <span className={`shrink-0 text-xs font-semibold ${item.ok === true
                  ? "text-success" : item.ok === null ? "text-text-muted" : "text-amber-700"}`}>
                  {item.ok === true ? "Completa" : item.ok === null ? "Não verificada" : "Pendente"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <FormularioExperiencia
        experiencia={registro}
        categorias={(categorias.data ?? []) as Category[]}
        destinos={(destinos.data ?? []) as unknown as DestinationWithCountry[]}
      />

      <div className="border-t border-border pt-10">
        <Datas experienceId={id} datas={(datas.data ?? []) as ExperienceDate[]} />
      </div>
    </div>
  );
}
