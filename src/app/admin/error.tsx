"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Erro numa página do painel: mensagem clara e saída, em vez da tela genérica do Next. */
export default function ErroDoPainel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] erro de renderização:", error.digest ?? error.message);
  }, [error]);

  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8">
      <h1 className="font-heading text-2xl text-red-900">Não foi possível carregar esta página</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-red-800">
        Pode ser uma falha passageira de conexão com o banco ou uma configuração faltando no
        Supabase. Tente de novo; se persistir, avise quem cuida do sistema
        {error.digest ? ` (código ${error.digest})` : ""}.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800">
          Tentar de novo
        </button>
        <Link href="/admin" className="rounded-lg border border-primary-700 px-5 py-2.5 text-sm font-semibold text-primary-700">
          Voltar à visão geral
        </Link>
      </div>
    </div>
  );
}
