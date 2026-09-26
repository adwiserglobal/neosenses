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
  children?: Array<{ label: string; href: string }>;
}

const NAV_LINKS: ItemDeMenu[] = [
  { label: "Home", href: "/" },
  { label: "Sobre Nós", href: "/sobre" },
  {
    label: "Experiências & Roteiros",
    href: "/experiencias",
    children: [
      { label: "Ver todas", href: "/experiencias" },
      { label: "Destinos", href: "/destinos" },
      { label: "Montar meu roteiro", href: "/planejar" },
    ],
  },
  { label: "Para Facilitadores", href: "/para-facilitadores" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
];

const DESKTOP_BREAKPOINT = 1280;

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const onResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) setMobileOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!activeDropdown) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest?.("[data-public-menu]")) setActiveDropdown(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveDropdown(null);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeDropdown]);

  const navColor = scrolled
    ? "text-primary-700 hover:text-secondary-500"
    : "text-warm-white/90 hover:text-warm-white";

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-warm-white/95 shadow-soft backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="container-wide flex h-[72px] items-center justify-between gap-4">
        <Link
          href="/"
          prefetch
          onClick={closeMobile}
          className="relative z-50 inline-flex shrink-0 items-center transition-transform hover:scale-[1.02]"
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

        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 xl:flex">
          {NAV_LINKS.map((link) => {
            const open = activeDropdown === link.label;
            return (
              <div
                key={link.label}
                data-public-menu
                className="relative shrink-0"
                onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                onMouseLeave={() => link.children && setActiveDropdown(null)}
              >
                <span className="flex items-center">
                  <Link
                    href={link.href}
                    prefetch
                    onClick={() => setActiveDropdown(null)}
                    className={`flex items-center whitespace-nowrap px-3 py-2 text-[12px] font-medium uppercase tracking-[0.065em] transition-colors ${navColor}`}
                  >
                    {link.label}
                  </Link>

                  {link.children && (
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-label={`${open ? "Fechar" : "Abrir"} menu de ${link.label}`}
                      onClick={() => setActiveDropdown(open ? null : link.label)}
                      className={`-ml-2 flex h-8 w-7 items-center justify-center rounded transition-colors ${navColor}`}
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                  )}
                </span>

                <AnimatePresence>
                  {link.children && open && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.14 }}
                      className="absolute left-0 top-full pt-2"
                    >
                      <div className="min-w-[220px] rounded-xl border border-border bg-surface p-2 shadow-elevated">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            prefetch
                            onClick={() => setActiveDropdown(null)}
                            className="block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-warm-gray hover:text-secondary-500"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="hidden shrink-0 xl:flex">
          <a
            href={linkWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-w-max shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.065em] transition-colors ${
              scrolled
                ? "bg-secondary-300 text-text-primary hover:bg-secondary-200"
                : "border border-warm-white/45 text-warm-white hover:bg-warm-white hover:text-primary-700"
            }`}
          >
            Fale no WhatsApp
          </a>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-menu"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          className={`relative z-50 rounded-full p-2 xl:hidden ${
            scrolled || mobileOpen ? "text-primary-700" : "text-warm-white"
          }`}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="public-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-warm-white xl:hidden"
          >
            <nav className="h-full overflow-y-auto px-8 pb-16 pt-24 text-center">
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.035, duration: 0.22 }}
                  className="mb-5"
                >
                  <Link
                    href={link.href}
                    prefetch
                    onClick={closeMobile}
                    className="inline-block py-1 font-heading text-2xl text-primary-700 transition-colors hover:text-secondary-500"
                  >
                    {link.label}
                  </Link>

                  {link.children && (
                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          prefetch
                          onClick={closeMobile}
                          className="inline-block px-2 py-1.5 text-sm text-text-muted transition-colors hover:text-secondary-500"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              <a
                href={linkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-secondary-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-primary-800"
              >
                Fale no WhatsApp
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
