"use client";

/**
 * Pedido de contato depois do roteiro pronto.
 *
 * Momento é tudo aqui: a pessoa acabou de responder oito perguntas sobre
 * momento de vida, orçamento e receios, e está lendo um caminho feito para
 * ela. É a maior intenção que o site consegue medir — e até agora ela ia
 * embora sem deixar nada.
 *
 * Pedir antes de mostrar o roteiro seria pedágio: a pessoa paga antes de ver
 * se vale. Aqui o roteiro já está na tela, e o que se oferece é guardá-lo.
 */

import { useState, useTransition } from "react";
import { criarLead } from "@/lib/actions/forms";
import type { Roteiro } from "@/lib/journey/roteiro";

interface Props {
  roteiro: Roteiro;
  token: string | null;
}

export function GuardarRoteiro({ roteiro, token }: Props) {
  const [pendente, iniciar] = useTransition();
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function enviar(dados: FormData) {
    setErro(null);

    iniciar(async () => {
      try {
        const experienciaCitada = roteiro.trechos.find((t) => t.experienceId)?.experienceId;

        const r = await criarLead({
          nome: String(dados.get("nome") ?? ""),
          email: String(dados.get("email") ?? ""),
          // O roteiro vai junto: a equipe abre a conversa sabendo o que a
          // pessoa procura, em vez de começar por "como posso ajudar?".
          mensagem:
            `Montou um roteiro no site: "${roteiro.titulo}".\n\n${roteiro.resumo}` +
            (token ? `\n\nRoteiro: /roteiro/${token}` : ""),
          experienciaId: experienciaCitada ?? undefined,
          origem: "journey_builder",
          armadilha: String(dados.get("site") ?? ""),
        });

        if (!r.success) {
          setErro(r.error ?? "Não foi possível guardar agora.");
          return;
        }
        setEnviado(true);
      } catch (err) {
        console.error("[roteiro] falha ao guardar:", err);
        setErro("Não consegui falar com o servidor. Copie o endereço acima para não perder.");
      }
    });
  }

  if (enviado) {
    return (
      <div role="status" className="rounded-xl border border-success/30 bg-success/5 p-5 text-center">
        <p className="font-medium text-primary-700">Roteiro guardado.</p>
        <p className="mt-1 text-sm text-text-muted">
          Enviamos o link para o seu e-mail e nossa equipe entra em contato para conversar sobre ele.
        </p>
      </div>
    );
  }

  return (
    <form action={enviar} className="rounded-xl border border-border bg-warm-white/60 p-5">
      <h3 className="font-heading text-base text-primary-700">Quer que a gente guarde este roteiro?</h3>
      <p className="mt-0.5 text-sm text-text-muted">
        Mandamos o link por e-mail e nossa equipe conversa com você sobre ele. Sem propaganda.
      </p>

      {erro && (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {erro}
        </p>
      )}

      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="roteiro-site">Não preencha</label>
        <input id="roteiro-site" name="site" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="roteiro-nome" className="sr-only">
            Seu nome
          </label>
          <input
            id="roteiro-nome"
            name="nome"
            placeholder="Seu nome"
            required
            maxLength={120}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
          />
        </div>
        <div>
          <label htmlFor="roteiro-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="roteiro-email"
            name="email"
            type="email"
            placeholder="Seu e-mail"
            required
            maxLength={160}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
          />
        </div>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-60"
        >
          {pendente ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
