# Configuration TailwindCSS - Choice App

## 🎨 Configuration actuelle

### Police de caractères
- **Inter** : Police principale moderne et lisible
- **Fallback** : system-ui, sans-serif
- **Poids disponibles** : 300, 400, 500, 600, 700, 800

### Palette de couleurs
- **Primary** : Bleu moderne (#3b82f6 à #1e3a8a)
- **Gray** : Palette de gris neutres (#f9fafb à #111827)
- **Couleurs système** : Rouge, vert, jaune, etc.

### Espacement
- **Base** : Système TailwindCSS standard
- **Personnalisé** : 18 (4.5rem), 88 (22rem), 128 (32rem)

### Bordures arrondies
- **xl** : 1rem
- **2xl** : 1.5rem  
- **3xl** : 2rem

### Ombres
- **soft** : Ombre douce pour les cartes
- **medium** : Ombre moyenne pour les éléments interactifs
- **large** : Ombre importante pour les éléments principaux

## 🧩 Classes utilitaires personnalisées

### Boutons
```css
.btn          /* Bouton de base */
.btn-primary  /* Bouton principal (bleu) */
.btn-secondary /* Bouton secondaire (gris) */
```

### Formulaires
```css
.input        /* Champ de saisie stylisé */
```

### Layout
```css
.card         /* Carte avec ombre et bordure */
```

## 📱 Responsive Design

L'application utilise les breakpoints TailwindCSS standard :
- **sm** : 640px
- **md** : 768px
- **lg** : 1024px
- **xl** : 1280px
- **2xl** : 1536px

## 🎯 Utilisation recommandée

### Typographie
```jsx
<h1 className="text-3xl font-bold">Titre principal</h1>
<h2 className="text-2xl font-semibold">Sous-titre</h2>
<p className="text-gray-600">Texte de contenu</p>
```

### Layout
```jsx
<div className="card p-6">
  <div className="space-y-4">
    {/* Contenu */}
  </div>
</div>
```

### Boutons
```jsx
<button className="btn btn-primary">
  Action principale
</button>
<button className="btn btn-secondary">
  Action secondaire
</button>
```

### Formulaires
```jsx
<input type="text" className="input" placeholder="Saisie..." />
<select className="input">
  <option>Option 1</option>
</select>
```

## 🔧 Personnalisation

Pour ajouter de nouvelles couleurs ou styles :

1. **Modifier** `tailwind.config.js` pour les couleurs et espacements
2. **Ajouter** dans `src/index.css` pour les classes utilitaires
3. **Redémarrer** le serveur de développement

## 📦 Dépendances

- **tailwindcss** : ^3.4.0
- **postcss** : ^8.4.0
- **autoprefixer** : ^10.4.0
- **Inter font** : Chargée via Google Fonts 