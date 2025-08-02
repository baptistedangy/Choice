# Composant Camera - Choice App

## 📷 Fonctionnalités

Le composant Camera utilise `react-webcam` pour fournir une interface de capture d'images pour le scan de menus.

### ✨ Caractéristiques principales

- **Flux vidéo en direct** : Affichage en temps réel de la caméra
- **Capture d'image** : Bouton pour prendre une photo
- **Prévisualisation** : Affichage de l'image capturée
- **Gestion d'erreurs** : Fallback si la caméra n'est pas disponible
- **Interface responsive** : Design adaptatif mobile/desktop
- **Guide de cadrage** : Overlay pour aider à positionner le menu

## 🛠️ Installation

```bash
npm install react-webcam
```

## 📱 Utilisation

### Import du composant
```jsx
import Camera from '../components/Camera';

// Dans votre composant
<Camera />
```

### Intégration dans MenuScan
```jsx
import React from 'react';
import Camera from '../components/Camera';

const MenuScan = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10">
            <h1 className="text-3xl font-bold text-white mb-2">Scanner de Menu</h1>
            <p className="text-green-100 text-lg">Scannez et analysez les menus de restaurants</p>
          </div>
          <div className="p-8">
            <Camera />
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 🎯 États du composant

### 1. **Mode Capture** (état initial)
- Affichage du flux vidéo en direct
- Bouton "📸 Prendre une photo"
- Guide de cadrage avec bordure pointillée
- Instructions d'utilisation

### 2. **Mode Prévisualisation** (après capture)
- Affichage de l'image capturée
- Badge "✓ Capturé" en haut à droite
- Boutons "🔄 Reprendre" et "✅ Analyser le menu"

### 3. **Mode Erreur** (si caméra indisponible)
- Message d'erreur explicatif
- Bouton "Réessayer" pour recharger la page
- Icône d'avertissement

## 🔧 Configuration

### Contraintes vidéo
```jsx
const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "environment" // Caméra arrière sur mobile
};
```

### Format de capture
- **Format** : JPEG
- **Qualité** : Par défaut (peut être ajustée)
- **Résolution** : 640x480 (responsive)

## 🎨 Design

### Classes TailwindCSS utilisées
- **Conteneur** : `card`, `overflow-hidden`
- **Boutons** : `btn`, `btn-primary`, `btn-secondary`
- **Layout** : `flex`, `space-y-6`, `items-center`
- **Responsive** : `max-w-2xl`, `w-full`, `h-auto`

### Couleurs et thème
- **Primaire** : Vert (green-600 à emerald-600)
- **Secondaire** : Gris neutres
- **Succès** : Vert (green-500)
- **Erreur** : Rouge (red-100)

## 🔒 Permissions

### Navigateur
Le composant nécessite l'autorisation d'accès à la caméra :
- **HTTPS requis** en production
- **Permission utilisateur** nécessaire
- **Fallback** en cas de refus

### Gestion des erreurs
```jsx
const handleCameraError = () => {
  setCameraError(true);
};

// Dans le composant Webcam
<Webcam
  onUserMediaError={handleCameraError}
  // ... autres props
/>
```

## 📱 Compatibilité

### Navigateurs supportés
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari (iOS 11+)
- ✅ Edge

### Fonctionnalités par plateforme
- **Desktop** : Caméra intégrée ou externe
- **Mobile** : Caméra arrière par défaut
- **Tablette** : Caméra disponible

## 🚀 Améliorations futures

### Fonctionnalités à ajouter
- [ ] **Zoom** : Contrôles de zoom pour le cadrage
- [ ] **Flash** : Contrôle du flash (si disponible)
- [ ] **Filtres** : Filtres d'amélioration d'image
- [ ] **Auto-capture** : Détection automatique de menu
- [ ] **Galerie** : Sélection depuis la galerie photos
- [ ] **Upload** : Upload de fichier image

### Optimisations techniques
- [ ] **Compression** : Optimisation de la taille d'image
- [ ] **Cache** : Mise en cache des images capturées
- [ ] **Performance** : Optimisation du rendu vidéo
- [ ] **Accessibilité** : Support des lecteurs d'écran

## 🐛 Dépannage

### Problèmes courants

1. **Caméra non détectée**
   - Vérifiez les permissions du navigateur
   - Assurez-vous d'être en HTTPS
   - Redémarrez le navigateur

2. **Image floue**
   - Vérifiez l'éclairage
   - Stabilisez l'appareil
   - Ajustez la distance

3. **Performance lente**
   - Fermez les autres onglets
   - Vérifiez la mémoire disponible
   - Redémarrez l'application

## 📄 Licence

Ce composant utilise `react-webcam` sous licence MIT. 