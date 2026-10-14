/**
 * Moldura dos documentos legais (privacidade e termos): capa, índice lateral
 * que acompanha a leitura, seções numeradas e cartão de contato.
 *
 * Server Component: só o `Surge` roda no navegador, e `prefers-reduced-motion`
 * já é respeitado por ele.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, FileText, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Surge } from "@/components/ui/Surge";
import { linkWhatsApp } from "@/lib/utils";

export interface SecaoLegal {
  id: string;
  titulo: string;
  conteudo: ReactNode;
}

export interface DadosDaEmpresa {
  razaoSocial: string;
  cnpj: string;
  cadastur: string;
  endereco: string;
  email: string;
  whatsapp: string;
}

export function lerDadosDaEmpresa(config: Record<string, unknown>): DadosDaEmpresa {
  const texto = (chave: string): string => {
    const v = config[chave];
    return typeof v === "string" ? v.trim() : "";
  };
  return {
    razaoSocial: texto("empresa.razao_social"),
    cnpj: texto("empresa.cnpj"),
    cadastur: texto("empresa.cadastur"),
    endereco: texto("empresa.endereco"),
    email: texto("site.email"),
    whatsapp: texto("site.whatsapp"),
  };
}

/** Parágrafos e listas com o mesmo ritmo em todo o documento. */
export function Texto({ children }: { children: ReactNode }) {
  return <p className="leading-[1.85]">{children}</p>;
}

export function Lista({ itens }: { itens: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3 leading-[1.8]">
          <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-secondary-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DocumentoLegal({
  icone,
  titulo,
  introducao,
  atualizadoEm,
  destaque,
  secoes,
  empresa,
  outro,
}: {
  icone: "privacidade" | "termos";
  titulo: string;
  introducao: string;
  atualizadoEm: string;
  /** Quadro "em poucas palavras", logo abaixo da capa. */
  destaque?: { titulo: string; itens: string[] };
  secoes: SecaoLegal[];
  empresa: DadosDaEmpresa;
  outro: { href: string; rotulo: string };
}) {
  const Icone = icone === "privacidade" ? ShieldCheck : FileText;
  const email = empresa.email || "contato@neosenses.com.br";

  return (
    <>
      <section className="relative isolate overflow-hidden bg-primary-800 pb-14 pt-32 md:pb-20 md:pt-44">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 [background:radial-gradient(circle_at_85%_10%,rgba(215,168,40,0.22),transparent_32%),radial-gradient(circle_at_8%_100%,rgba(159,78,186,0.38),transparent_40%),linear-gradient(160deg,#250031,#4b1058)]"
        />
        <div className="container-content">
          <div className="max-w-3xl">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-secondary-300 ring-1 ring-white/15">
              <Icone className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-6 font-heading text-4xl leading-tight text-warm-white md:text-5xl">{titulo}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-warm-white/80">{introducao}</p>
            <p className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-secondary-300">
              Última atualização: {atualizadoEm}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f5eddf] py-12 md:py-20">
        <div className="container-content">
          {destaque && (
            <Surge className="mb-12 rounded-2xl border border-secondary-300/50 bg-[#fffaf2] p-6 shadow-[0_12px_36px_rgba(70,24,80,0.08)] md:mb-16 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-600">{destaque.titulo}</p>
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {destaque.itens.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-text-primary md:text-base">
                    <span aria-hidden="true" className="mt-[0.45em] h-2 w-2 shrink-0 rounded-full bg-secondary-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </Surge>
          )}

          <div className="grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <details className="group rounded-xl border border-border bg-[#fffaf2] lg:border-0 lg:bg-transparent" open>
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 marker:content-[''] lg:pointer-events-none lg:cursor-default lg:px-0 lg:pt-0">
                  Neste documento
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 lg:hidden" aria-hidden="true" />
                </summary>
                <nav aria-label="Índice do documento" className="px-5 pb-4 lg:px-0 lg:pb-0">
                  <ol className="space-y-1 border-l border-secondary-300/60">
                    {secoes.map((s, i) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm leading-snug text-text-muted transition-colors hover:border-secondary-500 hover:text-primary-700"
                        >
                          <span className="mr-2 tabular-nums text-secondary-600">{String(i + 1).padStart(2, "0")}</span>
                          {s.titulo}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </details>
            </aside>

            <div className="min-w-0 space-y-12 text-text-muted md:space-y-14">
              {secoes.map((s, i) => (
                <Surge as="section" key={s.id} className="scroll-mt-28">
                  <div id={s.id} className="scroll-mt-28" />
                  <div className="flex items-baseline gap-4">
                    <span aria-hidden="true" className="font-heading text-3xl leading-none text-secondary-500 md:text-4xl">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-heading text-2xl leading-snug text-primary-700 md:text-3xl">{s.titulo}</h2>
                  </div>
                  <div className="mt-5 space-y-4 md:pl-[3.4rem]">{s.conteudo}</div>
                </Surge>
              ))}

              <Surge className="rounded-2xl bg-primary-800 p-7 text-warm-white md:p-9">
                <h2 className="font-heading text-2xl text-warm-white">Ficou com alguma dúvida?</h2>
                <address className="mt-3 not-italic leading-relaxed text-warm-white/80">
                  {empresa.razaoSocial || "NeoSenses"}
                  {empresa.cnpj && (<><br />CNPJ: {empresa.cnpj}</>)}
                  {empresa.cadastur && (<><br />Cadastur: {empresa.cadastur}</>)}
                  {empresa.endereco && (<><br />{empresa.endereco}</>)}
                </address>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary-300 px-5 py-3 text-sm font-semibold text-primary-900 transition hover:bg-secondary-200"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {email}
                  </a>
                  <a
                    href={linkWhatsApp()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/35 px-5 py-3 text-sm font-semibold text-warm-white transition hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Falar no WhatsApp
                  </a>
                </div>
              </Surge>

              <p className="text-sm">
                Veja também:{" "}
                <Link href={outro.href} className="font-medium text-primary-700 underline underline-offset-4 hover:text-secondary-600">
                  {outro.rotulo}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
