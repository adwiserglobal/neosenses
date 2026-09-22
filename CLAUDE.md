@AGENTS.md

# NeoSenses

Site institucional e Concierge de IA da NeoSenses — experiências de viagem
transformadoras. Next.js 16 (App Router) + Supabase + Gemini.

## Convenções

- **Idioma no código:** identificadores em inglês quando o ecossistema manda
  (tabelas, colunas, rotas, tipos gerados). Código novo escrito à mão, nomes
  de função e comentários em português. Foi a convenção herdada; manter.
- **Texto multi-idioma:** JSONB `{"pt": "...", "en": "...", "es": "..."}`.
  Ler sempre com fallback (`textoI18n` em `src/types/models.ts`).
- **Tipos do banco:** `src/types/database.ts` é **gerado**, não editar.
  Regenerar com `npx supabase gen types typescript --local > src/types/database.ts`.
  Alias e composição escritos à mão vão em `src/types/models.ts`.
- **Schema:** só por migration versionada em `supabase/migrations/`.
  Ver `supabase/README.md` para o modelo de segurança.

## Ambiente local

Esta máquina roda **três** projetos Supabase ao mesmo tempo. O NeoSenses usa a
faixa **548xx** (`supabase/config.toml`). Não mudar de volta, e não parar os
containers dos vizinhos.

| Serviço | Endereço |
|---|---|
| API | http://127.0.0.1:54801 |
| Postgres | 127.0.0.1:54802 |
| Studio | http://127.0.0.1:54803 |
| E-mails (Mailpit) | http://127.0.0.1:54804 |

Era 545xx até 02/09/2026, quando o Windows passou a reservar a faixa que
continha essas portas — ver "Erros conhecidos".

```bash
npx supabase start              # sobe e aplica migrations + seed
npx supabase db reset           # recria do zero
node scripts/admin-local.mjs    # cria o admin do /admin (ver abaixo)
npm run dev                     # app em http://localhost:3000
npm run check                   # tsc + eslint + testes
npm run test:e2e                # ponta a ponta (consome cota de IA)
```

### Entrar no /admin local

O banco local nasce **sem nenhum usuário** — `supabase start` aplica as
migrations e o seed de conteúdo, mas não cria conta. Sem isto, `/admin`
redireciona para o login e não há como entrar na própria máquina:

```bash
node scripts/admin-local.mjs
```

| | |
|---|---|
| e-mail | `admin@neosenses.local` |
| senha | `neosenses-dev` |

A senha está escrita no script de propósito, e não é descuido: ela vale só
no Supabase de `127.0.0.1`, com dados de desenvolvimento — exatamente como
as chaves `anon` e `service_role` do Supabase local, que são fixas e iguais
em toda instalação. O que impede o acidente é a guarda do script, que
**recusa rodar se a URL não for local**; sem ela, um `.env` trocado por
engano criaria um admin de senha pública em produção, e o script diria que
deu certo.

Na nuvem é outro caminho: criar a conta em Authentication → Users e rodar
`SELECT public.promover_admin('email@daequipe.com');`.

`.env.development.local` aponta para o Supabase local e tem precedência sobre
`.env.local` em `npm run dev`. O `.env.local` guarda o projeto da nuvem.

## Identidade visual

A paleta é a da marca, não uma invenção: o dourado `#d7a828` (botão),
`#af8920` (hover) e `#896a17` (escuro) são os que o neosenses.com.br usa
hoje. A base areia `#f6f1e4` e os escuros profundos vêm dos três modelos
B2B que a equipe aprovou, que também definem o par tipográfico —
**Fraunces** (display) + **Work Sans** (corpo), carregados por `next/font`.

Três regras que vieram de medição, não de gosto. Antes de mexer nas cores,
conferir contra elas:

- **O dourado vivo nunca é texto sobre fundo claro.** `#d7a828` sobre a
  areia dá 1,96:1. Ele é fundo de botão — com tinta escura por cima, 7,48:1
  — ou texto sobre escuro, onde dá 7,27:1.
