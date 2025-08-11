#!/bin/bash

# 📱 Script de démarrage pour test mobile
echo "📱 Démarrage du test mobile avec Choice..."

# Vérifier que l'application locale fonctionne
echo "🔍 Vérification de l'application locale..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Application locale accessible sur le port 5173"
else
    echo "❌ Application locale non accessible sur le port 5173"
    echo "💡 Démarrez d'abord votre application avec: npm run dev"
    exit 1
fi

echo ""
echo "🚀 Démarrage du tunnel LocalTunnel..."
echo "📱 Copiez l'URL HTTPS qui apparaîtra ci-dessous sur votre téléphone"
echo ""

# Démarrer le tunnel sans mot de passe
npm run tunnel:web

echo ""
echo "✅ Tunnel arrêté."
