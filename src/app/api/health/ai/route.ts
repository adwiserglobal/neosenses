/**
 * GET /api/health/ai — diagnóstico da integração de IA.
 *
 * Serve para saber se o Concierge tem chance de responder antes de abrir o
 * chat: provedor detectado, modelo resolvido e uma chamada real de ida e volta.
 *
 * Em produção a resposta é reduzida de propósito. Nome de modelo, mensagem de
 * erro do provedor e latência dizem mais sobre a infraestrutura do que um
 * endpoint público precisa dizer.
 */

import { NextResponse } from "next/server";
import { testAIConnection, validateAIConfig } from "@/lib/ai/provider";
import { usuarioAtual } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

/**
 * Resultado em cache.
 *
 * Cada verificação é uma chamada real e paga ao provedor. Sem cache, uma
 * rota pública viraria torneira de custo: um laço de requisições consome a
 * cota do modelo e derruba o Concierge para os visitantes de verdade.
 *
 * Cinco minutos bastam para diagnóstico — quem acabou de trocar a chave usa
 * `?forcar=1`, que exige sessão.
 */
const CACHE_MS = 5 * 60_000;
let ultimoTeste: { em: number; resposta: Awaited<ReturnType<typeof testAIConnection>> } | null = null;

export async function GET(request: Request) {
  const emDesenvolvimento = process.env.NODE_ENV !== "production";

  // Em produção a rota é da equipe. Anônimo recebe 404, não 401: um 401
  // confirma que o endereço existe e convida a insistir.
  const perfil = emDesenvolvimento ? null : await usuarioAtual();
  if (!emDesenvolvimento && (!perfil || !perfil.is_active)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const forcar = new URL(request.url).searchParams.get("forcar") === "1";

  const config = validateAIConfig();
  if (!config.valid) {
    return NextResponse.json(
      {
        ok: false,
        etapa: "configuracao",
        ...(emDesenvolvimento ? { erro: config.error } : {}),
      },
      { status: 503 }
    );
  }

  const emCache = ultimoTeste && !forcar && Date.now() - ultimoTeste.em < CACHE_MS;
  const teste = emCache ? ultimoTeste!.resposta : await testAIConnection();
  if (!emCache) ultimoTeste = { em: Date.now(), resposta: teste };

  if (!teste.success) {
    return NextResponse.json(
      {
        ok: false,
        etapa: "chamada",
        ...(emDesenvolvimento
          ? { provider: teste.provider, errorCode: teste.errorCode, erro: teste.error }
          : {}),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    ...(emDesenvolvimento
      ? { provider: teste.provider, model: teste.model, responseTimeMs: teste.responseTimeMs }
      : {}),
  });
}
