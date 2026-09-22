"use client";

/**
 * Página de contato.
 *
 * Antes, o envio era `await new Promise(r => setTimeout(r, 1500))` seguido de
 * "Mensagem Enviada!". Nada era gravado e todo contato se perdia. Agora chama
 * a server action, que valida e grava com service_role.
 */

import { useState } from "react";
import { enviarContato } from "@/lib/actions/forms";
import { Capa } from "@/components/templates/base";

type Estado = "parado" | "enviando" | "enviado";

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
      // O erro aparece na tela: falha silenciosa aqui é contato perdido.
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
    `w-full rounded-lg border bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
      campoComErro === campo
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
        : "border-border focus:border-secondary-500 focus:ring-secondary-500/20"
    }`;

  return (
    <>
      <Capa
        chapeu="Fale conosco"
        titulo="Entre em contato"
        resumo="Conte o que você procura. A gente responde com o que existe de verdade — data, roteiro e valor."
        imagem="/images/b2b/amazonas-porsol-flutuante.jpg"
        alinhamento="centro"
      />

      <section className="py-16 md:py-24">
        <div className="container-content">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3">
              {estado === "enviado" ? (
                <div className="rounded-2xl border border-success/20 bg-success/5 p-12 text-center">
                  <h2 className="mb-2 font-heading text-2xl text-primary-700">Mensagem enviada!</h2>
                  <p className="text-text-muted">Retornaremos em até 24 horas. 🙏</p>
                  <button
                    onClick={() => setEstado("parado")}
                    className="mt-6 text-sm font-medium text-secondary-500 underline underline-offset-4"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={aoEnviar} className="space-y-6" noValidate>
                  {erro && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {erro}
                    </div>
                  )}

                  {/* Isca para robô. Escondida do olho e do leitor de tela; um
                      humano nunca preenche, então valor aqui indica automação. */}
                  <div className="absolute left-[-9999px]" aria-hidden="true">
                    <label htmlFor="c-website">Não preencha este campo</label>
                    <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-name" className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
                        Nome *
                      </label>
                      <input id="c-name" name="name" type="text" required maxLength={120} className={classeCampo("name")} />
                    </div>
                    <div>
                      <label htmlFor="c-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
                        Email *
                      </label>
                      <input id="c-email" name="email" type="email" required maxLength={160} className={classeCampo("email")} />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-phone" className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
                        Telefone
                      </label>
                      <input id="c-phone" name="phone" type="tel" maxLength={30} placeholder="(11) 90000-0000" className={classeCampo("phone")} />
                    </div>
                    <div>
                      <label htmlFor="c-subject" className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
                        Assunto
                      </label>
                      <input id="c-subject" name="subject" type="text" maxLength={120} className={classeCampo("subject")} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="c-msg" className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
                      Mensagem *
                    </label>
                    <textarea id="c-msg" name="message" required rows={5} maxLength={2000} className={`resize-none ${classeCampo("message")}`} />
                  </div>

                  <button
                    type="submit"
                    disabled={estado === "enviando"}
                    className="rounded-lg bg-secondary-600 hover:bg-secondary-700 px-8 py-4 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
                  >
                    {estado === "enviando" ? "Enviando..." : "Enviar Mensagem"}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-8 lg:col-span-2">
              <div className="rounded-xl border border-border bg-warm-gray/30 p-8">
                <h2 className="mb-4 font-heading text-xl text-primary-700">Contato Direto</h2>
                <ul className="space-y-3 text-sm text-text-muted">
                  <li>📧 contato@neosenses.com.br</li>
                  <li>📞 +55 11 94718-8319</li>
                  <li>📍 Rua Alegre, 928 – São Caetano do Sul</li>
                  <li>🕐 Seg–Sáb 9:00–18:00</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-warm-gray/30 p-8">
                <h2 className="mb-4 font-heading text-xl text-primary-700">WhatsApp</h2>
                <a
                  href="https://wa.me/5511947188319"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-whatsapp)] px-6 py-3 text-sm font-semibold text-[#0b2e18] transition-all hover:shadow-lg"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
