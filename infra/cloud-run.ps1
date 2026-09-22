<#
.SINOPSE
  Publica o NeoSenses no Cloud Run.

.QUANDO USAR ISTO
  Este script nasceu de uma premissa errada: a de que o plano gratuito da
  Vercel corta toda requisição em 10 segundos, o que deixaria o Journey
  Builder fora do ar. Era verdade até 2024. Hoje o Hobby dá 300 s — dez vezes
  o que a rota pede — e a Vercel voltou a ser o caminho mais simples.

  O script continua aqui porque funciona e foi testado ponta a ponta: serve
  se um dia houver necessidade de container, execução longa, ou de não
  depender da Vercel.

  Pré-requisito que não é óbvio: o Cloud Run exige conta de faturamento
  vinculada ao projeto mesmo dentro do free tier. A cota gratuita isenta a
  cobrança, não o cadastro.

.CUSTO
  O free tier do Cloud Run cobre 2 milhões de requisições por mês e o serviço
  escala a zero — parado, não cobra. Fora do free: a imagem ocupa espaço no
  Artifact Registry (0,5 GB grátis; esta imagem tem ~200 MB) e tráfego de
  saída é cobrado.

  Free tier NÃO é o mesmo que impossível de cobrar. Configure um orçamento com
  alerta no console antes de deixar rodando.

.SEGREDO
  As três chaves secretas NÃO vão na linha de comando — iriam parar no
  histórico do PowerShell. O script lê o .env.local, escreve um YAML temporário
  e o apaga em seguida, inclusive se algo falhar no meio.

.USO
  .\infra\cloud-run.ps1                 # build + deploy
  .\infra\cloud-run.ps1 -SomenteBuild   # só constrói e testa local
  .\infra\cloud-run.ps1 -Destruir       # remove o serviço
#>

[CmdletBinding()]
param(
  [string]$Projeto  = "neosenses-505200",
  [string]$Regiao   = "southamerica-east1",   # São Paulo: menor latência daqui
  [string]$Servico  = "neosenses",
  # Conta do Google a usar. O projeto neosenses-505200 é da conta pessoal, e a
  # conta da LOI não o enxerga. Passar aqui evita `gcloud config set account`,
  # que mudaria a conta ativa para todo o resto da máquina.
  [string]$Conta    = "",
  [switch]$SomenteBuild,
  [switch]$Destruir
)

$ErrorActionPreference = "Stop"

# Repassado a cada chamada do gcloud. Vazio quando -Conta não é informado, e
# aí vale a conta ativa.
$gc = if ($Conta) { @("--account", $Conta) } else { @() }
$raiz = Split-Path -Parent $PSScriptRoot
$envLocal = Join-Path $raiz ".env.local"

function Passo($texto) { Write-Host "`n== $texto" -ForegroundColor Cyan }
function Aviso($texto) { Write-Host "   $texto" -ForegroundColor Yellow }

<#
  Roda um gcloud cuja falha é uma RESPOSTA, não um acidente: "o projeto existe?",
  "o repositório já foi criado?".

  Existe porque o PowerShell 5.1, com $ErrorActionPreference = "Stop", trata
  qualquer linha que um executável nativo escreva em stderr como erro
  terminante — e `2>$null` não impede isso. O efeito prático apareceu duas
  vezes aqui: a mensagem de ajuda sobre trocar de conta nunca chegava a ser
  impressa, e a verificação do repositório derrubaria o script justamente na
  primeira execução, quando o repositório ainda não existe.

  Devolve a saída, ou $null se o comando falhou.
#>
function Perguntar-Gcloud {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Argumentos)
  $anterior = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $saida = & gcloud @Argumentos 2>$null
    if ($LASTEXITCODE -ne 0) { return $null }
    return ($saida | Where-Object { $_ }) -join "`n"
  } catch {
    return $null
  } finally {
    $ErrorActionPreference = $anterior
  }
}

