# NeoSenses no Cloud Run.
#
# Três estágios, para que a imagem final não carregue nem o código-fonte nem
# as dependências de build. O que sobe é `.next/standalone` — o servidor que o
# Next monta com apenas o que ele importa de verdade.
#
# ── Sobre segredo ─────────────────────────────────────────────────────────
#
# Só as variáveis NEXT_PUBLIC_* entram como ARG. Elas já vão para o navegador
# de qualquer forma, então não há o que proteger — e o Next as escreve dentro
# do JavaScript durante o build, então precisam existir aqui.
#
# SUPABASE_SERVICE_ROLE_KEY, GOOGLE_GENERATIVE_AI_API_KEY e RESEND_API_KEY
# NÃO aparecem neste arquivo, e não devem. Build arg fica gravado na imagem e
# aparece em `docker history` para quem puxar a imagem. Essas três são lidas
# em tempo de execução e vão configuradas no serviço do Cloud Run.

# ── 1. Dependências ────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
# Só os manifestos: assim esta camada só é refeita quando uma dependência
# muda, e não a cada alteração de código.
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. Build ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME=NeoSenses
ARG NEXT_PUBLIC_DEFAULT_LOCALE=pt
ARG NEXT_PUBLIC_WHATSAPP_NUMBER

# Liga o `output: "standalone"` no next.config.ts. Fica aqui, e não lá, porque
# o standalone quebra o build na Vercel: os dois empacotamentos são
# excludentes, e quem constrói container é este arquivo.
ENV BUILD_STANDALONE=1

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

RUN npm run build

# ── 3. Imagem final ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

# Usuário sem privilégio. Se algum dia houver execução de código pela porta,
# ela acontece como `nextjs`, não como root.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
# O standalone traz o server.js e um node_modules mínimo.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# O standalone NÃO inclui os estáticos: sem esta linha o site sobe sem CSS
# nenhum, com aparência de página quebrada e nenhum erro no log.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

# O Cloud Run injeta PORT. O server.js do standalone já a respeita.
CMD ["node", "server.js"]
