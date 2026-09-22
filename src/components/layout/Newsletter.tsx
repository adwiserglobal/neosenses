"use client";

/**
 * Inscrição na newsletter, no rodapé.
 *
 * O formulário anterior fazia POST para /api/newsletter, rota que nunca
 * existiu: quem se inscrevia caía num 404 em página cheia, saindo do site. E
 * o e-mail não era gravado em lugar nenhum.
 *
 * Agora chama a server action, que grava com service_role e reativa quem já
 * havia se descadastrado.
 */

import { useState, useTransition } from "react";
import { assinarNewsletter } from "@/lib/actions/forms";

export function Newsletter() {
  const [pendente, iniciar] = useTransition();
  const [estado, setEstado] = useState<"parado" | "ok">("parado");
  const [erro, setErro] = useState<string | null>(null);

  function enviar(dados: FormData) {
    setErro(null);
    iniciar(async () => {
      const r = await assinarNewsletter(
        String(dados.get("email") ?? ""),
        undefined,
        "rodape"
      );
      if (!r.success) {
        setErro(r.error ?? "Não foi possível inscrever agora.");
        return;
      }
      setEstado("ok");
    });
  }

  if (estado === "ok") {
    return (
      <p role="status" className="text-sm font-medium text-success">
        Pronto! Você vai receber nossas novidades.
      </p>
    );
  }

  return (
    <form action={enviar} className="w-full max-w-md">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Seu e-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          placeholder="Seu melhor e-mail"
          required
          maxLength={160}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? "newsletter-erro" : undefined}
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm transition-colors focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20"
        />
        <button
          type="submit"
          disabled={pendente}
          className="whitespace-nowrap rounded-lg bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-800 disabled:opacity-60"
        >
          {pendente ? "Enviando…" : "Inscrever-se"}
        </button>
      </div>
      {erro && (
        <p id="newsletter-erro" role="alert" className="mt-2 text-sm text-red-600">
          {erro}
        </p>
      )}
    </form>
  );
}
