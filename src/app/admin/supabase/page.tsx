/**
 * /admin/supabase — estado da instalação.
 *
 * Responde de uma olhada: a qual banco o site está falando, se as migrations
 * subiram, se o RLS está fechado, o que falta configurar e se a IA responde.
 *
 * Não há campo para gravar credencial aqui, e é de propósito. Explicado na
 * própria tela, na seção "Onde ficam as credenciais".
 */

import { coletarDiagnostico, type Severidade } from "@/lib/diagnostico";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Supabase",
  robots: { index: false, follow: false },
};

const ESTILO: Record<Severidade, { caixa: string; marca: string; rotulo: string }> = {
  ok: { caixa: "border-success/30 bg-success/5", marca: "bg-success", rotulo: "Tudo certo" },
  atencao: { caixa: "border-amber-300 bg-amber-50", marca: "bg-amber-500", rotulo: "Atenção" },
  erro: { caixa: "border-red-300 bg-red-50", marca: "bg-red-500", rotulo: "Problema" },
};

export default async function PaginaSupabase() {
  const d = await coletarDiagnostico();

  const problemas = d.verificacoes.filter((v) => v.situacao === "erro").length;
  const alertas = d.verificacoes.filter((v) => v.situacao === "atencao").length;

  const tabelasSensiveisExpostas = d.tabelas.filter((t) => t.acesso_anonimo && t.linhas > 0);
  const semRLS = d.tabelas.filter((t) => !t.rls_ligado);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl text-primary-700">Supabase</h1>
        <p className="mt-1 text-sm text-text-muted">
          Estado da conexão, das migrations e da segurança de acesso aos dados.
        </p>
      </header>

      {/* ── Resumo ─────────────────────────────────────────────────────── */}
      <section
        className={`rounded-xl border p-5 ${
          problemas > 0 ? ESTILO.erro.caixa : alertas > 0 ? ESTILO.atencao.caixa : ESTILO.ok.caixa
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-muted">Ambiente</p>
            <p className="font-medium text-primary-700">
              {d.ambiente === "local" ? "Local (desenvolvimento)" : d.ambiente === "nuvem" ? "Nuvem" : "Indefinido"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-text-muted">Endereço</p>
            <p className="truncate font-mono text-sm text-text-primary">{d.url || "não configurado"}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-semibold text-primary-700">
              {problemas > 0
                ? `${problemas} problema${problemas > 1 ? "s" : ""}`
                : alertas > 0
                ? `${alertas} ponto${alertas > 1 ? "s" : ""} de atenção`
                : "Tudo certo"}
            </p>
            <p className="text-xs text-text-muted">{d.verificacoes.length} verificações</p>
          </div>
        </div>
      </section>

      {/* ── Verificações ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg text-primary-700">Verificações</h2>
        {d.verificacoes.map((v) => (
          <div key={v.titulo} className={`rounded-lg border p-4 ${ESTILO[v.situacao].caixa}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ESTILO[v.situacao].marca}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-primary-700">
                  {v.titulo}
                  <span className="sr-only"> — {ESTILO[v.situacao].rotulo}</span>
                </p>
                <p className="mt-0.5 text-sm text-text-primary">{v.detalhe}</p>
                {v.comoResolver && (
                  <p className="mt-2 rounded bg-white/60 px-3 py-2 text-sm text-text-muted">
                    <strong className="font-medium text-primary-700">Como resolver:</strong> {v.comoResolver}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Variáveis faltando ─────────────────────────────────────────── */}
      {d.variaveisFaltando.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg text-primary-700">Falta configurar</h2>
          <p className="text-sm text-text-muted">
            Acrescente ao arquivo <code className="rounded bg-warm-gray px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
            e reinicie o servidor. Os valores ficam no arquivo — nunca aqui, nem no banco.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-primary-700 p-4 text-sm text-warm-white">
            <code>{d.variaveisFaltando.map((v) => `${v}=`).join("\n")}</code>
          </pre>
        </section>
      )}

      {/* ── Alerta de exposição ────────────────────────────────────────── */}
      {(d.exposicoes.length > 0 || semRLS.length > 0 || tabelasSensiveisExpostas.length > 0) && (
        <section className="rounded-xl border border-red-300 bg-red-50 p-5">
          <h2 className="font-heading text-lg text-red-800">Dados expostos</h2>
          <p className="mt-1 text-sm text-red-900">
            A chave pública é distribuída no JavaScript do site. Tudo que ela consegue ler, qualquer
            visitante consegue baixar.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-red-900">
            {semRLS.map((t) => (
              <li key={`rls-${t.tabela}`}>
                <code className="font-mono">{t.tabela}</code> — sem RLS ({t.linhas} linhas)
              </li>
            ))}
            {d.exposicoes.map((e) => (
              <li key={`${e.tabela}-${e.policy}`}>
                <code className="font-mono">{e.tabela}</code> — policy anônima{" "}
                <code className="font-mono">{e.policy}</code> ({e.operacao})
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Tabelas ────────────────────────────────────────────────────── */}
      {d.tabelas.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg text-primary-700">Tabelas ({d.tabelas.length})</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-warm-gray/50 text-left text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Tabela</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Linhas</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">RLS</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Policies</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Leitura pública</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {d.tabelas.map((t) => (
                  <tr key={t.tabela}>
                    <td className="px-4 py-2 font-mono text-xs text-text-primary">{t.tabela}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-text-muted">{t.linhas}</td>
                    <td className="px-4 py-2">
                      {t.rls_ligado ? (
                        <span className="text-success">ligado</span>
                      ) : (
                        <span className="font-semibold text-red-600">desligado</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-text-muted">{t.qtd_policies}</td>
                    <td className="px-4 py-2 text-text-muted">{t.acesso_anonimo ? "sim" : "não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-muted">
            &quot;Leitura pública: sim&quot; é o esperado para conteúdo do site — experiências publicadas,
            destinos, blog. Numa tabela de lead, conversa ou reserva, é vazamento.
          </p>
        </section>
      )}

      {/* ── Credenciais ────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-heading text-lg text-primary-700">Onde ficam as credenciais</h2>
        <div className="mt-2 space-y-2 text-sm text-text-muted">
          <p>
            Esta tela lê e diagnostica, mas não grava chave nenhuma. São duas razões concretas,
            não preferência de estilo:
          </p>
          <p>
            <strong className="text-primary-700">A chave de servidor ignora todas as regras de acesso.</strong>{" "}
            Guardá-la onde a aplicação escreve significa que invadir o painel passa a valer o banco
            inteiro — leads, conversas e reservas.
          </p>
          <p>
            <strong className="text-primary-700">O login deste painel depende do Supabase.</strong>{" "}
            Se a configuração da conexão morasse dentro do próprio banco, uma configuração errada
            derrubaria o login e não haveria por onde consertar.
          </p>
          <p>
            Alterar credencial: editar <code className="rounded bg-warm-gray px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
            e reiniciar o servidor. Em produção, pelas variáveis de ambiente da hospedagem.
          </p>
        </div>
      </section>
    </div>
  );
}
