# MVP Cleanup - Nettoyage du chemin MVP

## 🎯 Objectif
Nettoyer le chemin MVP pour éliminer toutes les interruptions dans la boucle **scan → recommend**. Seuls les composants essentiels au flux MVP restent actifs.

## ✅ Composants MVP conservés
- **Camera/Scan** → `src/components/Camera.jsx`
- **OCR** → Backend `/analyze-image`
- **Parsed dishes** → Extraction locale des plats
- **scoreAndLabel** → `src/lib/mvpRecommender.js`
- **Top-3 cards** → `src/pages/Recommendations.jsx`

## 🗑️ Composants supprimés/déplacés vers `src/legacy/`
- `src/components/OnboardingFlow.jsx` → `src/legacy/`
- `src/pages/Profile.jsx` → `src/legacy/`
- `src/components/NutritionCard.jsx` → `src/legacy/`

## 🔧 Modifications effectuées

### 1. `src/App.jsx`
- ❌ Supprimé `OnboardingFlow` import et logique
- ❌ Supprimé `Profile` import et routes
- ✅ Gardé uniquement : MenuScan, Recommendations
- ✅ Route par défaut : `/menu-scan`

### 2. `src/pages/Recommendations.jsx`
- ❌ Supprimé `NutritionCard` import
- ❌ Supprimé états : `showProfileBanner`, `isAnalyzing`, `analysisContext`, `fallbackMode`, `diagnostics`
- ❌ Supprimé logique de profil étendu et préférences alimentaires
- ❌ Supprimé appels OpenAI et analyse AI
- ✅ Gardé : scoring local avec `scoreAndLabel`
- ✅ Gardé : cartes personnalisées avec badges colorés et scores

### 3. `src/components/Navigation.jsx`
- ✅ Déjà simplifié : Scan Menu + Recommendations uniquement

## 🚀 Flux MVP simplifié
```
📷 Scan Menu → 🔍 OCR Backend → 🍽️ Parsed Dishes → ⭐ Local Scoring → 🎯 Top-3 Cards
```

## 🧪 Vérification
- ✅ `npm run build` : Compilation réussie
- ✅ `npm run dev` : Frontend démarre sans erreur
- ✅ Routes MVP fonctionnelles
- ✅ Pas d'imports vers composants legacy

## 📝 Notes
- Les composants legacy sont préservés dans `src/legacy/` pour référence future
- Aucune interruption dans le flux scan→recommend
- Interface simplifiée et focalisée sur l'expérience MVP
- Pas de dépendances OpenAI ou profils utilisateur complexes
