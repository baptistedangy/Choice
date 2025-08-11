#!/bin/bash

# 🔗 Script stable pour démarrer le tunnel Cloudflare
echo "🔒 Démarrage du tunnel Cloudflare stable..."

# Arrêter les tunnels existants
pkill -f cloudflared 2>/dev/null
sleep 3

# Vérifier que l'application locale fonctionne
echo "📱 Vérification de l'application locale..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Application locale accessible sur le port 5173"
else
    echo "❌ Application locale non accessible sur le port 5173"
    echo "💡 Démarrez d'abord votre application avec: npm run dev:full"
    exit 1
fi

echo ""
echo "🚀 Lancement du tunnel avec paramètres optimisés..."
echo "⏳ Attendez que l'URL apparaisse (peut prendre 10-30 secondes)..."
echo ""

# Démarrer le tunnel avec des paramètres optimisés
./node_modules/.bin/cloudflared tunnel \
  --url http://localhost:5173 \
  --protocol http2 \
  --no-tls-verify \
  --no-autoupdate \
  --no-chunked-encoding \
  --edge-ip-version auto \
  --retries 5 \
  --grace-period 30s

echo ""
echo "✅ Tunnel arrêté."
