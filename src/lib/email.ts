/**
 * E-mail transacional.
 *
 * O Resend estava instalado e configurado desde o início do projeto e nunca
 * foi chamado por ninguém: um lead entrava no banco e ficava lá, esperando
 * alguém abrir o painel. Numa operação pequena, isso é o mesmo que perder o
 * contato — quem pede orçamento de vinte mil reais e recebe silêncio por dois
 * dias já falou com outra agência.
 *
 * Duas regras que valem para tudo aqui:
 *
 *   1. Falha de e-mail nunca derruba a ação. O lead já está gravado quando
 *      esta função roda; se o envio falhar, registra-se o erro e segue. O
 *      contrário — perder o lead porque o e-mail caiu — é inaceitável.
 *
 *   2. Nada de conteúdo inventado. O e-mail diz o que aconteceu e o que vem
 *      a seguir, sem prometer prazo que a equipe não combinou.
 *
 * Roda apenas no servidor.
 */

import { Resend } from "resend";

const REMETENTE_PADRAO = "NeoSenses <contato@neosenses.com.br>";

/** Para onde vão os avisos internos. Sem isto, a equipe não fica sabendo. */
function destinoDaEquipe(): string | null {
  return process.env.EMAIL_EQUIPE?.trim() || process.env.ADMIN_EMAIL?.trim() || null;
}

function cliente(): Resend | null {
  const chave = process.env.RESEND_API_KEY?.trim();
  // Chave de exemplo passa na validação de presença e falha só no envio,
  // quando já é tarde para avisar.
  if (!chave || chave.length < 20 || chave.startsWith("re_xxx")) return null;
  return new Resend(chave);
}

/** Escapa texto que vem do visitante antes de entrar no HTML do e-mail. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Envio {
  para: string | string[];
  assunto: string;
  html: string;
  texto: string;
  responderPara?: string;
}

/**
 * Envia e nunca lança.
 *
 * Quem chama está no meio de uma ação do visitante e não deve nem precisar
 * saber que o e-mail existe.
 */
async function enviar({ para, assunto, html, texto, responderPara }: Envio): Promise<boolean> {
  const resend = cliente();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY ausente — "${assunto}" não foi enviado`);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_REMETENTE?.trim() || REMETENTE_PADRAO,
      to: Array.isArray(para) ? para : [para],
      subject: assunto,
      html,
      text: texto,
      ...(responderPara ? { replyTo: responderPara } : {}),
    });

    if (error) {
      console.error(`[email] falha ao enviar "${assunto}":`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] erro inesperado em "${assunto}":`, err instanceof Error ? err.message : err);
    return false;
  }
}

// ── Moldura ────────────────────────────────────────────────────────────────
/**
 * Estilo em atributo, e não em folha: cliente de e-mail ignora <style> com
 * frequência, e o Gmail remove a tag inteira.
 */
function moldura(titulo: string, corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(titulo)}</title></head>
<body style="margin:0;padding:24px;background:#f1f4f1;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#141c18">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d6ddd7;border-radius:12px;overflow:hidden">
    <div style="background:#1e3a34;padding:20px 24px">
      <p style="margin:0;color:#fff;font-size:18px;letter-spacing:0.02em">NeoSenses</p>
    </div>
    <div style="padding:24px">${corpo}</div>
    <div style="padding:16px 24px;border-top:1px solid #d6ddd7;background:#f7f9f7">
      <p style="margin:0;font-size:12px;color:#6e7d75">
        NeoSenses — experiências de viagem transformadoras<br>
        <a href="https://wa.me/5511947188319" style="color:#1e3a34">WhatsApp</a> ·
        <a href="mailto:contato@neosenses.com.br" style="color:#1e3a34">contato@neosenses.com.br</a>
      </p>
    </div>
  </div>
</body></html>`;
}

// ── Aviso interno de novo contato ──────────────────────────────────────────
export interface AvisoDeLead {
  nome: string;
  email?: string | null;
  telefone?: string | null;
  mensagem?: string | null;
  origem: string;
  experiencia?: string | null;
  saida?: string | null;
  listaDeEspera?: boolean;
}

export async function avisarEquipeDeLead(dados: AvisoDeLead): Promise<boolean> {
  const destino = destinoDaEquipe();
  if (!destino) {
    console.warn("[email] EMAIL_EQUIPE não configurado — ninguém foi avisado do novo contato");
    return false;
  }

  const linhas: Array<[string, string]> = [["Nome", dados.nome]];
  if (dados.email) linhas.push(["E-mail", dados.email]);
  if (dados.telefone) linhas.push(["WhatsApp", dados.telefone]);
  if (dados.experiencia) linhas.push(["Experiência", dados.experiencia]);
  if (dados.saida) linhas.push(["Saída", dados.saida]);
  linhas.push(["Origem", dados.origem]);

  const assunto = dados.listaDeEspera
    ? `Lista de espera: ${dados.nome}`
    : `Novo contato: ${dados.nome}${dados.experiencia ? ` — ${dados.experiencia}` : ""}`;

  const tabela = linhas
    .map(
      ([r, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6e7d75;font-size:14px;white-space:nowrap">${escapar(
          r
        )}</td><td style="padding:6px 0;font-size:14px">${escapar(v)}</td></tr>`
    )
    .join("");

  const corpo = `
    <p style="margin:0 0 4px;font-size:13px;color:#6e7d75;text-transform:uppercase;letter-spacing:0.1em">
      ${dados.listaDeEspera ? "Lista de espera" : "Novo contato"}
    </p>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:600">${escapar(dados.nome)}</h1>
    <table style="border-collapse:collapse;width:100%">${tabela}</table>
    ${
      dados.mensagem
        ? `<div style="margin-top:16px;padding:12px;background:#f1f4f1;border-radius:8px">
             <p style="margin:0;font-size:14px;white-space:pre-line">${escapar(dados.mensagem)}</p>
           </div>`
        : ""
    }
    ${
      dados.listaDeEspera
        ? `<p style="margin:16px 0 0;padding:10px 12px;background:#f7eae4;border-radius:8px;font-size:14px;color:#9e4526">
             Esta saída está lotada. Avise se abrir vaga ou se for aberta turma nova.
           </p>`
        : ""
    }`;

  const texto = [
    dados.listaDeEspera ? "LISTA DE ESPERA" : "NOVO CONTATO",
    "",
    ...linhas.map(([r, v]) => `${r}: ${v}`),
    dados.mensagem ? `\nMensagem:\n${dados.mensagem}` : "",
  ].join("\n");

  return enviar({
    para: destino,
    assunto,
    html: moldura(assunto, corpo),
    texto,
    // Responder no cliente de e-mail já escreve para a pessoa certa.
    responderPara: dados.email ?? undefined,
  });
}

