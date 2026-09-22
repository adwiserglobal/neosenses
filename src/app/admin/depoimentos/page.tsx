/**
 * /admin/depoimentos — prova social.
 *
 * O site não exibe um depoimento, um rosto nem um nome. Numa compra de
 * quinze a quarenta mil reais, de uma empresa que a pessoa não conhece, para
 * viajar com desconhecidos, é o que mais falta — mais que qualquer ajuste de
 * página.
 *
 * A home e a página da experiência já sabem exibir. Faltava por onde
 * cadastrar.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Experience, I18nField, Testimonial } from "@/types/models";
import { t } from "@/lib/utils";
import { Depoimentos } from "@/components/admin/Depoimentos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Depoimentos", robots: { index: false } };

export default async function DepoimentosPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return <p className="text-sm text-red-700">Sem conexão com o banco.</p>;
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });

  const [depoimentos, experiencias] = await Promise.all([
    supabase.from("testimonials").select("*").order("sort_order").order("created_at", { ascending: false }),
    supabase.from("experiences").select("id, title").eq("status", "published").order("sort_order"),
  ]);

  const opcoes = (experiencias.data ?? []).map((e) => ({
    id: (e as Experience).id,
    titulo: t((e as Experience).title as I18nField, "pt"),
  }));

  const lista = (depoimentos.data ?? []) as Testimonial[];
  const publicados = lista.filter((d) => d.status === "published").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl text-primary-700">Depoimentos</h1>
        <p className="mt-1 text-sm text-text-muted">
          {lista.length} cadastrado{lista.length === 1 ? "" : "s"} · {publicados} no ar
        </p>
      </header>

      {publicados === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-medium">Nenhum depoimento no ar</p>
          <p className="mt-1">
            O visitante decide gastar vinte mil reais sem ver uma única pessoa que já foi. É a
            ausência mais cara do site — mais do que qualquer detalhe de página.
          </p>
        </div>
      )}

      <Depoimentos depoimentos={lista} experiencias={opcoes} />
    </div>
  );
}
