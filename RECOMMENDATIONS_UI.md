# Interface des Recommandations - Choice App

## 🎯 **Nouvelle interface des recommandations**

### 📱 **Grille responsive moderne**

L'interface des recommandations a été complètement repensée pour offrir une expérience utilisateur moderne et intuitive :

#### **Masquage de la caméra**
- **Condition** : La caméra et la prévisualisation sont masquées quand les recommandations sont affichées
- **Transition** : Transition fluide entre les modes
- **Focus** : Concentration sur les recommandations

#### **Grille responsive**
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```
- **Mobile** : 1 colonne (pleine largeur)
- **Tablet** : 2 colonnes
- **Desktop** : 3 colonnes
- **Espacement** : 24px entre les cartes

### 🎨 **Design des cartes**

#### **Structure de chaque carte**
```jsx
<div className="card overflow-hidden hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1">
  {/* En-tête avec nom et prix */}
  <div className="p-6 pb-4">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-xl font-bold text-gray-900 leading-tight">
        {dish.name}
      </h3>
      <div className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-medium">
        {dish.price.toFixed(2)}€
      </div>
    </div>
    
    {/* Description */}
    <p className="text-gray-600 text-sm leading-relaxed mb-4">
      {dish.description}
    </p>
    
    {/* Tags */}
    <div className="flex flex-wrap gap-2 mb-4">
      {dish.tags.slice(0, 3).map(tag => (
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
          {tag}
        </span>
      ))}
    </div>
  </div>
  
  {/* Bouton d'action */}
  <div className="px-6 pb-6">
    <button className="w-full btn btn-primary py-3 text-sm font-semibold shadow-medium hover:shadow-large transition-shadow">
      Voir détails
    </button>
  </div>
</div>
```

#### **Éléments visuels**

##### **Nom du plat**
- **Taille** : `text-xl` (20px)
- **Poids** : `font-bold`
- **Couleur** : `text-gray-900`
- **Alignement** : `leading-tight` pour un espacement optimal

##### **Prix**
- **Style** : Badge arrondi avec fond primaire
- **Couleur** : `bg-primary-600` avec texte blanc
- **Ombre** : `shadow-medium` pour la profondeur
- **Position** : En haut à droite de la carte

##### **Description**
- **Taille** : `text-sm` (14px)
- **Couleur** : `text-gray-600`
- **Espacement** : `leading-relaxed` pour la lisibilité
- **Marge** : `mb-4` pour séparer des tags

##### **Tags**
- **Style** : Badges arrondis avec bordure
- **Couleur** : Fond gris clair avec texte gris foncé
- **Espacement** : `gap-2` entre les tags
- **Limite** : Maximum 3 tags affichés

##### **Bouton "Voir détails"**
- **Style** : Bouton primaire plein largeur
- **Padding** : `py-3` pour une hauteur confortable
- **Ombre** : `shadow-medium` avec hover `shadow-large`
- **Transition** : Effet de survol fluide

### ✨ **Animations et transitions**

#### **Animation d'apparition progressive**
```css
.animate-fade-in-staggered {
  animation: fadeInStaggered 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes fadeInStaggered {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### **Délai d'animation**
```jsx
style={{ animationDelay: `${index * 200}ms` }}
```
- **Carte 1** : Apparition immédiate
- **Carte 2** : Délai de 200ms
- **Carte 3** : Délai de 400ms

#### **Effets de survol**
- **Translation** : `hover:-translate-y-1` (élévation de 4px)
- **Ombre** : `hover:shadow-medium` (ombre plus prononcée)
- **Transition** : `transition-all duration-300` (300ms)

### 🔄 **Navigation et interactions**

#### **Boutons d'action**
Quand les recommandations sont affichées :

##### **"📸 Nouveau scan"**
- **Style** : `btn btn-secondary`
- **Action** : Réinitialise tout et retourne au scanner
- **Fonction** : `onClick={retake}`

##### **"🔄 Nouvelles recommandations"**
- **Style** : `btn btn-primary`
- **Action** : Masque les recommandations pour revenir au texte extrait
- **Fonction** : `onClick={() => setRecommendations(null)}`

#### **Bouton "Voir détails"**
- **Action** : Log dans la console (TODO: navigation vers détails)
- **Style** : Bouton primaire plein largeur
- **Feedback** : Effet de survol avec ombre

### 📱 **Responsive Design**

#### **Breakpoints**
- **Mobile** (`< 768px`) : 1 colonne
- **Tablet** (`768px - 1024px`) : 2 colonnes
- **Desktop** (`> 1024px`) : 3 colonnes

#### **Adaptations**
- **Largeur maximale** : `max-w-6xl` pour éviter l'étirement excessif
- **Espacement** : `gap-6` (24px) entre les cartes
- **Padding** : `p-6` (24px) à l'intérieur des cartes

### 🎯 **Expérience utilisateur**

#### **Flux de travail**
1. **Capture** : Prise de photo du menu
2. **OCR** : Extraction du texte (3s)
3. **Analyse** : Génération des recommandations (2s)
4. **Affichage** : Grille de 3 cartes avec animations
5. **Interaction** : Boutons de navigation et "Voir détails"

#### **Feedback visuel**
- **États clairs** : Distinction nette entre les modes
- **Animations fluides** : Transitions de 300ms
- **Effets de survol** : Feedback immédiat des interactions
- **Chargement** : Indicateurs visuels pour chaque étape

### 🚀 **Améliorations futures**

#### **Fonctionnalités à ajouter**
- [ ] **Navigation** : Page de détails pour chaque plat
- [ ] **Images** : Photos des plats dans les cartes
- [ ] **Favoris** : Système de favoris
- [ ] **Partage** : Partage des recommandations
- [ ] **Filtres** : Filtrage par prix, tags, etc.

#### **Optimisations techniques**
- [ ] **Lazy loading** : Chargement différé des images
- [ ] **Virtualisation** : Pour de longues listes
- [ ] **Cache** : Mise en cache des recommandations
- [ ] **PWA** : Support hors ligne

### 🎨 **Palette de couleurs**

#### **Couleurs principales**
- **Primary** : `primary-600` (#2563eb) pour les accents
- **Text** : `gray-900` pour les titres, `gray-600` pour le texte
- **Background** : `white` pour les cartes
- **Borders** : `gray-200` pour les séparations

#### **États**
- **Hover** : `shadow-medium` → `shadow-large`
- **Focus** : `ring-2 ring-primary-500`
- **Active** : États de pression

### 📊 **Métriques de performance**

#### **Temps de rendu**
- **Animation** : 600ms pour l'apparition complète
- **Délai** : 200ms entre chaque carte
- **Transition** : 300ms pour les effets de survol

#### **Optimisations**
- **CSS** : Animations GPU-accelerated
- **JavaScript** : Gestion efficace des états
- **Images** : Optimisation future avec lazy loading

## 📝 **Notes de développement**

### **Bonnes pratiques**
- ✅ **Accessibilité** : Contraste et focus visibles
- ✅ **Performance** : Animations optimisées
- ✅ **Responsive** : Design mobile-first
- ✅ **UX** : Feedback visuel immédiat

### **Points d'attention**
- 🔍 **Performance** : Optimisation des animations
- 🔍 **Accessibilité** : Support des lecteurs d'écran
- 🔍 **SEO** : Métadonnées des plats
- 🔍 **Analytics** : Suivi des interactions 