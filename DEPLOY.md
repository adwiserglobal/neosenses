# Publicar o NeoSenses

**No ar desde 11/08/2026: https://neosenses.vercel.app**

Verificado em produção, não presumido: CSS servido, 10 páginas respondendo,
`/admin` redirecionando para o login sem sessão, as 12 FAQs vindo do banco da
nuvem, Concierge respondendo **e gravando a conversa**, e o sitemap com 17
endereços — todos no domínio certo, nenhum apontando para localhost.

Falta o domínio próprio (`neosenses.com.br`) e o conteúdo real. Ver
**Antes de divulgar**.

Roteiro do que precisa acontecer, em ordem. Os itens de **Bloqueia** impedem
o site de funcionar; os de **Antes de divulgar** deixam ele no ar, mas
incompleto de um jeito que custa venda ou credibilidade.

---

## Três armadilhas que custaram um deploy cada

Ficam registradas porque nenhuma aponta para a própria causa.

**1. Pipe do PowerShell injeta BOM.** `$valor | vercel env add` entregou
`EF BB BF` antes do primeiro caractere, nas treze variáveis. Forçar
`$OutputEncoding` não corrige. O build quebrou em `TypeError: Invalid URL`
sobre uma URL impecável na tela. Passe por arquivo temporário sem BOM,
redirecionado pelo `cmd` — é o que `infra/vercel-env.ps1` faz.

**2. `output: "standalone"` quebra a Vercel.** Ela consome
`.next/next-server.js.nft.json`; o standalone produz `.next/standalone` no
lugar. Erro: `ENOENT ... next-server.js.nft.json`, no fim do build, sem citar
standalone. Hoje a opção depende de `BUILD_STANDALONE=1`, que só o Dockerfile
define.

**3. `vercel whoami` sem sessão não responde "não logado"** — ele inicia o
fluxo de login e espera para sempre. Em script, é travamento.

---

## Bloqueia

### ~~1. Aplicar as migrations no Supabase da nuvem~~ — feito em 09/08/2026

O projeto da nuvem (`mvdtgepqibmrqfmhatud`) recebeu `001` a `011`. Antes as
tabelas antigas foram removidas; conferido que estavam vazias e que nenhuma
guardava dado real.

Verificado depois de aplicar:

- **42 tabelas** em `public`
- Seed no lugar: 7 categorias, 18 guias, 25 itens de bagagem, 12 FAQs,
  10 configurações
- A `005` passou. Ela aborta se alguma tabela com dado pessoal ganhar acesso
  público, então passar é o que prova o RLS — não a contagem de linhas
- `npm run build` sem nenhum dos erros de coluna que apareciam antes
  (`column faqs.sort_order does not exist`), o que prova que schema e código
  batem
- Site servido em produção: 12 rotas respondendo, FAQ vindo do banco, `/admin`
  redirecionando para o login sem sessão

Falta cadastrar o conteúdo: `experiences` e `destinations` estão em **zero**.

### ~~1. Chave de servidor no `.env.local`~~ — feita em 10/08/2026

Preenchida, e a gravação foi verificada de ponta a ponta contra a nuvem:

- Concierge: `conversations` 0 → 1, `messages` 0 → 2, com o texto das duas
  mensagens conferido no banco (linha gravada vazia contaria igual na soma)
- Formulário de contato preenchido **no navegador**, não por API: lead
  gravado com origem `website` e situação `new`
- O mesmo lead lido com a chave pública: 0 linhas. Existe e é invisível.
- `promover_admin` funcionou e, na segunda chamada, recusou com *"Já existe
  administrador"* — a trava de pé em produção

Os registros de teste foram removidos depois; o banco está em zero.

### 1. E-mail: duas configurações faltando

Descoberto no teste acima. O lead **é gravado** — a falha de e-mail não
derruba a ação, como projetado — mas ninguém fica sabendo dele:

```
[forms] lead 10a21ef5-… registrado (website)
[email] EMAIL_EQUIPE não configurado — ninguém foi avisado do novo contato
[email] falha ao enviar "Recebemos seu contato": The neosenses.com.br domain
        is not verified. Please, add and verify your domain
```

- **`EMAIL_EQUIPE`** — para onde vai o aviso de contato novo. Vazia, o lead
  espera alguém abrir o painel por conta própria.
- **Domínio no Resend** — `neosenses.com.br` não está verificado, então a
  confirmação para o visitante é recusada na origem. Verificar em
  resend.com/domains (é publicar uns registros DNS), ou usar um remetente de
  domínio já verificado em `EMAIL_REMETENTE`.

Nenhuma das duas falha em silêncio, o que é o desenho certo — mas as duas
custam venda enquanto estiverem assim.

### 2. Variáveis de ambiente na hospedagem

O `.env.local` **não** vai junto com o código (está no `.gitignore`, e é assim
que tem que ser). Cada variável precisa ser cadastrada no painel da
hospedagem:

