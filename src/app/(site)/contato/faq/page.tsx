/**
 * Perguntas frequentes.
 *
 * O conteúdo saiu de um array neste arquivo para a tabela `faqs`. Motivo: o
 * Concierge lê essa tabela, então a resposta que mais destrava decisão — a
 * política de cancelamento — passa a ser dada no chat, no momento exato da
 * dúvida, em vez de só existir para quem achar esta página e rolar até o fim.
 *
 * Server Component: dado vem do banco, e a página ganha os dados estruturados
 * de FAQ que o buscador exibe em sanfona no resultado.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { listarPerguntasFrequentes } from "@/lib/dal/content";
import { JsonLd } from "@/components/seo/JsonLd";
import { perguntasFrequentes } from "@/lib/seo/dadosEstruturados";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";
import { Capa } from "@/components/templates/base";

export const metadata: Metadata = {
  title: "Perguntas Frequentes",
  description:
    "Como funcionam as jornadas, tamanho dos grupos, política de cancelamento e o que saber antes de viajar em grupo pela primeira vez.",
  alternates: { canonical: "/contato/faq" },
};

export const revalidate = 3600;

/** Ordem e rótulo das seções. Categoria fora desta lista cai em "Outras". */
const SECOES: Array<{ chave: string; titulo: string }> = [
  { chave: "geral", titulo: "Sobre a NeoSenses" },
  { chave: "viagem", titulo: "A viagem" },
  { chave: "grupo", titulo: "Viajar em grupo" },
  { chave: "praticas", titulo: "As práticas" },
  { chave: "cancelamento", titulo: "Pagamento e cancelamento" },
];

export default async function FAQPage() {
  const perguntas = await listarPerguntasFrequentes();

  const porCategoria = new Map<string, typeof perguntas>();
  for (const p of perguntas) {
    const chave = p.category ?? "outras";
    porCategoria.set(chave, [...(porCategoria.get(chave) ?? []), p]);
  }

  const secoes = [
    ...SECOES.filter((s) => porCategoria.has(s.chave)).map((s) => ({
      titulo: s.titulo,
      itens: porCategoria.get(s.chave)!,
    })),
    // Categoria criada no admin depois, sem lugar definido aqui, ainda aparece.
    ...[...porCategoria.entries()]
      .filter(([chave]) => !SECOES.some((s) => s.chave === chave))
      .map(([chave, itens]) => ({ titulo: chave === "outras" ? "Outras dúvidas" : chave, itens })),
  ];

  return (
    <>
      <JsonLd dados={perguntasFrequentes(perguntas)} />

      <Capa
        chapeu="Dúvidas"
        titulo="Perguntas frequentes"
        resumo="O que costuma ser perguntado antes de fechar uma jornada."
        imagem="/images/b2b/peru-titicaca.jpg"
        alinhamento="centro"
      />

      <section className="py-16 md:py-24">
        <div className="container-content">
          {perguntas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-text-muted">
              Ainda não há perguntas publicadas.{" "}
              <a
                href="https://wa.me/5511947188319"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-500 underline underline-offset-4"
              >
                Fale com a equipe
              </a>
              .
            </p>
          ) : (
            <div className="space-y-12">
              {secoes.map((secao) => (
                <div key={secao.titulo}>
                  <h2 className="mb-4 font-heading text-2xl text-primary-700">{secao.titulo}</h2>
                  <div className="space-y-3">
                    {secao.itens.map((p) => (
                      // <details> em vez de estado no React: funciona sem
                      // JavaScript, é acessível por padrão e o buscador lê o
                      // conteúdo mesmo fechado.
                      <details
                        key={p.id}
                        className="group rounded-xl border border-border bg-surface p-5"
                      >
                        <summary className="cursor-pointer list-none font-medium text-primary-700">
                          <span className="flex items-center justify-between gap-4">
                            {t(p.question as I18nField, "pt")}
                            <span
                              aria-hidden="true"
                              className="shrink-0 text-text-muted transition-transform group-open:rotate-180"
                            >
                              ⌄
                            </span>
                          </span>
                        </summary>
                        <p className="mt-3 leading-relaxed text-text-muted">
                          {t(p.answer as I18nField, "pt")}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-14 rounded-2xl border border-border bg-warm-gray/30 p-8 text-center">
            <h2 className="font-heading text-xl text-primary-700">Ficou alguma dúvida?</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">
              O Concierge responde aqui mesmo no site, e nossa equipe fala com você pelo WhatsApp.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="https://wa.me/5511947188319"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-whatsapp)] px-6 py-3 text-sm font-semibold text-[#0b2e18] transition hover:opacity-95"
              >
                Falar no WhatsApp
              </a>
              <Link
                href="/contato"
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-muted transition hover:border-secondary-500 hover:text-secondary-500"
              >
                Enviar mensagem
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
