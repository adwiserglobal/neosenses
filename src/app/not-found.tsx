import Link from "next/link";
export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 text-6xl">✦</div>
      <h1 className="mb-4 font-heading text-4xl text-primary-700">
        Página não encontrada
      </h1>
      <p className="mb-8 max-w-md text-text-muted">
        A página que você procura pode ter sido movida ou não existe mais.
        Que tal explorar nossas experiências transformadoras?
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/"
          className="rounded-lg bg-secondary-600 hover:bg-secondary-700 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
        >
          Voltar ao Início
        </Link>
        <Link href="/experiencias"
          className="rounded-lg border border-border px-8 py-3.5 text-sm font-medium text-primary-700 transition-all hover:border-secondary-500 hover:text-secondary-500"
        >
          Ver Experiências
        </Link>
      </div>
    </section>
  );
}
