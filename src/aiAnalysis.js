import { analyzeDishBackend, analyzeMultipleDishesBackend } from './services/backendService';

/**
 * Analyse un plat pour un utilisateur avec un profil spécifique
 * @param {string} dishText - Description du plat à analyser
 * @param {Object} userProfile - Profil utilisateur avec préférences et objectifs
 * @returns {Promise<Object>} - Analyse du plat avec score, calories, macronutriments et justification
 */
export async function analyzeDish(dishText, userProfile) {
  try {
    // Validation des entrées
    if (!dishText) {
      throw new Error('Description du plat requise');
    }

    if (!userProfile) {
      throw new Error('Profil utilisateur requis');
    }

    // Récupération du profil étendu depuis localStorage
    let extendedProfile = {};
    try {
      const savedExtendedProfile = localStorage.getItem('extendedProfile');
      if (savedExtendedProfile) {
        extendedProfile = JSON.parse(savedExtendedProfile);
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération du profil étendu:', error);
    }

    // Fusion du profil de base avec le profil étendu
    const completeUserProfile = {
      ...userProfile,
      ...extendedProfile
    };

    console.log('📤 Sending dish analysis request to backend...');
    
    // Use backend service instead of direct OpenAI call
    const analysis = await analyzeDishBackend(dishText, completeUserProfile);
    
    // Retour de l'analyse formatée
    return {
      aiScore: analysis.aiScore,
      calories: analysis.calories,
      macros: {
        protein: analysis.macros.protein,
        carbs: analysis.macros.carbs,
        fats: analysis.macros.fats
      },
      shortJustification: analysis.shortJustification
    };

  } catch (error) {
    console.error('Erreur lors de l\'analyse du plat:', error);
    
    // Retour d'une analyse par défaut en cas d'erreur
    return {
      aiScore: 5.0,
      calories: 0,
      macros: {
        protein: 0,
        carbs: 0,
        fats: 0
      },
      shortJustification: `Service temporarily unavailable: ${error.message}`
    };
  }
}

/**
 * Analyse plusieurs plats en parallèle
 * @param {Array} dishes - Liste des plats à analyser
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Promise<Array>} - Liste des analyses
 */
export async function analyzeMultipleDishes(dishes, userProfile) {
  try {
    console.log('📤 Sending multiple dishes analysis request to backend...');
    
    // Use backend service instead of direct OpenAI calls
    const analyses = await analyzeMultipleDishesBackend(dishes, userProfile);
    
    console.log('✅ Multiple dishes analysis completed');
    return analyses;
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse multiple:', error);
    return dishes.map(dish => ({
      ...dish,
      aiScore: 5.0,
      calories: 0,
      macros: { protein: 0, carbs: 0, fats: 0 },
      shortJustification: `Service temporarily unavailable: ${error.message}`
    }));
  }
} 