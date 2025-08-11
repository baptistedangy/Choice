# Choice - Application React

Une application React moderne pour la gestion de profils utilisateur, le scan de menus et les recommandations alimentaires.

## 🚀 Technologies utilisées

- **React 18** - Framework JavaScript
- **Vite** - Outil de build rapide
- **TailwindCSS** - Framework CSS utilitaire
- **React Router** - Navigation entre les pages

## 📁 Structure du projet

```
src/
├── components/
│   └── Navigation.jsx          # Composant de navigation
├── pages/
│   ├── Profile.jsx             # Page de profil utilisateur
│   ├── MenuScan.jsx            # Page de scan de menu
│   └── Recommendations.jsx     # Page de recommandations
├── services/
│   └── api.js                  # Service API pour les appels futurs
├── App.jsx                     # Composant principal avec routage
└── index.css                   # Styles TailwindCSS
```

## 🛠️ Installation

1. **Cloner le projet** (si applicable)
```bash
git clone <repository-url>
cd Choice
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
```

4. **Ouvrir dans le navigateur**
```
http://localhost:5173
```

**🌐 Accès réseau local :** Le serveur est maintenant accessible sur votre réseau local avec l'option `--host`

## 📱 Fonctionnalités

### 🏠 Page d'accueil
- Redirection automatique vers la page Profil

### 👤 Profil
- Gestion des informations utilisateur
- Formulaire de modification des données personnelles
- Sélection des préférences alimentaires
- Interface moderne avec design responsive

### 📷 Scanner de Menu
- Interface de scan de menus
- Simulation d'analyse de menu
- Affichage des résultats scannés
- Boutons d'action pour analyser les recommandations

### ⭐ Recommandations
- Affichage des recommandations personnalisées
- Filtrage par catégories (Sain, Végétarien, Classique)
- Cartes de produits avec informations détaillées
- Système de notation et tags

### 🧭 Navigation
- Barre de navigation responsive
- Indication de la page active
- Menu mobile adaptatif
- Logo et branding

## 🎨 Design

L'application utilise TailwindCSS pour un design moderne et responsive :
- Gradients colorés pour les headers
- Cartes avec ombres et bordures arrondies
- Animations et transitions fluides
- Palette de couleurs cohérente
- Interface adaptée mobile et desktop

## 🔧 Configuration

### 🌐 Tunnel HTTPS avec Cloudflare (pour tests mobiles)

Pour tester l'application sur votre téléphone avec HTTPS (nécessaire pour l'accès à la caméra) :

#### 🚀 Démarrage Ultra-Rapide
```bash
# Une seule commande pour tout démarrer
npm run dev:tunnel
```

#### 📱 Workflow de Test Mobile avec LocalTunnel

Pour tester l'application sur votre téléphone avec accès à la caméra (HTTPS requis pour iOS) :

**Terminal A - Frontend :**
```bash
npm run dev
```

**Terminal B - Tunnel Frontend :**
```bash
npm run tunnel:web
```
→ Copiez l'URL `https://*.loca.lt` qui s'affiche

**Terminal C - Tunnel API (optionnel) :**
```bash
npm run tunnel:api
```
→ Copiez l'URL `https://*.loca.lt` qui s'affiche

**Configuration Backend (si nécessaire) :**
Créez un fichier `.env.development` :
```bash
VITE_BACKEND_URL=https://votre-api-url.loca.lt
```
Puis redémarrez Vite.

**Instructions :**
1. Gardez les terminaux ouverts
2. Utilisez l'URL frontend `https://*.loca.lt` sur votre téléphone
3. Testez la caméra et toutes les fonctionnalités

**💡 Avantages LocalTunnel :**
- ✅ HTTPS automatique (requis pour la caméra iOS)
- ✅ Plus simple que Cloudflare Tunnel
- ✅ Pas de certificats à configurer
- ✅ URLs stables pendant la session

#### 📚 Guides Disponibles
- **`QUICK_TUNNEL_START.md`** - Démarrage en 3 étapes
- **`TUNNEL_README.md`** - Guide complet
- **`TUNNEL_SUMMARY.md`** - Vue d'ensemble

#### 🔧 Options de Démarrage
```bash
# Option 1 : Démarrage séparé (recommandé)
npm run dev          # Terminal 1
npm run tunnel       # Terminal 2

# Option 2 : Démarrage automatique
npm run dev:tunnel   # Tout en une fois

# Option 3 : Script personnalisé
./start-tunnel.sh
```

#### Utilisation
1. Le tunnel Cloudflare génère une URL HTTPS unique
2. Utilisez cette URL sur votre téléphone pour accéder à l'application
3. L'URL HTTPS permet l'accès à la caméra sur mobile
4. Le tunnel se reconecte automatiquement en cas de déconnexion

**Exemple de sortie :**
```
🌐 Tunnel Cloudflare créé
🔗 URL HTTPS: https://abc123-def456-ghi789.trycloudflare.com
📱 Utilisez cette URL sur votre téléphone
```

### Variables d'environnement
1. **Copier le fichier d'exemple** :
```bash
cp .env.example .env
```

2. **Configurer les clés API** dans le fichier `.env` :
```bash
# Configuration du backend (optionnel)
VITE_BACKEND_URL=http://localhost:3001

# Google Cloud Vision API Key
VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# OpenAI API Key
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Configuration automatique du backend
L'application détecte automatiquement si elle tourne sur une IP locale et configure l'URL du backend en conséquence :
- **IP locale** : Utilise la même IP que le frontend avec le port 3001
- **localhost** : Utilise `http://localhost:3001`
- **Variable d'environnement** : Priorité si `VITE_BACKEND_URL` est définie

3. **Obtenir les clés API** :
- **Google Cloud Vision** : Créez un projet sur [Google Cloud Console](https://console.cloud.google.com/) et activez l'API Vision
- **OpenAI** : Créez une clé API sur [OpenAI Platform](https://platform.openai.com/api-keys)

### TailwindCSS
Le projet est configuré avec TailwindCSS dans `tailwind.config.js` et `postcss.config.js`.

### React Router
Le routage est configuré dans `App.jsx` avec les routes suivantes :
- `/` → Redirection vers `/profile`
- `/profile` → Page de profil
- `/menu-scan` → Page de scan de menu
- `/recommendations` → Page de recommandations

## 📡 API

Le fichier `src/services/api.js` contient des fonctions prêtes pour les appels API futurs :
- `get(endpoint)` - Appels GET
- `post(endpoint, data)` - Appels POST
- `put(endpoint, data)` - Appels PUT
- `delete(endpoint)` - Appels DELETE

## 🚀 Scripts disponibles

```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Construire pour la production
npm run preview      # Prévisualiser la build de production
npm run lint         # Linter le code (si configuré)

# 🔒 Tunnel Cloudflare (tests mobiles)
npm run tunnel       # Créer un tunnel HTTPS avec Cloudflare
npm run dev:tunnel   # Lancer le serveur dev + tunnel en parallèle
npm run tunnel:check # Vérifier la configuration du tunnel
npm run tunnel:start # Script de démarrage personnalisé
```

## 📝 TODO

- [ ] Implémenter l'authentification utilisateur
- [ ] Connecter l'API de scan de menu
- [ ] Ajouter la persistance des données
- [ ] Implémenter les notifications
- [ ] Ajouter des tests unitaires
- [ ] Optimiser les performances

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
