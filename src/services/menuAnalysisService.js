// Service dédié à l'analyse des menus et la génération de recommandations
import { parseMenu } from '../lib/menuParser.js';
import { scoreAndLabel } from '../lib/mvpRecommender.js';

/**
 * Service pour l'analyse des menus
 */
export class MenuAnalysisService {
  /**
   * Parse un menu et extrait les plats
   * @param {string} menuText - Texte du menu
   * @param {Object} options - Options de parsing
   * @returns {Object} - Résultat du parsing
   */
  static parseMenu(menuText, options = {}) {
    try {
      console.log('🔍 MenuAnalysisService: Parsing menu...');
      
      if (!menuText || typeof menuText !== 'string') {
        throw new Error('Menu text is required and must be a string');
      }
      
      const dishes = parseMenu(menuText);
      console.log('✅ MenuAnalysisService: Extracted', dishes.length, 'dishes');
      
      return {
        success: true,
        dishes: dishes.map((dish, index) => ({
          id: index + 1,
          title: dish.title,
          description: dish.description,
          price: dish.price,
          currency: '€',
          tags: ['parsed', 'menu']
        })),
        count: dishes.length,
        context: {
          mindset: options.mindset || null,
          activity: options.activity || null
        }
      };
    } catch (error) {
      console.error('❌ MenuAnalysisService: Parse error:', error);
      return {
        success: false,
        error: 'Failed to parse menu',
        message: error.message,
        dishes: [],
        count: 0
      };
    }
  }

  /**
   * Génère des recommandations basées sur les plats parsés
   * @param {Array} dishes - Liste des plats
   * @param {Object} userProfile - Profil utilisateur
   * @returns {Object} - Recommandations générées
   */
  static generateRecommendations(dishes, userProfile = {}) {
    try {
      console.log('🎯 MenuAnalysisService: Generating recommendations...');
      
      if (!Array.isArray(dishes) || dishes.length === 0) {
        throw new Error('Dishes array is required and must not be empty');
      }
      
      // Utiliser le MVP recommender pour scorer et labelliser
      const { top3, all } = scoreAndLabel(dishes);
      
      console.log('✅ MenuAnalysisService: Generated', top3.length, 'top recommendations');
      
      return {
        success: true,
        top3: top3.map(dish => ({
          id: dish.id || Math.random().toString(36).substr(2, 9),
          title: dish.title,
          description: dish.description,
          price: dish.price,
          score: dish.score,
          label: dish.label,
          reasons: dish.reasons,
          tags: dish.tags || ['recommended']
        })),
        all: all.map(dish => ({
          id: dish.id || Math.random().toString(36).substr(2, 9),
          title: dish.title,
          description: dish.description,
          price: dish.price,
          score: dish.score,
          label: dish.label,
          reasons: dish.reasons,
          tags: dish.tags || ['analyzed']
        })),
        count: top3.length,
        totalAnalyzed: all.length
      };
    } catch (error) {
      console.error('❌ MenuAnalysisService: Recommendation error:', error);
      return {
        success: false,
        error: 'Failed to generate recommendations',
        message: error.message,
        top3: [],
        all: [],
        count: 0,
        totalAnalyzed: 0
      };
    }
  }

  /**
   * Analyse complète d'un menu (parsing + recommandations)
   * @param {string} menuText - Texte du menu
   * @param {Object} userProfile - Profil utilisateur
   * @param {Object} options - Options d'analyse
   * @returns {Object} - Résultat complet de l'analyse
   */
  static analyzeMenu(menuText, userProfile = {}, options = {}) {
    try {
      console.log('🔬 MenuAnalysisService: Starting complete menu analysis...');
      
      // Étape 1: Parser le menu
      const parseResult = this.parseMenu(menuText, options);
      if (!parseResult.success) {
        return parseResult;
      }
      
      // Étape 2: Générer les recommandations
      const recommendationResult = this.generateRecommendations(parseResult.dishes, userProfile);
      if (!recommendationResult.success) {
        return {
          ...parseResult,
          ...recommendationResult
        };
      }
      
      console.log('✅ MenuAnalysisService: Complete analysis successful');
      
      return {
        success: true,
        parsing: parseResult,
        recommendations: recommendationResult,
        summary: {
          dishesFound: parseResult.count,
          recommendationsGenerated: recommendationResult.count,
          totalAnalyzed: recommendationResult.totalAnalyzed
        }
      };
    } catch (error) {
      console.error('❌ MenuAnalysisService: Complete analysis error:', error);
      return {
        success: false,
        error: 'Failed to complete menu analysis',
        message: error.message,
        parsing: { success: false, dishes: [], count: 0 },
        recommendations: { success: false, top3: [], all: [], count: 0, totalAnalyzed: 0 }
      };
    }
  }
}

export default MenuAnalysisService;
