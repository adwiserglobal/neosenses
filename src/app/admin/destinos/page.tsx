/**
 * /admin/destinos — lista.
 *
 * Mostra o que o Concierge tem para trabalhar em cada destino: sem altitude
 * nem clima, ele não sabe dizer o que levar nem o que esperar. A coluna
 * "Contexto" existe para isso ficar visível antes de alguém reclamar que a IA
 * responde raso.
 */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { textoI18n } from "@/types/models";

export const dynamic = "force-dynamic";
export const metadata = { title: "Destinos", robots: { index: false } };

interface Linha {
  id: string;
  name: unknown;
  slug: unknown;
  hero_image: string | null;
  altitude_m: number | null;
  climate: Record<string, unknown> | null;
  is_active: boolean;
  description: unknown;
  country: { name: unknown } | null;
}

export default async function AdminDestinos() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    return <p className="text-sm text-red-700">Sem conexão com o banco.</p>;
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("destinations")
    .select("*, country:countries(name)")
    .order("sort_order");

  const destinos = (data ?? []) as unknown as Linha[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-primary-700">Destinos</h1>
          <p className="mt-1 text-sm text-text-muted">
            {destinos.length === 0
              ? "Nenhum destino cadastrado."
              : `${destinos.length} destino${destinos.length > 1 ? "s" : ""}.`}
          </p>
        </div>
        <Link
          href="/admin/destinos/novo"
          className="rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary-700"
        >
          Novo destino
        </Link>
      </header>

      {destinos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-text-muted">
            Comece pelo nome do lugar — a IA monta o rascunho e você revisa.
          </p>
          <Link
            href="/admin/destinos/novo"
            className="mt-4 inline-block text-sm text-secondary-700 underline underline-offset-4"
          >
            Cadastrar o primeiro
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3">País</th>
                <th className="px-4 py-3">Contexto para a IA</th>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {destinos.map((d) => {
                const clima = (d.climate ?? {}) as Record<string, unknown>;
                const falta: string[] = [];
                if (d.altitude_m === null) falta.push("altitude");
                if (!clima.tipo) falta.push("clima");
                if (!textoI18n(d.description)) falta.push("descrição");

                return (
                  <tr key={d.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/destinos/${d.id}`}
                        className="font-medium text-primary-700 hover:underline"
                      >
                        {textoI18n(d.name) || "sem nome"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {textoI18n(d.country?.name) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {falta.length === 0 ? (
                        <span className="text-green-700">completo</span>
                      ) : (
                        <span className="text-amber-700">falta {falta.join(", ")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.hero_image ? (
                        <span className="text-text-muted">sim</span>
                      ) : (
                        <span className="text-amber-700">sem foto</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.is_active ? (
                        <span className="text-green-700">no site</span>
                      ) : (
                        <span className="text-text-muted">oculto</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
