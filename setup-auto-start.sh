#!/bin/bash

# Script pour configurer le démarrage automatique de l'application Choice

echo "🔧 Configuration du démarrage automatique de l'application Choice..."

# Chemin vers le script de démarrage
SCRIPT_PATH="/Users/baptistedangy/Desktop/Projects/Choice/start-app.sh"

# Créer le fichier de configuration pour launchd
cat > ~/Library/LaunchAgents/com.choice.app.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.choice.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$SCRIPT_PATH</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/baptistedangy/Desktop/Projects/Choice/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/baptistedangy/Desktop/Projects/Choice/launchd-error.log</string>
    <key>WorkingDirectory</key>
    <string>/Users/baptistedangy/Desktop/Projects/Choice</string>
</dict>
</plist>
EOF

echo "✅ Fichier de configuration créé: ~/Library/LaunchAgents/com.choice.app.plist"

# Charger le service
launchctl load ~/Library/LaunchAgents/com.choice.app.plist

echo "✅ Service de démarrage automatique configuré !"
echo "🔄 L'application Choice démarrera automatiquement au prochain redémarrage de votre Mac"
echo "🌐 Accès: http://localhost:5173/"
echo "🛑 Pour désactiver: launchctl unload ~/Library/LaunchAgents/com.choice.app.plist" 