// ── Confirmação para quem entrou em contato ────────────────────────────────
export interface ConfirmacaoDeContato {
  para: string;
  nome: string;
  experiencia?: string | null;
  saida?: string | null;
  listaDeEspera?: boolean;
}

export async function confirmarContato(dados: ConfirmacaoDeContato): Promise<boolean> {
  const primeiroNome = dados.nome.split(/\s+/)[0];

  const assunto = dados.listaDeEspera
    ? "Você entrou na lista de espera"
    : "Recebemos seu contato";

  // Sem prazo prometido que a equipe não combinou. "Assim que possível" é
  // honesto; "em até 2 horas" vira promessa quebrada num fim de semana.
  const corpo = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:600">
      ${dados.listaDeEspera ? "Você está na lista de espera" : `Olá, ${escapar(primeiroNome)}`}
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6">
      ${
        dados.listaDeEspera
          ? `Registramos seu interesse${
              dados.experiencia ? ` em <strong>${escapar(dados.experiencia)}</strong>` : ""
            }${dados.saida ? `, na saída de ${escapar(dados.saida)}` : ""}. Esta turma está completa.`
          : `Recebemos sua mensagem${
              dados.experiencia ? ` sobre <strong>${escapar(dados.experiencia)}</strong>` : ""
            } e nossa equipe vai entrar em contato.`
      }
    </p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6">
      ${
        dados.listaDeEspera
          ? "Se abrir vaga — ou se abrirmos uma turma nova para este destino —, você é avisado antes de anunciarmos."
          : "Se preferir conversar agora, é só chamar no WhatsApp."
      }
    </p>
    <p style="margin:20px 0 0">
      <a href="https://wa.me/5511947188319"
         style="display:inline-block;background:#157a3a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">
        Falar no WhatsApp
      </a>
    </p>`;

  const texto = [
    dados.listaDeEspera ? "Você está na lista de espera" : `Olá, ${primeiroNome}`,
    "",
    dados.listaDeEspera
      ? `Registramos seu interesse${dados.experiencia ? ` em ${dados.experiencia}` : ""}. Esta turma está completa, e avisamos se abrir vaga.`
      : `Recebemos sua mensagem${dados.experiencia ? ` sobre ${dados.experiencia}` : ""} e nossa equipe vai entrar em contato.`,
    "",
    "WhatsApp: https://wa.me/5511947188319",
  ].join("\n");

  return enviar({ para: dados.para, assunto, html: moldura(assunto, corpo), texto });
}

// ── Roteiro montado ────────────────────────────────────────────────────────
export async function enviarRoteiro(
  para: string,
  nome: string,
  titulo: string,
  resumo: string,
  link: string | null
): Promise<boolean> {
  const primeiroNome = nome.split(/\s+/)[0];
  const assunto = `Seu roteiro: ${titulo}`;

  const corpo = `
    <h1 style="margin:0 0 12px;font-size:20px;font-weight:600">Olá, ${escapar(primeiroNome)}</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6">
      Guardamos o roteiro que você montou no site.
    </p>
    <div style="padding:16px;background:#f1f4f1;border-radius:8px;margin-bottom:16px">
      <p style="margin:0 0 6px;font-size:16px;font-weight:600">${escapar(titulo)}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#4a5a52">${escapar(resumo)}</p>
    </div>
    ${
      link
        ? `<p style="margin:0 0 16px">
             <a href="${escapar(link)}" style="display:inline-block;background:#1e3a34;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">
               Ver o roteiro completo
             </a>
           </p>`
        : ""
    }
    <p style="margin:0;font-size:14px;line-height:1.6;color:#4a5a52">
      Este roteiro é um ponto de partida. Quem monta a viagem de verdade é a nossa equipe, com
      datas, valores e o que faz sentido para você.
    </p>`;

  const texto = [
    `Olá, ${primeiroNome}`,
    "",
    `Guardamos o roteiro que você montou: ${titulo}`,
    "",
    resumo,
    link ? `\nVer completo: ${link}` : "",
    "",
    "Este roteiro é um ponto de partida. A equipe monta a viagem com você.",
  ].join("\n");

  return enviar({ para, assunto, html: moldura(assunto, corpo), texto });
}
