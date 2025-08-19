#!/usr/bin/env bash
set -euo pipefail

NS="infra-ns-node-text-analyzer"

echo "=== Uninstalling Grafana ==="
helm uninstall grafana --namespace "$NS" || echo "Grafana not found."

echo "=== Uninstalling Loki ==="
helm uninstall loki --namespace "$NS" || echo "Loki not found."

echo "=== Uninstalling MongoDB ==="
helm uninstall mongodb --namespace "$NS" || echo "MongoDB not found."

echo "=== Deleting application manifests ==="
kubectl delete -f k8s/app/ --ignore-not-found

echo "=== Deleting loki-logs-* pods force with 0 grace ==="
kubectl get pods --namespace "$NS" --no-headers=true | grep "loki-logs" | awk '{print $1}' | xargs kubectl delete pod --namespace "$NS" --force --grace-period=0

echo "=== Deleting namespace ==="
kubectl delete -f k8s/infra-ns.yaml --ignore-not-found

echo "✅ Teardown complete."
echo "Tip: Run 'kubectl get ns' to confirm the namespace is gone."
