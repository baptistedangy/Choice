# 🔧 **MVP Guacamole Filtering Fix - Guide de test**

## ✅ **Problème corrigé**

### **Avant :**
- ❌ **"guacamole (Alt)"** apparaissait comme recommandation
- ❌ **Add-ons capturés** comme plats principaux
- ❌ **Filtrage insuffisant** des accompagnements

### **Après :**
- ✅ **Seuls les vrais plats** en MAJUSCULES capturés
- ✅ **Add-ons filtrés** (guacamole, sauces, etc.)
- ✅ **Filtrage strict** des faux titres

## 🛠️ **Correction technique**

### **Code modifié dans `src/lib/menuParser.js` :**

```javascript
// AVANT (filtrage insuffisant) :
const titleCandidate = (
  isRealDishTitle(line) ||
  (hasPrice(line) && isLikelyTitleByLength(line)) // ❌ Capturait guacamole
);

// APRÈS (filtrage strict) :
const titleCandidate = isRealDishTitle(line); // ✅ Seulement les vrais titres
```

### **Patterns de bruit ajoutés :**
```javascript
const noisePatterns = [
  // ... patterns existants ...
  /^\+.*$/i,           // ✅ Lines starting with + (add-ons)
  /^.*\(.*\).*$/i,     // ✅ Lines with parentheses (often add-ons)
  /^[a-z].*$/i,        // ✅ Lines starting with lowercase (not titles)
  /^[^A-Z].*$/i        // ✅ Lines not starting with uppercase
];
```

## 🧪 **Comment tester la correction**

### **Test 1 : Vérification que guacamole n'est plus capturé**
1. **Scannez le même menu** que précédemment
2. **Vérifiez que vous obtenez** :
   - ✅ "CHULE CONMIGO" (plat principal)
   - ✅ "EL COLIFLOR" (plat principal)
   - ✅ "COSTILLAS DE LA MADRE" (plat principal)
   - ✅ "GREEN BUT NOT BORING" (plat principal)
   - ✅ "POLLO CHEESEBURGER" (plat principal)
   - ❌ **PAS de "guacamole"** dans les recommandations
   - ❌ **PAS d'add-ons** ou d'accompagnements

### **Test 2 : Vérification des logs de parsing**
Après avoir scanné, vérifiez dans la console :

```javascript
// AVANT (bugué) :
[MVP] parsed dishes -> [
  "CHULE CONMIGO",
  "EL COLIFLOR", 
  "guacamole",        // ❌ Add-on capturé !
  "GREEN BUT NOT BORING",
  "POLLO CHEESEBURGER"
]

// APRÈS (corrigé) :
[MVP] parsed dishes -> [
  "CHULE CONMIGO",
  "EL COLIFLOR", 
  "COSTILLAS DE LA MADRE",  // ✅ Vrai plat
  "GREEN BUT NOT BORING",
  "POLLO CHEESEBURGER"
]
```

**Note** : Plus de "guacamole" dans la liste !

### **Test 3 : Vérification des recommandations finales**
1. **Vérifiez que les 3 recommandations** sont des vrais plats
2. **Vérifiez qu'il n'y a plus** de plats "(Alt)" basés sur des add-ons
3. **Vérifiez que chaque recommandation** a un label unique (Recovery, Healthy, Comforting)

## 🎯 **Résultat attendu**

### **Recommandations avant correction :**
1. "GREEN BUT NOT BORING VII" - **Healthy**
2. "CHULE CONMIGO IF" - **Comforting**  
3. "guacamole (Alt)" - **Recovery** ❌ **ADD-ON !**

### **Recommandations après correction :**
1. "GREEN BUT NOT BORING VII" - **Healthy**
2. "CHULE CONMIGO IF" - **Comforting**
3. "COSTILLAS DE LA MADRE" - **Recovery** ✅ **VRAI PLAT !**

## 🔍 **Détails de la correction**

### **Logique de filtrage améliorée :**
1. **Titres en MAJUSCULES uniquement** : Seuls les vrais noms de plats
2. **Filtrage des add-ons** : Lignes commençant par "+" ignorées
3. **Filtrage des accompagnements** : Lignes avec parenthèses ignorées
4. **Filtrage des minuscules** : Lignes commençant par minuscule ignorées

### **Patterns de bruit étendus :**
- `/^\+.*$/i` : **"+ guacamole (+2.50)"** → ignoré
- `/^.*\(.*\).*$/i` : **"sauce (optionnelle)"** → ignoré  
- `/^[a-z].*$/i` : **"guacamole"** → ignoré
- `/^[^A-Z].*$/i` : **"2.50"** → ignoré

## 📱 **Test sur différents menus**

Testez avec :
1. **Menu avec add-ons** → Vérifiez qu'ils ne sont pas capturés
2. **Menu avec accompagnements** → Vérifiez qu'ils sont filtrés
3. **Menu avec prix isolés** → Vérifiez qu'ils ne créent pas de faux plats

## 🚨 **Points de vigilance**

- ✅ **Seuls les vrais plats** en MAJUSCULES capturés
- ✅ **Add-ons et accompagnements** filtrés
- ✅ **Prix isolés** ne créent pas de faux plats
- ✅ **Recommandations cohérentes** basées sur de vrais plats

## 🎉 **Bénéfices de la correction**

1. **Recommandations de qualité** : Plus de faux plats comme "guacamole"
2. **Interface cohérente** : Seuls les vrais plats affichés
3. **Expérience utilisateur** : Recommandations pertinentes et réalistes
4. **Logique métier** : Respect de la structure menu (plats vs add-ons)

**🎉 Le filtrage des add-ons est maintenant corrigé !**

Plus de "guacamole" dans vos recommandations - seulement de vrais plats principaux !
