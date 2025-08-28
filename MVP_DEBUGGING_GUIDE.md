# 🔍 MVP Debugging Guide - Guide de débogage MVP

## 🚨 **Problème identifié : Aucune recommandation affichée**

### **Symptômes :**
- L'interface affiche "No dishes available" 
- Aucune carte de recommandation n'est visible
- Le flux MVP semble ne pas fonctionner

## 🔍 **Étapes de débogage :**

### **1. Vérifier les logs de la console (Camera.jsx)**
Après avoir scanné un menu, vous devriez voir dans la console :

```
[MVP] About to call scoreAndLabel with X dishes
[MVP] scoreAndLabel returned: { top3Length: 3, allLength: 5 }
[MVP] parsed dishes => 5
[MVP] received scored recommendations: 3
[MVP] received all scored dishes: 5
[MVP] Navigating with state: { mvp: {...}, menuText: "...", source: "scan" }
```

**Si ces logs n'apparaissent pas :**
- Le problème est dans `analyzeMenu` avant l'appel à `scoreAndLabel`
- Vérifiez que `dishesFromBackend` contient des données

**Si les logs apparaissent mais avec des longueurs 0 :**
- Le problème est dans `scoreAndLabel` qui retourne des tableaux vides
- Vérifiez que `mvpRecommender.js` fonctionne correctement

### **2. Vérifier les logs de la console (Recommendations.jsx)**
Après la navigation, vous devriez voir :

```
🎯 Recommendations component mounted
📍 Location state: { mvp: {...}, menuText: "...", source: "scan" }
🎯 MVP mode detected - using mvp.top3 payload
[MVP] rendering top3 -> [...]
```

**Si vous voyez "🔄 MVP mode not detected" :**
- Le payload MVP n'est pas transmis correctement
- Vérifiez la navigation dans `Camera.jsx`

### **3. Test manuel de scoreAndLabel**
Dans la console du navigateur, testez directement :

```javascript
// Importer la fonction
import { scoreAndLabel } from './src/lib/mvpRecommender.js';

// Tester avec des données factices
const testDishes = [
  { title: "Test Dish 1", description: "Test description 1", price: 10 },
  { title: "Test Dish 2", description: "Test description 2", price: 15 }
];

const result = scoreAndLabel(testDishes);
console.log('Test result:', result);
```

## 🛠️ **Solutions possibles :**

### **Solution 1 : Problème dans scoreAndLabel**
Si `scoreAndLabel` retourne des tableaux vides :

1. **Vérifiez `src/lib/mvpRecommender.js`**
2. **Ajoutez des logs dans `scoreAndLabel`**
3. **Vérifiez que les données d'entrée sont correctes**

### **Solution 2 : Problème de navigation**
Si la navigation ne transmet pas les données :

1. **Vérifiez que `navigate` est appelé**
2. **Vérifiez la structure du `state`**
3. **Vérifiez que `top3` et `all` ne sont pas `undefined`**

### **Solution 3 : Problème de réception**
Si `Recommendations.jsx` ne reçoit pas les données :

1. **Vérifiez `location.state`**
2. **Vérifiez la détection du mode MVP**
3. **Vérifiez le fallback vers l'ancien pipeline**

## 📊 **Logs de débogage ajoutés :**

### **Dans Camera.jsx :**
```javascript
console.log('[MVP] About to call scoreAndLabel with', dishesFromBackend.length, 'dishes');
console.log('[MVP] scoreAndLabel returned:', { top3Length: top3?.length, allLength: all?.length });
console.log('[MVP] Navigating with state:', mvpState);
```

### **Dans Recommendations.jsx :**
```javascript
console.log('🎯 MVP mode detected - using mvp.top3 payload');
console.log('[MVP] rendering top3 ->', mvpPayload.map(i => ({title: i.title, score: i.score, label: i.label})));
```

## 🎯 **Actions à effectuer :**

1. **Scannez un nouveau menu** et regardez la console
2. **Notez tous les logs MVP** qui apparaissent
3. **Vérifiez si `scoreAndLabel` est appelé**
4. **Vérifiez si la navigation se fait avec les bonnes données**
5. **Vérifiez si `Recommendations.jsx` détecte le mode MVP**

## 📝 **Informations à fournir :**

Pour diagnostiquer le problème, partagez :

1. **Tous les logs de la console** après avoir scanné un menu
2. **Le contenu de `location.state`** dans `Recommendations.jsx`
3. **Les erreurs éventuelles** dans la console
4. **Le nombre de plats parsés** par le backend

## 🔧 **Test rapide :**

Si le problème persiste, testez en ouvrant la console et en tapant :

```javascript
// Vérifier que mvpRecommender est accessible
console.log('mvpRecommender available:', typeof scoreAndLabel);

// Tester avec des données factices
const test = scoreAndLabel([{title: "Test", description: "Test", price: 10}]);
console.log('Test result:', test);
```

Cela nous aidera à identifier exactement où se situe le problème !
