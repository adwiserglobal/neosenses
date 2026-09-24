"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { linkWhatsApp } from "@/lib/utils";

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
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!activeDropdown) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setActiveDropdown(null);
      botaoDoMenu.current?.focus();
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
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
        scrolled ? "bg-warm-white/95 shadow-soft backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="container-wide flex h-[72px] items-center justify-between">
        <Link
          href="/"
          prefetch
          onClick={() => setMobileOpen(false)}
          className="relative z-50 inline-flex items-center rounded-md bg-primary-800/95 px-2.5 py-2 shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.02]"
          aria-label="NeoSenses — início"
        >
          <Image
            src="/images/neosenses-logo.svg"
            alt="NeoSenses"
            width={200}
            height={25}
            priority
            className="h-[20px] w-auto"
          />
        </Link>

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
                onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                onMouseLeave={() => link.children && setActiveDropdown(null)}
              >
                <span className="flex items-center">
                  <Link
                    href={link.href}
                    prefetch
                    onClick={() => setActiveDropdown(null)}
                    className={`flex items-center whitespace-nowrap px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] transition-colors duration-200 ${corDoItem} ${
                      link.children ? "pr-1" : ""
                    }`}
                  >
                    {link.label}
                  </Link>

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
                      transition={{ duration: 0.15 }}
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
                              prefetch
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
            <nav className="h-full overflow-y-auto px-8 pb-16 pt-24 text-center">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="mb-5"
                >
                  <Link
                    href={link.href}
                    prefetch
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
                          prefetch
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
                transition={{ delay: 0.3 }}
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
