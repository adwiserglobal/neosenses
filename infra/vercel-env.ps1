<#
.SINOPSE
  Cadastra as variáveis de ambiente do .env.local no projeto da Vercel.

.POR QUE EXISTE
  O .env.local não sobe com o código — está no .gitignore, e é assim que tem
  que ser. Sem as variáveis cadastradas no painel, o site sobe respondendo
  200 em tudo e não grava nada: o Concierge responde, o formulário diz que
  enviou, e o banco não recebe. Já vimos esse sintoma neste projeto.

  São treze campos. Digitar um por um no painel é onde se erra um caractere
  e se perde uma tarde procurando.

.SEGREDO
  O valor nunca aparece na linha de comando — vai por pipe, a partir de uma
  variável. A própria documentação da Vercel desaconselha
  `echo VALOR | vercel env add`, porque aí o valor fica no histórico do shell.

.USO
  .\infra\vercel-env.ps1 -Url https://neosenses.vercel.app
  .\infra\vercel-env.ps1 -Url https://www.neosenses.com.br -Ambiente production
  .\infra\vercel-env.ps1 -Listar
#>

[CmdletBinding()]
param(
  # Endereço público do site. Sem isto, NEXT_PUBLIC_SITE_URL e
  # NEXT_PUBLIC_APP_URL iriam com o valor de desenvolvimento
  # (http://localhost:3000), e o sitemap sairia apontando para a máquina de
  # quem publicou.
  [string]$Url = "",
  [ValidateSet("production", "preview", "development")]
  [string]$Ambiente = "production",
  [switch]$Listar
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$envLocal = Join-Path $raiz ".env.local"

function Passo($t) { Write-Host "`n== $t" -ForegroundColor Cyan }
function Aviso($t) { Write-Host "   $t" -ForegroundColor Yellow }

# Mesmo motivo da função equivalente em cloud-run.ps1: com
# $ErrorActionPreference = "Stop", stderr de executável nativo vira erro
# terminante e 2>$null não impede.
function Perguntar-Exe {
  param([string]$Programa, [Parameter(ValueFromRemainingArguments = $true)][string[]]$Argumentos)
  $anterior = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $saida = & $Programa @Argumentos 2>$null
    if ($LASTEXITCODE -ne 0) { return $null }
    return ($saida | Where-Object { $_ }) -join "`n"
  } catch { return $null } finally { $ErrorActionPreference = $anterior }
}

Set-Location $raiz

# ── A CLI existe? ──────────────────────────────────────────────────────────
Passo "Conferindo a CLI da Vercel"
$versao = Perguntar-Exe npx --no-install vercel --version
if (-not $versao) {
  Write-Host "   A CLI da Vercel nao esta instalada." -ForegroundColor Red
  Write-Host ""
  Write-Host "     npm i -g vercel"
  throw "CLI ausente."
}
Write-Host "   vercel $versao" -ForegroundColor Green

# ── Sessão ─────────────────────────────────────────────────────────────────
# `vercel whoami` NÃO serve para descobrir se há sessão: sem credencial ele
# inicia o fluxo de login por device code e fica esperando a autorização no
# navegador — para sempre, num script. Medido: 20 s de espera sem sinal de que
# ia terminar.
#
# Por isso a checagem é o arquivo de credencial, que é instantânea e não
# dispara nada. Só depois de saber que existe sessão é que `whoami` é chamado,
# e aí ele responde na hora.
Passo "Conferindo a sessao"

# O caminho do arquivo já mudou entre versões e não é o óbvio: na 58.x fica em
# %APPDATA%\xdg.data\com.vercel.cli (XDG emulado), não em LOCALAPPDATA. Por
# isso a lista, e por isso o fallback logo abaixo — supor um caminho só produz
# o erro oposto ao travamento: dizer "nao logado" para quem está logado.
$candidatos = @(
  "$env:APPDATA\xdg.data\com.vercel.cli",
  "$env:LOCALAPPDATA\com.vercel.cli",
  "$env:APPDATA\com.vercel.cli",
  "$env:XDG_DATA_HOME\com.vercel.cli",
  "$env:USERPROFILE\.local\share\com.vercel.cli"
) | Where-Object { $_ -and (Test-Path $_) }