# ── Leitura do .env.local ──────────────────────────────────────────────────
function Ler-Env {
  if (-not (Test-Path $envLocal)) {
    throw "Não achei o .env.local em $raiz. Sem ele o site sobe sem banco e sem IA."
  }
  $mapa = @{}
  foreach ($linha in Get-Content $envLocal) {
    if ($linha -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $mapa[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $mapa
}

# ── Destruir ───────────────────────────────────────────────────────────────
if ($Destruir) {
  Passo "Removendo o serviço $Servico"
  gcloud @gc run services delete $Servico --region=$Regiao --project=$Projeto --quiet
  Aviso "A imagem continua no Artifact Registry. Para apagar também:"
  Aviso "  gcloud artifacts repositories delete $Servico --location=$Regiao --project=$Projeto"
  exit 0
}

$cfg = Ler-Env

# ── Conferência do que não pode faltar ─────────────────────────────────────
Passo "Conferindo as variáveis"

$obrigatorias = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY"
)
$faltando = $obrigatorias | Where-Object { -not $cfg[$_] }
if ($faltando) {
  throw "Vazia(s) no .env.local: $($faltando -join ', ')"
}

# Estas não impedem o site de subir, mas cada uma quebra algo em silêncio.
$avisos = @{
  "RESEND_API_KEY" = "sem e-mail transacional"
  "EMAIL_EQUIPE"   = "ninguém é avisado de lead novo"
  "NEXT_PUBLIC_SITE_URL" = "sitemap e dados estruturados com endereço errado"
}
foreach ($chave in $avisos.Keys) {
  if (-not $cfg[$chave]) { Aviso "$chave vazia — $($avisos[$chave])" }
}
Write-Host "   ok" -ForegroundColor Green

# ── Acesso ao projeto ──────────────────────────────────────────────────────
# Esta conferência vem ANTES do build de propósito. Na primeira versão ela não
# existia: o script construía a imagem inteira — uns dois minutos — e só então
# esbarrava em "permission denied" ao habilitar as APIs. Falhar em dois
# segundos é melhor que falhar em dois minutos dizendo a mesma coisa.
Passo "Conferindo acesso ao projeto $Projeto"

$contaAtiva = if ($Conta) { $Conta } else { Perguntar-Gcloud config get-value account }
$temAcesso = Perguntar-Gcloud @gc projects describe $Projeto --format="value(projectId)"

if (-not $temAcesso) {
  Write-Host ""
  Write-Host "   A conta ativa nao enxerga o projeto $Projeto." -ForegroundColor Red
  Write-Host "   Conta ativa: $contaAtiva"
  Write-Host ""
  Write-Host "   Contas ja autenticadas nesta maquina:"
  $contas = Perguntar-Gcloud auth list --format="value(account)"
  if ($contas) { $contas -split "`n" | ForEach-Object { Write-Host "     $_" } }
  else { Write-Host "     (nenhuma)" }
  Write-Host ""
  Write-Host "   Se a conta certa ja aparece acima:"
  Write-Host "     gcloud config set account EMAIL"
  Write-Host ""
  Write-Host "   Se nao aparece (abre o navegador):"
  Write-Host "     gcloud auth login"
  Write-Host ""
  Write-Host "   Ou use a conta so nesta execucao, sem mudar a ativa:"
  Write-Host "     .\infra\cloud-run.ps1 -Conta EMAIL"
  Write-Host ""
  Write-Host "   Para ver quais projetos a conta atual alcanca:"
  Write-Host "     gcloud projects list"
  throw "Sem acesso ao projeto $Projeto."
}
Write-Host "   $contaAtiva enxerga $Projeto" -ForegroundColor Green

# ── Faturamento ────────────────────────────────────────────────────────────
# O free tier do Cloud Run isenta o custo, não a exigência de uma conta de
# faturamento vinculada. Sem ela nem as APIs podem ser habilitadas, e o erro
# aparece a meio caminho — depois do build e do push, que já não tinham para
# onde ir.
Passo "Conferindo o faturamento"

$faturamento = Perguntar-Gcloud @gc billing projects describe $Projeto --format="value(billingEnabled)"
if ($faturamento -ne "True") {
  Write-Host ""
  Write-Host "   O projeto $Projeto nao tem conta de faturamento vinculada." -ForegroundColor Red
  Write-Host "   O Cloud Run exige isso mesmo dentro do free tier: a cota gratuita"
  Write-Host "   isenta a cobranca, nao o cadastro."
  Write-Host ""
  Write-Host "   Contas de faturamento que esta conta enxerga:"
  $contasFat = Perguntar-Gcloud @gc billing accounts list --format="value(name.basename(),displayName,open)"
  if ($contasFat) { $contasFat -split "`n" | ForEach-Object { Write-Host "     $_" } }
  else { Write-Host "     (nenhuma)" }
  Write-Host ""
  Write-Host "   Se houver uma ABERTA acima:"
  Write-Host "     gcloud billing projects link $Projeto --billing-account=ID"
  Write-Host ""
  Write-Host "   Se a conta de faturamento pertence a outro login, o caminho e"
  Write-Host "   publicar num projeto que ja tenha faturamento:"
  Write-Host "     .\infra\cloud-run.ps1 -Projeto OUTRO_PROJETO -Conta EMAIL"
  throw "Faturamento nao habilitado em $Projeto."
}
Write-Host "   habilitado" -ForegroundColor Green

# ── Docker ─────────────────────────────────────────────────────────────────
# O Docker Desktop desta máquina não sobe no boot e cai quando a máquina
# dorme — é característica conhecida, não bug. Sem esta conferência o erro
# aparece como "failed to connect to the docker API at npipe://...", que soa
# como problema de configuração e manda a pessoa procurar no lugar errado.
Passo "Conferindo o Docker"

$anterior = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& docker info --format "{{.ServerVersion}}" 2>$null | Out-Null
$daemonOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $anterior

if (-not $daemonOk) {
  Write-Host ""
  Write-Host "   O daemon do Docker nao responde." -ForegroundColor Red
  Write-Host "   Nesta maquina o Docker Desktop nao sobe sozinho e cai quando ela dorme."
  Write-Host ""
  Write-Host "   Abra o Docker Desktop e espere a baleia parar de animar, ou:"
  Write-Host "     Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"
  Write-Host ""
  Write-Host "   Para saber quando esta pronto:"
  Write-Host "     docker info"
  throw "Docker indisponivel."
}
Write-Host "   daemon respondendo" -ForegroundColor Green

# ── Build ──────────────────────────────────────────────────────────────────
$imagem = "$Regiao-docker.pkg.dev/$Projeto/$Servico/app:$(git -C $raiz rev-parse --short HEAD)"

Passo "Construindo a imagem"
Write-Host "   $imagem"

# Só NEXT_PUBLIC_* como build arg: o Next as grava dentro do JavaScript, e
# elas já vão para o navegador de qualquer forma. Segredo aqui ficaria na
# imagem, visível em `docker history`.
$argsBuild = @(
  "build", "-t", $imagem, "-f", (Join-Path $raiz "Dockerfile"),
  "--build-arg", "NEXT_PUBLIC_SUPABASE_URL=$($cfg['NEXT_PUBLIC_SUPABASE_URL'])",
  "--build-arg", "NEXT_PUBLIC_SUPABASE_ANON_KEY=$($cfg['NEXT_PUBLIC_SUPABASE_ANON_KEY'])",
  "--build-arg", "NEXT_PUBLIC_SITE_URL=$($cfg['NEXT_PUBLIC_SITE_URL'])",
  "--build-arg", "NEXT_PUBLIC_APP_URL=$($cfg['NEXT_PUBLIC_APP_URL'])",
  "--build-arg", "NEXT_PUBLIC_WHATSAPP_NUMBER=$($cfg['NEXT_PUBLIC_WHATSAPP_NUMBER'])",
  $raiz
)
& docker @argsBuild
if ($LASTEXITCODE -ne 0) { throw "O build da imagem falhou." }

if ($SomenteBuild) {
  Passo "Imagem pronta. Para experimentar antes de publicar:"
  Write-Host "   docker run --rm -p 8080:8080 --env-file .env.local $imagem"
  Write-Host "   e abra http://localhost:8080"
  exit 0
}

# ── Preparo do projeto ─────────────────────────────────────────────────────
Passo "Habilitando as APIs (não faz nada se já estiverem)"
# --quiet porque o gcloud faz pergunta interativa quando a API está desligada
# ("Would you like to enable and retry?"), e num script isso é um travamento
# esperando alguém digitar.
#
# A checagem do código de saída não é zelo excessivo: sem ela, o erro daqui
# era só impresso e o script seguia criando repositório e empurrando 343 MB
# de imagem para um registry que não existia. Falhava três minutos depois,
# com uma mensagem que não apontava para a causa.
gcloud @gc services enable run.googleapis.com artifactregistry.googleapis.com `
  --project=$Projeto --quiet
if ($LASTEXITCODE -ne 0) { throw "Nao consegui habilitar as APIs em $Projeto." }

Passo "Garantindo o repositório de imagens"
$existe = Perguntar-Gcloud @gc artifacts repositories describe $Servico `
  --location=$Regiao --project=$Projeto --format="value(name)"
if (-not $existe) {
  gcloud @gc artifacts repositories create $Servico `
    --repository-format=docker --location=$Regiao --project=$Projeto `
    --description="Imagens do site NeoSenses" --quiet
  if ($LASTEXITCODE -ne 0) { throw "Nao consegui criar o repositorio de imagens." }
}
gcloud @gc auth configure-docker "$Regiao-docker.pkg.dev" --quiet

Passo "Enviando a imagem"
docker push $imagem
if ($LASTEXITCODE -ne 0) { throw "O push falhou." }

# ── Variáveis de execução ──────────────────────────────────────────────────
# Arquivo temporário fora da pasta do projeto, para não haver a menor chance
# de um `git add -A` alcançá-lo. Apagado no finally, mesmo se der erro.
$arquivoEnv = Join-Path ([System.IO.Path]::GetTempPath()) "neosenses-env-$([guid]::NewGuid()).yaml"

try {
  $runtime = @(
    "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY", "GOOGLE_GENERATIVE_AI_API_KEY",
    "AI_PROVIDER", "AI_MODEL", "RESEND_API_KEY", "EMAIL_EQUIPE",
    "EMAIL_REMETENTE", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_APP_NAME", "NEXT_PUBLIC_DEFAULT_LOCALE",
    "NEXT_PUBLIC_WHATSAPP_NUMBER"
  )
  $linhas = foreach ($chave in $runtime) {
    if ($cfg[$chave]) {
      # Aspas simples no YAML: nada é interpretado. A duplicação escapa a
      # própria aspa, que é como o YAML faz.
      "${chave}: '$($cfg[$chave] -replace "'", "''")'"
    }
  }
  Set-Content -Path $arquivoEnv -Value $linhas -Encoding utf8

  Passo "Publicando no Cloud Run"
  gcloud @gc run deploy $Servico `
    --image=$imagem `
    --region=$Regiao `
    --project=$Projeto `
    --platform=managed `
    --allow-unauthenticated `
    --port=8080 `
    --memory=1Gi `
    --cpu=1 `
    --min-instances=0 `
    --max-instances=10 `
    --timeout=300 `
    --env-vars-file=$arquivoEnv
  if ($LASTEXITCODE -ne 0) { throw "O deploy falhou." }
}
finally {
  if (Test-Path $arquivoEnv) { Remove-Item $arquivoEnv -Force }
}

$url = gcloud @gc run services describe $Servico --region=$Regiao --project=$Projeto `
  --format="value(status.url)"

Passo "No ar"
Write-Host "   $url" -ForegroundColor Green
Write-Host @"

   Confira nesta ordem — cada um pega uma classe diferente de problema:

     1. $url                    a home carrega e tem estilo
     2. $url/contato            envie e confirme o lead em /admin/leads
     3. $url/planejar           o roteiro monta sem estourar o tempo
     4. $url/admin              redireciona para o login
     5. $url/sitemap.xml        endereços com o domínio certo

   min-instances=0 significa partida a frio de 2 a 4 s na primeira visita
   depois de um período parado. É o preço de não pagar por serviço ocioso.

   Para remover tudo:  .\infra\cloud-run.ps1 -Destruir
"@
