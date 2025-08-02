# Service de Recommandations - Choice App

## 🎯 **Fonctionnalités du service**

### 📊 **Algorithme de recommandation intelligent**

Le service `recommendations.js` analyse le texte extrait du menu par OCR et génère des recommandations personnalisées basées sur :

- **Mots-clés du menu** : Analyse sémantique du texte
- **Profil utilisateur** : Préférences alimentaires et restrictions
- **Budget** : Niveau de prix adapté
- **Tags des plats** : Catégorisation automatique

### 🔧 **Fonctions principales**

#### **getRecommendationsFromMenu(menuText, userProfile)**
```javascript
const recommendations = getRecommendationsFromMenu(
  "Salade de quinoa, Poulet rôti, Tarte aux pommes",
  { budget: "medium", dietaryRestrictions: ["vegetarian"] }
);
```

**Retourne** : Array de 3 objets plats avec structure :
```javascript
{
  name: "Nom du plat",
  description: "Description détaillée",
  price: 18.90,
  tags: ["végétarien", "sain", "gluten-free"]
}
```

## 📝 **Structure des données**

### **Base de données de plats**
Le service contient 10 plats de référence avec :
- **Noms** : Descriptifs et appétissants
- **Descriptions** : Détails culinaires précis
- **Prix** : Tarifs réalistes (8.50€ - 24.50€)
- **Tags** : Catégorisation multi-critères

### **Profil utilisateur**
```javascript
{
  name: "Utilisateur",
  dietaryRestrictions: [], // ['vegetarian', 'gluten-free', 'vegan']
  budget: "medium", // 'low', 'medium', 'high'
  cuisinePreferences: [], // ['italien', 'français', 'asiatique']
  allergies: [], // ['noix', 'lactose', 'gluten']
  spiceTolerance: "medium" // 'low', 'medium', 'high'
}
```

## 🧠 **Algorithme de scoring**

### **Calcul des scores**
Chaque plat reçoit un score basé sur :

#### **1. Correspondance avec le menu (Score: +2 par mot-clé)**
- Recherche dans le nom, description et tags
- Mots-clés détectés : salade, quinoa, poulet, rôti, tarte, pommes, etc.

#### **2. Préférences alimentaires (Score: +3 pour végétarien, +2 pour gluten-free)**
- Adaptation aux restrictions diététiques
- Priorité aux plats compatibles

#### **3. Budget utilisateur (Score: +1)**
- **Low** : < 15€
- **Medium** : 15€ - 25€  
- **High** : > 25€

#### **4. Préférences culinaires (Score: +1 par préférence)**
- Correspondance avec les tags de cuisine
- Exemples : italien, français, asiatique, méditerranéen

#### **5. Bonus popularité (Score: +0.5)**
- Plats populaires : poulet, steak, salade, dessert
- Bonus pour les choix classiques

## 🎨 **Interface utilisateur**

### **Affichage des recommandations**
```jsx
{/* Grille responsive */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {recommendations.map((dish, index) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* En-tête avec nom et prix */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{dish.name}</h4>
        <span className="text-primary-600 font-semibold">
          {dish.price.toFixed(2)}€
        </span>
      </div>
      
      {/* Description */}
      <p className="text-gray-600 text-xs mb-3">{dish.description}</p>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {dish.tags.slice(0, 3).map(tag => (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  ))}
</div>
```

### **États de chargement**
- **OCR** : Spinner bleu (3 secondes)
- **Recommandations** : Spinner vert (2 secondes)
- **Messages** : Différenciés par étape

## 🔄 **Flux de travail intégré**

### **Étape 1 : Capture et OCR**
1. Prise de photo du menu
2. Simulation OCR (3s)
3. Affichage du texte extrait

### **Étape 2 : Génération automatique**
1. Déclenchement automatique après OCR
2. Analyse des mots-clés
3. Génération des recommandations (2s)

### **Étape 3 : Affichage des résultats**
1. Texte extrait avec validation
2. 3 recommandations personnalisées
3. Options de réanalyse

## 📊 **Exemples de recommandations**

### **Menu analysé**
```
"Salade de quinoa, Poulet rôti, Tarte aux pommes, Soupe à l'oignon, Steak frites, Crème brûlée"
```

