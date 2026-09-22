# Banco de dados — NeoSenses

## Regra

Toda alteração de schema entra por **migration versionada neste diretório**.
Nada de mexer pelo Studio sem capturar a mudança como migration — schema que
existe só no banco e não no repositório é schema que ninguém consegue
reproduzir nem revisar.

## Ordem de aplicação

| Arquivo | O que faz | Destrutivo |
|---|---|---|
| `000_verificacao_estado.sql` | Só lê. Mostra tabelas, contagem real, RLS e policies | não |
| `001_schema_core.sql` | Conteúdo público: países, destinos, experiências, blog | não |
| `002_schema_pessoas.sql` | Leads, reservas, conversas do Concierge | não |
| `003_conhecimento_viagem.sql` | Guias de viagem e catálogo de bagagem | não |
| `004_features_ia.sql` | Journey Builder, Packing Assistant, Community Matching | não |
| `005_rls_policies.sql` | Row Level Security de todas as tabelas | não |
| `006_seed_conhecimento.sql` | Categorias, configuração, 25 itens de bagagem, 18 guias | não |

Todos são idempotentes: rodar de novo não duplica nem quebra.
Nenhum apaga dado — não há `DROP TABLE` em lugar nenhum.

## Como aplicar

Supabase Studio → **SQL Editor** → New Query → colar o arquivo → **Run**.
Na ordem `001` … `006`.

Rode `000` antes de tudo e confira o resultado: ele mostra o que já existe.

O `005` termina com uma verificação automática. Se alguma tabela com dado
pessoal tiver ganhado acesso público, ele **aborta com erro** em vez de
aplicar. Erro ali significa vazamento — não contorne, corrija a policy.

## Modelo de segurança

Três perfis de acesso:

- **`anon`** — a chave publishable, que vai no bundle JavaScript do site.
  Trate como pública, porque ela é. Lê apenas conteúdo publicado.
  **Não escreve nada.**
- **`authenticated`** — a equipe logada no `/admin`. O que cada um vê depende
  de `profiles.role`: `editor` mexe em conteúdo, `admin` também em dado
  pessoal e configuração.
- **`service_role`** — o servidor (API routes e server actions). Ignora RLS.
  **Toda escrita do site passa por aqui**, com validação no servidor.

O teste que decide se uma tabela recebe policy para `anon`: *essa linha pode
aparecer num outdoor?* Se não, não recebe.

### Por que a escrita não vai direto do navegador

Deixar o navegador gravar direto no banco significa confiar em validação de
front-end, que qualquer pessoa contorna com o DevTools aberto. O caminho é
sempre: navegador → rota do servidor (valida, limita, sanitiza) → banco.

## Convenções

- Identificadores (tabela, coluna, índice) em **inglês** — segue o código.
- Comentários em **português** — segue o time.
- Texto multi-idioma em JSONB: `{"pt": "...", "en": "...", "es": "..."}`.
- Constraint com nome descritivo em português (`escopo_bate_com_alvo`) —
  o nome aparece na mensagem de erro para quem estiver cadastrando.

## Testando alterações antes de aplicar em produção

As migrations foram validadas em Postgres 16 local, não só lidas:

```bash
docker run -d --name neosenses-test-db -e POSTGRES_PASSWORD=testonly -e POSTGRES_DB=neosenses -p 55433:5432 postgres:16-alpine
```

Como o Postgres puro não tem o schema `auth` nem as roles do Supabase, é
preciso um shim que crie `auth.users`, `auth.uid()` e as roles `anon`,
`authenticated` e `service_role` antes de rodar as migrations.

O que vale a pena verificar a cada mudança de policy:

1. `anon` lê experiência publicada e **não** lê rascunho;
2. `anon` **não** lê `leads`, `bookings` nem `conversations`;
3. `anon` tentando escrever recebe erro de RLS;
4. o seed roda duas vezes sem duplicar.

## Débito conhecido

- **Traduções.** Os guias de viagem estão com `title` e `summary` nos três
  idiomas, mas o `content` longo só em português. É o campo que entra no
  prompt quando o visitante pede detalhe — em inglês e espanhol a resposta
  sai mais rasa até isso ser preenchido.
- **Ponto de encontro por data.** A estrutura existe
  (`experience_dates.meeting_point`), mas cada data precisa ser preenchida
  pela equipe. Enquanto estiver vazio, o Concierge responde a orientação
  genérica e encaminha para a equipe — de propósito, para não inventar
  endereço.
