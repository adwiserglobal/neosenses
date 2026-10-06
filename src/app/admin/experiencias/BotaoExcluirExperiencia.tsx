"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { excluirExperiencia } from "@/lib/actions/admin";

interface Props {
  id: string;
  titulo: string;
}

export function BotaoExcluirExperiencia({ id, titulo }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function excluir() {
    const confirmado = window.confirm(
      `Excluir definitivamente “${titulo}”?\n\nEssa ação remove a experiência e os conteúdos vinculados que podem ser apagados em cascata. Não é possível desfazer.`
    );

    if (!confirmado) return;

    setErro(null);
    iniciar(async () => {
      const resposta = await excluirExperiencia(id);

      if (!resposta.success) {
        setErro(resposta.error ?? "Não foi possível excluir.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={excluir}
        disabled={pendente}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2.5 text-xs font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {pendente ? "Excluindo…" : "Excluir"}
      </button>

      {erro && (
        <div
          role="alert"
          className="absolute bottom-full right-0 z-30 mb-2 w-72 rounded-xl border border-red-200 bg-white p-3 text-xs leading-relaxed text-red-700 shadow-xl"
        >
          {erro}
        </div>
      )}
    </div>
  );
}
