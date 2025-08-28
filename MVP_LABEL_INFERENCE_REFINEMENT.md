# 🎯 MVP Label Inference Refinement - Affinement de l'inférence des labels

## ✅ **Améliorations implémentées dans `scoreAndLabel` :**

### **1. Inférence des labels avec priorité stricte**
```javascript
// Priority rule for label assignment (only one label per dish):
// Recovery > Healthy > Comforting
let label, reasons, score;

if (r.s > 0) {
  // Recovery hit
  label = 'Recovery';
  reasons = [...r.reasons, 'protein-focused'];
} else if (h.s > 0) {
  // Healthy hit
  label = 'Healthy';
  reasons = [...h.reasons, 'veg-forward / lighter prep'];
} else if (c.s > 0) {
  // Comforting hit
  label = 'Comforting';
  reasons = [...c.reasons, 'indulgent / richer prep'];
} else {
  // Default fallback
  label = 'Healthy';
  reasons = ['balanced option'];
}
```

**Avantages :**
- **Un seul label par plat** : Évite la confusion et les conflits
- **Priorité stricte** : Recovery > Healthy > Comforting
- **Logique claire** : Premier score positif détermine le label

### **2. Règles strictes pour Recovery**
```javascript
function scoreRecovery(text) {
  // Recovery applies only if explicit protein keywords are present
  const hasProtein = hasAny(text, KW.protein);
  const hasCookingMethod = hasAny(text, KW.grilled) || 
                           text.includes('protein') || 
                           text.includes('protéine');
  
  // Do not set Recovery if clearly indulgent
  const isIndulgent = hasAny(text, ['burger', 'ribs', 'fried', 'crispy', 
                                   'creamy', 'cheesy', 'mayo', 'béchamel']);
  
  if (hasProtein && hasCookingMethod && !isIndulgent) {
    s += 2; 
    reasons.push('protéine principale');
  }
}
```

**Règles Recovery :**
- **Protéine explicite** : chicken, beef, lamb, pork, salmon, tofu, etc.
- **Méthode de cuisson** : grilled, roasted, baked, seared, steak, filet
- **Exclusion** : burger, ribs, fried, crispy, creamy, cheesy, mayo, béchamel

### **3. Règles strictes pour Healthy**
```javascript
function scoreHealthy(text) {
  // Healthy applies if veg/mediterranean/light cues present and indulgent cues absent
  const hasVegCues = hasAny(text, KW.vegForward);
  const hasLightCues = hasAny(text, KW.light);
  const hasIndulgentCues = hasAny(text, KW.indulgent);
  
  if (hasVegCues && !hasIndulgentCues) {
    s += 2; 
    reasons.push('orienté légumes/bol');
  }
  if (hasLightCues && !hasIndulgentCues) {
    s += 1; 
    reasons.push('léger/frais');
  }
}
```

**Règles Healthy :**
- **Cues végétariens** : salad, bowl, roasted vegetables, hummus, avocado
- **Cues légers** : light, fresh, seasonal, quinoa, couscous
- **Exclusion** : Pas de marqueurs indulgent (fried, creamy, cheesy, etc.)

### **4. Règles strictes pour Comforting**
```javascript
function scoreComforting(text) {
  // Comforting applies if indulgent markers present
  const hasIndulgent = hasAny(text, KW.indulgent);
  
  if (hasIndulgent) {
    s += 2; 
    reasons.push('réconfort/indulgent');
    if (hasAny(text, KW.creamy)) reasons.push('crémeux/fromagé');
  }
}
```

**Règles Comforting :**
- **Marqueurs indulgent** : fried, crispy, creamy, cheesy, buttery
- **Plats réconfortants** : bbq, burger, pizza, pasta, lasagna, gratin
- **Préparations riches** : ribs, pork belly, stew, braised, mayo, béchamel

### **5. Raisons améliorées et spécifiques**
```javascript
// Recovery
reasons = [...r.reasons, 'protein-focused'];

// Healthy  
reasons = [...h.reasons, 'veg-forward / lighter prep'];

// Comforting
reasons = [...c.reasons, 'indulgent / richer prep'];
```

**Avantages :**
- **Raisons contextuelles** : Chaque label a une raison spécifique
- **Clarté pour l'utilisateur** : Comprend pourquoi un plat est recommandé
- **Cohérence** : Tous les plats d'une catégorie ont des raisons similaires

## 🔄 **Flux d'inférence des labels :**

1. **Scoring des catégories** : Chaque plat est scoré pour Recovery, Healthy, Comforting
2. **Vérification des conditions** : Respect des règles strictes pour chaque catégorie
3. **Assignation par priorité** : Recovery > Healthy > Comforting
4. **Ajout des raisons** : Raisons spécifiques selon le label assigné
5. **Normalisation du score** : Base 5 + ajustements + bonus 0.5 pour positifs

## 🎯 **Résultats attendus :**

- **Recovery** : Plats protéinés avec cuisson saine (grillé, rôti, steak)
- **Healthy** : Plats végétariens/mediterranéens sans indulgence
- **Comforting** : Plats réconfortants et indulgent
- **Pas de conflits** : Un plat ne peut pas être à la fois Recovery et Comforting
- **Raisons claires** : Chaque recommandation a des justifications spécifiques

## 📊 **Exemples de classification :**

- **"Grilled Chicken Breast"** → Recovery (protein-focused)
- **"Quinoa Bowl with Avocado"** → Healthy (veg-forward / lighter prep)  
- **"Creamy Mac and Cheese"** → Comforting (indulgent / richer prep)
- **"Fried Chicken Burger"** → Comforting (pas Recovery à cause de "fried" + "burger")
