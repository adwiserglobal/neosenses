/**
 * Os blocos que dizem a quem a página está falando.
 *
 * Duas conversas diferentes moram no mesmo site:
 *
 * - VIAJANTE (B2C) compra uma vaga numa data. Tem preço, tem calendário,
 *   tem botão de reserva.
 * - FACILITADOR (B2B) traz o próprio grupo. Não tem data nem vaga: tem uma
 *   conversa com a consultora, e o que se decide nela é o roteiro.
 *
 * Misturar as duas custa venda dos dois lados — "3 vagas restantes" numa
 * página feita para quem vai formar o grupo, ou "fale com a consultora"
 * para quem só queria saber quanto custa e quando sai.
 *
 * Daí a ponte: cada lado do site oferece o outro, uma vez, no lugar certo.
 */

import Link from "next/link";
import Image from "next/image";
import { linkWhatsApp, podeOtimizar } from "@/lib/utils";
import { Chapeu, Faixa, type Fundo, ehEscuro } from "./blocos";

// ── Parceria ───────────────────────────────────────────────────────────────
/**
 * "Você conduz o grupo. A NeoSenses sustenta a jornada."
 *
 * As duas colunas dos três modelos. A da esquerda é o que a facilitadora
 * traz; a da direita, o que a empresa faz. Sem uma das duas listas o bloco
 * não é desenhado — meia balança não comunica troca, comunica pedido.
 */
