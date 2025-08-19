#!/usr/bin/env bash
set -euo pipefail

NS="infra-ns-node-text-analyzer"

echo "=== Applying namespace manifest ==="
kubectl apply -f k8s/infra-ns.yaml

echo "=== Adding & updating Helm repos ==="
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

echo "=== Installing MongoDB ==="
helm install mongodb bitnami/mongodb \
  --namespace "$NS" \
  --values k8s/mongodb-values.yaml

echo "=== Installing Loki ==="
helm install loki grafana/loki \
  --namespace "$NS" \
  --values k8s/loki-values.yaml \
  --version 5.30.0

echo "=== Installing Grafana ==="
helm install grafana grafana/grafana \
  --namespace "$NS" \
  --values k8s/grafana-values.yaml

echo "=== Deploying application manifests ==="
kubectl apply -f k8s/app/

echo "✅ Deployment commands executed successfully."
echo "Tip: Use 'kubectl get pods -n $NS' to watch pods starting."
