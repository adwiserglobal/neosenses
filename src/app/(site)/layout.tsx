/**
 * Chrome do site público: cabeçalho, rodapé, WhatsApp e Concierge.
 *
 * Isto morava no layout raiz e, por isso, aparecia TAMBÉM no /admin — dois
 * cabeçalhos empilhados, e o de cima levando para as páginas públicas. Quem
 * estava no painel clicava em "Experiências" e caía no site.
 *
 * O route group `(site)` não entra na URL: /experiencias continua
 * /experiencias. Ele existe só para dizer quais rotas ganham este envoltório.
 *
 * Fora daqui, de propósito: /admin (tem o próprio) e /login (uma tela de
 * senha não precisa de menu nem de chatbot flutuando por cima).
 */

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { AIConcierge } from "@/components/ui/AIConcierge";
import { listarCategoriasEmArvore } from "@/lib/dal/destinations";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // O menu de experiências vem do banco. Estava escrito à mão no Header, e
  // por isso listava categorias que ninguém mais usava e não listava as
  // três novas — o menu é a primeira coisa que envelhece quando o catálogo
  // muda e ninguém lembra de abrir o componente.
  const categorias = await listarCategoriasEmArvore();
  const menuDeExperiencias = categorias.map((c) => ({
    label: t(c.name as I18nField, "pt"),
    href: `/experiencias?categoria=${c.slug}`,
  }));

  return (
    <>
      {/* Pular para o conteúdo — WCAG 2.4.1, nível A.
          Sem ele, quem navega por teclado atravessa nove paradas de Tab
          (logo, seis itens de menu, a seta do submenu e o WhatsApp) antes
          da primeira palavra da página, em TODA página do site.

          `tabIndex={-1}` no <main> não é detalhe: sem ele o Safari rola a
          página mas deixa o foco no link, e o Tab seguinte volta ao menu —
          o link parece funcionar e não funciona. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-text-primary focus:shadow-elevated"
      >
        Pular para o conteúdo
      </a>

      <Header categorias={menuDeExperiencias} />
      <div className="flex min-h-screen flex-col">
        {/* `scroll-mt-28` é o mesmo valor que o questionário já usa para
            este cabeçalho — seguir o precedente em vez de inventar um
            segundo número para a mesma altura. */}
        <main id="conteudo" tabIndex={-1} className="flex-1 scroll-mt-28">
          {children}
        </main>
        <Footer />
      </div>
      <WhatsAppButton />
      <AIConcierge />
    </>
  );
}
