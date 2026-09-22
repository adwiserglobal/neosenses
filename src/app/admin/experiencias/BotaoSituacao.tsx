"use client";

/**
 * Publicar e despublicar direto da lista.
 *
 * Publicar com pendência pede confirmação: o texto diz o que falta, porque
 * "tem certeza?" sem contexto é sempre respondido com sim.
 */

import { useState, useTransition } from "react";
import { alterarSituacao } from "@/lib/actions/admin";
import type { ExperienceStatus } from "@/types/models";

interface Props {
  id: string;
  situacaoAtual: ExperienceStatus;
  temPendencia: boolean;
}

export function BotaoSituacao({ id, situacaoAtual, temPendencia }: Props) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const noAr = situacaoAtual === "published";
  const proxima: ExperienceStatus = noAr ? "draft" : "published";

  function acionar() {
    if (!noAr && temPendencia) {
      const segue = window.confirm(
        "Esta experiência tem informação faltando (veja o aviso na linha).\n\n" +
          "Publicar assim deixa a página incompleta no ar e o Concierge passa a recomendá-la.\n\n" +
          "Publicar mesmo assim?"
      );
      if (!segue) return;
    }

    setErro(null);
    iniciar(async () => {
      const r = await alterarSituacao(id, proxima);
      if (!r.success) setErro(r.error ?? "Não foi possível alterar.");
    });
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={acionar}
        disabled={pendente}
        className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
          noAr
            ? "border-border text-text-muted hover:border-amber-400 hover:text-amber-700"
            : "border-success/40 text-success hover:bg-success/5"
        }`}
      >
        {pendente ? "…" : noAr ? "Despublicar" : "Publicar"}
      </button>
      {erro && (
        <span role="alert" className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-red-600">
          {erro}
        </span>
      )}
    </span>
  );
}
