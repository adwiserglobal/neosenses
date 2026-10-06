/**
 * /admin — visão geral da operação.
 */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowUpRight,
  BookOpenText,
  Compass,
  FileClock,
  MapPinned,
  MessageCircleMore,
  PackageOpen,
  Users,
} from "lucide-react";
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
      erro: "Não foi possível carregar os indicadores. Verifique as variáveis do ambiente de produção.",
    };
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });
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

const ICONES: Record<string, React.ElementType> = {
  "Experiências publicadas": Compass,
  Rascunhos: FileClock,
  Destinos: MapPinned,
  "Guias de viagem": BookOpenText,
  "Itens de bagagem": PackageOpen,
  "Conversas (7 dias)": MessageCircleMore,
  "Conversas no total": MessageCircleMore,
  Leads: Users,
};

function Cartao({ dados, destaque = false }: { dados: Contagem; destaque?: boolean }) {
  const Icone = ICONES[dados.rotulo] ?? Compass;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 ${
        destaque
          ? "border-[#b98dbe]/35 bg-[#551360] text-white shadow-[0_18px_45px_rgba(76,18,86,0.13)]"
          : "border-[#ded1bf] bg-[#fffaf3] shadow-[0_12px_32px_rgba(72,45,31,0.05)]"
      }`}
    >
      {destaque && (
        <div aria-hidden="true" className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#d6a72d]/18 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            destaque ? "bg-white/10 text-[#f0cf79]" : "bg-[#efe3c8] text-[#896116]"
          }`}
        >
          <Icone className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <p className={`text-3xl font-semibold tabular-nums ${destaque ? "text-white" : "text-[#4b174e]"}`}>
          {dados.valor === null ? "—" : dados.valor}
        </p>
      </div>
      <p className={`relative mt-5 text-sm font-medium ${destaque ? "text-white/76" : "text-[#6f5e54]"}`}>
        {dados.rotulo}
      </p>
      {dados.observacao && <p className="relative mt-1 text-xs text-[#f0cf79]">{dados.observacao}</p>}
    </div>
  );
}

export default async function PaginaAdmin() {
  const { conteudo, movimento, erro } = await contar();

  return (
    <div className="space-y-9">
      <section className="relative overflow-hidden rounded-[30px] bg-[#4b1058] px-7 py-8 text-white shadow-[0_24px_70px_rgba(64,20,72,0.16)] md:px-9 md:py-10">
        <div aria-hidden="true" className="absolute inset-0 [background:radial-gradient(circle_at_92%_12%,rgba(225,172,48,0.26),transparent_29%),radial-gradient(circle_at_6%_100%,rgba(121,33,136,0.9),transparent_38%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f2cd70]">
              Visão geral
            </p>
            <h1 className="mt-3 max-w-xl font-heading text-3xl leading-tight md:text-4xl">
              O que está acontecendo na NeoSenses agora
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
              Conteúdo publicado, conversas e oportunidades comerciais em um só lugar.
            </p>
          </div>
          <Link
            href="/admin/experiencias/nova"
            className="inline-flex items-center gap-2 rounded-xl bg-[#e1ad34] px-5 py-3 text-sm font-semibold text-[#39270d] shadow-sm transition hover:bg-[#ecc153]"
          >
            Nova experiência
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
          {erro}
        </div>
      ) : (
        <>
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9d721a]">Conteúdo</p>
                <h2 className="mt-1 font-heading text-2xl text-[#4b174e]">Catálogo e publicação</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {conteudo.map((c, index) => (
                <Cartao key={c.rotulo} dados={c} destaque={index === 0} />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9d721a]">Relacionamento</p>
              <h2 className="mt-1 font-heading text-2xl text-[#4b174e]">Movimento recente</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {movimento.map((c, index) => (
                <Cartao key={c.rotulo} dados={c} destaque={index === 0} />
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9d721a]">Atalhos</p>
          <h2 className="mt-1 font-heading text-2xl text-[#4b174e]">Ações rápidas</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/admin/experiencias", titulo: "Gerenciar jornadas", texto: "Publicar, editar e revisar experiências.", Icone: Compass },
            { href: "/admin/blog", titulo: "Produzir conteúdo", texto: "Criar e revisar artigos do blog.", Icone: BookOpenText },
            { href: "/admin/leads", titulo: "Ver oportunidades", texto: "Acompanhar leads, conversas e roteiros.", Icone: Users },
            { href: "/admin/configuracoes", titulo: "Dados da empresa", texto: "Atualizar informações institucionais.", Icone: MapPinned },
          ].map(({ href, titulo, texto, Icone }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-[#ddd0bd] bg-[#fffaf3] p-5 shadow-[0_12px_32px_rgba(72,45,31,0.05)] transition hover:-translate-y-0.5 hover:border-[#b99b6b]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#efe3c8] text-[#896116] transition group-hover:bg-[#4d145b] group-hover:text-white">
                <Icone className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-heading text-lg text-[#4b174e]">{titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#77665b]">{texto}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#7f5c17]">
                Abrir <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
