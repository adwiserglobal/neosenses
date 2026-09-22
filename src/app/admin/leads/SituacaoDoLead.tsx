"use client";

/**
 * Situação do lead no funil, alterável direto na lista.
 * Sem isso a equipe não tem como marcar quem já foi atendido.
 */

import { useState, useTransition } from "react";
import { alterarSituacaoDoLead } from "@/lib/actions/admin";

const SITUACOES = [
  { valor: "new", rotulo: "Novo" },
  { valor: "contacted", rotulo: "Contatado" },
  { valor: "qualified", rotulo: "Qualificado" },
  { valor: "converted", rotulo: "Fechou" },
  { valor: "lost", rotulo: "Perdido" },
];

export function SituacaoDoLead({ id, situacaoAtual }: { id: string; situacaoAtual: string }) {
  const [pendente, iniciar] = useTransition();
  const [situacao, setSituacao] = useState(situacaoAtual);
  const [erro, setErro] = useState(false);

  function alterar(nova: string) {
    const anterior = situacao;
    setSituacao(nova); // otimista: a lista não pisca a cada troca
    setErro(false);

    iniciar(async () => {
      const r = await alterarSituacaoDoLead(id, nova);
      if (!r.success) {
        setSituacao(anterior); // desfaz e avisa, em vez de mentir que salvou
        setErro(true);
      }
    });
  }

  return (
    <div className="shrink-0 text-right">
      <label htmlFor={`situacao-${id}`} className="sr-only">
        Situação do lead
      </label>
      <select
        id={`situacao-${id}`}
        value={situacao}
        onChange={(e) => alterar(e.target.value)}
        disabled={pendente}
        className={`rounded-lg border px-3 py-2 text-xs transition disabled:opacity-60 ${
          situacao === "converted"
            ? "border-success/40 bg-success/5 text-success"
            : situacao === "lost"
            ? "border-border bg-warm-gray text-text-muted"
            : "border-border bg-surface text-text-primary"
        }`}
      >
        {SITUACOES.map((s) => (
          <option key={s.valor} value={s.valor}>
            {s.rotulo}
          </option>
        ))}
      </select>
      {erro && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          não salvou
        </p>
      )}
    </div>
  );
}
