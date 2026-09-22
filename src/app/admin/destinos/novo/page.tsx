/**
 * /admin/destinos/novo — cadastro com assistente.
 *
 * A IA roda aqui, uma vez, com alguém esperando na frente da tela. O site
 * público nunca chama IA para mostrar um destino: ele lê o que foi gravado.
 */

import Link from "next/link";
import { FormularioDestino } from "@/components/admin/FormularioDestino";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo destino", robots: { index: false } };

export default function NovoDestino() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/destinos" className="text-sm text-text-muted hover:text-primary-700">
          ← Destinos
        </Link>
        <h1 className="mt-2 font-heading text-2xl text-primary-700">Novo destino</h1>
        <p className="mt-1 text-sm text-text-muted">
          O que você preencher aqui é o que o Concierge sabe sobre o lugar.
          Altitude e clima são o que ele usa para falar de preparação.
        </p>
      </header>

      <FormularioDestino />
    </div>
  );
}
