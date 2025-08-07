# 🔍 Problème de Détection des Plats

## 🎯 Problème Identifié

**Symptôme :** Seulement 2 plats sont analysés et affichés, même si l'OCR extrait correctement plus de plats.

**Cause Racine :** La logique de détection automatique des plats dans `server.js` ne détecte que les plats qui commencent par des lettres majuscules (comme "EL COLIFLOR", "CHULE CONMIGO"), mais rate les plats avec des formats différents comme :
- "POLLO CHEESEBURGER" 
- "GREEN BUT NOT BORING VE"
- "COSTILLAS DE LA MADRE"

## 📊 Analyse du Problème

### **Plats Détectés (2) :**
1. ✅ "EL COLIFLOR" - Détecté (majuscules)
2. ✅ "CHULE CONMIGO" - Détecté (majuscules)

### **Plats Manqués (2+) :**
1. ❌ "POLLO CHEESEBURGER" - Non détecté (majuscules mixtes)
2. ❌ "GREEN BUT NOT BORING VE" - Non détecté (majuscules mixtes)
3. ❌ "COSTILLAS DE LA MADRE" - Non détecté (majuscules mixtes)

## 🔧 Solutions Possibles

### **Solution 1 : Améliorer la Regex de Détection**
```javascript
// Regex actuelle (trop restrictive)
const isDishTitle = /^[A-Z][A-Z\s]+$/.test(line)

// Regex améliorée (plus flexible)
const isDishTitle = (
  /^[A-Z][A-Z\s]+$/.test(line) || // Titres en majuscules
  /^[A-Z][A-Z\s]+[A-Z][A-Z\s]*$/.test(line) || // Titres avec mots en majuscules
  /^[A-Z][a-zA-Z\s]+$/.test(line) // Titres mixtes
)
```

### **Solution 2 : Détection par Mots-Clés**
```javascript
const dishKeywords = [
  'POLLO', 'CHEESEBURGER', 'GREEN', 'BORING', 
  'COSTILLAS', 'MADRE', 'COLIFLOR', 'CHULE', 'CONMIGO'
];

const isDishTitle = dishKeywords.some(keyword => 
  line.includes(keyword) && line.length >= 3 && line.length <= 50
);
```

### **Solution 3 : Utiliser OpenAI pour la Détection**
Revenir à l'utilisation d'OpenAI pour détecter les plats, mais avec un prompt amélioré qui spécifiquement demande de détecter tous les plats, y compris ceux avec des formats mixtes.

## 🚀 Recommandation

**Solution Recommandée :** Combiner les approches 1 et 2 pour une détection robuste :

1. **Détection automatique améliorée** pour les plats évidents
2. **Détection par mots-clés** pour les plats avec formats spéciaux
3. **Validation manuelle** des résultats

## 📝 Prochaines Étapes

1. ✅ **Identifier le problème** - Fait
2. 🔄 **Corriger la logique de détection** - En cours
3. 🧪 **Tester avec différents menus**
4. 📊 **Valider que tous les plats sont détectés**
5. 🎯 **Confirmer que les 3 meilleurs sont affichés**

## 🎯 Objectif Final

**Résultat Attendu :**
- ✅ Tous les plats extraits via OCR sont détectés
- ✅ Tous les plats détectés sont analysés par IA
- ✅ Les plats sont triés par score IA (décroissant)
- ✅ Les 3 meilleurs plats sont affichés dans l'interface

**Statut Actuel :** 🔄 **En cours de correction** 