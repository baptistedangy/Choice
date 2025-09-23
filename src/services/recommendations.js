// Service de recommandations pour l'application Choice
// Génère des recommandations de plats basées sur le menu scanné et le profil utilisateur

import { generateMindsetRecommendations, getMindsetInfo } from './mindsetRecommendations.js';
import { scoreAndLabel } from '../lib/mvpRecommender.js';

/**
 * Charge le profil utilisateur étendu depuis localStorage
 * @returns {object} Profil utilisateur étendu ou profil par défaut
 */
export function loadExtendedUserProfile() {
  try {
    const saved = localStorage.getItem('extendedProfile');
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('Failed to load extended profile:', error);
    return {};
  }
}

/**
 * Génère des recommandations de plats basées sur le texte du menu et le profil utilisateur
 * @param {string} menuText - Le texte extrait du menu par OCR
 * @param {object} userProfile - Le profil utilisateur avec préférences
 * @param {object} options - Options supplémentaires (mindset, activity, etc.)
 * @returns {Object} Recommandations avec top3 et toutes les recommandations
 */
export const getRecommendationsFromMenu = (menuText, userProfile = {}, options = {}) => {
  console.log('📋 Generating recommendations from menu text...');
  console.log('Menu text length:', menuText?.length);
  console.log('User profile:', userProfile);
  console.log('Options:', options);

  // Si pas de texte de menu, retourner des recommandations vides
  if (!menuText || menuText.trim().length === 0) {
    console.log('⚠️ No menu text provided');
    return {
      topRecommendations: [],
      allRecommendations: [],
      error: 'No menu text provided'
    };
  }

  // Charger le profil étendu
  const extendedProfile = userProfile && Object.keys(userProfile).length > 0 
    ? userProfile 
    : loadExtendedUserProfile();

  // Extraire le mindset (par défaut: healthy)
  const mindset = options.mindset || extendedProfile.mindset || 'healthy';
  console.log('🎯 Using mindset:', mindset);

  // Pour l'instant, retourner des recommandations vides car les plats 
  // viendront de l'analyse AI du menu scanné via le backend
  // Cette fonction sera appelée après que le backend ait parsé les plats
  console.log('✅ Recommendations will be generated after menu parsing');
  
  return {
    topRecommendations: [],
    allRecommendations: [],
    mindset: mindset,
    status: 'pending_parsing'
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
 * Génère des recommandations à partir de plats déjà parsés
 * @param {Array} dishes - Liste des plats parsés
 * @param {object} userProfile - Profil utilisateur
 * @param {object} options - Options (mindset, activity, etc.)
 * @returns {Object} Recommandations avec top3 et toutes les recommandations
 */
export const generateRecommendationsFromDishes = (dishes, userProfile = {}, options = {}) => {
  console.log('🍽️ Generating recommendations from parsed dishes...');
  console.log('Dishes count:', dishes?.length);
  console.log('User profile:', userProfile);
  console.log('Options:', options);

  if (!Array.isArray(dishes) || dishes.length === 0) {
    console.log('⚠️ No dishes provided');
    return {
      topRecommendations: [],
      allRecommendations: [],
      error: 'No dishes provided'
    };
  }

  // Charger le profil étendu
  const extendedProfile = userProfile && Object.keys(userProfile).length > 0 
    ? userProfile 
    : loadExtendedUserProfile();

  // Extraire le mindset
  const mindset = options.mindset || extendedProfile.mindset || 'healthy';
  console.log('🎯 Using mindset:', mindset);

  // Option 1: Utiliser le MVP recommender (logique actuelle)
  if (options.useMvpRecommender !== false) {
    console.log('📊 Using MVP recommender...');
    const { top3, all } = scoreAndLabel(dishes);
    
    return {
      topRecommendations: top3,
      allRecommendations: all,
      mindset: mindset,
      method: 'mvp_recommender',
      summary: {
        totalDishes: dishes.length,
        recommendationsGenerated: top3.length,
        averageScore: top3.length > 0 ? top3.reduce((sum, dish) => sum + (dish.score || 0), 0) / top3.length : 0
      }
    };
  }

  // Option 2: Utiliser le mindset recommender
  console.log('🎯 Using mindset recommender...');
  const mindsetResult = generateMindsetRecommendations(dishes, mindset, options);
  
  return {
    topRecommendations: mindsetResult.top3,
    allRecommendations: mindsetResult.all,
    mindset: mindset,
    method: 'mindset_recommender',
    summary: mindsetResult.summary
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

/**
 * Sauvegarde le profil utilisateur dans localStorage
 * @param {object} profile - Profil à sauvegarder
 * @returns {boolean} Succès de la sauvegarde
 */
export const saveUserProfile = (profile) => {
  try {
    localStorage.setItem('extendedProfile', JSON.stringify(profile));
    console.log('✅ User profile saved');
    return true;
  } catch (error) {
    console.error('❌ Failed to save user profile:', error);
    return false;
  }
};

/**
 * Obtient les informations sur un mindset
 * @param {string} mindset - Nom du mindset
 * @returns {object} Informations sur le mindset
 */
export const getMindsetInfo = (mindset) => {
  return getMindsetInfo(mindset);
};

/**
 * Liste tous les mindsets disponibles
 * @returns {Array} Liste des mindsets
 */
export const getAvailableMindsets = () => {
  return getAvailableMindsets();
};

/**
 * Valide un mindset
 * @param {string} mindset - Mindset à valider
 * @returns {boolean} True si le mindset est valide
 */
export const isValidMindset = (mindset) => {
  const availableMindsets = getAvailableMindsets();
  return availableMindsets.some(m => m.key === mindset);
};

/**
 * Obtient le mindset par défaut
 * @returns {string} Mindset par défaut
 */
export const getDefaultMindset = () => {
  return 'healthy';
}; 