export function Parceria({
  titulo,
  chapeu,
  texto,
  facilitador,
  neosenses,
  fundo = "clara",
}: {
  titulo: string;
  chapeu?: string;
  texto?: string;
  facilitador: string[];
  neosenses: string[];
  fundo?: Fundo;
}) {
  if (facilitador.length === 0 || neosenses.length === 0) return null;
  const escuro = ehEscuro(fundo);

  const colunas = [
    { rotulo: "Você traz", itens: facilitador, destaque: false },
    { rotulo: "A NeoSenses cuida de", itens: neosenses, destaque: true },
  ];

  return (
    <Faixa fundo={fundo} id="parceria">
      {chapeu && (
        <Chapeu escuro={escuro} comRisco className="mb-4">
          {chapeu}
        </Chapeu>
      )}
      <h2
        className={`max-w-3xl font-heading text-3xl md:text-4xl ${
          escuro ? "text-warm-white" : "text-primary-700"
        }`}
      >
        {titulo}
      </h2>
      {texto && (
        <p
          className={`mt-5 max-w-[68ch] text-lg leading-relaxed ${
            escuro ? "text-warm-white/75" : "text-text-muted"
          }`}
        >
          {texto}
        </p>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {colunas.map((coluna) => (
          <div
            key={coluna.rotulo}
            className={`rounded-2xl border p-8 ${
              coluna.destaque
                ? escuro
                  ? "border-secondary-300/40 bg-warm-white/[0.08]"
                  : "border-secondary-300/60 bg-secondary-50"
                : escuro
                ? "border-warm-white/15"
                : "border-border bg-surface"
            }`}
          >
            <h3
              className={`font-heading text-xl ${escuro ? "text-warm-white" : "text-primary-700"}`}
            >
              {coluna.rotulo}
            </h3>
            <ul className="mt-6 space-y-4">
              {coluna.itens.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                      escuro ? "bg-secondary-300" : "bg-secondary-400"
                    }`}
                  />
                  <span
                    className={`leading-relaxed ${
                      escuro ? "text-warm-white/80" : "text-text-primary/85"
                    }`}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Faixa>
  );
}

// ── Fechamento ─────────────────────────────────────────────────────────────
/**
 * O último bloco. Nos três modelos ele se chama "O convite", e é onde a
 * página pede a conversa.
 *
 * Sem título cadastrado, o bloco não aparece. É de propósito: um convite
 * genérico no fim de uma página específica soa como rodapé de modelo, e
 * quem chegou até aqui merece uma frase que fale da jornada que leu.
 */
export function Fechamento({
  chapeu,
  titulo,
  texto,
  imagem,
  rotuloAcao,
  mensagemWhatsApp,
}: {
  chapeu?: string;
  titulo?: string;
  texto?: string;
  imagem?: string | null;
  rotuloAcao?: string;
  mensagemWhatsApp: string;
}) {
  if (!titulo) return null;

  return (
    <section className="relative overflow-hidden bg-primary-800 py-24 md:py-32">
      {imagem && (
        <>
          <Image
            src={imagem}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            unoptimized={!podeOtimizar(imagem)}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-primary-800/80" />
        </>
      )}

      <div className="container-content relative z-10 text-center">
        {chapeu && (
          <Chapeu escuro className="mb-5">
            {chapeu}
          </Chapeu>
        )}
        <h2 className="mx-auto max-w-3xl font-heading text-3xl text-warm-white md:text-4xl">
          {titulo}
        </h2>
        {texto && (
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-white/75">{texto}</p>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href={linkWhatsApp(mensagemWhatsApp)} target="_blank" rel="noopener noreferrer" className="btn-primario">
            {rotuloAcao ?? "Falar com a consultora"}
          </a>
          <Link href="/contato" className="btn-secundario btn-secundario-claro">
            Enviar uma mensagem
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── A ponte: B2C → B2B ─────────────────────────────────────────────────────
/**
 * Convite ao facilitador, dentro das páginas de viajante.
 *
 * Fica no fim da leitura, não no meio: quem está avaliando uma jornada
 * para si não deve tropeçar numa proposta comercial antes de decidir. Quem
 * conduz grupo, por outro lado, costuma chegar por uma página dessas —
 * lendo como cliente e pensando como facilitador — e hoje não encontrava
 * nenhuma porta.
 */
export function ConviteAoFacilitador({ imagem }: { imagem?: string | null }) {
  return (
    <section className={`relative overflow-hidden ${imagem ? "bg-forest-800" : "bg-forest-700"}`}>
      {imagem && (
        <>
          <Image
            src={imagem}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            unoptimized={!podeOtimizar(imagem)}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-forest-800/88" />
        </>
      )}

      <div className="container-wide relative z-10 py-20 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_auto]">
          <div>
            <Chapeu escuro comRisco className="mb-5">
              Para quem conduz
            </Chapeu>
            <h2 className="max-w-2xl font-heading text-3xl text-warm-white md:text-4xl">
              Seu grupo já confia em você. Falta o lugar à altura do trabalho.
            </h2>
            <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-warm-white/80">
              Você conduz há anos — na sala, no círculo, na mesa de reiki. Já viu o
              que acontece quando alguém se permite. Agora imagine esse mesmo grupo
              num lugar onde a montanha faz metade do trabalho por você.
            </p>
            <p className="mt-4 max-w-[62ch] leading-relaxed text-warm-white/80">
              O que trava não é a vontade: é a logística. Passagem, hospedagem, guia,
              seguro, o imprevisto às onze da noite num país que não é o seu. Essa
              parte é nossa — para que a sua parte continue sendo a sua.
            </p>
            <p className="mt-4 max-w-[62ch] leading-relaxed text-warm-white/65">
              Sem pacote pronto e sem data imposta. O roteiro nasce da intenção que
              você já tem para essas pessoas.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:min-w-[16rem]">
            <Link href="/para-facilitadores" className="btn-primario w-full">
              Levar meu grupo
            </Link>
            <a
              href={linkWhatsApp(
                "Olá! Sou terapeuta/facilitadora e quero levar meu grupo numa jornada. Podemos conversar?"
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secundario btn-secundario-claro w-full"
            >
              Falar com a consultora
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── A ponte: B2B → B2C ─────────────────────────────────────────────────────
/**
 * O caminho de volta. Nem todo mundo que abre uma página de facilitador
 * conduz grupo — parte chega procurando uma viagem para si e, sem esta
 * saída, sai do site achando que a NeoSenses não vende para pessoas.
 */
export function ConviteAoViajante() {
  return (
    <Faixa fundo="clara" largura="content">
      <div className="rounded-2xl border border-border bg-warm-white px-8 py-10 text-center">
        <Chapeu className="mb-4">Para viver, não para conduzir</Chapeu>
        <h2 className="mx-auto max-w-2xl font-heading text-2xl text-primary-700 md:text-3xl">
          Desta vez você quer ser quem chega, não quem organiza
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-text-muted">
          As jornadas com data aberta recebem viajantes um a um, em grupos pequenos,
          com quem conhece o território. Ninguém precisa vir acompanhado — a maior
          parte do grupo chega sozinha, e é justamente isso que forma o círculo.
        </p>
        <Link href="/experiencias" className="btn-secundario mt-8">
          Ver as jornadas com data
        </Link>
      </div>
    </Faixa>
  );
}
