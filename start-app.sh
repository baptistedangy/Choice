#!/bin/bash

# Script pour démarrer l'application Choice (workspace)
cd /workspace

# Démarrer le serveur backend en arrière-plan (dev + OCR simulé possible)
export NODE_ENV=${NODE_ENV:-development}
export SIMULATE_OCR=${SIMULATE_OCR:-true}
export PORT=${PORT:-3001}

echo "🚀 Démarrage du serveur backend (NODE_ENV=$NODE_ENV, SIMULATE_OCR=$SIMULATE_OCR, PORT=$PORT)..."
node server.js > server.log 2>&1 &
BACKEND_PID=$!

# Attendre que le backend démarre
sleep 2

# Démarrer le frontend en arrière-plan
echo "🌐 Démarrage du frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Sauvegarder les PIDs pour pouvoir arrêter plus tard
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

# Affichage des liens
echo "✅ Application Choice démarrée !"
echo "🌐 Frontend: http://localhost:5173/"
echo "🔧 Backend: http://localhost:3001/"
echo "📝 Logs: server.log et frontend.log"
echo "🛑 Pour arrêter: ./stop-app.sh" 