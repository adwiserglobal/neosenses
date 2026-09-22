"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  id?: string;
}

export function Section({ children, className = "", dark = false, id }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-24 md:py-32 ${
        dark ? "bg-gradient-dark text-warm-white" : ""
      } ${className}`}
    >
      <div className="container-wide">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  overline?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
  dark?: boolean;
}

export function SectionHeader({
  overline,
  title,
  description,
  className = "",
  align = "center",
  dark = false,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className={`mb-16 ${align === "center" ? "text-center" : ""} ${className}`}
    >
      {overline && (
        <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.2em] ${
          dark ? "text-secondary-300" : "text-secondary-500"
        }`}>
          {overline}
        </p>
      )}
      <h2 className={`mx-auto max-w-3xl font-heading text-3xl md:text-4xl ${
        dark ? "text-warm-white" : "text-primary-700"
      }`}>
        {title}
      </h2>
      {description && (
        <p className={`mx-auto mt-4 max-w-2xl text-lg leading-relaxed ${
          dark ? "text-warm-white/70" : "text-text-muted"
        }`}>
          {description}
        </p>
      )}
    </motion.div>
  );
}

// Button component with variants
interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "whatsapp";
  href?: string;
  onClick?: () => void;
  className?: string;
  external?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  className = "",
  external = false,
  disabled = false,
  type = "button",
}: ButtonProps) {
  // O primário é o dourado vivo do site (#d7a828) com TINTA por cima.
  // Com texto branco esse dourado dá 2,2:1 — era assim, e o CTA da home
  // sumia no fundo claro. Com a tinta, 7,5:1. Mesma cor de marca, texto
  // que se lê. Vale igual para o verde do WhatsApp.
  const variants: Record<string, string> = {
    primary:
      "bg-secondary-300 hover:bg-secondary-200 text-text-primary shadow-soft hover:shadow-card",
    secondary:
      "border border-secondary-500 text-secondary-500 hover:bg-secondary-500 hover:text-white",
    ghost:
      "text-primary-700 underline-offset-4 hover:underline hover:text-secondary-500",
    whatsapp:
      "bg-[var(--color-whatsapp)] text-[#0b2e18] shadow-soft hover:shadow-card",
  };

  const baseClasses = `inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={baseClasses}>
      {children}
    </button>
  );
}