- **O limão `#e7fd6e` só existe sobre fundo escuro.** Sobre a areia ele tem
  a mesma luminância do fundo: 1,00:1, literalmente invisível.
- **A escala do dourado está deslocada de propósito.** `secondary-500` é
  `#896a17`, escuro, porque o código usa `text-secondary-500` como texto
  sobre claro em 54 lugares. Pôr o tom médio ali reprovaria os 54 de uma
  vez. O dourado vivo mora no `300`.

Sobre foto, o contraste não pode depender da foto: quem garante é o véu
escuro do bloco (`Capa`, `FaixaFoto`) ou o fundo próprio do selo, a 90% de
opacidade. Sem isso, a próxima imagem cadastrada apaga o título.

O véu da `Capa` fecha em **88%** no meio do degradê, não 75%. Foi medido: a
75%, o chapéu dourado sobre a montanha de Vinicunca dava 3,65:1, reprovado
para 11px. Como `hero_image` é campo livre do painel, o número é calculado
para o pior caso — branco puro — onde ainda entrega 6,1:1.

Animação de entrada esconde o primeiro quadro (`opacity: 0`), e sem
JavaScript esse é o único quadro que existe. Todo invólucro animado leva
`data-anima`, e o `<noscript>` do layout raiz o devolve ao normal. Ao criar
um componente que anima na entrada, marque-o também.

## Layouts de página

Quatro, escolhidos pelo campo `template` (enum na 015, layouts construídos
depois). Os nomes descrevem a **estrutura do conteúdo**, não a aparência:

| Template | Público | Quando usar |
|---|---|---|
| `classico` | viajante | Jornada curta: coluna de conteúdo + lateral com datas e reserva |
| `roteiro` | viajante | Jornada longa: o dia a dia é o eixo da página |
| `territorio` | facilitador | Territórios, vivências e o bloco de parceria |
| `convite` | facilitador | Imagem grande, texto curto, conversa com a consultora |

Moram em `src/components/templates/`. A rota `/experiencias/[slug]` só
busca os dados e escolhe — nenhum layout é escrito nela.

`roteiro` **sem nenhuma etapa cadastrada cai para `classico`**: um layout
que reserva metade da página para o dia a dia fica pior que o clássico
quando o dia a dia não existe.

### O esqueleto de 8 seções

O documento de reformulação (passo 5) fixa a ordem de toda página de
roteiro ou retiro, e a ordem é o argumento de venda, não preferência de
layout:

1. título, subtítulo e período · 2. introdução · 3. por que criamos ·
4. o que é · 5. por que participar · 6. a jornada dia a dia ·
7. apenas relaxe · 8. quem conduz

As oito moram em `components/templates/esqueleto.tsx` e são as mesmas nos
dois layouts B2C — o que muda entre `classico` e `roteiro` é a largura e
onde entra a coluna de reserva. Seção sem conteúdo cadastrado não é
desenhada.

A seção 6 usa **sanfona** (`<details>` nativo, sem JavaScript): com seis
etapas a página fica 36% mais curta, e num roteiro de catorze dias a
diferença é o que separa uma leitura de uma rolagem infinita.

A seção 8 lê `experience_facilitators.role` para separar os três papéis —
`facilitator`, `guia_neosenses` e `guia_local`. O campo existia desde a
001 e nunca chegava à tela.

### Categorias em árvore

As três entradas do menu (`viagens-peregrinacoes`, `retiros-imersoes`,
`workshops-aulas`) são categorias-mãe das sete que já existiam. As sete
continuam ativas de propósito: `/experiencias?categoria=retiros` está no ar
e no sitemap, e link publicado que passa a dar 404 custa a posição que
levou meses para ganhar.

**Filtro por categoria traz as filhas junto** (`idsDaCategoria`). Sem isso
a primeira opção do menu abriria uma página vazia, porque o conteúdo está
nas filhas.

Nacional × internacional não é campo: sai do país do destino, que já está
no banco. Campo novo seria uma segunda verdade para a mesma informação.

