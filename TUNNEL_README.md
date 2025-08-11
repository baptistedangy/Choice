# 🔒 Guide Complet : Tunnel Cloudflare pour Choice

## 🎯 Objectif

Permettre l'accès à votre application Choice depuis n'importe où via HTTPS, essentiel pour :
- 📱 **Tests mobiles** avec accès à la caméra
- 🌐 **Démonstrations** à distance
- 🔒 **Sécurité** avec connexion chiffrée

## 🚀 Démarrage Rapide

### Option 1 : Une seule commande (recommandée)
```bash
npm run dev:tunnel
```

### Option 2 : Démarrage séparé
```bash
# Terminal 1 : Application
npm run dev

# Terminal 2 : Tunnel
npm run tunnel
```

### Option 3 : Script personnalisé
```bash
./start-tunnel.sh
```

## 📱 Utilisation sur Mobile

### 1. Démarrer le tunnel
```bash
npm run dev:tunnel
```

### 2. Identifier l'URL HTTPS
```
🔗 URL générée : https://abc123-def456-ghi789.trycloudflare.com
```

### 3. Tester sur téléphone
- 📱 Ouvrir le navigateur mobile
- 🔗 Coller l'URL HTTPS
- ✅ **Caméra accessible !**

## 🔧 Configuration

### Vérifier la configuration
```bash
npm run tunnel:check
```

### Modifier les paramètres
Éditez `tunnel.config.js` :
```javascript
export const tunnelConfig = {
  localPort: 5173,        // Port de votre app
  localUrl: 'http://localhost:5173'
};
```

### Variables d'environnement
Créez un fichier `.env` :
```bash
TUNNEL_PORT=5173
TUNNEL_NAME=choice-app
```

## 🚨 Dépannage

### Problème : Tunnel ne démarre pas
```bash
# Vérifier l'installation
npx cloudflared --version

# Réinstaller si nécessaire
npm install --save-dev cloudflared
```

### Problème : Port occupé
```bash
# Identifier le processus
lsof -i :5173

# Arrêter le processus
kill -9 <PID>
```

### Problème : Connexion instable
- ✅ **Normal** : Le tunnel se reconecte automatiquement
- 🔄 L'URL reste la même
- 📶 Vérifiez votre connexion internet

## 📋 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm run dev:tunnel` | 🚀 **Démarrage complet** |
| `npm run tunnel` | 🔗 Tunnel seul |
| `npm run tunnel:check` | ✅ Vérifier la config |
| `npm run tunnel:start` | 🎯 Script personnalisé |

## 🌟 Conseils d'Utilisation

### Performance
- ⚡ Latence minime ajoutée
- 🎯 Idéal pour les tests
- 🚫 Pas pour la production

### Sécurité
- 🔒 URL publique mais temporaire
- ⚠️ Évitez de partager publiquement
- 🛡️ Se ferme automatiquement

### Développement
- 📱 Gardez ouvert pendant les tests
- 🔄 Testez régulièrement la caméra
- 💾 Sauvegardez l'URL pour vos tests

## 🔗 Ressources

- [Documentation Cloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Installation cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
- [Dépannage](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/troubleshooting/)

## 📝 Exemples d'Usage

### Test de la caméra
```bash
# 1. Démarrer
npm run dev:tunnel

# 2. Copier l'URL HTTPS
# 3. Ouvrir sur mobile
# 4. Tester la fonctionnalité caméra
```

### Démonstration à distance
```bash
# 1. Lancer le tunnel
npm run tunnel

# 2. Partager l'URL HTTPS
# 3. Démontrer l'application
# 4. Arrêter avec Ctrl+C
```

---

**🎯 Prêt à tester ? Lancez `npm run dev:tunnel` !**

**💡 Astuce** : Gardez ce guide ouvert pendant vos premiers tests !
