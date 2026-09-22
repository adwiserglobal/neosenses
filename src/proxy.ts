/**
 * Roda antes de toda requisição que casa com o `matcher`.
 *
 * Chamava-se `middleware` até o Next 16.3, que renomeou a convenção para
 * `proxy` — o nome antigo virava confusão com middleware de Express, que é
 * outra coisa. Só mudou o nome do arquivo e o da função exportada.
 */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
