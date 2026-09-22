/**
 * POST /api/concierge/feedback — o joinha da resposta do Concierge.
 *
 * Herdado do PATCH que existia na rota /api/concierge, removida por ser uma
 * segunda implementação do chat que ninguém chamava.
 *
 * Sem isto não há como saber se o Concierge ajuda ou atrapalha: o log conta
 * quantas respostas saíram, não quantas prestaram.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const corpo = await request.json().catch(() => null);
    if (!corpo) {
      return NextResponse.json({ success: false, error: "Corpo inválido" }, { status: 400 });
    }

    const { messageId, conversationId, rating, comment } = corpo as {
      messageId?: string;
      conversationId?: string;
      rating?: number;
      comment?: string;
    };

    if (!messageId || !RE_UUID.test(messageId)) {
      return NextResponse.json({ success: false, error: "messageId inválido" }, { status: 400 });
    }
    if (!conversationId || !RE_UUID.test(conversationId)) {
      return NextResponse.json({ success: false, error: "conversationId inválido" }, { status: 400 });
    }
    if (rating !== 1 && rating !== -1) {
      return NextResponse.json({ success: false, error: "rating deve ser 1 ou -1" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !chave) {
      console.warn("[feedback] service_role ausente — voto descartado");
      return NextResponse.json({ success: false, error: "Indisponível" }, { status: 503 });
    }

    const supabase = createClient<Database>(url, chave, { auth: { persistSession: false } });

    // upsert: trocar de ideia atualiza o voto em vez de acumular dois.
    // O índice único em message_id garante isso no banco.
    const { error } = await supabase.from("ai_feedback").upsert(
      {
        message_id: messageId,
        conversation_id: conversationId,
        rating,
        comment: typeof comment === "string" ? comment.slice(0, 500) : null,
      },
      { onConflict: "message_id" }
    );

    if (error) {
      console.error("[feedback] gravar:", error.message);
      return NextResponse.json({ success: false, error: "Não foi possível registrar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[feedback] erro inesperado:", err instanceof Error ? err.message : err);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
