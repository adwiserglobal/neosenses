/**
 * Cria o administrador do ambiente de DESENVOLVIMENTO.
 *
 * O banco local nasce sem nenhum usuário — `supabase start` aplica as
 * migrations e o seed de conteúdo, mas não cria conta. Sem isto, `/admin`
 * redireciona para o login e não há como entrar: o painel fica inacessível
 * na própria máquina de quem o está construindo.
 *
 * ── Por que a senha está escrita aqui ─────────────────────────────────────
 *
 * Porque não é segredo. Ela vale só no Supabase que roda em 127.0.0.1, com
 * dados de desenvolvimento, exatamente como as chaves `anon` e `service_role`
 * do Supabase local — que são fixas, públicas e iguais em toda instalação.
 *
 * O que impede o acidente é a GUARDA abaixo: o script recusa rodar se a URL
 * não for local. Sem ela, um `.env` trocado por engano criaria um admin com
 * senha pública no banco de produção — e ninguém perceberia, porque o script
 * teria "funcionado".
 *
 * Uso:  node scripts/admin-local.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const EMAIL = "admin@neosenses.local";
const SENHA = "neosenses-dev";

const env = {};
for (const l of readFileSync(join(RAIZ, ".env.development.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const U = env.NEXT_PUBLIC_SUPABASE_URL;
const S = env.SUPABASE_SERVICE_ROLE_KEY;

if (!U || !S) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.development.local.");
  process.exit(1);
}

// A guarda. Não é zelo: é o que separa "criei um admin de teste" de "publiquei
// uma senha conhecida no banco de produção".
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(U)) {
  console.error(`RECUSADO: ${U} não é o Supabase local.`);
  console.error("Este script só cria conta em 127.0.0.1. Para a nuvem, use o painel do Supabase.");
  process.exit(1);
}

const cab = { apikey: S, Authorization: `Bearer ${S}`, "Content-Type": "application/json" };

console.log(`\nSupabase local: ${U}\n`);

// Idempotente: se já existe, só garante a senha e o papel.
const lista = await fetch(`${U}/auth/v1/admin/users?page=1&per_page=200`, { headers: cab });
if (!lista.ok) {
  console.error(`Não consegui listar usuários: ${lista.status} ${await lista.text()}`);
  process.exit(1);
}
const { users = [] } = await lista.json();
const existente = users.find((u) => u.email === EMAIL);

if (existente) {
  const r = await fetch(`${U}/auth/v1/admin/users/${existente.id}`, {
    method: "PUT",
    headers: cab,
    body: JSON.stringify({ password: SENHA, email_confirm: true }),
  });
  console.log(r.ok ? `  senha redefinida para ${EMAIL}` : `  falha ao redefinir: ${await r.text()}`);
} else {
  const r = await fetch(`${U}/auth/v1/admin/users`, {
    method: "POST",
    headers: cab,
    body: JSON.stringify({ email: EMAIL, password: SENHA, email_confirm: true }),
  });
  if (!r.ok) {
    console.error(`  falha ao criar: ${r.status} ${await r.text()}`);
    process.exit(1);
  }
  console.log(`  usuário criado: ${EMAIL}`);
}

// Promove a admin. A função tem trava anti-escalação (011) e usa uma flag de
// sessão para se autorizar — por isso a chamada vai por RPC e não por UPDATE.
const promo = await fetch(`${U}/rest/v1/rpc/promover_admin`, {
  method: "POST",
  headers: cab,
  body: JSON.stringify({ email_alvo: EMAIL }),
});
const resposta = await promo.text();
console.log(promo.ok ? `  ${resposta.replace(/^"|"$/g, "")}` : `  promoção: ${promo.status} ${resposta}`);

console.log(`
Entre em http://localhost:3000/admin

  e-mail: ${EMAIL}
  senha:  ${SENHA}

Só funciona no banco local. Não existe na nuvem e não deve existir.
`);
