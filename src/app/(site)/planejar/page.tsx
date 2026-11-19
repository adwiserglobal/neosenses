import type { Metadata } from "next";
import PlanejarClient from "./PlanejarClient";

const titulo = "Planeje sua Jornada";
const descricao =
  "Descubra uma experiência que combine com seu momento. Responda algumas perguntas e receba uma sugestão de roteiro personalizada da NeoSenses.";

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: "/planejar" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "NeoSenses",
    title: `${titulo} | NeoSenses`,
    description: descricao,
    url: "/planejar",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Planeje sua próxima jornada com a NeoSenses" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${titulo} | NeoSenses`,
    description: descricao,
    images: ["/og-image.jpg"],
  },
};

export default function PlanejarPage() {
  return <PlanejarClient />;
}
