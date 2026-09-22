"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { linkWhatsApp } from "@/lib/utils";

/**
 * Menu.
 *
 * A estrutura é a do documento de reformulação (passo 1): Home, Sobre Nós,
 * Experiências & Roteiros com as três categorias, Para Facilitadores, Blog
 * e Contato — separando o atendimento direto das parcerias.
 *
 * As categorias do dropdown vêm do banco, não daqui. Escritas à mão, elas
 * apontavam para filtros que ninguém mais usava e ignoravam os criados
 * depois: o menu é a primeira coisa a envelhecer quando o catálogo muda.
 *
 * Destinos e Montar Roteiro entram no mesmo dropdown, abaixo de um filete.
 * O documento não os lista no topo, mas são conteúdo real — oito páginas de
 * destino e o gerador de roteiro — e sumir com eles do menu seria enterrar
 * o que já existe para caber numa lista mais curta.
 */
interface ItemDeMenu {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string; separarAntes?: boolean }>;
}

function montarMenu(categorias: Array<{ label: string; href: string }>): ItemDeMenu[] {
  return [
    { label: "Home", href: "/" },
    { label: "Sobre Nós", href: "/sobre" },
    {
      label: "Experiências & Roteiros",
      href: "/experiencias",
      children: [
        ...categorias,
        { label: "Ver todas", href: "/experiencias", separarAntes: categorias.length > 0 },
        { label: "Destinos", href: "/destinos" },
        { label: "Montar meu roteiro", href: "/planejar" },
      ],
    },
    { label: "Para Facilitadores", href: "/para-facilitadores" },
    { label: "Blog", href: "/blog" },
    { label: "Contato", href: "/contato" },
  ];
}