```
NEXT_PUBLIC_SUPABASE_URL          projeto da nuvem
NEXT_PUBLIC_SUPABASE_ANON_KEY     chave publishable
SUPABASE_SERVICE_ROLE_KEY         chave secreta — sem ela nada grava
GOOGLE_GENERATIVE_AI_API_KEY      Gemini
AI_PROVIDER                       gemini
AI_MODEL                          gemini-3.6-flash
RESEND_API_KEY                    e-mail
EMAIL_EQUIPE                      quem recebe aviso de lead
EMAIL_REMETENTE                   de domínio verificado no Resend
NEXT_PUBLIC_SITE_URL              https://www.neosenses.com.br
NEXT_PUBLIC_APP_URL               https://www.neosenses.com.br
NEXT_PUBLIC_WHATSAPP_NUMBER       5511947188319
```

Duas que costumam ser esquecidas e quebram em silêncio:

- **`SUPABASE_SERVICE_ROLE_KEY`** — sem ela o RLS bloqueia toda escrita.
  Formulário parece enviar, o Concierge parece responder, e nada é gravado.
- **`NEXT_PUBLIC_SITE_URL`** — é a base do sitemap e dos dados estruturados.
  Errada, o buscador recebe endereços que não existem.

Depois de publicar, `/admin/supabase` mostra o que ficou faltando.

### 3. Plano pago do Gemini

No plano gratuito o limite é **por modelo, por minuto e por dia**. Esgotei a
cota diária duas vezes só testando. Com visitantes reais, cinco conversas
simultâneas já derrubam o Concierge — e ele passa a responder só a mensagem
de indisponível.

Não é opcional para um site no ar.

---

## Onde hospedar

**Vercel, plano Hobby (gratuito).** É quem faz o Next.js, o deploy sai do git,
não há servidor para manter, e o plano gratuito cobre este site inteiro.

Quatro passos, nesta ordem:

```bash
npm i -g vercel
```

```bash
vercel login
```

```bash
vercel link
```

Os dois do meio fazem perguntas e abrem o navegador — não dá para automatizar,
e não deveria dar. Depois deles:

```bash
.\infra\vercel-env.ps1 -Url https://SEU-PROJETO.vercel.app
```

Esse script cadastra as treze variáveis do `.env.local` de uma vez. Sem ele, é
digitar campo a campo no painel — e esquecer a `SUPABASE_SERVICE_ROLE_KEY`
produz um site que responde bem e não grava nada, que é o sintoma mais caro
de diagnosticar aqui.

O `-Url` importa: sem ele, `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_APP_URL`
subiriam com `http://localhost:3000`, e o sitemap sairia apontando para a
máquina de quem publicou. Quando o domínio próprio entrar, rode de novo com
`-Url https://www.neosenses.com.br` e publique outra vez.

```bash
vercel --prod
```

Conferir o que ficou cadastrado: `.\infra\vercel-env.ps1 -Listar`

**Uma armadilha da CLI:** `vercel whoami` sem sessão não responde "não
logado" — ele **inicia o fluxo de login** e fica esperando autorização no
navegador, indefinidamente. Num script isso é um travamento. Por isso
`vercel-env.ps1` verifica o arquivo de credencial antes de chamar qualquer
coisa.

### Correção de uma informação errada que estava aqui