`audience` separa os dois funis, e `listarExperiencias` filtra por ele com
padrão `viajante`. Sem esse padrão, as páginas de facilitador entram no
catálogo como jornada "sob consulta" — oferecendo vaga a quem vai *formar*
o grupo. Quem precisa do outro lado usa `listarParaFacilitadores()`.

A ponte entre os funis é `ConviteAoFacilitador` (fim das páginas de
viajante) e `ConviteAoViajante` (dentro das de facilitador). Uma vez cada,
no fim da leitura — no meio, atrapalha quem está decidindo.

## Erros conhecidos

Consultar antes de rediagnosticar.

### O Windows reserva faixas de porta, e o Supabase local para de responder
Sintoma: os containers sobem, `docker ps` mostra tudo **healthy**, o `psql`
pelo container funciona — e o REST não responde. `curl` na porta da API dá
conexão recusada, e o `next build` enche de `[dal] ... TypeError: fetch
failed` sem dizer o motivo.

O que denuncia: `docker ps` mostra o Kong com `8000/tcp` **sem mapeamento
para o host**. A porta simplesmente não foi publicada, e nada acusa isso —
o container fica saudável, porque por dentro ele está.

A causa só aparece ao recriar o container:

```
bind: An attempt was made to access a socket in a way forbidden by its
access permissions
```

O Windows (Hyper-V/WSL) reserva faixas dinâmicas de porta para si, e elas
**mudam entre reinicializações**. Em 02/09/2026 a faixa 54432-54531 passou a
ser reservada, e as quatro portas do projeto (54521-54524) caíram dentro
dela. Não é o Docker, não é o Supabase, não é o código.

Ver as faixas reservadas:

```bash
netsh interface ipv4 show excludedportrange protocol=tcp
```

A correção é mover as portas para fora das faixas listadas, em
`supabase/config.toml` E em `.env.development.local` — os dois precisam
casar. Depois `npx supabase stop && npx supabase start`.

**Antes de parar, faça um dump.** O `supabase stop` preserva o volume, mas
o custo de um dump é dez segundos e o de perder o banco de desenvolvimento
é uma tarde:

```bash
docker exec supabase_db_neosenses pg_dump -U postgres -d postgres --data-only --schema=public > backup.sql
```

### Projeto Supabase pausado: o site fica no ar e VAZIO
Sintoma: o subdomínio do projeto (`<ref>.supabase.co`) para de resolver no
DNS — `getaddrinfo ENOTFOUND` em qualquer script, e `nslookup` não devolve
endereço nem pelo 8.8.8.8. A rede está boa: `supabase.com` e o resto
respondem normalmente.

Causa: projeto do plano gratuito pausa depois de uma semana sem atividade,
e o subdomínio some junto.

O que torna isso caro: **o site continua no ar, respondendo 200**. A DAL
degrada com elegância — erro de consulta vira lista vazia —, então
`/experiencias` mostra "Ainda não há experiências publicadas" com doze
publicadas no banco. Não há erro em log nenhum, e o build passa.

Aconteceu em 01/09/2026, com o site servindo catálogo vazio em produção.

Conferir antes de suspeitar do código:

```bash
nslookup mvdtgepqibmrqfmhatud.supabase.co
```

Sem resposta, é o projeto — despausar no painel do Supabase. Enquanto
isso, dá para trabalhar inteiro contra o banco local, inclusive o build de
produção, exportando as três variáveis antes:

```bash
export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY)=" .env.development.local | xargs -d '\n') && npm run build
```

### `next build` serve dado velho do banco por causa do fetch-cache
Depois de alterar conteúdo no banco, o build pode gerar as páginas com o
conteúdo **anterior** — sem erro nenhum, e com a contagem de páginas certa.
O Next guarda as respostas de `fetch` em `.next/cache/fetch-cache`, e esse
diretório sobrevive entre builds; com `revalidate = 3600`, a resposta velha
vale por uma hora.

Sintoma: uma alteração conferida no banco não aparece no site publicado, e
rebuildar não resolve. Custou uma sessão inteira de "mas eu já rebuildei".

```bash
rm -rf .next/cache/fetch-cache && npm run build
```

Apagar só esse subdiretório — `.next/cache/images` e `turbopack` são caros
de reconstruir e não têm nada a ver com o problema.

