// Service de recommandations pour l'application Choice
// Génère des recommandations de plats basées sur le menu scanné et le profil utilisateur

/**
 * Génère des recommandations de plats basées sur le texte du menu et le profil utilisateur
 * @param {string} menuText - Le texte extrait du menu par OCR
 * @param {object} userProfile - Le profil utilisateur avec préférences
 * @returns {Array} Array d'objets plats recommandés
 */
export const getRecommendationsFromMenu = (menuText, userProfile = {}) => {
  // Simulation d'un délai de traitement
  console.log('Analyse du menu:', menuText);
  console.log('Profil utilisateur:', userProfile);

  // Base de données de plats disponibles (en réalité, cela viendrait d'une API)
  const availableDishes = [
    {
      name: "Salade de quinoa aux légumes",
      description: "Quinoa frais avec tomates cerises, concombre, avocat et vinaigrette citron-huile d'olive",
      price: 12.50,
      tags: ["végétarien", "sain", "gluten-free", "salade"]
    },
    {
      name: "Poulet rôti aux herbes",
      description: "Suprême de poulet fermier rôti avec thym, romarin et jus de citron, accompagné de pommes de terre",
      price: 18.90,
      tags: ["protéines", "classique", "herbes", "poulet"]
    },
    {
      name: "Tarte aux pommes traditionnelle",
      description: "Tarte fine aux pommes caramélisées avec une pâte sablée maison et crème anglaise",
      price: 8.50,
      tags: ["dessert", "traditionnel", "pommes", "sucré"]
    },
    {
      name: "Soupe à l'oignon gratinée",
      description: "Soupe traditionnelle à l'oignon caramélisé avec croûtons et fromage gratiné",
      price: 11.00,
      tags: ["soupe", "traditionnel", "fromage", "réconfortant"]
    },
    {
      name: "Steak frites maison",
      description: "Steak de bœuf grillé à la perfection avec frites maison et sauce au poivre",
      price: 24.50,
      tags: ["viande", "classique", "frites", "steak"]
    },
    {
      name: "Crème brûlée à la vanille",
      description: "Crème brûlée traditionnelle avec vanille de Madagascar et sucre caramélisé",
      price: 9.50,
      tags: ["dessert", "classique", "vanille", "crème"]
    },
    {
      name: "Risotto aux champignons",
      description: "Risotto crémeux aux champignons de Paris, parmesan et truffe noire",
      price: 16.80,
      tags: ["végétarien", "italien", "champignons", "risotto"]
    },
    {
      name: "Saumon grillé citron",
      description: "Filet de saumon frais grillé avec citron confit et légumes de saison",
      price: 22.00,
      tags: ["poisson", "sain", "citron", "grillé"]
    },
    {
      name: "Tiramisu classique",
      description: "Tiramisu traditionnel avec mascarpone, café et cacao en poudre",
      price: 10.50,
      tags: ["dessert", "italien", "café", "mascarpone"]
    },
    {
      name: "Burger gourmet",
      description: "Burger avec steak de bœuf, cheddar affiné, bacon croustillant et sauce secrète",
      price: 19.90,
      tags: ["burger", "viande", "gourmet", "cheddar"]
    },
    {
      name: "Lasagnes végétariennes",
      description: "Lasagnes maison avec légumes de saison, ricotta et sauce tomate fraîche",
      price: 15.50,
      tags: ["végétarien", "italien", "pâtes", "légumes"]
    },
    {
      name: "Carpaccio de bœuf",
      description: "Carpaccio finement tranché avec huile d'olive, parmesan et roquette",
      price: 14.80,
      tags: ["viande", "italien", "entrée", "carpaccio"]
    },
    {
      name: "Mousse au chocolat",
      description: "Mousse au chocolat noir avec chantilly et copeaux de chocolat",
      price: 7.90,
      tags: ["dessert", "chocolat", "mousse", "sucré"]
    },
    {
      name: "Pâtes carbonara",
      description: "Spaghetti à la carbonara traditionnelle avec œuf, pancetta et parmesan",
      price: 13.20,
      tags: ["italien", "pâtes", "carbonara", "classique"]
    },
    {
      name: "Ratatouille provençale",
      description: "Ratatouille traditionnelle avec aubergines, courgettes et tomates",
      price: 11.80,
      tags: ["végétarien", "français", "légumes", "provençal"]
    }
  ];

  // Analyse du texte du menu pour extraire des mots-clés
  const menuKeywords = extractKeywords(menuText);
  console.log('Mots-clés extraits:', menuKeywords);

  // Algorithme de recommandation basique
  const recommendations = generateRecommendations(availableDishes, menuKeywords, userProfile);

  return recommendations;
};

/**
 * Extrait les mots-clés du texte du menu
 * @param {string} menuText - Le texte du menu
 * @returns {Array} Array de mots-clés
 */
