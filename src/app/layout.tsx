/**
 * Layout raiz: o documento e nada mais.
 *
 * Cabeçalho, rodapé, WhatsApp e Concierge saíram daqui para `(site)/layout`.
 * Enquanto moravam neste arquivo, apareciam em toda rota — inclusive no
 * /admin, que ficava com dois cabeçalhos e um menu levando de volta ao site.
 *
 * O JSON-LD da organização ficou: descreve a empresa, e vale em qualquer
 * página onde um buscador chegue.
 */

import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizacao } from "@/lib/seo/dadosEstruturados";

/**
 * Fraunces e Work Sans — o par dos três modelos B2B.
 *
 * Por `next/font` e não por `<link>` para o Google Fonts: os arquivos
 * passam a ser servidos deste domínio, some a requisição a terceiro
 * (e o endereço IP do visitante que ia junto), e o texto não salta
 * quando a fonte chega.
 *
 * `opsz` é o que faz Fraunces valer a pena: o desenho muda com o
 * tamanho. Sem declarar o eixo aqui, só o peso viria e o CSS pediria
 * um eixo que o arquivo não tem. `SOFT` e `WONK` são os outros dois
 * eixos da família — WONK é o que dá o "g" e o "y" com a perna
 * torta que assina a fonte.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-titulo",
  axes: ["SOFT", "WONK", "opsz"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-corpo",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.neosenses.com.br"),
  title: {
    default: "NeoSenses | Experiências Transformadoras de Viagem",
    template: "%s | NeoSenses",
  },
  description:
    "Jornadas espirituais, retiros transformadores e experiências de viagem que elevam sua vibração. Descubra um novo sentir com a NeoSenses.",
  keywords: [
    "viagem espiritual",
    "retiro espiritual",
    "viagem transformadora",
    "autoconhecimento",
    "NeoSenses",
    "turismo espiritual",
    "retiro yoga",
    "peregrinação",
    "viagem com propósito",
  ],
  authors: [{ name: "NeoSenses" }],
  creator: "NeoSenses",
  publisher: "NeoSenses",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    // Sem `url` fixa. Estava chumbada em https://www.neosenses.com.br, que
    // hoje serve um site WordPress DIFERENTE deste — toda página deste site
    // dizia ao compartilhar "eu sou aquela outra página lá". Sem o campo, o
    // Next resolve pelo metadataBase e cada rota anuncia a si mesma.
    siteName: "NeoSenses",
    title: "NeoSenses | Experiências Transformadoras de Viagem",
    description:
      "Jornadas espirituais, retiros transformadores e experiências de viagem que elevam sua vibração.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NeoSenses — Um Novo Sentir",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NeoSenses | Experiências Transformadoras de Viagem",
    description:
      "Jornadas espirituais, retiros transformadores e experiências de viagem que elevam sua vibração.",
    images: ["/og-image.jpg"],
  },
  // `canonical` relativo, resolvido contra o metadataBase, e portanto válido
  // só para a home. Estava fixo no endereço da home e era herdado por todas
  // as páginas — o buscador lia cada experiência como cópia da home e
  // nenhuma delas seria indexada em separado. Cada página define a sua.
  //
  // `languages` saiu: apontava para /en e /es, que não existem. Declarar
  // versão de idioma inexistente é erro de rastreio, não ganho de alcance.
  // Sem `alternates` aqui.
  //
  // Havia `canonical: "/"` neste layout, e o merge de metadata do Next é raso
  // por campo: toda rota que não redefinisse herdava, declarando-se cópia da
  // home. Quatro páginas estavam assim em produção — /contato, /sobre,
  // /planejar e /legal/privacidade —, e as quatro aparecem no sitemap. O site
  // mandava indexar e a própria página mandava não indexar.
  //
  // O custo maior era em /contato: é a única página com endereço, CEP e
  // horário, ou seja, o ativo de busca local — e ela se autoexcluía do índice.
  //
  // Agora a home declara o dela em (site)/page.tsx, e rota nova nasce SEM
  // canonical em vez de nascer apontando para a home. Errar por omissão é
  // recuperável; errar apontando para outra página não aparece até alguém
  // conferir o Search Console.
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e4" },
    { media: "(prefers-color-scheme: dark)", color: "#16232b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${workSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-warm-white text-text-primary antialiased">
        {/* O framer-motion entrega o primeiro quadro com `opacity: 0` — é
            como ele anima, e vale para os cartões e para tudo que passa pelo
            `Surge`. Com o JavaScript desligado ou quebrado, esse primeiro
            quadro é o único que existe, e o catálogo inteiro fica invisível
            numa página que carregou por completo.

            Sete elementos de `/experiencias` estavam nessa situação. A regra
            abaixo só entra quando não há script para animar. */}
        <noscript>
          <style>{`[data-anima]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
        <JsonLd dados={organizacao()} />
      </body>
    </html>
  );
}
