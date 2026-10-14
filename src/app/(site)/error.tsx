"use client";

import Link from "next/link";
import { useEffect } from "react";
import { linkWhatsApp } from "@/lib/utils";

/**
 * Rede de segurança das páginas públicas. Sem este arquivo, qualquer exceção
 * numa página mostrava a tela de erro genérica do Next, sem saída para o
 * visitante.
 */
export default function ErroDoSite({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] erro de renderização:", error.digest ?? error.message);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-32 text-center">
      <h1 className="mb-4 font-heading text-4xl text-primary-700">Algo não saiu como esperado</h1>
      <p className="mb-8 max-w-md text-text-muted">
        Não conseguimos carregar esta página agora. Tente de novo; se continuar, fale com a gente.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={reset} className="btn-primario">
          Tentar de novo
        </button>
        <Link href="/" className="btn-secundario">
          Voltar ao início
        </Link>
        <a href={linkWhatsApp()} target="_blank" rel="noopener noreferrer" className="btn-secundario">
          Falar no WhatsApp
        </a>
      </div>
    </section>
  );
}
