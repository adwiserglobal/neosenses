/**
 * /admin/destinos/[id] — edição.
 *
 * O assistente continua disponível: serve para completar destino antigo que
 * entrou pela metade, sem precisar apagar e cadastrar de novo.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { textoI18n } from "@/types/models";
import { FormularioDestino } from "@/components/admin/FormularioDestino";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar destino", robots: { index: false } };

export default async function EditarDestino({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return <p className="text-sm text-red-700">Sem conexão com o banco.</p>;
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("destinations")
    .select("*, country:countries(name, code)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const d = data as unknown as {
    id: string;
    name: unknown;
    description: unknown;
    hero_image: string | null;
    latitude: number | null;
    longitude: number | null;
    altitude_m: number | null;
    timezone: string | null;
    climate: Record<string, unknown> | null;
    is_active: boolean;
    country: { name: unknown; code: string | null } | null;
  };

  const clima = (d.climate ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : null);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/destinos" className="text-sm text-text-muted hover:text-primary-700">
          ← Destinos
        </Link>
        <h1 className="mt-2 font-heading text-2xl text-primary-700">
          {textoI18n(d.name) || "Destino"}
        </h1>
      </header>

      <FormularioDestino
        inicial={{
          id: d.id,
          nome: textoI18n(d.name),
          pais: textoI18n(d.country?.name),
          paisCodigo: d.country?.code ?? undefined,
          descricao: textoI18n(d.description),
          heroImage: d.hero_image,
          latitude: d.latitude,
          longitude: d.longitude,
          altitudeM: d.altitude_m,
          timezone: d.timezone,
          climaTipo: typeof clima.tipo === "string" ? clima.tipo : null,
          tempMinC: num(clima.temp_min_c),
          tempMaxC: num(clima.temp_max_c),
          estacaoChuvosa: typeof clima.estacao_chuvosa === "string" ? clima.estacao_chuvosa : null,
          ativo: d.is_active,
        }}
      />
    </div>
  );
}
