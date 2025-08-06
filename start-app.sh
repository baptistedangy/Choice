#!/bin/bash

# Script pour démarrer l'application Choice
cd /Users/baptistedangy/Desktop/Projects/Choice

# Démarrer le serveur backend en arrière-plan
echo "🚀 Démarrage du serveur backend..."
node server.js > server.log 2>&1 &
BACKEND_PID=$!

# Attendre que le backend démarre
sleep 3

# Démarrer le frontend en arrière-plan
echo "🌐 Démarrage du frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Sauvegarder les PIDs pour pouvoir arrêter plus tard
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo "✅ Application Choice démarrée !"
echo "🌐 Frontend: http://localhost:5173/"
echo "🔧 Backend: http://localhost:3001/"
echo "📝 Logs: server.log et frontend.log"
echo "🛑 Pour arrêter: ./stop-app.sh" 