#!/bin/bash

# 🚀 Script de démarrage du tunnel Cloudflare
# Usage: ./start-tunnel.sh

echo "🔒 Démarrage du tunnel Cloudflare..."
echo "📱 Prêt pour les tests mobiles !"
echo ""

# Vérifier si cloudflared est installé
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared n'est pas installé"
    echo "📦 Installation en cours..."
    npm install --save-dev cloudflared
fi

# Démarrer le tunnel
echo "🔗 Lancement du tunnel..."
echo "💡 L'URL HTTPS sera affichée ci-dessous"
echo "📱 Copiez-la sur votre téléphone pour tester"
echo ""

npm run tunnel
