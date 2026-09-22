/**
 * NeoSenses Design Tokens
 * Single source of truth for all design values.
 */

export const colors = {
  primary: {
    DEFAULT: "#1a2e1f",
    light: "#4a6741",
    50: "#f0f5f1",
    100: "#dce8de",
    200: "#b8d1bd",
    300: "#8fb59a",
    400: "#6a9977",
    500: "#4a6741",
    600: "#3a5234",
    700: "#1a2e1f",
    800: "#0f1c13",
    900: "#070e09",
  },
  secondary: {
    DEFAULT: "#b8860b",
    light: "#d4a855",
    50: "#fdf8eb",
    100: "#f9ecc8",
    200: "#f0d48e",
    300: "#e6bb54",
    400: "#d4a855",
    500: "#b8860b",
    600: "#946b09",
    700: "#705107",
    800: "#4c3605",
    900: "#281c03",
  },
  accent: {
    DEFAULT: "#c4704b",
    light: "#e8c4b0",
    50: "#fdf3ee",
    100: "#f9e2d5",
    200: "#f0c4ab",
    300: "#e8c4b0",
    400: "#d49272",
    500: "#c4704b",
    600: "#a5573a",
    700: "#7e422c",
    800: "#572e1f",
    900: "#301a11",
  },
  neutral: {
    bg: "#faf8f5",
    "bg-alt": "#f0ece6",
    "bg-dark": "#1a1a18",
    surface: "#ffffff",
    border: "#e5e0d8",
    text: "#2c2c2a",
    "text-muted": "#8a8578",
    "text-inverse": "#faf8f5",
  },
  semantic: {
    success: "#4a6741",
    warning: "#d4a855",
    error: "#c4443a",
    info: "#5b7a9d",
    whatsapp: "#25d366",
  },
} as const;

export const fonts = {
  heading: '"Playfair Display", Georgia, serif',
  body: '"Inter", system-ui, -apple-system, sans-serif',
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 12px rgba(0,0,0,0.08)",
  lg: "0 8px 24px rgba(0,0,0,0.12)",
  xl: "0 16px 48px rgba(0,0,0,0.16)",
} as const;

export const radii = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  full: "9999px",
} as const;

export const transitions = {
  fast: "150ms ease",
  base: "200ms ease",
  slow: "300ms ease",
  smooth: "400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
} as const;

// Framer Motion variants
export const motionVariants = {
  fadeUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5 },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  slideInRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
} as const;
