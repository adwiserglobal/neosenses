/**
 * /admin/experiencias — lista para a equipe operar.
 *
 * Mostra o que impede uma experiência de ir ao ar (sem resumo, sem destino,
 * sem data futura) direto na linha. Descobrir isso só depois de publicar é
 * descobrir com o visitante junto.
 */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";
import { BotaoSituacao } from "./BotaoSituacao";
import { ImportarExperienciaUrl } from "@/components/admin/ImportarExperienciaUrl";

export const dynamic = "force-dynamic";
export const metadata = { title: "Experiências", robots: { index: false } };

const SITUACAO: Record<string, { rotulo: string; classe: string }> = {
  published: { rotulo: "No ar", classe: "bg-success/10 text-success border-success/30" },
  draft: { rotulo: "Rascunho", classe: "bg-warm-gray text-text-muted border-border" },
  sold_out: { rotulo: "Esgotada", classe: "bg-amber-50 text-amber-700 border-amber-300" },
  archived: { rotulo: "Arquivada", classe: "bg-warm-gray text-text-muted/60 border-border" },
};

export default async function ListaExperiencias() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
        Sem conexão com o banco.{" "}
        <Link href="/admin/supabase" className="underline underline-offset-4">
          Ver diagnóstico
        </Link>
      </div>
    );
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });
  const hoje = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("experiences")
    .select(
      `id, title, slug, short_description, status, is_featured, duration_days, price_from,
       destination_id,
       destination:destinations(name),
       experience_dates(id, start_date, status)`
    )
    .order("status", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
        Erro ao carregar: {error.message}
      </div>
    );
  }

  const itens = data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-primary-700">Experiências</h1>
          <p className="mt-1 text-sm text-text-muted">
            {itens.length} cadastrada{itens.length === 1 ? "" : "s"} ·{" "}
            {itens.filter((e) => e.status === "published").length} no ar
          </p>
        </div>
        <Link
          href="/admin/experiencias/nova"
          className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
        >
          Nova experiência
        </Link>
      </header>

      <ImportarExperienciaUrl />

      {itens.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="font-heading text-lg text-primary-700">Nenhuma experiência cadastrada</p>
          <p className="mt-1 text-sm text-text-muted">
            Importe uma página pronta acima ou cadastre manualmente. Nada aparece no site até você publicar.
          </p>
          <Link
            href="/admin/experiencias/nova"
            className="mt-5 inline-block rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Cadastrar manualmente
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {itens.map((exp) => {
            const titulo = t(exp.title as I18nField, "pt") || "(sem título)";
            const slug = t(exp.slug as I18nField, "pt");
            const destino = exp.destination
              ? t((exp.destination as { name: unknown }).name as I18nField, "pt")
              : "";

            const datasFuturas = ((exp.experience_dates ?? []) as Array<Record<string, unknown>>).filter(
              (d) => d.status === "published" && String(d.start_date) >= hoje
            ).length;

            const pendencias: string[] = [];
            if (!t(exp.short_description as I18nField, "pt")) pendencias.push("sem resumo");
            if (!exp.destination_id) pendencias.push("sem destino");
            if (!exp.duration_days) pendencias.push("sem duração");
            if (exp.status === "published" && datasFuturas === 0) pendencias.push("sem data futura");

            const situacao = SITUACAO[exp.status] ?? SITUACAO.draft;

            return (
              <li key={exp.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${situacao.classe}`}>
                        {situacao.rotulo}
                      </span>
                      {exp.is_featured && (
                        <span className="rounded-full border border-secondary-300 bg-secondary-50 px-2.5 py-0.5 text-[11px] font-medium text-secondary-700">
                          Destaque
                        </span>
                      )}
                    </div>

                    <h2 className="mt-1.5 font-heading text-lg text-primary-700">{titulo}</h2>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      {destino && <span>{destino}</span>}
                      {exp.duration_days && <span>{exp.duration_days} dias</span>}
                      {exp.price_from && <span>R$ {Number(exp.price_from).toLocaleString("pt-BR")}</span>}
                      <span>
                        {datasFuturas} data{datasFuturas === 1 ? "" : "s"} futura{datasFuturas === 1 ? "" : "s"}
                      </span>
                    </div>

                    {pendencias.length > 0 && (
                      <p className="mt-2 inline-block rounded bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
                        Falta: {pendencias.join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {exp.status === "published" && slug && (
                      <Link
                        href={`/experiencias/${slug}`}
                        target="_blank"
                        className="rounded-lg border border-border px-3 py-2 text-xs text-text-muted transition hover:border-secondary-500 hover:text-secondary-500"
                      >
                        Ver no site
                      </Link>
                    )}
                    <BotaoSituacao id={exp.id} situacaoAtual={exp.status} temPendencia={pendencias.length > 0} />
                    <Link
                      href={`/admin/experiencias/${exp.id}`}
                      className="rounded-lg bg-primary-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-800"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