$temCredencial = [bool]$env:VERCEL_TOKEN   # token por variável dispensa arquivo
foreach ($dir in $candidatos) {
  if ($temCredencial) { break }
  $auth = Get-ChildItem $dir -Recurse -Filter "auth.json" -ErrorAction SilentlyContinue |
          Select-Object -First 1
  if ($auth) {
    try { $temCredencial = [bool]((Get-Content $auth.FullName -Raw | ConvertFrom-Json).token) }
    catch { }
  }
}

# Nenhum caminho conhecido bateu. Antes de declarar que não há sessão, pergunta
# à própria CLI — mas num job com prazo, porque é exatamente aqui que ela
# começaria o fluxo de login e ficaria esperando para sempre.
if (-not $temCredencial) {
  $tarefa = Start-Job { vercel whoami 2>$null }
  if (Wait-Job $tarefa -Timeout 15) {
    $resposta = Receive-Job $tarefa -ErrorAction SilentlyContinue
    $temCredencial = [bool]($resposta | Where-Object { $_ -and $_ -notmatch "^>" })
  } else {
    Stop-Job $tarefa   # entrou no fluxo de login: não há sessão
  }
  Remove-Job $tarefa -Force -ErrorAction SilentlyContinue
}

if (-not $temCredencial) {
  Write-Host "   Ninguem logado na CLI da Vercel." -ForegroundColor Red
  Write-Host ""
  Write-Host "   O login abre o navegador para autorizar, entao rode voce:"
  Write-Host "     vercel login"
  throw "Sem sessao."
}

$quem = Perguntar-Exe vercel whoami
Write-Host "   $(if ($quem) { $quem } else { 'sessao encontrada' })" -ForegroundColor Green

# ── Projeto vinculado ──────────────────────────────────────────────────────
Passo "Conferindo o vinculo com o projeto"
$vinculo = Join-Path $raiz ".vercel\project.json"
if (-not (Test-Path $vinculo)) {
  Write-Host "   Esta pasta ainda nao esta ligada a um projeto da Vercel." -ForegroundColor Red
  Write-Host ""
  Write-Host "   O vinculo faz perguntas, entao rode voce:"
  Write-Host "     vercel link"
  Write-Host ""
  Write-Host "   Ou publique uma vez, que ele e criado no caminho:"
  Write-Host "     vercel"
  throw "Projeto nao vinculado."
}
$proj = Get-Content $vinculo -Raw | ConvertFrom-Json
Write-Host "   projectId $($proj.projectId)" -ForegroundColor Green

if ($Listar) {
  Passo "Variaveis ja cadastradas"
  & vercel env ls $Ambiente
  exit 0
}

