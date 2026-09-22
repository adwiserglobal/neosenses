/**
 * /admin/experiencias/nova — cadastro.
 *
 * Nasce como rascunho. Publicar é passo separado, na lista, com aviso do que
 * ainda falta.
 */

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Category, DestinationWithCountry } from "@/types/models";
import { FormularioExperiencia } from "@/components/admin/FormularioExperiencia";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nova experiência", robots: { index: false } };

export default async function NovaExperiencia() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    return <p className="text-sm text-red-700">Sem conexão com o banco.</p>;
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });

  const [categorias, destinos] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("destinations").select("*, country:countries(*)").eq("is_active", true).order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/experiencias" className="text-sm text-text-muted hover:text-primary-700">
          ← Experiências
        </Link>
        <h1 className="mt-2 font-heading text-2xl text-primary-700">Nova experiência</h1>
        <p className="mt-1 text-sm text-text-muted">
          Ela nasce como rascunho. Nada aparece no site até você publicar.
        </p>
      </header>

      <FormularioExperiencia
        categorias={(categorias.data ?? []) as Category[]}
        destinos={(destinos.data ?? []) as unknown as DestinationWithCountry[]}
      />
    </div>
  );
}
