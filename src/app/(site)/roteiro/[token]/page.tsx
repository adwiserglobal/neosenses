/**
 * /roteiro/[token] — abre um roteiro salvo.
 *
 * O token é a credencial: aleatório, único e conhecido só por quem recebeu o
 * link. A leitura acontece no servidor com a chave de serviço, e o token é
 * conferido aqui — a tabela não é legível pela chave pública.
 *
 * `noindex` de propósito: são páginas pessoais, não conteúdo de site.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { conferirRoteiro, type Roteiro } from "@/lib/journey/roteiro";
import { RoteiroPronto } from "@/components/journey/RoteiroPronto";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seu roteiro",
  robots: { index: false, follow: false },
};

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  params: Promise<{ token: string }>;
}

async function buscarRoteiro(token: string): Promise<Roteiro | null> {
  // Formato errado nem chega ao banco.
  if (!RE_UUID.test(token)) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    console.error("[roteiro] service_role ausente — não há como ler o roteiro salvo");
    return null;
  }

  const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("ai_journeys")
    .select("itinerary")
    .eq("access_token", token)
    .maybeSingle();

  if (error || !data) return null;

  // Reconfere contra o catálogo de HOJE, não contra o do dia da geração.
  // Assim uma experiência despublicada desde então deixa de virar link — o
  // roteiro continua legível, mas não aponta para uma página que sumiu.
  const { data: publicadas } = await supabase
    .from("experiences")
    .select("id, title, slug, destination:destinations(name, country:countries(name))")
    .eq("status", "published");

  const i18n = (campo: unknown): string => {
    if (!campo) return "";
    if (typeof campo === "string") return campo;
    const o = campo as Record<string, string>;
    return o.pt || o.en || Object.values(o).find(Boolean) || "";
  };

  const catalogo = (publicadas ?? []).map((e) => {
    const destino = e.destination as { name: unknown; country: { name: unknown } | null } | null;
    return {
      id: e.id,
      titulo: i18n(e.title),
      slug: i18n(e.slug),
      destino: destino ? i18n(destino.name) : "",
      pais: destino?.country ? i18n(destino.country.name) : "",
      dias: null,
      precoTexto: "",
      resumo: "",
      intencoes: [],
      dificuldade: "",
      proximasDatas: [],
    };
  });

  // Sem faixa de dias: o teto já foi checado quando o roteiro foi gerado, e
  // reaplicá-lo aqui só arriscaria descartar um roteiro que a pessoa já leu.
  return conferirRoteiro(data.itinerary, catalogo, null);
}

export default async function RoteiroSalvoPage({ params }: Props) {
  const { token } = await params;
  const roteiro = await buscarRoteiro(token);

  if (!roteiro) notFound();

  return (
    <section className="pb-20 pt-32 md:pt-40">
      <div className="container-content">
        <RoteiroPronto roteiro={roteiro} token={token} />

        <p className="mt-10 text-center text-sm text-text-muted">
          <Link href="/planejar" className="text-secondary-500 underline underline-offset-4">
            Montar outro roteiro
          </Link>
        </p>
      </div>
    </section>
  );
}
