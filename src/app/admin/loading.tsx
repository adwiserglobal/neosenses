/**
 * Feedback imediato ao navegar no painel.
 *
 * As páginas do /admin são dinâmicas (sessão + banco). Sem este arquivo o
 * clique parecia não fazer nada até o servidor terminar; com ele a barra de
 * progresso e o esqueleto aparecem na hora, e o menu lateral continua no lugar.
 */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-7">
      <div className="fixed left-0 right-0 top-0 z-50 h-0.5 overflow-hidden bg-[#e0d4c4]">
        <div className="h-full w-1/3 animate-pulse bg-[#d6a72d]" />
      </div>
      <div className="animate-pulse space-y-4">
        <div className="h-36 rounded-[28px] bg-[#e9dcc8]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#efe5d3]" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-[#efe5d3]" />
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
