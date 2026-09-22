/**
 * Termos de Uso.
 *
 * A seção de contato exibia "CNPJ: XX.XXX.XXX/0001-XX" fixo no código.
 * Documento de placeholder num contrato de adesão é pior que documento
 * ausente: dá a um texto sem parte identificada a aparência de contrato
 * válido.
 *
 * Agora os dados vêm de `settings`, preenchidos em /admin/configuracoes, e
 * cada linha some quando o valor não existe.
 */

import type { Metadata } from "next";
import { lerConfiguracoesPublicas } from "@/lib/dal/content";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos e condições de uso do site da NeoSenses e das experiências de viagem transformadora.",
  alternates: { canonical: "/legal/termos" },
};

export const revalidate = 3600;

export default async function TermosPage() {
  const config = await lerConfiguracoesPublicas();
  const texto = (chave: string): string => {
    const v = config[chave];
    return typeof v === "string" ? v.trim() : "";
  };

  const razaoSocial = texto("empresa.razao_social");
  const cnpj = texto("empresa.cnpj");
  const cadastur = texto("empresa.cadastur");
  const endereco = texto("empresa.endereco");
  const email = texto("site.email");
  const whatsapp = texto("site.whatsapp");

  return (
    <>
      <section className="bg-primary-700 pb-12 pt-32 md:pb-16 md:pt-40">
        <div className="container-content text-center">
          <h1 className="font-heading text-4xl text-warm-white">Termos de Uso</h1>
          <p className="mt-4 text-warm-white/60">Última atualização: Agosto de 2026</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-content">
          <div className="mx-auto max-w-3xl space-y-8 text-text-muted leading-relaxed">
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">1. Aceitação dos Termos</h2>
              <p>Ao acessar e utilizar o site da NeoSenses, você concorda com estes termos de uso. Caso não concorde com algum dos termos, solicitamos que não utilize nosso site.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">2. Serviços</h2>
              <p>A NeoSenses oferece experiências de viagem transformadora, incluindo retiros, jornadas espirituais, peregrinações e imersões. Todos os roteiros estão sujeitos à disponibilidade e condições específicas de cada experiência.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">3. Reservas e Pagamentos</h2>
              <p>As reservas são confirmadas mediante pagamento de sinal conforme condições de cada experiência. O valor total, condições de parcelamento e política de cancelamento são informados antes da confirmação da reserva.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">4. Cancelamento</h2>
              <p>Cancelamentos com mais de 60 dias de antecedência têm reembolso integral. Entre 30 e 60 dias, reembolso de 50%. Após 30 dias, o valor pode ser convertido em crédito para outra experiência.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">5. Responsabilidade</h2>
              <p>A NeoSenses se compromete a oferecer experiências seguras e de alta qualidade. No entanto, não nos responsabilizamos por eventos de força maior, condições climáticas ou decisões pessoais dos participantes durante as experiências.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">6. Contato</h2>
              {/* Cada linha só aparece quando existe. Documento de contrato
                  não leva número de exemplo. */}
              <address className="not-italic">
                {razaoSocial || "NeoSenses"}
                {cnpj && (
                  <>
                    <br />
                    CNPJ: {cnpj}
                  </>
                )}
                {cadastur && (
                  <>
                    <br />
                    Cadastur: {cadastur}
                  </>
                )}
                {endereco && (
                  <>
                    <br />
                    {endereco}
                  </>
                )}
                {(email || whatsapp) && <br />}
                {email && (
                  <a href={`mailto:${email}`} className="underline underline-offset-2 hover:text-primary-700">
                    {email}
                  </a>
                )}
                {email && whatsapp && " | "}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-primary-700"
                  >
                    +{whatsapp.replace(/\D/g, "")}
                  </a>
                )}
              </address>

              {!cnpj && (
                // Aviso só em desenvolvimento: quem opera o site vê a
                // pendência sem que o visitante veja recado interno.
                process.env.NODE_ENV !== "production" && (
                  <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Falta o CNPJ. Preencha em /admin/configuracoes — sem ele, estes Termos não
                    identificam a empresa contratante.
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
