# 🌐 Configuration Réseau Local

Ce document explique comment configurer l'application pour qu'elle soit accessible sur le réseau local et pointe automatiquement vers le backend LAN.

## 🚀 Serveur de Développement Accessible sur le Réseau

### Modification du script dev
Le script `dev` dans `package.json` a été modifié pour inclure l'option `--host` :

```json
{
  "scripts": {
    "dev": "vite --host"
  }
}
```

**Avantages :**
- ✅ Accessible depuis d'autres appareils sur le réseau local
- ✅ Détection automatique de l'IP locale
- ✅ Configuration automatique du backend

### Démarrer le serveur
```bash
npm run dev
```

**Sortie attendue :**
```
> choice@0.0.0 dev
> vite --host

  VITE v7.0.6  ready in 144 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/  # Votre IP locale
```

## 🔧 Configuration Automatique du Backend

### Fichier de configuration
Le fichier `src/config/backend.js` gère automatiquement l'URL du backend :

```javascript
function getBackendUrl() {
  // Priorité 1: Variable d'environnement
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Priorité 2: Détection automatique de l'IP locale
  const hostname = window.location.hostname;
  const isLocalIP = /^(?:10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|::1$|fe80:|fc00:|fd00:)/.test(hostname);
  
  if (isLocalIP) {
    return `http://${hostname}:3001`;
  }
  
  // Priorité 3: Localhost par défaut
  return 'http://localhost:3001';
}
```

### Logique de détection
1. **Variable d'environnement** : `VITE_BACKEND_URL` (priorité maximale)
2. **IP locale** : Détection automatique des plages d'IP privées
3. **Localhost** : Fallback par défaut

### Plages d'IP détectées automatiquement
- `10.0.0.0/8` - Réseaux privés classe A
- `172.16.0.0/12` - Réseaux privés classe B
- `192.168.0.0/16` - Réseaux privés classe C
- `127.0.0.0/8` - Localhost
- `::1` - IPv6 localhost
- `fe80::/10` - IPv6 link-local
- `fc00::/7` - IPv6 unique local

## 📱 Utilisation sur le Réseau Local

### 1. Démarrer le serveur backend
```bash
npm run server
# ou
node server.js
```

### 2. Démarrer le serveur frontend
```bash
npm run dev
```

### 3. Accéder depuis d'autres appareils
- **Frontend** : `http://VOTRE_IP_LOCALE:5173`
- **Backend** : `http://VOTRE_IP_LOCALE:3001`

### 4. Vérifier la configuration
Ouvrez la console du navigateur pour voir :
```
🌐 Backend URL configurée: http://192.168.1.100:3001
📍 Frontend accessible sur: http://192.168.1.100:5173/
🔧 Hostname détecté: 192.168.1.100
```

## 🔒 Tunnel HTTPS avec Cloudflare (Tests Mobiles)

### Pourquoi utiliser Cloudflare Tunnel ?
- **📱 Support de la caméra** : HTTPS requis pour l'accès à la caméra sur mobile
- **🔒 Sécurité** : Connexion chiffrée entre votre téléphone et l'application
- **🌐 Accessibilité** : Accès depuis n'importe où, pas seulement le réseau local
- **🔄 Fiabilité** : Reconnexion automatique en cas de déconnexion

### Méthodes de démarrage

#### Option 1 : Démarrage séparé (recommandé)
```bash
# Terminal 1 : Démarrer le serveur de développement
npm run dev

# Terminal 2 : Créer le tunnel HTTPS
npm run tunnel
```

#### Option 2 : Démarrage automatique
```bash
# Démarrer le serveur + tunnel en parallèle
npm run dev:tunnel
```

### Utilisation du tunnel
1. **Démarrage** : Le tunnel génère une URL HTTPS unique
2. **Accès mobile** : Utilisez cette URL sur votre téléphone
3. **Fonctionnalités** : Accès complet à la caméra et toutes les fonctionnalités
4. **Persistance** : Le tunnel reste actif tant que la commande tourne

### Exemple de sortie du tunnel
```
🌐 Tunnel Cloudflare créé
🔗 URL HTTPS: https://abc123-def456-ghi789.trycloudflare.com
📱 Utilisez cette URL sur votre téléphone
🌍 Tunnel accessible depuis n'importe où
```

## 🔒 Variables d'Environnement

### Configuration optionnelle
Créez un fichier `.env` à la racine du projet :

```bash
# Configuration du backend (optionnel)
VITE_BACKEND_URL=http://192.168.1.100:3001

# Clés API
VITE_GOOGLE_VISION_API_KEY=your_key_here
VITE_OPENAI_API_KEY=your_key_here
```

### Priorité des configurations
1. **VITE_BACKEND_URL** (si définie)
2. **Détection automatique** (IP locale)
3. **Localhost** (fallback)

## 🚀 Scripts Disponibles

### Scripts de développement
```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Construire pour la production
npm run preview      # Prévisualiser la build de production
npm run lint         # Linter le code
```

### Scripts de serveur
```bash
npm run server       # Lancer le serveur backend
npm run dev:full     # Lancer le serveur backend + frontend
npm run start        # Démarrer l'application en production
npm run deploy       # Construire et déployer
```

### Scripts de tunnel
```bash
npm run tunnel       # Créer un tunnel HTTPS avec Cloudflare
npm run dev:tunnel   # Lancer le serveur dev + tunnel en parallèle
```

## 🧪 Tests et Débogage

### Vérifier la configuration
```bash
# Test de la configuration
node test-backend-config.js
```

### Logs de démarrage
Les logs suivants apparaissent au démarrage de l'application :
```
🚀 Application démarrée avec la configuration suivante:
🌐 Backend URL: http://192.168.1.100:3001
📍 Frontend URL: http://192.168.1.100:5173/
```

### Vérifier la connectivité
```bash
# Test du frontend
curl http://VOTRE_IP_LOCALE:5173

# Test du backend
curl http://VOTRE_IP_LOCALE:3001/health
```

## 🚨 Dépannage

### Problème : Serveur non accessible sur le réseau
**Solution :** Vérifiez que le firewall autorise le port 5173

### Problème : Backend non accessible
**Solution :** Vérifiez que le serveur backend écoute sur `0.0.0.0:3001`

### Problème : Configuration incorrecte
**Solution :** Vérifiez les logs de la console du navigateur

### Problème : Tunnel Cloudflare ne fonctionne pas
**Solution :** Vérifiez que cloudflared est installé et que le port 5173 est accessible

## 📋 Résumé des Modifications

1. ✅ **package.json** : Ajout de `--host` au script dev + scripts tunnel
2. ✅ **src/config/backend.js** : Configuration automatique du backend
3. ✅ **src/services/backendService.js** : Import de la configuration
4. ✅ **src/services/api.js** : Utilisation de la configuration
5. ✅ **src/main.jsx** : Affichage de la configuration au démarrage
6. ✅ **README.md** : Documentation mise à jour + tunnel Cloudflare
7. ✅ **NETWORK_SETUP.md** : Guide de configuration réseau + tunnel HTTPS
8. ✅ **cloudflared** : Installation comme dépendance de développement

## 🎯 Avantages de cette Configuration

- **🌐 Accessibilité réseau** : L'application est accessible depuis d'autres appareils
- **🔧 Configuration automatique** : L'URL du backend est détectée automatiquement
- **📱 Développement mobile** : Test facile sur appareils mobiles
- **🔒 Tunnel HTTPS** : Accès sécurisé et support de la caméra mobile
- **🔄 Flexibilité** : Support des variables d'environnement et détection automatique
- **📊 Monitoring** : Logs clairs de la configuration au démarrage
