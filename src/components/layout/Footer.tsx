import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Newsletter } from "./Newsletter";
import { lerConfiguracoesPublicas } from "@/lib/dal/content";
import { listarCategoriasEmArvore } from "@/lib/dal/destinations";
import { t } from "@/lib/utils";
import type { I18nField } from "@/types/models";

/**
 * Rodapé.
 *
 * O CNPJ e o registro vêm do banco (`/admin/configuracoes`), não do JSX:
 * são os dados que identificam a empresa num contrato, e escritos à mão
 * envelhecem sem que ninguém perceba. Campo vazio simplesmente não é
 * desenhado — melhor a linha ausente que um número errado.
 */
export async function Footer() {
  const config = await lerConfiguracoesPublicas();
  const texto = (chave: string) =>
    typeof config[chave] === "string" ? (config[chave] as string).trim() : "";
  const cnpj = texto("empresa.cnpj");
  const cadastur = texto("empresa.cadastur");

  // A coluna de experiências listava cinco categorias escritas à mão, três
  // delas hoje subcategorias. Vem do banco pelo mesmo motivo do menu.
  const categorias = await listarCategoriasEmArvore();
  const linksDeExperiencia = [
    ...categorias.map((c) => ({
      label: t(c.name as I18nField, "pt"),
      href: `/experiencias?categoria=${c.slug}`,
    })),
    { label: "Todas as jornadas", href: "/experiencias" },
    { label: "Destinos", href: "/destinos" },
    { label: "Montar meu roteiro", href: "/planejar" },
    { label: "Para Facilitadores", href: "/para-facilitadores" },
  ];

  return (
    <footer className="border-t border-border bg-warm-white">
      {/* Newsletter Section */}
      <div className="border-b border-border bg-warm-gray/50 py-12">
        <div className="container-wide flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div>
            <h3 className="font-heading text-xl text-primary-700">Receba nossas novidades</h3>
            <p className="mt-1 text-sm text-text-muted">Experiências exclusivas e inspirações para sua jornada.</p>
          </div>
          <Newsletter />
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-wide py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              <h2 className="font-heading text-2xl text-primary-700">NeoSenses</h2>
            </Link>
            <p className="mt-1 text-sm italic text-secondary-500">Um Novo Sentir</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-muted">
              Experiências transformadoras de viagem que elevam sua vibração e conectam com seu melhor.
            </p>
            {/* Só o Instagram, e com o endereço de verdade.
                Havia três ícones — Instagram, Facebook e YouTube — todos
                com `href="#"`. Clicar recarregava a página; para quem
                tentou, o site simplesmente não funciona. O @neosenses vem
                do material da própria equipe; dos outros dois não existe
                perfil confirmado, e ícone bonito que não leva a lugar
                nenhum custa mais confiança do que a ausência dele. */}
            <div className="mt-6 flex gap-3">
              {[
                { label: "Instagram", href: "https://instagram.com/neosenses", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> },
              ].map(({ label, href, svg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-muted transition-all hover:border-secondary-500 hover:text-secondary-500"
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Experiences */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              Experiências
            </h4>
            <ul className="space-y-3 text-sm">
              {linksDeExperiencia.map(({ label, href }) => (
                <li key={href + label}>
                  <Link
                    href={href}
                    className="inline-block py-1 text-text-muted transition-colors hover:text-secondary-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              Empresa
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Sobre Nós", href: "/sobre" },
                { label: "Blog", href: "/blog" },
                { label: "FAQ", href: "/contato/faq" },
                { label: "Privacidade", href: "/legal/privacidade" },
                { label: "Termos", href: "/legal/termos" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-block py-1 text-text-muted transition-colors hover:text-secondary-500"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700">
              Contato
            </h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
                <a href="mailto:contato@neosenses.com.br" className="transition-colors hover:text-secondary-500">
                  contato@neosenses.com.br
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
                <a href="tel:+5511947188319" className="transition-colors hover:text-secondary-500">
                  +55 11 94718-8319
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary-500" />
                <span>
                  Rua Alegre, 928 – Santa Paula<br />
                  São Caetano do Sul – SP<br />
                  09550-250
                </span>
              </li>
              <li className="pt-1 text-xs text-text-muted">
                Seg–Sáb 9:00–18:00
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container-wide flex flex-col items-center justify-between gap-3 py-6 text-xs text-text-muted md:flex-row">
          <p>
            © {new Date().getFullYear()} NeoSenses. Todos os direitos reservados.
            {cnpj && <span className="ml-2">CNPJ {cnpj}</span>}
            {cadastur && <span className="ml-2">CADASTUR {cadastur}</span>}
          </p>
          <div className="flex gap-6">
            <Link href="/legal/privacidade" className="transition-colors hover:text-secondary-500">
              Política de Privacidade
            </Link>
            <Link href="/legal/termos" className="transition-colors hover:text-secondary-500">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
