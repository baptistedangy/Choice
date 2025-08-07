# 📊 Layout Horizontal des Macronutriments - Choice App

## 🚀 **Nouveau Design Implémenté**

### 📐 **Layout Horizontal Compact**

#### **Structure d'une Ligne de Macro**
```
[Icône] Protein 🛈 30g                    ▬▬▬▬▬▬▬▬▬▬ 33%
     muscle repair
```

#### **Éléments sur une Seule Ligne**
- **Gauche** : Label + Tooltip + Grammes
- **Droite** : Barre de progression + Pourcentage
- **Sous-label** : Informations contextuelles (optionnel)

### 🎨 **Composants Visuels**

#### **Section Gauche**
```jsx
<div className="macro-left-section">
  {/* Groupe label + tooltip */}
  <div className="macro-label-group">
    <Icon className={color} />
    <span>{name}</span>
    <Tooltip content={tooltipContent}>
      <InfoIcon />
    </Tooltip>
  </div>
  
  {/* Sous-label optionnel */}
  {subLabel && <div className="macro-sublabel-horizontal">{subLabel}</div>}
  
  {/* Grammes */}
  <span className="macro-grams">{value}g</span>
</div>
```

#### **Section Droite**
```jsx
<div className="macro-right-section">
  {/* Barre de progression */}
  <div className="macro-progress-bar">
    <div className="macro-bar-fill-horizontal" style={{width: `${percentage}%`}} />
  </div>
  
  {/* Pourcentage */}
  <span className="macro-percentage-horizontal">{percentage}%</span>
</div>
```

### 🌈 **Système de Couleurs**

#### **Couleurs des Barres de Progression**
```javascript
const getBarColor = (macroName) => {
  switch(macroName.toLowerCase()) {
    case 'protein':
      return 'bg-red-500';        // Rouge
    case 'carbohydrates':
      return 'bg-yellow-400';     // Jaune
    case 'fats':
      return 'bg-green-500';      // Vert
    default:
      return 'bg-gray-500';
  }
};
```

#### **Couleurs des Icônes et Textes**
- **Protéines** : `text-red-500` (icône) + `text-red-700` (grammes)
- **Glucides** : `text-yellow-500` (icône) + `text-yellow-700` (grammes)
- **Lipides** : `text-green-500` (icône) + `text-green-700` (grammes)

### 💡 **Tooltips Informatifs**

#### **Contenu des Tooltips**
```javascript
const tooltipContent = {
  protein: "Helps with muscle repair and growth",
  carbohydrates: "Primary energy source for the body",
  fats: "Supports hormone production and healthy cells"
};
```

#### **Sous-labels Contextuels**
```javascript
const subLabels = {
  protein: "muscle repair",
  carbohydrates: "energy source", 
  fats: "hormone support"
};
```

### 📱 **Responsive Design**

#### **Desktop (>768px)**
```css
.macro-row-horizontal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
}
```

#### **Tablet (≤768px)**
```css
@media (max-width: 768px) {
  .macro-row-horizontal {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .macro-left-section {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .macro-sublabel-horizontal {
    display: none; /* Masqué sur mobile */
  }
}
```

#### **Mobile (≤640px)**
```css
@media (max-width: 640px) {
  .macro-row-horizontal {
    gap: 0.375rem;
    padding: 0.75rem 0;
  }
  
  .macro-progress-bar {
    height: 0.375rem;
  }
  
  .macro-percentage-horizontal {
    font-size: 0.625rem;
  }
}
```

### ✨ **Animations et Transitions**

#### **Animation des Barres**
```css
.macro-bar-fill-horizontal {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease-in-out;
}

@keyframes progressFill {
  from { width: 0%; }
  to { width: var(--progress-width); }
}

.macro-bar-fill-horizontal {
  animation: progressFill 0.8s ease-out forwards;
}
```

#### **Transitions des Tooltips**
```css
.tooltip-content {
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.2s ease-in-out;
}

.tooltip-content.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
```

### ♿ **Accessibilité**

