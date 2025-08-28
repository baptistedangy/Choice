// Service de recommandations pour l'application Choice
// Génère des recommandations de plats basées sur le menu scanné et le profil utilisateur

/**
 * Charge le profil utilisateur étendu depuis localStorage
 * @returns {object} Profil utilisateur étendu ou profil par défaut
 */
export function loadExtendedUserProfile() {
  return {};
}

/**
 * Génère des recommandations de plats basées sur le texte du menu et le profil utilisateur
 * @param {string} menuText - Le texte extrait du menu par OCR
 * @param {object} userProfile - Le profil utilisateur avec préférences
 * @returns {Array} Array d'objets plats recommandés
 */
export const getRecommendationsFromMenu = (menuText, userProfile = {}) => {
  // Charger le profil étendu si aucun profil n'est fourni
  const extendedProfile = userProfile && Object.keys(userProfile).length > 0 
    ? userProfile 
    : loadExtendedUserProfile();

  console.log('📋 Menu analysis:', menuText?.substring(0, 100) + '...');
  console.log('👤 Extended user profile:', extendedProfile);

  // Aucun plat hardcodé - seuls les plats extraits du menu scanné sont utilisés
  console.log('✅ No hardcoded dishes - only scanned menu dishes will be used');
  
  // Retourner un objet vide car les plats viendront de l'analyse AI du menu scanné
  return {
    topRecommendations: [],
    allRecommendations: []
  };
};

/**
 * Filtre les plats basé sur les préférences utilisateur (allergies, lois alimentaires, etc.)
 * @param {Array} dishes - Liste des plats à filtrer
 * @param {object} userProfile - Profil utilisateur étendu
 * @returns {Array} Plats filtrés et triés par pertinence
 */
export function filterDishesByUserPreferences(dishes, userProfile = {}) {
  if (!dishes || !Array.isArray(dishes)) {
    console.log('⚠️ No dishes to filter');
    return [];
  }

  console.log('🔍 Filtering dishes based on user preferences:', userProfile);

  const filteredDishes = dishes.filter(dish => {
    // 1. Vérifier les allergies (exclusion stricte)
    if (userProfile.allergies && userProfile.allergies.length > 0) {
      const hasAllergen = userProfile.allergies.some(allergy => {
        const dishText = `${dish.name} ${dish.description} ${dish.ingredients || ''}`.toLowerCase();
        return dishText.includes(allergy.toLowerCase());
      });
      
      if (hasAllergen) {
        console.log(`🚫 Dish "${dish.name}" excluded due to allergy`);
        return false;
      }
    }

    // 2. Vérifier les lois alimentaires
    if (userProfile.dietaryLaws && userProfile.dietaryLaws !== 'none') {
      // Logique simplifiée - à étendre selon les besoins
      if (userProfile.dietaryLaws === 'halal' && dish.containsPork) {
        console.log(`🚫 Dish "${dish.name}" excluded - not halal compliant`);
        return false;
      }
      if (userProfile.dietaryLaws === 'kosher' && dish.containsPork) {
        console.log(`🚫 Dish "${dish.name}" excluded - not kosher compliant`);
        return false;
      }
    }

    return true;
  });

  // 3. Trier par pertinence basée sur les préférences
  const scoredDishes = filteredDishes.map(dish => {
    let score = 0;
    const dishText = `${dish.name} ${dish.description} ${dish.ingredients || ''}`.toLowerCase();

    // Bonus pour les sources de protéines préférées
    if (userProfile.preferredProteinSources && userProfile.preferredProteinSources.length > 0) {
      userProfile.preferredProteinSources.forEach(protein => {
        if (dishText.includes(protein.toLowerCase())) {
          score += 10;
          console.log(`✅ Dish "${dish.name}" gets +10 for preferred protein: ${protein}`);
        }
      });
    }

    // Bonus pour les préférences gustatives
    if (userProfile.tasteAndPrepPreferences && userProfile.tasteAndPrepPreferences.length > 0) {
      userProfile.tasteAndPrepPreferences.forEach(pref => {
        if (pref === 'prefer_grilled' && dishText.includes('grilled')) {
          score += 5;
        } else if (pref === 'prefer_spicy' && dishText.includes('spicy')) {
          score += 5;
        } else if (pref === 'love_pasta' && dishText.includes('pasta')) {
          score += 5;
        }
      });
    }

    // Bonus pour les préférences alimentaires de base
    if (userProfile.dietaryPreferences && userProfile.dietaryPreferences.length > 0) {
      userProfile.dietaryPreferences.forEach(pref => {
        if (pref === 'vegetarian' && dishText.includes('vegetarian')) {
          score += 8;
        } else if (pref === 'vegan' && dishText.includes('vegan')) {
          score += 8;
        }
      });
    }

    return { ...dish, relevanceScore: score };
  });

  // Trier par score de pertinence (décroissant)
  const sortedDishes = scoredDishes.sort((a, b) => b.relevanceScore - a.relevanceScore);

  console.log(`✅ Filtered and scored ${sortedDishes.length} dishes`);
  return sortedDishes;
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
 * @param {Array} availableDishes - Plats disponibles (maintenant vide)
 * @param {Array} menuKeywords - Mots-clés extraits du menu
 * @param {object} userProfile - Profil utilisateur
 * @returns {Array} Array de 3 plats recommandés
 */
const generateRecommendations = (availableDishes, menuKeywords, userProfile) => {
  // Aucun plat hardcodé à traiter
  console.log('✅ No hardcoded dishes to process - only scanned menu dishes will be analyzed');
  
  return {
    topRecommendations: [],
    allRecommendations: []
  };
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
export const DEFAULT_USER_PROFILE = {
  dietaryPreferences: [],
  allergies: [],
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