const extractKeywords = (menuText) => {
  if (!menuText) return [];

  // Conversion en minuscules et nettoyage
  const cleanText = menuText.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Supprime la ponctuation
    .replace(/\s+/g, ' ') // Normalise les espaces
    .trim();

  // Mots-clés à rechercher
  const keywords = [
    'salade', 'quinoa', 'poulet', 'rôti', 'tarte', 'pommes', 'soupe', 'oignon',
    'steak', 'frites', 'crème', 'brûlée', 'viande', 'poisson', 'végétarien',
    'dessert', 'entrée', 'plat', 'principal', 'fromage', 'herbes', 'citron'
  ];

  // Extraction des mots-clés présents dans le texte
  const foundKeywords = keywords.filter(keyword => 
    cleanText.includes(keyword)
  );

  return foundKeywords;
};

/**
 * Génère des recommandations basées sur les mots-clés et le profil utilisateur
 * @param {Array} availableDishes - Plats disponibles
 * @param {Array} menuKeywords - Mots-clés extraits du menu
 * @param {object} userProfile - Profil utilisateur
 * @returns {Array} Array de 3 plats recommandés
 */
const generateRecommendations = (availableDishes, menuKeywords, userProfile) => {
  // Calcul du score pour chaque plat
  const scoredDishes = availableDishes.map(dish => {
    let score = 0;

    // Score basé sur les mots-clés du menu
    menuKeywords.forEach(keyword => {
      if (dish.name.toLowerCase().includes(keyword) || 
          dish.description.toLowerCase().includes(keyword) ||
          dish.tags.includes(keyword)) {
        score += 2;
      }
    });

    // Score basé sur les préférences utilisateur
    if (userProfile.dietaryRestrictions) {
      if (userProfile.dietaryRestrictions.includes('vegetarian') && 
          dish.tags.includes('végétarien')) {
        score += 3;
      }
      if (userProfile.dietaryRestrictions.includes('gluten-free') && 
          dish.tags.includes('gluten-free')) {
        score += 2;
      }
    }

    // Score basé sur le budget
    if (userProfile.budget) {
      if (userProfile.budget === 'low' && dish.price < 15) score += 1;
      if (userProfile.budget === 'medium' && dish.price >= 15 && dish.price < 25) score += 1;
      if (userProfile.budget === 'high' && dish.price >= 25) score += 1;
    }

    // Score basé sur les préférences culinaires
    if (userProfile.cuisinePreferences) {
      userProfile.cuisinePreferences.forEach(pref => {
        if (dish.tags.includes(pref)) score += 1;
      });
    }

    // Bonus pour les plats populaires
    const popularDishes = ['poulet', 'steak', 'salade', 'dessert'];
    if (popularDishes.some(popular => dish.name.toLowerCase().includes(popular))) {
      score += 0.5;
    }

    return { ...dish, score };
  });

  // Tri par score décroissant et sélection des 3 meilleurs
  const topRecommendations = scoredDishes
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(dish => {
      // Suppression du score pour l'affichage
      const { score, ...dishWithoutScore } = dish;
      return dishWithoutScore;
    });

  // Stockage de toutes les recommandations pour utilisation ultérieure
  const allRecommendations = scoredDishes
    .sort((a, b) => b.score - a.score)
    .map(dish => {
      const { score, ...dishWithoutScore } = dish;
      return dishWithoutScore;
    });

  console.log('Recommandations générées:', topRecommendations);
  return { topRecommendations, allRecommendations };
};

/**
 * Obtient des recommandations supplémentaires (plats 4-8)
 * @param {Array} allRecommendations - Toutes les recommandations disponibles
 * @returns {Array} Array de 5 plats supplémentaires
 */
export const getAdditionalRecommendations = (allRecommendations) => {
  return allRecommendations.slice(3, 8);
};

/**
 * Génère un profil utilisateur par défaut pour les tests
 * @returns {object} Profil utilisateur par défaut
 */
export const getDefaultUserProfile = () => {
  return {
    name: "Utilisateur",
    dietaryRestrictions: [], // ['vegetarian', 'gluten-free', 'vegan']
    budget: "medium", // 'low', 'medium', 'high'
    cuisinePreferences: [], // ['italien', 'français', 'asiatique', 'méditerranéen']
    allergies: [], // ['noix', 'lactose', 'gluten']
    spiceTolerance: "medium" // 'low', 'medium', 'high'
  };
};

/**
 * Met à jour le profil utilisateur avec de nouvelles préférences
 * @param {object} currentProfile - Profil actuel
 * @param {object} newPreferences - Nouvelles préférences
 * @returns {object} Profil mis à jour
 */
export const updateUserProfile = (currentProfile, newPreferences) => {
  return {
    ...currentProfile,
    ...newPreferences
  };
}; 