#### **Support Clavier**
```jsx
<div
  tabIndex="0"
  onFocus={handleShowTooltip}
  onBlur={handleHideTooltip}
  role="button"
  aria-label={`Information about ${content}`}
>
```

#### **Lecteurs d'Écran**
- **Role** : `button` pour l'icône d'information
- **Aria-label** : Description du contenu du tooltip
- **Focus visible** : Anneau bleu autour de l'élément focalisé

### 🔧 **Composant MacroRow Complet**

```jsx
const MacroRow = ({ icon: Icon, name, value, percentage, color, tooltipContent, subLabel }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getBarColor = (macroName) => {
    switch(macroName.toLowerCase()) {
      case 'protein': return 'bg-red-500';
      case 'carbohydrates': return 'bg-yellow-400';
      case 'fats': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="macro-row-horizontal">
      {/* Section gauche */}
      <div className="macro-left-section">
        <div className="macro-label-group">
          <Icon className={color} />
          <span className="text-sm font-semibold text-gray-700">{name}</span>
          <Tooltip
            content={tooltipContent}
            isVisible={showTooltip}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <InfoIcon className="info-icon" />
          </Tooltip>
        </div>
        
        {subLabel && (
          <div className="macro-sublabel-horizontal">{subLabel}</div>
        )}
        
        <span className="macro-grams" style={{ color: color.replace('text-', '').replace('-500', '-700') }}>
          {value}g
        </span>
      </div>
      
      {/* Section droite */}
      <div className="macro-right-section">
        <div className="macro-progress-bar">
          <div 
            className={`macro-bar-fill-horizontal ${getBarColor(name)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="macro-percentage-horizontal">{percentage}%</span>
      </div>
    </div>
  );
};
```

### 🎯 **Utilisation**

#### **Props du Composant**
```javascript
{
  icon: Component,        // Icône SVG du macro
  name: string,           // Nom ("Protein", "Carbohydrates", "Fats")
  value: number,          // Valeur en grammes
  percentage: number,     // Pourcentage du total
  color: string,          // Couleur Tailwind
  tooltipContent: string, // Texte du tooltip
  subLabel: string        // Sous-label optionnel
}
```

#### **Exemple d'Utilisation**
```jsx
<MacroRow
  icon={ProteinIcon}
  name="Protein"
  value={25}
  percentage={28}
  color="text-red-500"
  tooltipContent="Helps with muscle repair and growth"
  subLabel="muscle repair"
/>
```

### 📊 **Structure des Données**

#### **Exemple de Données**
```javascript
const macroData = {
  protein: {
    value: 25,
    percentage: 28,
    tooltip: "Helps with muscle repair and growth",
    subLabel: "muscle repair"
  },
  carbohydrates: {
    value: 50,
    percentage: 56,
    tooltip: "Primary energy source for the body",
    subLabel: "energy source"
  },
  fats: {
    value: 15,
    percentage: 17,
    tooltip: "Supports hormone production and healthy cells",
    subLabel: "hormone support"
  }
};
```

## 🎯 **Résultats Attendus**

### **Améliorations UX**
- ✅ **Layout compact** : Toutes les informations sur une ligne
- ✅ **Hiérarchie claire** : Label → Grammes → Barre → Pourcentage
- ✅ **Tooltips informatifs** : Explications contextuelles
- ✅ **Sous-labels** : Informations supplémentaires

### **Améliorations Visuelles**
- ✅ **Couleurs codées** : Rouge/Yellow/Vert pour chaque macro
- ✅ **Animations fluides** : Transitions des barres de progression
- ✅ **Design responsive** : Adaptation parfaite sur tous les écrans
- ✅ **Espacement optimisé** : Utilisation efficace de l'espace

### **Améliorations Techniques**
- ✅ **Flexbox moderne** : Layout flexible et robuste
- ✅ **CSS optimisé** : Classes utilitaires et variables
- ✅ **Accessibilité** : Support complet clavier et lecteurs d'écran
- ✅ **Performance** : Animations CSS natives

---

**🎉 Le layout horizontal des macronutriments offre maintenant une présentation compacte et informative avec une excellente expérience utilisateur !**
