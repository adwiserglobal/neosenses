/**
 * /admin/leads — quem levantou a mão.
 *
 * Reúne o que chegou pelo formulário, pelo Concierge e pelo montador de
 * roteiro. Até existir esta tela, tudo isso ficava só no banco: um lead que
 * ninguém vê é um lead perdido.
 *
 * Só admin: é a tela com mais dado pessoal do painel.
 */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { exigirPapel } from "@/lib/actions/auth";
import { SituacaoDoLead } from "./SituacaoDoLead";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads", robots: { index: false } };

const ORIGEM: Record<string, string> = {
  website: "Site",
  concierge: "Concierge",
  journey_builder: "Roteiro",
  whatsapp: "WhatsApp",
  referral: "Indicação",
  social: "Redes",
  other: "Outro",
};

function quando(iso: string): string {
  const agora = Date.now();
  const then = new Date(iso).getTime();
  const horas = Math.floor((agora - then) / 3_600_000);

  if (horas < 1) return "há minutos";
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `há ${dias}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function LeadsPage() {
  // Redundante com o layout de propósito: se um dia alguém mover esta página
  // para fora de /admin, a checagem vem junto.
  await exigirPapel(["admin"]);

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

  const [leads, capturas, roteiros] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, email, phone, message, source, status, created_at, travelers_count, experience_id")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("ai_lead_captures")
      .select("id, name, email, phone, source_page, raw_context, created_at, conversation_id")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("ai_journeys")
      .select("id, access_token, summary, created_at, input")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const listaLeads = leads.data ?? [];
  const listaCapturas = capturas.data ?? [];
  const listaRoteiros = roteiros.data ?? [];

  // Contato que apareceu no chat e ainda não virou lead no CRM.
  const emailsConhecidos = new Set(listaLeads.map((l) => l.email?.toLowerCase()).filter(Boolean));
  const capturasNovas = listaCapturas.filter(
    (c) => !c.email || !emailsConhecidos.has(c.email.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-2xl text-primary-700">Leads</h1>
        <p className="mt-1 text-sm text-text-muted">
          {listaLeads.length} no CRM · {capturasNovas.length} vindos do Concierge ainda sem cadastro ·{" "}
          {listaRoteiros.length} roteiros montados
        </p>
      </header>

      <section>
        <h2 className="mb-4 font-heading text-lg text-primary-700">Contatos</h2>

        {listaLeads.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-text-muted">
            Nenhum contato ainda. Eles chegam pelo formulário de contato, pelo Concierge e pelas
            páginas de experiência.
          </p>
        ) : (
          <ul className="space-y-3">
            {listaLeads.map((lead) => (
              <li key={lead.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-warm-gray px-2.5 py-0.5 text-[11px] font-medium text-text-muted">
                        {ORIGEM[lead.source] ?? lead.source}
                      </span>
                      <span className="text-xs text-text-muted">{quando(lead.created_at)}</span>
                    </div>

                    <p className="mt-1.5 font-medium text-primary-700">{lead.name || "(sem nome)"}</p>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="underline underline-offset-2 hover:text-primary-700">
                          {lead.email}
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-primary-700"
                        >
                          {lead.phone}
                        </a>
                      )}
                      {lead.travelers_count && <span>{lead.travelers_count} viajante(s)</span>}
                    </div>

                    {lead.message && (
                      <p className="mt-2 rounded-lg bg-warm-gray/40 px-3 py-2 text-sm text-text-primary">
                        {lead.message}
                      </p>
                    )}
                  </div>

                  <SituacaoDoLead id={lead.id} situacaoAtual={lead.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {capturasNovas.length > 0 && (
        <section>
          <h2 className="mb-1 font-heading text-lg text-primary-700">Deixaram contato no Concierge</h2>
          <p className="mb-4 text-sm text-text-muted">
            Escreveram e-mail ou telefone durante a conversa e ainda não estão na lista acima.
          </p>
          <ul className="space-y-3">
            {capturasNovas.map((c) => (
              <li key={c.id} className="rounded-xl border border-secondary-200 bg-secondary-50/40 p-5">
                <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                  <span>{quando(c.created_at)}</span>
                  {c.source_page && <span>em {c.source_page}</span>}
                </div>
                <p className="mt-1 font-medium text-primary-700">{c.name || "(sem nome)"}</p>
                <div className="mt-0.5 flex flex-wrap gap-x-4 text-sm text-text-muted">
                  {c.email && <span>{c.email}</span>}
                  {c.phone && <span>{c.phone}</span>}
                </div>
                {c.raw_context && (
                  <p className="mt-2 text-sm italic text-text-muted">“{c.raw_context}”</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {listaRoteiros.length > 0 && (
        <section>
          <h2 className="mb-1 font-heading text-lg text-primary-700">Roteiros montados</h2>
          <p className="mb-4 text-sm text-text-muted">
            Quem usou o montador demonstrou intenção clara. O roteiro mostra o que a pessoa procura.
          </p>
          <ul className="space-y-3">
            {listaRoteiros.map((r) => {
              const entrada = (r.input ?? {}) as Record<string, unknown>;
              return (
                <li key={r.id} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-text-muted">{quando(r.created_at)}</span>
                    <Link
                      href={`/roteiro/${r.access_token}`}
                      target="_blank"
                      className="text-xs text-secondary-600 underline underline-offset-4"
                    >
                      Ver roteiro ↗
                    </Link>
                  </div>
                  {r.summary && <p className="mt-1.5 text-sm text-text-primary">{r.summary}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-muted">
                    {typeof entrada.dias === "string" && (
                      <span className="rounded bg-warm-gray px-2 py-0.5">{entrada.dias.replace(/_/g, " ")}</span>
                    )}
                    {typeof entrada.motivo === "string" && (
                      <span className="rounded bg-warm-gray px-2 py-0.5">{entrada.motivo}</span>
                    )}
                    {Array.isArray(entrada.interesses) &&
                      (entrada.interesses as string[]).map((i) => (
                        <span key={i} className="rounded bg-warm-gray px-2 py-0.5">
                          {i.replace(/_/g, " ")}
                        </span>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
