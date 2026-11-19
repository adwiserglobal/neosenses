import type { Metadata } from "next";
import ContatoClient from "./ContatoClient";

const titulo = "Fale com a NeoSenses";
const descricao =
  "Entre em contato com a NeoSenses para tirar dúvidas sobre viagens, retiros e jornadas com propósito. Nossa equipe ajuda você a escolher os próximos passos.";

export const metadata: Metadata = {
  title: titulo,
  description: descricao,
  alternates: { canonical: "/contato" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "NeoSenses",
    title: `${titulo} | NeoSenses`,
    description: descricao,
    url: "/contato",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Entre em contato com a NeoSenses" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${titulo} | NeoSenses`,
    description: descricao,
    images: ["/og-image.jpg"],
  },
};

export default function ContatoPage() {
  return <ContatoClient />;
}
