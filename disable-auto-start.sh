#!/bin/bash

# Script pour désactiver le démarrage automatique de l'application Choice

echo "🛑 Désactivation du démarrage automatique de l'application Choice..."

# Décharger le service
launchctl unload ~/Library/LaunchAgents/com.choice.app.plist 2>/dev/null

# Supprimer le fichier de configuration
rm -f ~/Library/LaunchAgents/com.choice.app.plist

echo "✅ Démarrage automatique désactivé !"
echo "🔄 L'application Choice ne démarrera plus automatiquement"
echo "🚀 Pour démarrer manuellement: ./start-app.sh"
echo "🛑 Pour arrêter: ./stop-app.sh" 