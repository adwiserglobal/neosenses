import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade da NeoSenses. Saiba como coletamos, usamos e protegemos seus dados pessoais.",
};

export default function PrivacidadePage() {
  return (
    <>
      <section className="bg-primary-700 pb-12 pt-32 md:pb-16 md:pt-40">
        <div className="container-content text-center">
          <h1 className="font-heading text-4xl text-warm-white">Política de Privacidade</h1>
          <p className="mt-4 text-warm-white/60">Última atualização: Agosto de 2026</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container-content">
          <div className="mx-auto max-w-3xl space-y-8 text-text-muted leading-relaxed">
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">1. Informações que Coletamos</h2>
              <p>Coletamos informações que você fornece diretamente, como nome, e-mail, telefone e preferências de viagem ao preencher formulários em nosso site, assinar nossa newsletter ou entrar em contato pelo WhatsApp.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">2. Como Usamos suas Informações</h2>
              <p>Utilizamos suas informações para personalizar sua experiência, responder suas dúvidas, enviar informações sobre experiências de viagem, processar reservas e melhorar nossos serviços.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">3. Compartilhamento de Dados</h2>
              <p>Não vendemos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. Podemos compartilhar dados com parceiros operacionais (hotéis, guias locais) exclusivamente para a execução dos serviços contratados.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">4. Segurança</h2>
              <p>Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição. Utilizamos criptografia SSL e armazenamento seguro em nuvem.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">5. Seus Direitos (LGPD)</h2>
              <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar, corrigir, excluir ou portar seus dados pessoais. Para exercer esses direitos, entre em contato pelo e-mail contato@neosenses.com.br.</p>
            </div>
            <div>
              <h2 className="mb-4 font-heading text-2xl text-primary-700">6. Contato</h2>
              <p>Para dúvidas sobre esta política, entre em contato: contato@neosenses.com.br</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
