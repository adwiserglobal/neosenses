<div align="center">

# NeoSenses

**Experiências de viagem transformadoras, com um concierge de IA.**

Next.js · React · TypeScript · Supabase · Tailwind CSS

</div>

---

## Sobre o projeto

Site institucional da NeoSenses com catálogo de destinos e experiências, criação de roteiros, concierge de inteligência artificial e painel administrativo.

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `src/app` | Páginas e rotas da aplicação |
| `src/components` | Componentes de interface, jornada e administração |
| `src/lib` | Integrações, regras e ações da aplicação |
| `src/types` | Tipos e modelos de dados |
| `public` | Ícones e arquivos estáticos |
| `supabase` | Configuração, migrations e seed |
| `scripts` | Utilitários de conteúdo e administração |
| `tests` | Testes unitários e de integração |
| `infra` | Scripts de infraestrutura |

## Desenvolvimento

Use Node.js compatível com Next.js 16 e com `--experimental-strip-types` para executar os testes. Instale as dependências com o lockfile do projeto:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

No PowerShell, use `Copy-Item .env.example .env.local` para copiar a configuração. Preencha as variáveis antes de utilizar integrações. Abra `http://localhost:3000`.

### Configuração

O arquivo `.env.example` documenta as variáveis do Supabase, provedores de IA, Resend, WhatsApp e analytics. Use suas próprias credenciais e mantenha `.env.local` fora do Git.

Para configurar o banco, consulte [supabase/README.md](supabase/README.md). As instruções do ambiente local e suas portas estão em [CLAUDE.md](CLAUDE.md).

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Iniciar o build de produção |
| `npm run lint` | Análise com ESLint |
| `npm test` | Testes unitários existentes |
| `npm run check` | TypeScript, ESLint e testes |
| `npm run test:e2e` | Teste do concierge; pode consumir cota de IA |
| `npm run test:links` | Verificação de links de ponta a ponta |

## Publicação

Consulte [DEPLOY.md](DEPLOY.md) e os scripts em `infra/`. Configure as variáveis de ambiente diretamente no provedor de hospedagem.

## Cuidados com o repositório

Dependências, builds, caches, configurações locais e o histórico Git do arquivo original foram excluídos desta distribuição. O código da aplicação foi preservado. A preparação do repositório não equivale à validação do funcionamento em produção: build e testes não foram executados nesta etapa.