### **Mots-clés détectés**
```
["salade", "quinoa", "poulet", "rôti", "tarte", "pommes", "soupe", "oignon", "steak", "frites", "crème", "brûlée"]
```

### **Recommandations générées**
1. **Salade de quinoa aux légumes** (12.50€)
   - Tags: végétarien, sain, gluten-free, salade
   - Score élevé : correspondance directe avec le menu

2. **Poulet rôti aux herbes** (18.90€)
   - Tags: protéines, classique, herbes, poulet
   - Score élevé : correspondance avec "poulet rôti"

3. **Tarte aux pommes traditionnelle** (8.50€)
   - Tags: dessert, traditionnel, pommes, sucré
   - Score élevé : correspondance avec "tarte aux pommes"

## 🚀 **Améliorations futures**

### **Intelligence artificielle**
- [ ] **Machine Learning** : Modèles d'apprentissage pour améliorer les recommandations
- [ ] **Analyse de sentiment** : Détection des préférences implicites
- [ ] **Collaborative filtering** : Recommandations basées sur les choix d'autres utilisateurs

### **Données enrichies**
- [ ] **API externe** : Intégration avec des bases de données culinaires
- [ ] **Images** : Photos des plats pour une meilleure présentation
- [ ] **Avis** : Système de notation et commentaires
- [ ] **Nutrition** : Informations nutritionnelles détaillées

### **Personnalisation avancée**
- [ ] **Historique** : Apprentissage des préférences au fil du temps
- [ ] **Contexte** : Adaptation selon l'heure, la saison, l'occasion
- [ ] **Géolocalisation** : Recommandations adaptées au lieu
- [ ] **Météo** : Suggestions selon les conditions météorologiques

### **Fonctionnalités sociales**
- [ ] **Partage** : Partage des recommandations avec des amis
- [ ] **Groupes** : Recommandations pour des groupes
- [ ] **Événements** : Suggestions pour des occasions spéciales
- [ ] **Défis** : Recommandations pour découvrir de nouveaux plats

## 🔧 **Configuration et personnalisation**

### **Ajout de nouveaux plats**
```javascript
const newDish = {
  name: "Nouveau plat",
  description: "Description du plat",
  price: 15.00,
  tags: ["tag1", "tag2", "tag3"]
};
```

### **Modification de l'algorithme**
- Ajustement des poids de scoring
- Ajout de nouveaux critères
- Personnalisation des mots-clés

### **Intégration API**
- Remplacement de la base de données locale
- Connexion à des services externes
- Synchronisation en temps réel

## 📈 **Métriques et analytics**

### **Données collectées**
- **Mots-clés** : Fréquence d'apparition dans les menus
- **Préférences** : Plats les plus recommandés
- **Performance** : Temps de génération des recommandations
- **Satisfaction** : Taux de clic sur les recommandations

### **Optimisations**
- **Cache** : Mise en cache des recommandations fréquentes
- **Pré-calcul** : Génération anticipée pour les menus populaires
- **CDN** : Distribution des données pour améliorer les performances

## 🎯 **Cas d'usage**

### **Restaurant traditionnel**
- **Menu** : Plats classiques français
- **Recommandations** : Soupe à l'oignon, Steak frites, Crème brûlée
- **Adaptation** : Respect des traditions culinaires

### **Restaurant végétarien**
- **Menu** : Options végétariennes variées
- **Recommandations** : Salade de quinoa, Risotto aux champignons
- **Adaptation** : Focus sur les protéines végétales

### **Restaurant gastronomique**
- **Menu** : Plats raffinés et créatifs
- **Recommandations** : Saumon grillé, Tiramisu classique
- **Adaptation** : Privilégier les plats sophistiqués

## 📝 **Notes de développement**

### **Bonnes pratiques**
- ✅ **Modularité** : Service indépendant et réutilisable
- ✅ **Performance** : Algorithmes optimisés
- ✅ **Maintenabilité** : Code documenté et structuré
- ✅ **Extensibilité** : Architecture ouverte aux évolutions

### **Points d'attention**
- 🔍 **Données** : Qualité et fraîcheur des informations
- 🔍 **Performance** : Optimisation des algorithmes
- 🔍 **Précision** : Amélioration continue des recommandations
- 🔍 **Expérience** : Feedback utilisateur pour l'amélioration 