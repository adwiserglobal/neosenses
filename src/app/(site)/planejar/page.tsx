"use client";

/**
 * /planejar — o Journey Builder.
 *
 * Questionário e resultado na mesma rota: quem acabou de responder vê o
 * roteiro sem recarregar. Para voltar depois, existe /roteiro/[token], gerado
 * ao salvar.
 */

import { useState } from "react";
import { Questionario } from "@/components/journey/Questionario";
import { RoteiroPronto } from "@/components/journey/RoteiroPronto";
import type { Roteiro } from "@/lib/journey/roteiro";
import { Capa } from "@/components/templates/base";

export default function PlanejarPage() {
  const [resultado, setResultado] = useState<{ roteiro: Roteiro; token: string | null } | null>(null);

  return (
    <>
      {!resultado && (
        <Capa
          chapeu="Montador de roteiro"
          titulo="Vamos desenhar sua jornada"
          resumo="Oito perguntas, três minutos. No fim, um caminho pensado a partir do que você contar — com as experiências que estão abertas de verdade."
          imagem="/images/b2b/peru-montanhas-coloridas.jpg"
          alinhamento="centro"
        />
      )}

      <section className={resultado ? "pb-20 pt-32 md:pt-40" : "py-14 md:py-20"}>
        <div className="container-content">
          {resultado ? (
            <RoteiroPronto
              roteiro={resultado.roteiro}
              token={resultado.token}
              aoRecomecar={() => {
                setResultado(null);
                window.scrollTo({ top: 0 });
              }}
            />
          ) : (
            <Questionario aoConcluir={(roteiro, token) => {
              setResultado({ roteiro, token });
              window.scrollTo({ top: 0 });
            }} />
          )}
        </div>
      </section>
    </>
  );
}
