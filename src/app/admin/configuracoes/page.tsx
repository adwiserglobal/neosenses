/**
 * /admin/configuracoes — dados cadastrais e públicos da empresa.
 */

import { createClient } from "@supabase/supabase-js";
import { Building2, Eye, ShieldCheck } from "lucide-react";
import type { Database } from "@/types/database";
import { exigirPapel } from "@/lib/actions/auth";
import { FormularioEmpresa } from "@/components/admin/FormularioEmpresa";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações", robots: { index: false } };

const CHAVES = [
  "empresa.razao_social",
  "empresa.cnpj",
  "empresa.cadastur",
  "empresa.endereco",
  "empresa.fundacao",
  "site.email",
  "site.whatsapp",
];

export default async function ConfiguracoesPage() {
  await exigirPapel(["admin"]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
        Não foi possível carregar as configurações agora. Verifique as variáveis do ambiente de produção.
      </div>
    );
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });
  const { data } = await supabase.from("settings").select("key, value");

  const atuais: Record<string, string> = {};
  for (const s of data ?? []) {
    atuais[s.key] = typeof s.value === "string" ? s.value : String(s.value ?? "");
  }

  const preenchidos = CHAVES.filter((item) => atuais[item]?.trim()).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="overflow-hidden rounded-[28px] bg-[#4b1058] text-white shadow-[0_24px_70px_rgba(64,20,72,0.18)]">
        <div className="relative grid gap-8 px-7 py-8 md:grid-cols-[1fr_auto] md:items-end md:px-9 md:py-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-90 [background:radial-gradient(circle_at_92%_10%,rgba(230,179,57,0.26),transparent_29%),radial-gradient(circle_at_8%_100%,rgba(123,37,137,0.8),transparent_40%)]"
          />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f2ce72]">
              Configurações do site
            </p>
            <h1 className="mt-3 max-w-2xl font-heading text-3xl leading-tight md:text-4xl">
              Dados institucionais da NeoSenses
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68 md:text-base">
              Centralize as informações que aparecem no rodapé, nos termos e nas páginas institucionais.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">Preenchimento</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{preenchidos}/{CHAVES.length}</p>
            <div className="mt-3 h-1.5 w-36 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-[#e2ae35]"
                style={{ width: `${Math.round((preenchidos / CHAVES.length) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            Icone: Building2,
            titulo: "Identidade legal",
            texto: "Razão social, CNPJ e Cadastur usados na comunicação institucional.",
          },
          {
            Icone: Eye,
            titulo: "Informação pública",
            texto: "Somente os campos preenchidos aparecem nas páginas do site.",
          },
          {
            Icone: ShieldCheck,
            titulo: "Acesso restrito",
            texto: "Esta área é exclusiva para administradores da operação.",
          },
        ].map(({ Icone, titulo, texto }) => (
          <div
            key={titulo}
            className="rounded-2xl border border-[#dfd2c0] bg-[#fffaf2] p-5 shadow-[0_12px_35px_rgba(72,45,31,0.05)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#efe3c8] text-[#8a6418]">
              <Icone className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-heading text-lg text-[#4c174f]">{titulo}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#76665c]">{texto}</p>
          </div>
        ))}
      </section>

      <FormularioEmpresa atuais={atuais} />
    </div>
  );
}
