/**
 * A coluna que fecha a venda no funil do viajante: preço, próximas saídas
 * e os três caminhos de contato, em ordem de quem resolve mais rápido.
 *
 * Só aparece em página de viajante. Numa de facilitador ela mostraria
 * vaga e data para quem ainda vai formar o grupo.
 */

import { Calendar } from "lucide-react";
import { Interesse } from "@/components/experiencia/Interesse";
import { formatCurrency, linkWhatsApp, t } from "@/lib/utils";
import type { ExperienceDate, ExperienceWithRelations, I18nField } from "@/types/models";

function formatarPeriodo(inicio: string, fim: string): string {
  const opcoes: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  const d1 = new Date(`${inicio}T12:00:00Z`);
  const d2 = new Date(`${fim}T12:00:00Z`);
  return `${d1.toLocaleDateString("pt-BR", opcoes)} a ${d2.toLocaleDateString("pt-BR", opcoes)} de ${d2.getFullYear()}`;
}

export function LateralDeReserva({
  experiencia,
  titulo,
  urlReservas,
  rotuloReservas,
  mensagemWhatsApp,
}: {
  experiencia: ExperienceWithRelations;
  titulo: string;
  urlReservas: string;
  rotuloReservas: string;
  mensagemWhatsApp: string;
}) {
  const datas: ExperienceDate[] = experiencia.dates ?? [];

  return (
    <div className="sticky top-24 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-card">
      {experiencia.price_from ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-text-muted">A partir de</p>
          <p className="font-heading text-3xl text-secondary-500">
            {formatCurrency(experiencia.price_from, experiencia.price_currency)}
          </p>
          {experiencia.price_note && (
            <p className="mt-1 text-xs text-text-muted">
              {t(experiencia.price_note as I18nField, "pt")}
            </p>
          )}
        </div>
      ) : (
        <p className="font-heading text-xl text-primary-700">Valores sob consulta</p>
      )}

      <div className="border-t border-border pt-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary-700">
          <Calendar className="h-4 w-4" />
          Próximas saídas
        </h2>

        {datas.length > 0 ? (
          <ul className="space-y-3">
            {datas.map((d) => {
              const restantes =
                d.spots_total === null ? null : Math.max(0, d.spots_total - d.spots_taken);
              const esgotado = restantes === 0;

              return (
                <li
                  key={d.id}
                  className={`rounded-lg border p-3 ${
                    esgotado ? "border-border bg-warm-gray/40" : "border-border bg-warm-white"
                  }`}
                >
                  <p className="text-sm font-medium text-primary-700">
                    {formatarPeriodo(d.start_date, d.end_date)}
                  </p>
                  <p className={`text-xs ${esgotado ? "text-text-muted" : "text-success"}`}>
                    {restantes === null
                      ? "Consultar disponibilidade"
                      : esgotado
                      ? "Esgotado — entre na lista de espera"
                      : `${restantes} ${restantes === 1 ? "vaga" : "vagas"}`}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          // Dito com todas as letras: sem data cadastrada não se inventa
          // "em breve" nem se deixa um espaço mudo.
          <p className="text-sm text-text-muted">
            As próximas datas ainda não foram publicadas. Fale com a equipe para saber quando abre
            a próxima turma.
          </p>
        )}
      </div>

      {/* Reservar vem primeiro: é o único caminho que fecha sozinho. Os
          outros dois dependem de alguém da equipe responder depois.

          Abre em nova aba porque a plataforma é de terceiro: trocar a
          página por baixo de quem está lendo o roteiro perde a leitura e o
          contexto da escolha. */}
      {/* Reservar quando há plataforma cadastrada; consultar quando não há.
          Os dois nunca aparecem juntos: dar duas portas com o mesmo peso
          para a mesma intenção divide o clique e não aumenta a conversão. */}
      {urlReservas ? (
        <a
          href={urlReservas}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primario w-full"
        >
          {rotuloReservas}
        </a>
      ) : (
        <a
          href={linkWhatsApp(
            `Olá! Quero consultar a disponibilidade da experiência "${titulo}".`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primario w-full"
        >
          Consultar disponibilidade
        </a>
      )}

      <Interesse experienciaId={experiencia.id} titulo={titulo} datas={datas} />

      <a
        href={linkWhatsApp(mensagemWhatsApp)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-whatsapp w-full"
      >
        Prefiro falar no WhatsApp
      </a>
    </div>
  );
}
