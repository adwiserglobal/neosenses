/**
 * /admin/experiencias/[id] — edição.
 *
 * Cadastro e saídas na mesma tela: quem publica uma experiência precisa das
 * duas coisas, e separar em telas faz alguém publicar sem data.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  Category,
  DestinationWithCountry,
  ExperienceDate,
  ExperienceWithRelations,
  I18nField,
} from "@/types/models";
import { t } from "@/lib/utils";
import { FormularioExperiencia } from "@/components/admin/FormularioExperiencia";
import { Datas } from "@/components/admin/Datas";

export const dynamic = "force-dynamic";

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Editar experiência", robots: { index: false } };

export default async function EditarExperiencia({ params }: Props) {
  const { id } = await params;
  if (!RE_UUID.test(id)) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return <p className="text-sm text-red-700">Sem conexão com o banco.</p>;
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });

  const [experiencia, categorias, destinos, datas] = await Promise.all([
    supabase.from("experiences").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("destinations").select("*, country:countries(*)").eq("is_active", true).order("sort_order"),
    supabase.from("experience_dates").select("*").eq("experience_id", id).order("start_date"),
  ]);

  if (!experiencia.data) notFound();

  const registro = experiencia.data as unknown as ExperienceWithRelations;
  const titulo = t(registro.title as I18nField, "pt") || "(sem título)";
  const slug = t(registro.slug as I18nField, "pt");

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <Link href="/admin/experiencias" className="text-sm text-text-muted hover:text-primary-700">
          ← Experiências
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl text-primary-700">{titulo}</h1>
          {registro.status === "published" && slug && (
            <Link
              href={`/experiencias/${slug}`}
              target="_blank"
              className="text-sm text-secondary-600 underline underline-offset-4"
            >
              Ver no site ↗
            </Link>
          )}
        </div>
      </header>

      <FormularioExperiencia
        experiencia={registro}
        categorias={(categorias.data ?? []) as Category[]}
        destinos={(destinos.data ?? []) as unknown as DestinationWithCountry[]}
      />

      <div className="border-t border-border pt-10">
        <Datas experienceId={id} datas={(datas.data ?? []) as ExperienceDate[]} />
      </div>
    </div>
  );
}
