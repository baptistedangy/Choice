#!/bin/bash

# Script pour arrêter l'application Choice
cd /workspace

echo "🛑 Arrêt de l'application Choice..."

# Arrêter le backend
if [ -f backend.pid ]; then
    kill $(cat backend.pid) 2>/dev/null || true
    rm -f backend.pid
else
    echo "⚠️ Fichier backend.pid non trouvé"
fi

# Arrêter le frontend
if [ -f frontend.pid ]; then
    kill $(cat frontend.pid) 2>/dev/null || true
    rm -f frontend.pid
else
    echo "⚠️ Fichier frontend.pid non trouvé"
fi

# Arrêter tous les processus node liés à ce projet
echo "🧹 Nettoyage des processus restants..."
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Stop tunnels if any
pkill -f cloudflared 2>/dev/null || true

echo "✅ Application Choice arrêtée !" 