### A Browser pane escondida congela animação e corrompe screenshot
`requestAnimationFrame` **não roda** quando a pane do navegador está
escondida — e `document.visibilityState` continua dizendo `"visible"`, então
o sinal óbvio mente. `tabs_context` é quem conta a verdade, na última linha:
*"The Browser pane is currently hidden."*

O que quebra por causa disso, tudo parecendo bug do site:

- **framer-motion congela no meio.** Os cartões de `/experiencias` ficaram
  com `opacity` em 0,26 / 0,011 / 0 / 0 e não saíam de lá. Parece conteúdo
  invisível em produção; é a animação sem quadros para avançar.
- **`window.scrollTo` não anda**, porque `scroll-behavior: smooth` também
  depende de rAF. `scrollY` fica parado no valor antigo e a medição seguinte
  descreve outra parte da página. Contornar com
  `scrollTo({top, behavior: "instant"})`.
- **O screenshot compõe quadros de momentos diferentes** — cabeçalho
  desenhado no meio do conteúdo, seção inteira em branco, foto que existe no
  DOM e não aparece na imagem. Já custou três diagnósticos errados numa
  sessão só.

`tabs_select` **não** resolve: a aba passa a ser a ativa e continua sem
compor. O caminho que funciona é medir pelo DOM (`getComputedStyle`,
`getBoundingClientRect`, canvas) em vez de olhar a imagem. Para conferir
layout apesar da animação parada, injetar
`[data-anima]{opacity:1!important;transform:none!important}` força o estado
final — o mesmo CSS que o `<noscript>` do layout usa.

Confirmar em uma linha:
```js
await new Promise(r => { let n = 0; const t = () => { n++; requestAnimationFrame(t); };
  requestAnimationFrame(t); setTimeout(() => r(n), 700); })  // 0 = pane sem compor
```

### `ON CONFLICT` não casa com índice único parcial
`upsert` falhava com *"there is no unique or exclusion constraint matching the
ON CONFLICT specification"* em `ai_feedback` e `ai_lead_captures`. Causa: os
índices tinham `WHERE coluna IS NOT NULL`, e o PostgREST não consegue apontar
para índice parcial. Solução: índice único **sem** `WHERE` — no Postgres
valores NULL não conflitam entre si, então o efeito é o mesmo.

### `OLD IS NOT NULL` em trigger PL/pgSQL
Num record, `IS NOT NULL` só é verdadeiro quando **todos** os campos são
não-nulos. Um trigger de consentimento testava `OLD IS NOT NULL` e nunca
executava para perfil com qualquer campo em branco — a revogação de
consentimento falhava em silêncio. Usar `TG_OP = 'UPDATE'`.

### Gemini 3.x devolve resposta vazia com `maxTokens` baixo
O raciocínio interno é cobrado como token de saída e sai do mesmo orçamento:
~110 tokens antes da primeira letra em `gemini-3.6-flash`. Orçamento apertado
retorna `finishReason=MAX_TOKENS` com conteúdo vazio. Manter `maxTokens` folgado
(padrão 2048) e controlar o tamanho da resposta pelo prompt.
`thinkingConfig.thinkingLevel: "low"` reduz o gasto; `thinkingBudget: 0` é
rejeitado com HTTP 400.

### Cota do Gemini no free tier
Limitada **por modelo**, por minuto e por dia. A mensagem de erro traz o
limite aplicado (`limit: 20`, `Please retry in 40s`). Uma bateria de testes
esgota a cota do modelo e o Concierge fica fora do ar até o reset.

Duas consequências práticas:
- `.env.development.local` fixa um modelo diferente do de produção
  (`AI_MODEL=gemini-3.5-flash`), para testar sem derrubar o Concierge.
- Com tráfego real, o plano pago é pré-requisito para publicar.

`npm run test:e2e` espaça as chamadas em 20s e repete após 70s no 429
(`E2E_INTERVALO_MS` ajusta).

### Modelo some sem aviso
`gemini-2.5-flash` responde 404 *"no longer available"*. É por isso que o
modelo é descoberto na conta em vez de fixado no código — nome chumbado
envelhece e quebra em produção.