Este documento afirmava que o plano gratuito **corta a requisição em 10
segundos**, e que por isso o Journey Builder ficaria fora do ar sem o plano
Pro. Isso está desatualizado. A
[documentação oficial](https://vercel.com/docs/functions/limitations)
(revisada em 01/07/2026) diz:

| Plano | Padrão | Máximo |
|---|---|---|
| **Hobby** | **300 s** | **300 s** |
| Pro / Enterprise | 300 s | 800 s (1800 s em beta) |

Memória no Hobby: 2 GB / 1 vCPU. O `maxDuration = 60` da rota do Journey
Builder cabe com folga de cinco vezes.

O limite de 10 s era real até 2024, quando a Vercel o elevou. A conclusão
inteira sobre precisar de plano pago — e a busca por alternativa que se
seguiu — nasceu de uma informação vencida que não foi conferida na fonte.

### Alternativa: Google Cloud Run

`Dockerfile`, `.dockerignore` e `infra/cloud-run.ps1` continuam no repositório
e funcionam — a imagem foi construída e testada de ponta a ponta. Faz sentido
se um dia houver necessidade de container, execução longa ou de sair da
Vercel.

Um pré-requisito que não é óbvio: o Cloud Run **exige conta de faturamento
vinculada ao projeto**, mesmo dentro do free tier. A cota gratuita isenta a
cobrança, não o cadastro do cartão. É o que impede o deploy hoje, já que o
projeto pessoal `neosenses-505200` não tem faturamento.

**Recurso da LOI não é opção aqui.** O NeoSenses é projeto pessoal; usar conta
de faturamento ou projeto da empresa mistura o que não deve se misturar.

---

## Antes de divulgar

Estas não impedem o site de funcionar. Impedem que ele venda.

### CNPJ e Cadastur
Preencha em `/admin/configuracoes`. A página de Termos hoje **omite** a linha
quando o campo está vazio — melhor que o `XX.XXX.XXX/0001-XX` que estava
fixo no código, mas contrato de adesão sem parte identificada não se sustenta.
Cadastur é obrigatório para prestador de serviço turístico no Brasil.

### Conteúdo real
As quatro experiências que existem hoje são **exemplos do seed de
desenvolvimento**, com preços e datas fictícios. Cadastre as verdadeiras em
`/admin/experiencias` e apague as de exemplo — publicar preço inventado é pior
que publicar catálogo vazio.

### Pelo menos um depoimento
O site não tem um rosto, um nome nem uma frase de quem já foi. É uma compra de
quinze a quarenta mil reais, de uma empresa desconhecida, para viajar com
estranhos. Provavelmente é o que mais falta — mais que qualquer ajuste de
página.

### Condições de pagamento
Os textos estão em `/admin` marcados com `[CONFIRMAR]` e desativados. Enquanto
não forem revisados, o Concierge não fala de pagamento — o que é melhor que
falar errado, e pior que responder.

### Um administrador de verdade
O admin de desenvolvimento (`admin@neosenses.local`) só existe no banco local.
Na nuvem: crie a conta em Authentication → Users e rode

```sql
SELECT public.promover_admin('email@daequipe.com');
```

---

## Depois de publicar

Confira nesta ordem — cada um pega uma classe diferente de problema:

1. `/admin/supabase` — diagnóstico completo: conexão, migrations, RLS,
   integração de IA e o que falta configurar
2. `/api/health/ai` — em produção exige sessão; abra logado
3. Abra o Concierge e pergunte sobre uma experiência real. Se ele citar data e
   vaga corretas, a cadeia inteira está de pé
4. Envie o formulário de contato e confirme que o e-mail chegou
5. `/sitemap.xml` — deve listar as experiências, não só as páginas fixas

---

## BLOQUEIO — o projeto Supabase está pausado (01/09/2026)

O subdomínio `mvdtgepqibmrqfmhatud.supabase.co` **não resolve no DNS**, nem
pelo 8.8.8.8. A rede está boa: `supabase.com` responde 200. É o projeto do
plano gratuito, que pausa depois de uma semana sem atividade.

O efeito está no ar agora: **https://neosenses.vercel.app/experiencias diz
"Ainda não há experiências publicadas"**, com doze publicadas no banco. O
site responde 200, o build passa, nenhum log acusa nada — a DAL degrada com
elegância e o erro de consulta vira lista vazia.

**Despausar no painel do Supabase é o primeiro passo de qualquer coisa
daqui para frente.** Enquanto isso não acontece, três coisas ficam à
espera, todas com script pronto:

```bash
npx supabase db push                              # migration 017
node scripts/classificar-roteiros.mjs --dry       # confere o casamento
node scripts/classificar-roteiros.mjs             # aplica a classificação
```

E uma correção de conteúdo do passo 6.1 do documento — o card do Egito
descreve o Peru — que precisa do banco no ar para ser feita.

---

## O que mudou em 13/08/2026 e ainda não foi publicado

O conteúdo **já está no banco da nuvem** — as três jornadas de facilitador
(Peru, Marrocos, Amazônia) estão com `status = published`, e a migration
`016` foi aplicada. O código com os layouts, a paleta nova e as páginas de
destino está commitado, mas **não publicado**. Enquanto não sair um
`vercel --prod`, o site no ar mostra o layout antigo — e as três jornadas
novas respondem 404, porque a rota que as renderiza ainda não existe lá.

Antes de publicar:

```bash
rm -rf .next/cache/fetch-cache
```

Não é zelo: o Next guarda as respostas do banco nesse diretório e o build
pode gerar as páginas com o conteúdo anterior, sem erro nenhum. Ver
"Erros conhecidos" no `CLAUDE.md`.

Depois de publicar, conferir nesta ordem:

1. `/para-facilitadores` — as três jornadas devem aparecer com foto
2. `/experiencias` — deve listar **12**, não 15: as de facilitador ficam
   fora do catálogo de propósito
3. `/destinos/vale-sagrado` — página de destino, que antes não existia
4. Uma experiência de template `roteiro` (`/experiencias/retiro-inka-sol`):
   o dia a dia tem que aparecer como lista, não como `**Dia 1 —**` cru
5. `/sitemap.xml` — deve trazer as páginas de destino e
   `/para-facilitadores`
6. O menu deve mostrar Home, Sobre Nós, Experiências & Roteiros, Para
   Facilitadores, Blog e Contato — e o dropdown, as três categorias novas
7. `/experiencias?categoria=retiros-imersoes` precisa trazer resultado: o
   filtro pela categoria-mãe soma as filhas, e página vazia aí significa
   que a 017 não foi aplicada
8. Uma página de roteiro deve mostrar as oito seções na ordem, com o dia a
   dia em sanfona

## Dívida conhecida

- Cache de `/experiencias` e `/blog`: `revalidate` não vale nessas rotas
  porque `searchParams` as torna dinâmicas
- Traduções: o conteúdo longo dos guias só existe em português
- Packing Assistant e Community Matching: schema pronto, aplicação não
  construída
- Territórios, vivências e o bloco de parceria das páginas B2B só entram
  por script (`scripts/cadastrar-b2b.mjs`) — o painel ainda não os edita
