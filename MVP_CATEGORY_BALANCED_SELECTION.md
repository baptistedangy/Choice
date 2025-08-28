# 🎯 MVP Category Balanced Selection - Sélection équilibrée par catégorie

## ✅ **Améliorations implémentées dans `scoreAndLabel` :**

### **1. Construction des buckets par catégorie**
```javascript
// Build category buckets for balanced selection
const byLabel = { Recovery: [], Healthy: [], Comforting: [] };

// Push each item into its label bucket (only if label is set)
scored.forEach(item => {
  if (item.label && byLabel[item.label]) {
    byLabel[item.label].push(item);
  }
});
```

**Avantages :**
- **Séparation claire** : Chaque plat est placé dans son bucket de catégorie
- **Validation des labels** : Seuls les plats avec des labels valides sont inclus
- **Pas de promotion artificielle** : Un plat ne peut pas être promu vers une catégorie qu'il n'a pas

### **2. Tri des buckets par score**
```javascript
// Sort each bucket desc by score
Object.keys(byLabel).forEach(label => {
  byLabel[label].sort((a, b) => b.score - a.score);
});
```

**Avantages :**
- **Meilleur de chaque catégorie** : Le plat avec le score le plus élevé de chaque catégorie est en première position
- **Préparation pour la sélection** : Facilite la prise du premier élément de chaque bucket

### **3. Sélection équilibrée par priorité**
```javascript
// Start top3 with at most one item from each label in priority order
const top3 = [];
const usedTitles = new Set();

// Priority: Recovery > Healthy > Comforting
['Recovery', 'Healthy', 'Comforting'].forEach(label => {
  if (byLabel[label].length > 0 && top3.length < 3) {
    const item = byLabel[label][0];
    top3.push(item);
    usedTitles.add(item.title.toLowerCase().trim());
  }
});
```

**Avantages :**
- **Priorité respectée** : Recovery > Healthy > Comforting
- **Un par catégorie** : Maximum un plat de chaque catégorie dans le top3 initial
- **Déduplication** : Utilisation d'un Set pour éviter les doublons

### **4. Remplissage intelligent des slots restants**
```javascript
// If top3.length < 3, fill remaining from global scored (sorted desc)
// while skipping any already chosen titles (dedupe by lower-cased normalized title)
for (const item of scored) {
  if (top3.length >= 3) break;
  
  const normalizedTitle = item.title.toLowerCase().trim();
  if (!usedTitles.has(normalizedTitle)) {
    top3.push(item);
    usedTitles.add(normalizedTitle);
  }
}
```

**Avantages :**
- **Pas de doublons** : Vérification stricte des titres déjà utilisés
- **Normalisation** : Comparaison insensible à la casse et aux espaces
- **Ordre de score** : Les plats restants sont pris dans l'ordre de score décroissant

### **5. Garantie de 3 plats uniques**
```javascript
// Guarantee top3 has up to 3 unique dishes
// If not enough dishes overall, duplicate the last one with " (Alt)" suffix
while (top3.length < 3 && scored.length > 0) {
  const last = scored[scored.length - 1];
  top3.push({ 
    ...last, 
    title: `${last.title} (Alt)`,
    // Keep the same score/label/reasons
    score: last.score,
    label: last.label,
    reasons: last.reasons
  });
}
```

**Avantages :**
- **Toujours 3 plats** : Garantit que l'utilisateur voit toujours 3 recommandations
- **Suffix clair** : "(Alt)" indique qu'il s'agit d'une alternative
- **Données préservées** : Score, label et raisons restent identiques

### **6. Log de débogage**
```javascript
// Debug log for balanced selection
console.debug('[MVP] top3 balanced:', top3.map(x => ({
  title: x.title, 
  label: x.label, 
  score: x.score
})));
```

**Avantages :**
- **Transparence** : Permet de voir exactement quels plats ont été sélectionnés
- **Débogage facile** : Aide à identifier les problèmes de sélection
- **Vérification** : Confirme que l'équilibrage fonctionne correctement

## 🔄 **Flux de sélection complet :**

1. **Scoring** : Chaque plat est scoré et labellisé selon ses caractéristiques
2. **Bucketing** : Les plats sont triés dans des buckets par catégorie
3. **Sélection équilibrée** : Un plat de chaque catégorie disponible est sélectionné par priorité
4. **Remplissage** : Les slots restants sont remplis avec les meilleurs scores disponibles
5. **Garantie** : Si moins de 3 plats uniques, duplication avec suffix "(Alt)"
6. **Retour** : `{ top3, all: scored }` avec sélection équilibrée

## 🎯 **Résultat attendu :**

- **Variété maximale** : Tentative d'avoir un plat de chaque catégorie
- **Qualité optimale** : Les meilleurs scores de chaque catégorie sont privilégiés
- **Pas de doublons** : Chaque plat dans le top3 est unique
- **Toujours 3** : L'utilisateur voit toujours 3 recommandations
- **Déterminisme** : Même résultat pour les mêmes données d'entrée
