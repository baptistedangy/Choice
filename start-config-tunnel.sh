#!/bin/bash

# 🔗 Script avec configuration personnalisée pour éviter les erreurs
echo "🔒 Démarrage du tunnel Cloudflare avec configuration personnalisée..."

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
echo "🚀 Lancement du tunnel avec configuration personnalisée..."
echo "⏳ Attendez que l'URL apparaisse..."
echo ""

# Démarrer le tunnel avec la configuration personnalisée
./node_modules/.bin/cloudflared tunnel --config tunnel-config.yml

echo ""
echo "✅ Tunnel arrêté."
