"use client";

/**
 * Exibição do roteiro gerado.
 *
 * Trecho do catálogo e sugestão livre são visualmente distintos, e o segundo
 * traz um aviso explícito de que é ideia a combinar. Sem essa separação, a
 * pessoa lê tudo como oferta fechada e cobra da equipe um pacote que nunca
 * existiu.
 */

import Link from "next/link";
import { MapPin, ArrowRight, Sparkles, Check } from "lucide-react";
import { GuardarRoteiro } from "./GuardarRoteiro";
import type { Roteiro } from "@/lib/journey/roteiro";

interface Props {
  roteiro: Roteiro;
  /** Null quando não foi possível salvar — a página avisa. */
  token: string | null;
  aoRecomecar?: () => void;
}

function rotuloDeDias(de: number, ate: number): string {
  return de === ate ? `Dia ${de}` : `Dias ${de} a ${ate}`;
}

export function RoteiroPronto({ roteiro, token, aoRecomecar }: Props) {
  const totalDias = Math.max(...roteiro.trechos.map((t) => t.ate));
  const doCatalogo = roteiro.trechos.filter((t) => t.tipo === "neosenses");

  const mensagemWhatsApp = encodeURIComponent(
    `Olá! Montei um roteiro no site: "${roteiro.titulo}". Gostaria de conversar sobre ele.` +
      (token ? `\nLink: ${typeof window !== "undefined" ? window.location.origin : ""}/roteiro/${token}` : "")
  );

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10 text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-600">
          <Sparkles className="h-3 w-3" />
          Seu roteiro
        </p>
        <h1 className="font-heading text-3xl text-primary-700 md:text-4xl">{roteiro.titulo}</h1>
        <p className="mt-3 text-lg leading-relaxed text-text-muted">{roteiro.resumo}</p>
        <p className="mt-4 text-sm text-text-muted">
          {totalDias} dias
          {doCatalogo.length > 0 &&
            ` · ${doCatalogo.length} ${
              doCatalogo.length === 1 ? "experiência NeoSenses" : "experiências NeoSenses"
            }`}
        </p>
      </header>

      {roteiro.porQueCombina && (
        <section className="mb-10 rounded-2xl border border-secondary-200 bg-secondary-50/50 p-6">
          <h2 className="mb-2 font-heading text-lg text-primary-700">Por que este caminho</h2>
          <p className="leading-relaxed text-text-primary">{roteiro.porQueCombina}</p>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-5 font-heading text-xl text-primary-700">O caminho, dia a dia</h2>

        <ol className="space-y-4">
          {roteiro.trechos.map((trecho, i) => {
            const real = trecho.tipo === "neosenses";

            return (
              <li
                key={`${trecho.de}-${i}`}
                className={`rounded-xl border p-5 ${
                  real ? "border-secondary-300 bg-surface shadow-sm" : "border-border bg-warm-gray/30"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-600">
                    {rotuloDeDias(trecho.de, trecho.ate)}
                  </span>
                  {real ? (
                    <span className="rounded-full bg-primary-700 px-2.5 py-0.5 text-[11px] font-medium text-white">
                      Experiência NeoSenses
                    </span>
                  ) : (
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-text-muted">
                      Sugestão a combinar
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-lg text-primary-700">{trecho.titulo}</h3>

                {trecho.local && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                    <MapPin className="h-3 w-3" />
                    {trecho.local}
                  </p>
                )}

                {trecho.descricao && (
                  <p className="mt-2 leading-relaxed text-text-muted">{trecho.descricao}</p>
                )}

                {real && trecho.url && (
                  <Link
                    href={trecho.url}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-secondary-600 transition hover:gap-2"
                  >
                    Ver esta experiência
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        {roteiro.trechos.some((t) => t.tipo === "extensao") && (
          <p className="mt-4 rounded-lg bg-warm-gray/40 px-4 py-3 text-sm text-text-muted">
            Os trechos marcados como <strong className="font-medium">sugestão a combinar</strong> são
            ideias de dias livres — ainda não são pacotes com valor e data. A equipe monta esses
            trechos com você.
          </p>
        )}
      </section>

      {roteiro.aPreparar.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-heading text-xl text-primary-700">O que já dá para ir preparando</h2>
          <ul className="space-y-2">
            {roteiro.aPreparar.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-text-primary">
                <Check className="mt-1 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {roteiro.observacao && (
        <section className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-1 font-medium text-amber-900">A confirmar com a equipe</h2>
          <p className="text-sm text-amber-900">{roteiro.observacao}</p>
        </section>
      )}

      {/* Depois do roteiro, não antes: pedir contato como pedágio faz a
          pessoa pagar sem saber se vale. */}
      <div className="mb-6">
        <GuardarRoteiro roteiro={roteiro} token={token} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h2 className="font-heading text-xl text-primary-700">Gostou do caminho?</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">
          Este roteiro é um ponto de partida. Quem monta a viagem de verdade é a nossa equipe, com
          datas, valores e o que faz sentido para você.
        </p>

        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={`https://wa.me/5511947188319?text=${mensagemWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-whatsapp)] px-6 py-3.5 text-sm font-semibold text-[#0b2e18] shadow-sm transition-all hover:shadow-lg"
          >
            Conversar sobre este roteiro
          </a>
          <Link
            href="/contato"
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3.5 text-sm font-medium text-text-muted transition hover:border-secondary-500 hover:text-secondary-500"
          >
            Enviar por e-mail
          </Link>
        </div>

        {token ? (
          <p className="mt-5 border-t border-border pt-4 text-xs text-text-muted">
            Guarde este endereço para voltar quando quiser:
            <br />
            <code className="mt-1 inline-block break-all rounded bg-warm-gray px-2 py-1 font-mono text-[11px]">
              /roteiro/{token}
            </code>
          </p>
        ) : (
          <p className="mt-5 border-t border-border pt-4 text-xs text-amber-700">
            Não conseguimos salvar este roteiro. Copie o conteúdo antes de fechar a página.
          </p>
        )}

        {aoRecomecar && (
          <button
            type="button"
            onClick={aoRecomecar}
            className="mt-4 text-sm text-text-muted underline underline-offset-4 transition hover:text-primary-700"
          >
            Montar outro roteiro
          </button>
        )}
      </section>
    </div>
  );
}
