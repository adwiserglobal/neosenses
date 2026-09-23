import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marrocos com NeoSenses",
  description: "Conheça a experiência da NeoSenses no Marrocos.",
  alternates: { canonical: "/experiencias/marrocos-com-neosenses" },
};

export default function MarrocosComNeoSensesPage() {
  return (
    <main className="fixed inset-0 z-[9999] bg-white">
      <iframe
        src="/api/legacy/marrocos"
        title="Marrocos com NeoSenses"
        className="h-[100dvh] w-full border-0 bg-white"
        allow="fullscreen"
      />
      <noscript>
        <p>
          Esta experiência precisa de JavaScript para carregar. Acesse a página original em{" "}
          <a href="https://marrocos-com-neosenses.netlify.app/">
            marrocos-com-neosenses.netlify.app
          </a>
          .
        </p>
      </noscript>
    </main>
  );
}
