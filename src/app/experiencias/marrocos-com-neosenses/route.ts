import { NextResponse } from "next/server";

const ORIGEM = "https://marrocos-com-neosenses.netlify.app/";

export const revalidate = 3600;

export async function GET() {
  try {
    const resposta = await fetch(ORIGEM, {
      headers: {
        "User-Agent": "NeoSenses-Maroccos-Experience/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 },
    });

    if (!resposta.ok) {
      throw new Error(`Origem respondeu ${resposta.status}`);
    }

    let html = await resposta.text();

    const headExtra = `
      <base href="${ORIGEM}">
      <link rel="canonical" href="/experiencias/marrocos-com-neosenses">
      <meta name="robots" content="index,follow">
    `;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${headExtra}`);
    } else {
      html = `<!doctype html><html lang="pt-BR"><head>${headExtra}<title>Marrocos com NeoSenses</title></head><body>${html}</body></html>`;
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (erro) {
    console.error(
      "[marrocos] falha ao servir landing:",
      erro instanceof Error ? erro.message : erro
    );

    const fallback = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Marrocos com NeoSenses</title>
  <link rel="canonical" href="/experiencias/marrocos-com-neosenses">
</head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#f7f4ed;color:#15382f;display:grid;min-height:100vh;place-items:center">
  <main style="max-width:560px;padding:32px;text-align:center">
    <h1>Marrocos com NeoSenses</h1>
    <p>A experiência está temporariamente indisponível neste endereço.</p>
    <a href="${ORIGEM}" style="color:#9a6b2f">Abrir a página original</a>
  </main>
</body>
</html>`;

    return new NextResponse(fallback, {
      status: 502,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