### Bloqueio de segurança do Gemini responde HTTP 200
Com `promptFeedback.blockReason` ou `finishReason: SAFETY` e conteúdo vazio.
Tratar como erro explícito, senão o visitante recebe mensagem em branco e nada
aparece no log.

### Migrations e portas
`supabase start` falha com *"port is already allocated"* quando outro projeto
Supabase está no ar. Trocar as portas em `config.toml` — nunca derrubar o
projeto vizinho.

### `is_admin()` é falso quando se usa a service_role
`auth.uid()` é nulo sem usuário na sessão, então qualquer função que cheque
papel reprova a chamada feita com a chave de servidor. Para RPC que exige
papel, usar `createServerSupabaseClient()` (carrega os cookies de quem está
logado), não `createClient` com a service_role.

### O primeiro admin não conseguia ser criado
A trava anti-escalação (trigger em `profiles`) bloqueava a própria função de
promoção, porque no SQL Editor `is_admin()` é falso. Resolvido com uma flag de
sessão local à transação (`app.promocao_autorizada`) que o trigger reconhece.
Criar o primeiro admin: crie a conta em Authentication → Users e rode
`SELECT public.promover_admin('email@empresa.com');`.

### `useSearchParams` quebra o build, não o dev
Client component que usa `useSearchParams` precisa estar dentro de
`<Suspense>`. Sem isso, `npm run dev` funciona e `npm run build` falha com
*"Error occurred prerendering page"*. Rodar `npm run build` antes de dar
qualquer página por pronta.

### `npm run build` consulta o banco da NUVEM, não o local
`next build` roda em modo produção e por isso lê `.env.local`, nunca
`.env.development.local` — que só vale em `npm run dev`. Sintoma:
`column faqs.sort_order does not exist`, `column destinations.is_active does
not exist`, `Could not find a relationship between 'experiences' and
'categories'` no meio do build, com o build passando mesmo assim.

Não é bug do código: é o projeto da nuvem sem as migrations aplicadas. A DAL
degrada com elegância — erro de consulta vira lista vazia e a página é
gerada —, então o site vai ao ar **funcionando e vazio**. Enquanto a nuvem
não receber `001` a `009`, o build local não prova nada sobre o conteúdo.

Resolvido em 09/08/2026, aplicando `001` a `011`. Fica aqui porque o padrão se
repete: **build passando não é prova de que o conteúdo carrega**. Quando estas
mensagens sumirem do build é que o schema da nuvem bate com o código.

### `ON CONFLICT` não casa com índice sobre expressão nem parcial
Terceira vez nesta base (`ai_feedback`, `ai_lead_captures`,
`experience_interests`). `COALESCE(...)`, `lower(...)` ou `WHERE ...` no
índice fazem o upsert falhar com *"no unique or exclusion constraint matching
the ON CONFLICT specification"*.

Use colunas simples. Quando precisar que dois NULL sejam considerados iguais
— "interesse sem data escolhida também é único por pessoa" —, use
`NULLS NOT DISTINCT` (Postgres 15+), e normalize o valor na aplicação em vez
de aplicar `lower()` no índice.

### `ON CONFLICT DO NOTHING` sem constraint única é instrução inútil
Não dá erro: simplesmente insere de novo. Já duplicou `travel_guides`,
`packing_catalog_items` e quase duplicou `faqs`. Ao escrever seed, criar
antes a chave natural.

### Timeout do provedor
Resposta comum leva 1,4 a 4,5 s, mas pedido de detalhe passa de 25 s. O padrão
é 45 s (`AI_TIMEOUT_MS`). Atenção ao publicar: a hospedagem impõe o próprio
limite por requisição — na Vercel, 10 s no plano gratuito.

## O que o Concierge pode dizer

Duas camadas, porque prompt é instrução e não garantia:

1. **Prompt** (`src/lib/ai/prompt.ts`) — listas explícitas de PODE e NÃO PODE.
   Só fala de viagem e da NeoSenses, e só afirma o que está no contexto.
