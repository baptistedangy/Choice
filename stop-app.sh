#!/bin/bash

# Script pour arrêter l'application Choice
cd /Users/baptistedangy/Desktop/Projects/Choice

echo "🛑 Arrêt de l'application Choice..."

# Arrêter le backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "🔧 Arrêt du serveur backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    else
        echo "⚠️ Processus backend déjà arrêté"
    fi
    rm -f backend.pid
else
    echo "⚠️ Fichier backend.pid non trouvé"
fi

# Arrêter le frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "🌐 Arrêt du frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    else
        echo "⚠️ Processus frontend déjà arrêté"
    fi
    rm -f frontend.pid
else
    echo "⚠️ Fichier frontend.pid non trouvé"
fi

# Arrêter tous les processus node liés à ce projet
echo "🧹 Nettoyage des processus restants..."
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ Application Choice arrêtée !" 