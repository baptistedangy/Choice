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

### Variables d'environnement
1. **Copier le fichier d'exemple** :
```bash
cp .env.example .env
```

2. **Configurer les clés API** dans le fichier `.env` :
```bash
# Google Cloud Vision API Key
VITE_GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# OpenAI API Key
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

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
