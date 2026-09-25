import type { NextConfig } from "next";

const openRouterConfigurado = Boolean(process.env.OPENROUTER_API_KEY?.trim());
const provedorDeIA = openRouterConfigurado
  ? "openrouter"
  : process.env.AI_PROVIDER?.trim();
const modeloDeIA = openRouterConfigurado
  ? process.env.AI_MODEL?.trim() || "openrouter/free"
  : process.env.AI_MODEL?.trim();

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  env: {
    ...(provedorDeIA ? { AI_PROVIDER: provedorDeIA } : {}),
    ...(modeloDeIA ? { AI_MODEL: modeloDeIA } : {}),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "www.neosenses.com.br",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Legacy WordPress redirects
      { source: "/sobre-nos", destination: "/sobre", permanent: true },
      { source: "/sobre-nos/", destination: "/sobre", permanent: true },
      { source: "/contatos", destination: "/contato", permanent: true },
      { source: "/contatos/", destination: "/contato", permanent: true },
      { source: "/exibir-roteiros", destination: "/experiencias", permanent: true },
      { source: "/exibir-roteiros/", destination: "/experiencias", permanent: true },

      // Jornadas migradas para o novo padrão de experiências.
      { source: "/tailandia-iluminada", destination: "/experiencias/tailandia-iluminada", permanent: true },
      { source: "/tailandia-iluminada/", destination: "/experiencias/tailandia-iluminada", permanent: true },
      { source: "/roteiro-tailandia", destination: "/experiencias/tailandia-iluminada", permanent: true },
      { source: "/roteiro-tailandia/", destination: "/experiencias/tailandia-iluminada", permanent: true },
      { source: "/experiencias/jornada-espiritual-tailandia", destination: "/experiencias/tailandia-iluminada", permanent: true },

      { source: "/roteiros/chapadaveadeiros", destination: "/experiencias/chapada-dos-veadeiros", permanent: true },
      { source: "/roteiros/chapadaveadeiros/", destination: "/experiencias/chapada-dos-veadeiros", permanent: true },

      { source: "/machupicchu-xamanico", destination: "/experiencias/machu-picchu-xamanico", permanent: true },
      { source: "/machupicchu-xamanico/", destination: "/experiencias/machu-picchu-xamanico", permanent: true },

      { source: "/mariamadalena", destination: "/experiencias/caminho-de-maria-madalena", permanent: true },
      { source: "/mariamadalena/", destination: "/experiencias/caminho-de-maria-madalena", permanent: true },
      { source: "/roteiros/maria-madalena", destination: "/experiencias/caminho-de-maria-madalena", permanent: true },
      { source: "/roteiros/maria-madalena/", destination: "/experiencias/caminho-de-maria-madalena", permanent: true },
      { source: "/experiencias/caminho-maria-madalena", destination: "/experiencias/caminho-de-maria-madalena", permanent: true },

      { source: "/pacotes-de-viagens/india-milenar", destination: "/experiencias/india-milenar", permanent: true },
      { source: "/pacotes-de-viagens/india-milenar/", destination: "/experiencias/india-milenar", permanent: true },
      { source: "/experiencias/peregrinacao-india-milenar", destination: "/experiencias/india-milenar", permanent: true },

      { source: "/marrocos-rosas", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-rosas/", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-caminhos-rosas-e-aromas-2", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-caminhos-rosas-e-aromas-2/", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-caminhos-rosas-e-aromas", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-caminhos-rosas-e-aromas/", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },

      { source: "/pacotes-de-viagens/despertar-na-floresta", destination: "/experiencias/despertar-na-floresta", permanent: true },
      { source: "/pacotes-de-viagens/despertar-na-floresta/", destination: "/experiencias/despertar-na-floresta", permanent: true },
      { source: "/imersao-plant-based", destination: "/experiencias/imersao-plant-based", permanent: true },
      { source: "/imersao-plant-based/", destination: "/experiencias/imersao-plant-based", permanent: true },
      { source: "/pacotes-de-viagens/jornada-espiritual-egito", destination: "/experiencias/jornada-espiritual-egito", permanent: true },
      { source: "/pacotes-de-viagens/jornada-espiritual-egito/", destination: "/experiencias/jornada-espiritual-egito", permanent: true },
      { source: "/politica-de-privacidade", destination: "/legal/privacidade", permanent: true },
      { source: "/politica-de-privacidade/", destination: "/legal/privacidade", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
