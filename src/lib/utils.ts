import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Número do WhatsApp da equipe.
 *
 * Estava escrito à mão em oito arquivos. Um número trocado e esquecido em
 * um deles não dá erro nenhum: o botão continua funcionando e leva a
 * conversa para outro lugar — e o único jeito de descobrir é alguém
 * reclamar que não respondem.
 */
export const WHATSAPP_NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511947188319";

/**
 * O `next/image` consegue otimizar este endereço?
 *
 * As fotos deste site vêm de três lugares: o WordPress antigo, o Wikimedia
 * (destinos) e o que está em `public/`. Os dois domínios remotos estão em
 * `remotePatterns` no `next.config.ts`.
 *
 * Endereço fora dessa lista faz o `next/image` LANÇAR em tempo de execução
 * — a página inteira responde 500, não é só a imagem que falha. E
 * `hero_image` é campo de texto livre no painel: quem cadastra cola a URL
 * que tiver na mão, de qualquer domínio.
 *
 * Com `unoptimized`, a foto de host desconhecido é servida como está: perde
 * a otimização, mas a página existe.
 */
const HOSTS_DE_IMAGEM = ["www.neosenses.com.br", "upload.wikimedia.org"];

export function podeOtimizar(url: string | null | undefined): boolean {
  if (!url) return true;
  if (url.startsWith("/")) return true;
  try {
    const { host } = new URL(url);
    return HOSTS_DE_IMAGEM.includes(host) || host.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

/** Endereço de conversa, já com a mensagem codificada. */
export function linkWhatsApp(mensagem?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMERO.replace(/\D/g, "")}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

/**
 * Get a translated value from a JSONB i18n field.
 * Falls back to Portuguese if the requested locale is not available.
 */
export function t(
  field: Record<string, string | undefined> | string | null | undefined,
  locale: string = "pt"
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[locale] || field["pt"] || field["en"] || Object.values(field).find(Boolean) || "";
}

/**
 * Format currency for display
 */
export function formatCurrency(
  value: number,
  currency: string = "BRL",
  locale: string = "pt-BR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date for display
 */
export function formatDate(
  date: string | Date,
  locale: string = "pt-BR",
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(
    new Date(date)
  );
}

/**
 * Generate a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Estimate reading time for a text
 */
export function readingTime(text: string, wordsPerMinute: number = 200): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