2. **Guarda de saída** (`src/lib/ai/guardas.ts`) — inspeciona a resposta antes
   de enviar. Barra contato de terceiro, UUID, nome de tabela, credencial e
   vazamento das instruções, e devolve uma recusa educada.

A guarda erra para o lado seguro: prefere encaminhar à equipe sem necessidade
a deixar passar o telefone de um viajante. Ao mexer nela, rodar
`tests/guardas.test.ts` — metade dos casos existe para provar que respostas
legítimas continuam passando.

Nada disso substitui o RLS. O modelo só recebe contexto que já é público.

## Estado do projeto

Concluído e verificado:
- Schema completo com RLS (41 tabelas), migrations versionadas
- Base de conhecimento de viagem (guias + catálogo de bagagem)
- Provider de IA com Gemini, descoberta de modelo e erros tipados
- Concierge de ponta a ponta: contexto do banco, gravação, feedback, limite
- Restrições de assunto no prompt e guarda de saída
- Formulários gravando de verdade, com validação no servidor
- `/admin` com login, visão geral e diagnóstico do Supabase
- Build de produção passando

- Páginas públicas lendo do banco: home, experiências (lista, filtros,
  paginação e detalhe), destinos e blog
- AI Journey Builder em `/planejar`, com roteiro salvo em `/roteiro/[token]`
- Admin: cadastro de experiências, saídas com ponto de encontro, e leads
- Funil: "quero esta data" e lista de espera (`experience_interests`),
  captura de contato depois do roteiro, `who_is_this_for` na página
- FAQ no banco, para o Concierge poder citar a política de cancelamento
- Dados estruturados (JSON-LD) e sitemap com o catálogo

- **Supabase da nuvem migrado** (09/08/2026): `001` a `013` aplicadas, 42
  tabelas, seed no lugar, `005` passou. Build de produção sem erro de coluna e
  site servido de verdade — ver `DEPLOY.md`.
- **No ar em https://neosenses.vercel.app** (11/08/2026), Vercel Hobby.
  Verificado em produção: CSS, 10 páginas, `/admin` protegido, FAQ do banco,
  Concierge respondendo e gravando, sitemap no domínio certo.

- **Identidade visual da marca** (13/08/2026): paleta e tipografia extraídas
  do site e dos modelos B2B, com o contraste de cada par medido no DOM
  renderizado. Seis páginas auditadas, 667 elementos de texto, zero
  reprovados. Corrigiu três defeitos que já estavam no ar: CTA branco sobre
  dourado (3,27:1), `text-secondary-500` sobre claro (2,47:1) e botão do
  WhatsApp (1,98:1).
- **Os quatro layouts construídos** e escolhidos pelo `template` do banco,
  com público e layout editáveis no painel
- **Funil de facilitador**: `/para-facilitadores` e as três jornadas dos
  modelos da equipe (Peru, Marrocos, Amazônia) publicadas
- **Página própria por destino** (`/destinos/[slug]`), com as fotos, os
  dados do lugar, as jornadas e os guias de viagem
- **Roteiro e inclusões saíram do markdown** para as tabelas: 53 dias e 97
  itens em 9 experiências, conferidos contra backup do texto original
- `<img>` trocado por `next/image` em Cards: a dívida só existia por não
  sabermos os domínios das imagens. São `www.neosenses.com.br` e
  `upload.wikimedia.org`, ambos em `remotePatterns`.

Pendente:
- **`SUPABASE_SERVICE_ROLE_KEY` vazia no `.env.local`.** Nada dá erro: o
  Concierge responde, o formulário diz que enviou, e o banco não recebe nada.
- Cache de `/experiencias` e `/blog`: `revalidate` não vale nelas porque
  `searchParams` torna a rota dinâmica
- Packing Assistant e Community Matching: schema pronto, aplicação não
  construída
- Prova social: nenhum depoimento, rosto ou ano de fundação no site
- CNPJ de placeholder em `/legal/termos` e nenhum registro Cadastur
- Nenhuma informação de pagamento em lugar nenhum
- Traduções: `content` dos guias só em português
- E-mail transacional (Resend configurado, nunca chamado)

