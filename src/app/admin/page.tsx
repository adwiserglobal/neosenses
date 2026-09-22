/**
 * /admin — visão geral.
 *
 * Números do que existe e das conversas recentes. As telas de edição de
 * conteúdo ainda não foram construídas; os cartões apontam para o que já
 * funciona e dizem o que falta, em vez de fingir que está tudo pronto.
 */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

interface Contagem {
  rotulo: string;
  valor: number | null;
  observacao?: string;
}

async function contar(): Promise<{ conteudo: Contagem[]; movimento: Contagem[]; erro?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    return {
      conteudo: [],
      movimento: [],
      erro: "SUPABASE_SERVICE_ROLE_KEY não configurada — sem ela não há como ler os totais.",
    };
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });

  /** Só o total interessa; `head: true` evita trazer as linhas. */
  const somenteTotal = { count: "exact" as const, head: true };
  const valor = (r: { count: number | null; error: unknown }) => (r.error ? null : r.count ?? 0);

  const seteDiasAtras = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [publicadas, rascunhos, destinos, guias, itens, leads, conversas, conversasSemana] =
    await Promise.all([
      supabase.from("experiences").select("id", somenteTotal).eq("status", "published").then(valor),
      supabase.from("experiences").select("id", somenteTotal).eq("status", "draft").then(valor),
      supabase.from("destinations").select("id", somenteTotal).then(valor),
      supabase.from("travel_guides").select("id", somenteTotal).then(valor),
      supabase.from("packing_catalog_items").select("id", somenteTotal).then(valor),
      supabase.from("leads").select("id", somenteTotal).then(valor),
      supabase.from("conversations").select("id", somenteTotal).then(valor),
      supabase.from("conversations").select("id", somenteTotal).gte("started_at", seteDiasAtras).then(valor),
    ]);

  return {
    conteudo: [
      { rotulo: "Experiências publicadas", valor: publicadas, observacao: publicadas === 0 ? "o Concierge não recomenda nada" : undefined },
      { rotulo: "Rascunhos", valor: rascunhos },
      { rotulo: "Destinos", valor: destinos },
      { rotulo: "Guias de viagem", valor: guias },
      { rotulo: "Itens de bagagem", valor: itens },
    ],
    movimento: [
      { rotulo: "Conversas (7 dias)", valor: conversasSemana },
      { rotulo: "Conversas no total", valor: conversas },
      { rotulo: "Leads", valor: leads },
    ],
  };
}

function Cartao({ dados }: { dados: Contagem }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-2xl font-semibold tabular-nums text-primary-700">
        {dados.valor === null ? "—" : dados.valor}
      </p>
      <p className="mt-1 text-sm text-text-muted">{dados.rotulo}</p>
      {dados.observacao && <p className="mt-1 text-xs text-amber-700">{dados.observacao}</p>}
    </div>
  );
}

export default async function PaginaAdmin() {
  const { conteudo, movimento, erro } = await contar();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl text-primary-700">Visão geral</h1>
        <p className="mt-1 text-sm text-text-muted">O que existe hoje no site e no Concierge.</p>
      </header>

      {erro ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          {erro}{" "}
          <Link href="/admin/supabase" className="underline underline-offset-4">
            Ver diagnóstico
          </Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 font-heading text-lg text-primary-700">Conteúdo</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {conteudo.map((c) => (
                <Cartao key={c.rotulo} dados={c} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg text-primary-700">Movimento</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {movimento.map((c) => (
                <Cartao key={c.rotulo} dados={c} />
              ))}
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl border border-border bg-warm-gray/30 p-5">
        <h2 className="font-heading text-lg text-primary-700">Ainda não construído</h2>
        <p className="mt-1 text-sm text-text-muted">
          Estas telas fazem parte do painel, mas ainda não existem. Até lá, o cadastro é feito pelo
          Supabase Studio.
        </p>
        <ul className="mt-3 grid gap-2 text-sm text-text-muted sm:grid-cols-2">
          <li>· Experiências, datas e itinerário</li>
          <li>· Destinos e países</li>
          <li>· Guias de viagem e itens de bagagem</li>
          <li>· Leads e conversas do Concierge</li>
          <li>· Blog e depoimentos</li>
          <li>· Equipe e permissões</li>
        </ul>
      </section>
    </div>
  );
}
