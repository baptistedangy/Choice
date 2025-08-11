#!/bin/bash

echo "🔄 Arrêt des tunnels existants..."
pkill -f cloudflared
sleep 2

echo "🚀 Démarrage d'un nouveau tunnel..."
echo "📱 Récupération de l'URL HTTPS..."

# Démarrer le tunnel avec des paramètres optimisés
./node_modules/.bin/cloudflared tunnel --url http://localhost:5174 --protocol http2 --no-tls-verify 2>&1 | while IFS= read -r line; do
    echo "$line"
    
    # Chercher l'URL dans la sortie (attendre que le tunnel soit complètement initialisé)
    if [[ $line == *"https://"* ]] && [[ $line == *"trycloudflare.com"* ]]; then
        echo ""
        echo "🎉 URL TROUVÉE ! Copiez ceci sur votre téléphone :"
        echo "🔗 $line"
        echo ""
        echo "📱 Instructions :"
        echo "1. Ouvrez le navigateur de votre téléphone"
        echo "2. Collez l'URL ci-dessus"
        echo "3. Testez la caméra !"
        echo ""
        echo "💡 Gardez ce terminal ouvert pour maintenir le tunnel actif"
        echo "   Appuyez sur Ctrl+C pour arrêter le tunnel"
        break
    fi
done
