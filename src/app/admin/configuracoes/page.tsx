/**
 * /admin/configuracoes — dados cadastrais da empresa.
 *
 * Existem porque a página de Termos exibia "CNPJ: XX.XXX.XXX/0001-XX" fixo no
 * código. Documento de placeholder num contrato de adesão é pior que
 * documento ausente: passa a impressão de contrato real sem parte
 * identificada.
 *
 * Enquanto um campo estiver vazio, as páginas omitem a linha em vez de
 * mostrar espaço em branco ou texto inventado.
 */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { exigirPapel } from "@/lib/actions/auth";
import { FormularioEmpresa } from "@/components/admin/FormularioEmpresa";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações", robots: { index: false } };

export default async function ConfiguracoesPage() {
  await exigirPapel(["admin"]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return <p className="text-sm text-red-700">Sem conexão com o banco.</p>;
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });
  const { data } = await supabase.from("settings").select("key, value");

  const atuais: Record<string, string> = {};
  for (const s of data ?? []) {
    atuais[s.key] = typeof s.value === "string" ? s.value : String(s.value ?? "");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl text-primary-700">Dados da empresa</h1>
        <p className="mt-1 text-sm text-text-muted">
          Aparecem no rodapé, nos Termos de Uso e na página Sobre. Campo em branco é omitido —
          nada é inventado no lugar.
        </p>
      </header>

      <FormularioEmpresa atuais={atuais} />

      {/* O diagnóstico do Supabase mora aqui desde que saiu do menu: é
          configuração de infraestrutura, não trabalho de quem cadastra
          conteúdo. A rota continua a mesma — só mudou de porta de entrada. */}
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-heading text-lg text-primary-700">Infraestrutura</h2>
        <p className="mt-1 text-sm text-text-muted">
          Conexão com o banco, migrations aplicadas, RLS e integração de IA. É esta página
          que diz o que falta configurar quando algo parece salvar e não salva.
        </p>
        <Link
          href="/admin/supabase"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:border-secondary-500 hover:text-secondary-500"
        >
          Abrir diagnóstico do Supabase →
        </Link>
      </section>
    </div>
  );
}