Débito aberto pelo trabalho de 13/08:
- **Territórios, vivências e parceria só entram por script.** O painel edita
  público, layout, chapéu e fechamento, mas as grades nomeadas
  (`experience_highlights.grupo`) e a tabela `experience_partnership` ainda
  não têm formulário. Para uma jornada B2B nova hoje, o caminho é copiar
  `scripts/cadastrar-b2b.mjs`.
- **A página da Tailândia tem dois "Dia 11"** — um do roteiro Norte, outro do
  Sul, defeito herdado do site antigo. O segundo não entra em
  `itinerary_days` (chave única em experiência+dia) e ficou na descrição sob
  `## Roteiro — trechos a revisar`, à vista de quem for arrumar.
- **Quatro jornadas B2C estavam sem `hero_image`** — o catálogo, que é o
  coração do funil de viajante, mostrava quatro cartões sem foto. Peru e
  Marrocos foram preenchidos **só no banco local** (`peru-machu-picchu.jpg`
  e `marrocos-deserto.jpg`); em produção o caminho é o painel. Índia
  (Rishikesh) e Egito (Luxor) continuam sem: **não existe foto desses dois
  destinos no acervo** — `public/images/b2b/` só tem Peru, Marrocos e
  Amazônia. Enquanto não houver, o cartão mostra o nome do destino sobre o
  escuro da marca, em vez do ícone de imagem quebrada que havia antes.
- **`marrocos-argan.jpg` não é foto de argan**: é uma banca de tajines, e
  vertical. Conferir a imagem antes de usar pelo nome do arquivo —
  `peru-vale-sagrado.jpg`, pelo mesmo motivo, é o interior de um vagão
  panorâmico e não serve de capa.
- **As fotos do Marrocos são de banco de imagens** (Unsplash), não do acervo
  da NeoSenses — ver `public/images/b2b/ORIGEM.md`. Sustentam a página, mas
  foto genérica de destino um cliente atento reconhece.
- **Facebook e YouTube saíram do rodapé.** Apontavam para `href="#"`; ficou
  só o Instagram, com o endereço real. Se os perfis existirem, é só
  recolocar.
- **Nenhuma jornada usa o template `convite`.** Ele foi testado ponta a
  ponta contra o banco local, mas nenhum conteúdo o usa em produção.

## Journey Builder

`/planejar` → `POST /api/journey` → roteiro salvo em `/roteiro/[token]`.

As perguntas ficam em `src/lib/journey/perguntas.ts`, como dado. O servidor
valida contra a mesma lista que o formulário exibiu — duas cópias divergem.

Três perguntas carregam o resultado e não são as óbvias: **o que trouxe a
pessoa até aqui**, **como ela quer se sentir na volta** e **o que ela não
quer**. Foi o que fez o gerador descartar o Peru para quem mencionou receio de
altitude, mesmo com o perfil batendo em tudo o mais. Ao mexer no questionário,
preserve essas três.

`roteiro.ts` tem a conferência do que a IA devolveu, e não depende do cliente
de IA — de propósito, para ser testável sem rede. Ela garante o que o prompt
não garante:

- trecho marcado como experiência da NeoSenses precisa apontar para um id que
  existe no catálogo; id inventado vira "sugestão a combinar", sem link
- roteiro maior que o tempo informado é recusado inteiro

Na tela, experiência real e sugestão livre são visualmente distintas. Sem
isso, a pessoa lê tudo como oferta fechada e cobra da equipe um pacote que
nunca existiu.

## Dados vindos do banco nas páginas

Use `criarClientePublico()` (sem cookies) em página pública, nunca
`createServerSupabaseClient()`. Ler cookie marca a rota como dinâmica e o
`revalidate` deixa de valer em silêncio — o site perde o cache sem aviso. Em
`generateStaticParams` o cliente com cookies nem funciona: quebra com *"used
cookies() inside generateStaticParams"*.

Quando não houver dado, a página diz isso e oferece o WhatsApp. Não invente
"em breve" nem deixe grade vazia — é a mesma regra do Concierge.
