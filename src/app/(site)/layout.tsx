/**
 * Chrome do site público: cabeçalho, rodapé, WhatsApp e Concierge.
 *
 * O layout precisa responder imediatamente em toda navegação. Dados de catálogo
 * pertencem às páginas que realmente os exibem; não devem bloquear o chrome
 * compartilhado do site a cada clique.
 */

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { AIConcierge } from "@/components/ui/AIConcierge";
import { ConciergeMonkLauncher } from "@/components/ui/ConciergeMonkLauncher";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-text-primary focus:shadow-elevated"
      >
        Pular para o conteúdo
      </a>

      <Header />
      <div className="flex min-h-screen flex-col">
        <main id="conteudo" tabIndex={-1} className="flex-1 scroll-mt-28">
          {children}
        </main>
        <Footer />
      </div>
      <WhatsAppButton />
      <AIConcierge />
      <ConciergeMonkLauncher />
    </>
  );
}
