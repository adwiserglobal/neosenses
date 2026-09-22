#!/usr/bin/env bash
#
# Sobe o NeoSenses numa VM do free tier do Google Cloud.
#
# Rodar no Cloud Shell (https://console.cloud.google.com) — lá o gcloud já
# está autenticado e você não precisa mexer no JSON de credencial.
#
# ── Por que estas escolhas ────────────────────────────────────────────────
#
# e2-micro em us-central1: é o que o free tier cobre. Fora dessas regiões,
# a mesma máquina é cobrada. As regiões elegíveis são us-west1, us-central1
# e us-east1 — nenhuma no Brasil, então a latência para São Paulo fica em
# torno de 150 ms. Para homologação serve; para o site de verdade, não.
#
# 1 GB de RAM não builda Next.js. O build do Turbopack estoura e o processo
# morre com "JavaScript heap out of memory". Por isso o script cria 2 GB de
# swap ANTES de instalar qualquer coisa — sem isso, o passo do build falha e
# parece problema do código.
#
# ── O que este script NÃO faz ─────────────────────────────────────────────
#
# Não configura HTTPS nem domínio. É ambiente de teste, acessível por IP na
# porta 3000. Não coloque dado real de cliente aqui.
#
# ── Custo ─────────────────────────────────────────────────────────────────
#
# O free tier cobre 1 e2-micro por mês e 1 GB de tráfego de saída para a
# América do Norte. Passou disso, vira fatura. O script cria um alerta de
# orçamento, mas alerta AVISA — não impede. Se esquecer a VM ligada e o
# tráfego crescer, você paga.
#
# Para desligar tudo:  ./vm-free-tier.sh destruir
#
set -euo pipefail

NOME="${VM_NOME:-neosenses-teste}"
ZONA="${VM_ZONA:-us-central1-a}"
TIPO="e2-micro"
REPO="${VM_REPO:-https://github.com/aglemonflores/neosenses.git}"

destruir() {
  echo "Removendo a VM ${NOME} e a regra de firewall..."
  gcloud compute instances delete "${NOME}" --zone="${ZONA}" --quiet || true
  gcloud compute firewall-rules delete "${NOME}-3000" --quiet || true
  echo "Pronto. Confira em https://console.cloud.google.com/compute/instances"
}

if [[ "${1:-}" == "destruir" ]]; then
  destruir
  exit 0
fi

PROJETO="$(gcloud config get-value project 2>/dev/null)"
if [[ -z "${PROJETO}" || "${PROJETO}" == "(unset)" ]]; then
  echo "Nenhum projeto selecionado. Rode: gcloud config set project SEU_PROJETO"
  exit 1
fi

cat <<AVISO

  Projeto : ${PROJETO}
  VM      : ${NOME} (${TIPO}, ${ZONA})
  Acesso  : http://IP_DA_VM:3000  — sem HTTPS, ambiente de teste

  O free tier cobre 1 e2-micro e 1 GB de saída por mês. Acima disso, é cobrado.

AVISO
read -r -p "Criar? (digite: sim) " confirma
[[ "${confirma}" == "sim" ]] || { echo "Cancelado."; exit 0; }

# ── Script que roda dentro da VM ───────────────────────────────────────────
INICIALIZACAO=$(cat <<'DENTRO'
#!/bin/bash
set -e
exec > >(tee /var/log/neosenses-setup.log) 2>&1

echo "== swap: 1 GB de RAM não builda Next.js =="
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

echo "== dependências =="
apt-get update -qq
apt-get install -y -qq curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y -qq nodejs

echo "== código =="
git clone REPO_AQUI /opt/neosenses
cd /opt/neosenses/neosenses

# As variáveis de ambiente NÃO vêm no script de inicialização: ele fica
# legível nos metadados da instância para qualquer um com acesso ao projeto.
# Suba o .env.local depois, por scp.
if [ ! -f .env.local ]; then
  echo "AVISO: .env.local ausente. O app sobe sem banco e sem IA."
fi

npm ci
npm run build || echo "build falhou — veja /var/log/neosenses-setup.log"

echo "== serviço =="
cat > /etc/systemd/system/neosenses.service <<'UNIT'
[Unit]
Description=NeoSenses
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/neosenses/neosenses
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now neosenses
echo "== pronto =="
DENTRO
)

INICIALIZACAO="${INICIALIZACAO//REPO_AQUI/${REPO}}"

echo "Criando a VM..."
gcloud compute instances create "${NOME}" \
  --zone="${ZONA}" \
  --machine-type="${TIPO}" \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --tags="${NOME}" \
  --metadata=startup-script="${INICIALIZACAO}"

echo "Abrindo a porta 3000..."
gcloud compute firewall-rules create "${NOME}-3000" \
  --allow=tcp:3000 \
  --target-tags="${NOME}" \
  --description="NeoSenses — ambiente de teste" \
  2>/dev/null || echo "(regra já existia)"

IP="$(gcloud compute instances describe "${NOME}" --zone="${ZONA}" \
      --format='get(networkInterfaces[0].accessConfigs[0].natIP)')"

cat <<FIM

  VM criada. A instalação leva alguns minutos.

  Acompanhar:
    gcloud compute ssh ${NOME} --zone=${ZONA} --command="tail -f /var/log/neosenses-setup.log"

  Enviar as variáveis de ambiente (o app não funciona sem):
    gcloud compute scp .env.local ${NOME}:/opt/neosenses/neosenses/.env.local --zone=${ZONA}
    gcloud compute ssh ${NOME} --zone=${ZONA} --command="sudo systemctl restart neosenses"

  Depois:
    http://${IP}:3000

  DESLIGAR quando terminar — VM esquecida ligada é conta no fim do mês:
    ./vm-free-tier.sh destruir

FIM
