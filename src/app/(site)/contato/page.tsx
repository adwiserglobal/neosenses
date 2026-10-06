"use client";

/**
 * Página de contato.
 *
 * O formulário envia os dados para a server action, que valida e grava
 * o contato no servidor. O layout prioriza o formulário sem esconder os
 * canais diretos para quem prefere falar com a equipe.
 */

import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { enviarContato } from "@/lib/actions/forms";
import { Capa } from "@/components/templates/base";

type Estado = "parado" | "enviando" | "enviado";

const CONTATOS = [
  {
    titulo: "E-mail",
    valor: "contato@neosenses.com.br",
    href: "mailto:contato@neosenses.com.br",
    Icone: Mail,
  },
  {
    titulo: "Telefone",
    valor: "+55 11 94718-8319",
    href: "tel:+5511947188319",
    Icone: Phone,
  },
  {
    titulo: "Endereço",
    valor: "Rua Alegre, 928 · São Caetano do Sul",
    href: null,
    Icone: MapPin,
  },
  {
    titulo: "Atendimento",
    valor: "Segunda a sábado · 9h às 18h",
    href: null,
    Icone: Clock3,
  },
] as const;

export default function ContatoPage() {
  const [estado, setEstado] = useState<Estado>("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [campoComErro, setCampoComErro] = useState<string | null>(null);

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("enviando");
    setErro(null);
    setCampoComErro(null);

    const dados = new FormData(e.currentTarget);

    try {
      const r = await enviarContato({
        nome: String(dados.get("name") ?? ""),
        email: String(dados.get("email") ?? ""),
        telefone: String(dados.get("phone") ?? ""),
        assunto: String(dados.get("subject") ?? ""),
        mensagem: String(dados.get("message") ?? ""),
        armadilha: String(dados.get("website") ?? ""),
      });

      if (r.success) {
        setEstado("enviado");
        return;
      }

      setErro(r.error ?? "Não foi possível enviar.");
      setCampoComErro(r.campo ?? null);
      setEstado("parado");
    } catch (err) {
      console.error("[contato] falha no envio:", err);
      setErro("Não foi possível enviar agora. Tente pelo WhatsApp que respondemos na hora.");
      setEstado("parado");
    }
  }

  const classeCampo = (campo: string) =>
    `w-full rounded-xl border bg-surface px-4 py-3.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted/55 focus:ring-4 ${
      campoComErro === campo
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
        : "border-border hover:border-primary-200 focus:border-secondary-500 focus:ring-secondary-500/10"
    }`;

  return (
    <>
      <Capa
        chapeu="Fale com a NeoSenses"
        titulo="Vamos conversar sobre a sua próxima jornada"
        resumo="Conte o que você está buscando. Nossa equipe responde com clareza sobre experiências, roteiros, datas e próximos passos."
        imagem="/images/b2b/marrocos-abertura.jpg"
        alinhamento="centro"
      />

      <section className="bg-warm-white py-16 md:py-24">
        <div className="container-wide">
          <div className="mb-12 grid gap-8 border-b border-border pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-600">
                Atendimento
              </p>
              <h2 className="max-w-2xl font-heading text-3xl leading-tight text-primary-700 md:text-4xl">
                Conte para a gente o que você tem em mente
              </h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-text-muted lg:justify-self-end">
              Se você já sabe qual experiência procura, diga qual é. Se ainda está escolhendo,
              conte o tipo de viagem, momento ou transformação que busca e a gente orienta o caminho.
            </p>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.75fr)] xl:gap-12">
            <div className="self-start rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8 md:p-10">
              {estado === "enviado" ? (
                <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h2 className="mb-3 font-heading text-3xl text-primary-700">Mensagem enviada</h2>
                  <p className="max-w-md leading-relaxed text-text-muted">
                    Recebemos seu contato. Nossa equipe retorna em até 24 horas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEstado("parado")}
                    className="mt-8 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 transition hover:border-secondary-400 hover:text-secondary-600"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="font-heading text-2xl text-primary-700">Envie uma mensagem</h2>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      Preencha os campos abaixo e nossa equipe continua a conversa com você.
                    </p>
                  </div>

                  <form onSubmit={aoEnviar} className="space-y-6" noValidate>
                    {erro && (
                      <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                      >
                        {erro}
                      </div>
                    )}

                    <div className="absolute left-[-9999px]" aria-hidden="true">
                      <label htmlFor="c-website">Não preencha este campo</label>
                      <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="c-name" className="mb-2 block text-sm font-medium text-primary-800">
                          Nome
                        </label>
                        <input
                          id="c-name"
                          name="name"
                          type="text"
                          required
                          maxLength={120}
                          autoComplete="name"
                          placeholder="Seu nome"
                          className={classeCampo("name")}
                        />
                      </div>

                      <div>
                        <label htmlFor="c-email" className="mb-2 block text-sm font-medium text-primary-800">
                          E-mail
                        </label>
                        <input
                          id="c-email"
                          name="email"
                          type="email"
                          required
                          maxLength={160}
                          autoComplete="email"
                          placeholder="voce@email.com"
                          className={classeCampo("email")}
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="c-phone" className="mb-2 block text-sm font-medium text-primary-800">
                          Telefone
                        </label>
                        <input
                          id="c-phone"
                          name="phone"
                          type="tel"
                          maxLength={30}
                          autoComplete="tel"
                          placeholder="(11) 90000-0000"
                          className={classeCampo("phone")}
                        />
                      </div>

                      <div>
                        <label htmlFor="c-subject" className="mb-2 block text-sm font-medium text-primary-800">
                          Assunto
                        </label>
                        <input
                          id="c-subject"
                          name="subject"
                          type="text"
                          maxLength={120}
                          placeholder="Ex.: viagem para o Peru"
                          className={classeCampo("subject")}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="c-msg" className="mb-2 block text-sm font-medium text-primary-800">
                        Como podemos ajudar?
                      </label>
                      <textarea
                        id="c-msg"
                        name="message"
                        required
                        rows={6}
                        maxLength={2000}
                        placeholder="Conte um pouco sobre o que você procura, quando pretende viajar ou qual experiência chamou sua atenção."
                        className={`resize-none ${classeCampo("message")}`}
                      />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-relaxed text-text-muted">
                        Seus dados são usados apenas para responder ao seu contato.
                      </p>
                      <button
                        type="submit"
                        disabled={estado === "enviando"}
                        className="inline-flex min-w-40 items-center justify-center rounded-full bg-secondary-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {estado === "enviando" ? "Enviando..." : "Enviar mensagem"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-[#5a006f] p-7 text-white shadow-sm md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f0c86b]">
                  Contato direto
                </p>
                <h2 className="mt-3 font-heading text-2xl leading-tight text-white">Prefere falar com a gente agora?</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/90">
                  Pelo WhatsApp você conversa diretamente com a equipe NeoSenses.
                </p>

                <a
                  href="https://wa.me/5511947188319"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex w-full items-center justify-between rounded-full bg-[var(--color-whatsapp)] px-5 py-3.5 text-sm font-semibold text-[#0b2e18] transition hover:brightness-95"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Falar no WhatsApp
                  </span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border bg-surface">
                <div className="border-b border-border px-7 py-5">
                  <h2 className="font-heading text-xl text-primary-700">Canais de atendimento</h2>
                </div>

                <div className="divide-y divide-border">
                  {CONTATOS.map(({ titulo, valor, href, Icone }) => {
                    const conteudo = (
                      <>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                          <Icone className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
                            {titulo}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-primary-800">
                            {valor}
                          </span>
                        </span>
                      </>
                    );

                    return href ? (
                      <a
                        key={titulo}
                        href={href}
                        className="flex items-center gap-4 px-7 py-5 transition hover:bg-warm-gray/35"
                      >
                        {conteudo}
                      </a>
                    ) : (
                      <div key={titulo} className="flex items-center gap-4 px-7 py-5">
                        {conteudo}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-secondary-200/70 bg-secondary-50/60 p-7">
                <h2 className="font-heading text-xl text-primary-700">Ainda escolhendo?</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  Não precisa chegar com tudo decidido. Conte o que deseja viver, quanto tempo tem
                  disponível e o que espera dessa viagem. A conversa pode começar daí.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
