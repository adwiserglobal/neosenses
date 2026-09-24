export default function SiteLoading() {
  return (
    <div className="min-h-[60vh] bg-warm-white pt-24" role="status" aria-live="polite">
      <div className="fixed left-0 right-0 top-[72px] z-40 h-0.5 overflow-hidden bg-secondary-200/40">
        <div className="h-full w-full animate-pulse bg-secondary-500" />
      </div>
      <div className="container-content py-20">
        <div className="mx-auto max-w-3xl animate-pulse space-y-5">
          <div className="h-3 w-28 rounded-full bg-warm-gray" />
          <div className="h-10 w-4/5 rounded-xl bg-warm-gray" />
          <div className="h-4 w-full rounded-full bg-warm-gray/80" />
          <div className="h-4 w-3/4 rounded-full bg-warm-gray/80" />
        </div>
      </div>
      <span className="sr-only">Carregando página…</span>
    </div>
  );
}