# ── Leitura do .env.local ──────────────────────────────────────────────────
if (-not (Test-Path $envLocal)) { throw "Nao achei o .env.local em $raiz." }
$cfg = @{}
foreach ($linha in Get-Content $envLocal) {
  if ($linha -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    $cfg[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
  }
}

# O endereço público sobrescreve o de desenvolvimento.
if ($Url) {
  $cfg["NEXT_PUBLIC_SITE_URL"] = $Url.TrimEnd("/")
  $cfg["NEXT_PUBLIC_APP_URL"]  = $Url.TrimEnd("/")
} elseif ($cfg["NEXT_PUBLIC_APP_URL"] -like "*localhost*") {
  Aviso "NEXT_PUBLIC_APP_URL aponta para localhost e nenhum -Url foi informado."
  Aviso "O sitemap e os dados estruturados vao sair com endereco de desenvolvimento."
}

# ── O que vai subir ────────────────────────────────────────────────────────
# NEXT_PUBLIC_* chegam ao navegador de qualquer forma, então guardá-las como
# "sensitive" só atrapalha: some do painel sem proteger nada. As outras quatro
# são segredo de verdade e ficam sensitive, que é o padrão da Vercel.
$publicas = @(
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_DEFAULT_LOCALE", "NEXT_PUBLIC_WHATSAPP_NUMBER"
)
$secretas = @(
  "SUPABASE_SERVICE_ROLE_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "RESEND_API_KEY"
)
$simples = @("AI_PROVIDER", "AI_MODEL", "EMAIL_EQUIPE", "EMAIL_REMETENTE")

# Sem estas o site nao funciona; as demais degradam em silencio.
$obrigatorias = @(
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"
)
$faltando = $obrigatorias | Where-Object { -not $cfg[$_] }
if ($faltando) { throw "Vazia(s) no .env.local: $($faltando -join ', ')" }

Passo "Cadastrando em '$Ambiente'"

$enviadas = 0
$puladas  = @()

foreach ($nome in ($publicas + $simples + $secretas)) {
  $valor = $cfg[$nome]
  if (-not $valor) { $puladas += $nome; continue }

  $sensivel = if ($secretas -contains $nome) { "--sensitive" } else { "--no-sensitive" }

  # NÃO usar pipe do PowerShell aqui. Medido nesta máquina: `$valor | vercel`
  # entrega `EF BB BF` antes do primeiro caractere, e forçar $OutputEncoding
  # para UTF8 sem BOM NÃO corrige — o redirecionamento de stdin para
  # executável nativo não olha essa variável.
  #
  # O estrago é silencioso e caro: as treze variáveis foram cadastradas com um
  # BOM invisível grudado no valor, e o build só quebrou lá na frente, no
  # `new URL()`, com "TypeError: Invalid URL" apontando para uma URL que
  # parecia perfeita na tela.
  #
  # Arquivo temporário sem BOM + redirecionamento pelo cmd entrega os bytes
  # exatos. Fica fora da pasta do projeto e é apagado no finally, inclusive
  # se der erro — ele contém segredo enquanto existe.
  $arquivoValor = Join-Path ([System.IO.Path]::GetTempPath()) "nsenv-$([guid]::NewGuid()).txt"
  $anterior = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    [System.IO.File]::WriteAllText($arquivoValor, $valor, (New-Object System.Text.UTF8Encoding($false)))
    cmd /c "vercel env add $nome $Ambiente --force $sensivel < `"$arquivoValor`" >nul 2>&1"
    $codigo = $LASTEXITCODE
  } finally {
    Remove-Item $arquivoValor -Force -ErrorAction SilentlyContinue
    $ErrorActionPreference = $anterior
  }

  if ($codigo -eq 0) {
    $marca = if ($secretas -contains $nome) { "(secreta)" } else { "" }
    Write-Host ("   ok      {0,-32} {1}" -f $nome, $marca) -ForegroundColor Green
    $enviadas++
  } else {
    Write-Host ("   FALHOU  {0}" -f $nome) -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "   $enviadas cadastrada(s)."

if ($puladas) {
  Write-Host ""
  Aviso "Vazias no .env.local, nao cadastradas:"
  foreach ($p in $puladas) {
    $consequencia = switch ($p) {
      "EMAIL_EQUIPE"    { "ninguem e avisado de lead novo" }
      "EMAIL_REMETENTE" { "o remetente cai no padrao do codigo" }
      "RESEND_API_KEY"  { "nenhum e-mail sai" }
      default           { "" }
    }
    Aviso "  $p $(if ($consequencia) { "— $consequencia" })"
  }
}

Write-Host @"

   Conferir:   .\infra\vercel-env.ps1 -Listar
   Publicar:   vercel --prod

   Variavel cadastrada agora so vale no PROXIMO deploy. Se o site ja estava
   no ar, publique de novo.
"@
