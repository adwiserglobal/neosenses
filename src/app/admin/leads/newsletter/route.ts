/**
 * GET /admin/leads/newsletter — a lista de e-mails em CSV, para importar em
 * ferramenta de envio. Só admin: é dado pessoal.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { exigirPapel } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

/** Aspas duplas e, contra "injeção de fórmula" no Excel, prefixo nos que começam com = + - @. */
function celula(valor: string | null | undefined): string {
  let v = (valor ?? "").replace(/"/g, '""');
  if (/^[=+\-@]/.test(v)) v = `'${v}`;
  return `"${v}"`;
}

export async function GET() {
  await exigirPapel(["admin"]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) return new Response("Supabase não configurado.", { status: 503 });

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email, name, source, subscribed_at, is_active")
    .order("subscribed_at", { ascending: false })
    .limit(20_000);

  if (error) return new Response("Não foi possível ler a lista.", { status: 502 });

  const linhas = [
    "email,nome,origem,inscrito_em,ativo",
    ...(data ?? []).map((s) =>
      [celula(s.email), celula(s.name), celula(s.source), celula(s.subscribed_at), s.is_active ? "sim" : "nao"].join(",")
    ),
  ];

  return new Response("﻿" + linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="newsletter-neosenses.csv"',
      "Cache-Control": "no-store",
    },
  });
}
