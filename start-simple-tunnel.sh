#!/bin/bash

# 🔗 Script simple et direct pour démarrer le tunnel Cloudflare
echo "🔒 Démarrage du tunnel Cloudflare simple..."

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
echo "🚀 Lancement du tunnel simple..."
echo "⏳ Attendez que l'URL apparaisse..."
echo ""

# Démarrer le tunnel avec des paramètres minimaux
./node_modules/.bin/cloudflared tunnel --url http://localhost:5173

echo ""
echo "✅ Tunnel arrêté."