export function Header({
  categorias = [],
}: {
  categorias?: Array<{ label: string; href: string }>;
}) {
  const navLinks = montarMenu(categorias);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const botaoDoMenu = useRef<HTMLButtonElement>(null);
  const botaoMobile = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /**
   * Fecha o submenu por Escape e por clique fora.
   *
   * Enquanto ele só abria no hover, sair com o mouse bastava. Agora que
   * abre no clique, sem isto ele ficaria aberto para sempre em tela de
   * toque — não há "sair com o mouse" lá.
   */
  useEffect(() => {
    if (!activeDropdown) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveDropdown(null);
        // O foco volta para o botão que abriu: quem navega por teclado
        // ficaria perdido no fim do documento.
        botaoDoMenu.current?.focus();
      }
    };
    const aoClicarFora = (e: MouseEvent) => {
      const alvo = e.target as HTMLElement;
      if (!alvo.closest?.("[data-menu-suspenso]")) setActiveDropdown(null);
    };

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, [activeDropdown]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /**
   * O menu mobile fecha por Escape e ao passar para o desktop.
   *
   * O Escape só existia para o dropdown do desktop, e o overlay mobile
   * ficava preso ao toque no X. Pior: girar o celular ou alargar a janela
   * escondia o overlay (ele é `lg:hidden`) mas deixava `mobileOpen` ligado
   * e o `body` travado sem rolagem — a página parecia congelada, e nada
   * na tela explicava por quê.
   */
  useEffect(() => {
    if (!mobileOpen) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        botaoMobile.current?.focus();
      }
    };
    const aoRedimensionar = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };

    document.addEventListener("keydown", aoTeclar);
    window.addEventListener("resize", aoRedimensionar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-warm-white/95 shadow-soft backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="container-wide flex h-[72px] items-center justify-between lg:h-[72px]">
        {/* O logo fecha o menu antes de navegar: ele fica ACIMA do overlay
            (z-50 contra z-40), então dá para clicar nele com o menu aberto —
            e sem isto a home carregava atrás de uma folha branca. */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="relative z-50 flex items-center gap-2"
        >
          <span className={`font-heading text-2xl transition-colors duration-300 ${
            scrolled || mobileOpen ? "text-primary-700" : "text-warm-white"
          }`}>
            NeoSenses
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const aberto = activeDropdown === link.label;
            const idDoSubmenu = `submenu-${link.label.replace(/\W+/g, "-").toLowerCase()}`;
            const corDoItem = scrolled
              ? "text-primary-700 hover:text-secondary-500"
              : "text-warm-white/90 hover:text-warm-white";

            return (
              <div
                key={link.label}
                data-menu-suspenso
                className="relative"
                // O hover continua abrindo no desktop — é rápido e as pessoas
                // esperam isso. Mas ele é atalho, não a única porta: o botão
                // ao lado faz o mesmo no clique, no toque e no teclado.
                onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                onMouseLeave={() => link.children && setActiveDropdown(null)}
              >
                <span className="flex items-center">
                  <Link
                    href={link.href}
                    onClick={() => setActiveDropdown(null)}
                    className={`flex items-center px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] whitespace-nowrap transition-colors duration-200 ${corDoItem} ${
                      link.children ? "pr-1" : ""
                    }`}
                  >
                    {link.label}
                  </Link>

                  {/* A seta é um botão de verdade, não enfeite dentro do
                      link. Era o que faltava para o submenu existir fora do
                      mouse — e o que fazia o clique no rótulo se perder,
                      porque o dropdown entrava no DOM no meio do gesto. */}
                  {link.children && (
                    <button
                      ref={link.label === "Experiências & Roteiros" ? botaoDoMenu : undefined}
                      type="button"
                      aria-expanded={aberto}
                      aria-controls={idDoSubmenu}
                      aria-label={`${aberto ? "Fechar" : "Abrir"} o menu de ${link.label}`}
                      onClick={() => setActiveDropdown(aberto ? null : link.label)}
                      className={`-ml-1 flex h-8 w-7 items-center justify-center rounded transition-colors duration-200 ${corDoItem}`}
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${
                          aberto ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </span>

                <AnimatePresence>
                  {link.children && aberto && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 top-full pt-2"
                    >
                      <ul
                        id={idDoSubmenu}
                        className="min-w-[210px] rounded-xl border border-border bg-surface p-2 shadow-elevated"
                      >
                        {link.children.map((child) => (
                          <li key={child.href + child.label}>
                            <Link
                              href={child.href}
                              onClick={() => setActiveDropdown(null)}
                              className={`block rounded-lg px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-warm-gray hover:text-secondary-500 ${
                                child.separarAntes ? "mt-2 border-t border-border pt-3" : ""
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Ação fixa da direita: "Fale no WhatsApp", como pede o passo 1 do
            documento de reformulação.

            Havia aqui uma lupa e um seletor "PT" — dois botões que não
            faziam nada: nenhum tinha onClick, a busca não existe e o site
            só tem português. Botão que não responde ao clique é pior que
            função ausente, porque quem tenta conclui que o site quebrou. */}
        <div className="hidden items-center lg:flex">
          <a
            href={linkWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg px-5 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors ${
              scrolled
                ? "bg-secondary-300 text-text-primary hover:bg-secondary-200"
                : "border border-warm-white/45 text-warm-white hover:bg-warm-white hover:text-primary-700"
            }`}
          >
            Fale no WhatsApp
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          ref={botaoMobile}
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="menu-mobile"
          className={`relative z-50 rounded-full p-2 lg:hidden ${
            scrolled || mobileOpen ? "text-primary-700" : "text-warm-white"
          }`}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-warm-white lg:hidden"
          >
            {/* Rola em vez de centralizar: com seis entradas e as
                subcategorias, a lista passa da altura da tela num celular
                pequeno, e centralizado o que sobra fica inalcançável.
                `pt-24` deixa o botão de fechar livre. */}
            <nav className="h-full overflow-y-auto px-8 pb-16 pt-24 text-center">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="mb-5"
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="inline-block py-1 font-heading text-2xl text-primary-700 transition-colors hover:text-secondary-500"
                  >
                    {link.label}
                  </Link>

                  {link.children && (
                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      {link.children.map((child) => (
                        <Link
                          key={child.href + child.label}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="inline-block px-2 py-1.5 text-sm text-text-muted transition-colors hover:text-secondary-500"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <a
                  href={linkWhatsApp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primario"
                >
                  Fale no WhatsApp
                </a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
