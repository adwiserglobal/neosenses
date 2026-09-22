import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empacota o servidor com apenas as dependências que ele de fato usa, num
  // `.next/standalone` que roda com `node server.js`. É o que permite a
  // imagem Docker não levar `node_modules` inteiro — ~1,1 GB viram ~343 MB, e
  // em container o tamanho da imagem é tempo de partida a frio.
  //
  // Ligado SÓ quando o Dockerfile pede (BUILD_STANDALONE=1). Na Vercel ele
  // quebra o build:
  //
  //   ENOENT: no such file or directory, open '.next/next-server.js.nft.json'
  //
  // Os dois modos são excludentes. A Vercel consome o `.nft.json` — o trace
  // de arquivos que o `next build` normalmente emite — para montar a função
  // dela; com `standalone`, o Next produz `.next/standalone` no lugar, e a
  // Vercel procura um arquivo que não existe mais. O erro aparece no fim do
  // build, em "onBuildComplete", longe da linha que o causou.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
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
      // As fotos dos destinos são de licença livre e vêm de lá. Faltava:
      // a página de destinos servia as três fotos de cada card em tamanho
      // original, direto do Wikimedia — 1,5 MB por foto no celular.
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
      { source: "/marrocos-rosas", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-rosas/", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-caminhos-rosas-e-aromas-2", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-caminhos-rosas-e-aromas-2/", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-caminhos-rosas-e-aromas", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/marrocos-caminhos-rosas-e-aromas/", destination: "/experiencias/marrocos-rosas-e-aromas", permanent: true },
      { source: "/pacotes-de-viagens/india-milenar", destination: "/experiencias/peregrinacao-india-milenar", permanent: true },
      { source: "/pacotes-de-viagens/india-milenar/", destination: "/experiencias/peregrinacao-india-milenar", permanent: true },
      { source: "/machupicchu-xamanico", destination: "/experiencias/machu-picchu-xamanico", permanent: true },
      { source: "/machupicchu-xamanico/", destination: "/experiencias/machu-picchu-xamanico", permanent: true },
      { source: "/mariamadalena", destination: "/experiencias/caminho-maria-madalena", permanent: true },
      { source: "/mariamadalena/", destination: "/experiencias/caminho-maria-madalena", permanent: true },
      { source: "/roteiro-tailandia", destination: "/experiencias/jornada-espiritual-tailandia", permanent: true },
      { source: "/roteiro-tailandia/", destination: "/experiencias/jornada-espiritual-tailandia", permanent: true },
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
