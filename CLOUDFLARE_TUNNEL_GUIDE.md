# 🔒 Guide Rapide : Tunnel Cloudflare pour Tests Mobiles

## 🎯 Pourquoi utiliser Cloudflare Tunnel ?

- **📱 Caméra mobile** : HTTPS requis pour l'accès à la caméra sur téléphone
- **🔒 Sécurité** : Connexion chiffrée entre votre téléphone et l'application
- **🌐 Accessibilité** : Accès depuis n'importe où (pas seulement le réseau local)
- **🔄 Fiabilité** : Reconnexion automatique en cas de déconnexion

## 🚀 Démarrage Rapide

### Option 1 : Démarrage séparé (recommandé)
```bash
# Terminal 1 : Démarrer le serveur de développement
npm run dev

# Terminal 2 : Créer le tunnel HTTPS
npm run tunnel
```

### Option 2 : Démarrage automatique
```bash
# Démarrer le serveur + tunnel en parallèle
npm run dev:tunnel
```

## 📱 Utilisation sur Mobile

### 1. Démarrer le tunnel
```bash
npm run tunnel
```

### 2. Copier l'URL HTTPS
Le tunnel génère une URL unique comme :
```
🔗 URL HTTPS: https://abc123-def456-ghi789.trycloudflare.com
```

### 3. Ouvrir sur votre téléphone
- Ouvrez le navigateur de votre téléphone
- Collez l'URL HTTPS générée
- L'application se charge avec accès complet à la caméra

## 🔧 Configuration Avancée

### Variables d'environnement
Créez un fichier `.env` pour personnaliser :
```bash
# Configuration du tunnel (optionnel)
CLOUDFLARE_TUNNEL_URL=http://localhost:5173
```

### Ports personnalisés
Si vous utilisez un port différent :
```bash
# Modifier le script dans package.json
"tunnel": "cloudflared tunnel --url http://localhost:3000"
```

## 🚨 Dépannage

### Problème : Tunnel ne démarre pas
```bash
# Vérifier l'installation
npx cloudflared --version

# Réinstaller si nécessaire
npm install --save-dev cloudflared
```

### Problème : Port déjà utilisé
```bash
# Vérifier les processus sur le port 5173
lsof -i :5173

# Arrêter le processus si nécessaire
kill -9 <PID>
```

### Problème : Tunnel se déconnecte
- C'est normal, le tunnel se reconecte automatiquement
- L'URL reste la même
- Vérifiez que votre connexion internet est stable

## 📋 Commandes Utiles

### Vérifier le statut du tunnel
```bash
# Voir les tunnels actifs
npx cloudflared tunnel list

# Voir les informations d'un tunnel
npx cloudflared tunnel info <tunnel-id>
```

### Arrêter le tunnel
```bash
# Ctrl+C dans le terminal du tunnel
# Ou fermer le terminal
```

### Redémarrer le tunnel
```bash
# Arrêter avec Ctrl+C puis relancer
npm run tunnel
```

## 🌟 Conseils d'Utilisation

### Performance
- Le tunnel ajoute une latence minime
- Idéal pour les tests, pas pour la production
- L'URL change à chaque redémarrage

### Sécurité
- L'URL est publique mais temporaire
- Évitez de partager l'URL publiquement
- Le tunnel se ferme automatiquement à l'arrêt

### Développement
- Gardez le tunnel ouvert pendant vos tests
- Utilisez l'URL HTTPS pour tous vos tests mobiles
- Testez la caméra et les fonctionnalités sensibles

## 🔗 Ressources

- [Documentation Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Installation cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
- [Dépannage des tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/)

---

**💡 Astuce** : Gardez ce guide ouvert pendant vos premiers tests avec le tunnel !
