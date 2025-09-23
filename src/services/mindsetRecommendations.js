// Service de recommandations basé sur le mindset utilisateur
// Mindsets: healthy, comforting, cost-savy

/**
 * Règles de scoring pour chaque mindset
 */
const MINDSET_RULES = {
  healthy: {
    name: 'Healthy',
    description: 'Focus on nutritious, balanced meals',
    keywords: {
      positive: [
        'salad', 'quinoa', 'grilled', 'roasted', 'steamed', 'fresh', 'vegetables',
        'lean', 'protein', 'omega', 'antioxidant', 'organic', 'whole grain',
        'avocado', 'spinach', 'kale', 'broccoli', 'salmon', 'chicken breast',
        'brown rice', 'sweet potato', 'nuts', 'seeds', 'berries'
      ],
      negative: [
        'fried', 'deep fried', 'crispy', 'battered', 'butter', 'cream', 'cheese',
        'bacon', 'sausage', 'processed', 'sugar', 'syrup', 'mayo', 'ranch'
      ]
    },
    scoring: {
      base: 5,
      positiveMultiplier: 2,
      negativeMultiplier: -1,
      proteinBonus: 3,
      veggieBonus: 2
    }
  },
  
  comforting: {
    name: 'Comforting',
    description: 'Focus on hearty, satisfying comfort foods',
    keywords: {
      positive: [
        'comfort', 'hearty', 'rich', 'creamy', 'cheesy', 'warm', 'cozy',
        'pasta', 'risotto', 'mashed', 'gravy', 'sauce', 'stew', 'casserole',
        'mac and cheese', 'lasagna', 'pizza', 'burger', 'fries', 'soup',
        'bread', 'butter', 'cream', 'melted', 'gooey', 'indulgent'
      ],
      negative: [
        'light', 'diet', 'low-calorie', 'fat-free', 'sugar-free', 'raw',
        'cold', 'bitter', 'tart', 'sour'
      ]
    },
    scoring: {
      base: 5,
      positiveMultiplier: 2.5,
      negativeMultiplier: -1.5,
      comfortBonus: 4,
      indulgenceBonus: 3
    }
  },
  
  'cost-savy': {
    name: 'Cost-Savy',
    description: 'Focus on value and budget-friendly options',
    keywords: {
      positive: [
        'value', 'deal', 'special', 'combo', 'meal', 'lunch', 'happy hour',
        'affordable', 'budget', 'economical', 'generous', 'large', 'family',
        'pasta', 'rice', 'beans', 'potato', 'bread', 'soup', 'sandwich'
      ],
      negative: [
        'premium', 'luxury', 'gourmet', 'artisan', 'imported', 'organic',
        'truffle', 'caviar', 'lobster', 'steak', 'wine', 'champagne'
      ]
    },
    scoring: {
      base: 5,
      positiveMultiplier: 1.5,
      negativeMultiplier: -2,
      valueBonus: 3,
      budgetBonus: 2
    }
  }
};

/**
 * Calcule le score d'un plat basé sur le mindset
 * @param {Object} dish - Plat à scorer
 * @param {string} mindset - Mindset utilisateur
 * @returns {number} Score du plat
 */
function calculateMindsetScore(dish, mindset) {
  const rules = MINDSET_RULES[mindset];
  if (!rules) {
    console.warn(`Unknown mindset: ${mindset}`);
    return 5; // Score par défaut
  }

  const dishText = `${dish.title} ${dish.description}`.toLowerCase();
  let score = rules.scoring.base;

  // Appliquer les mots-clés positifs
  rules.keywords.positive.forEach(keyword => {
    if (dishText.includes(keyword)) {
      score += rules.scoring.positiveMultiplier;
    }
  });

  // Appliquer les mots-clés négatifs
  rules.keywords.negative.forEach(keyword => {
    if (dishText.includes(keyword)) {
      score += rules.scoring.negativeMultiplier;
    }
  });

  // Bonus spéciaux selon le mindset
  if (mindset === 'healthy') {
    if (dishText.includes('protein') || dishText.includes('lean')) {
      score += rules.scoring.proteinBonus;
    }
    if (dishText.includes('vegetable') || dishText.includes('green')) {
      score += rules.scoring.veggieBonus;
    }
  } else if (mindset === 'comforting') {
    if (dishText.includes('comfort') || dishText.includes('hearty')) {
      score += rules.scoring.comfortBonus;
    }
    if (dishText.includes('indulgent') || dishText.includes('rich')) {
      score += rules.scoring.indulgenceBonus;
    }
  } else if (mindset === 'cost-savy') {
    if (dishText.includes('value') || dishText.includes('deal')) {
      score += rules.scoring.valueBonus;
    }
    if (dishText.includes('budget') || dishText.includes('affordable')) {
      score += rules.scoring.budgetBonus;
    }
  }

  return Math.max(0, Math.min(10, score)); // Clamp entre 0 et 10
}

/**
 * Génère des recommandations basées sur le mindset
 * @param {Array} dishes - Liste des plats disponibles
 * @param {string} mindset - Mindset utilisateur (healthy, comforting, cost-savy)
 * @param {Object} options - Options supplémentaires
 * @returns {Object} Recommandations avec top3 et toutes les recommandations
 */
export function generateMindsetRecommendations(dishes, mindset = 'healthy', options = {}) {
  console.log(`🎯 Generating ${mindset} recommendations for ${dishes.length} dishes`);
  
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return {
      top3: [],
      all: [],
      mindset: mindset,
      summary: {
        totalDishes: 0,
        recommendationsGenerated: 0,
        averageScore: 0
      }
    };
  }

  // Scorer tous les plats selon le mindset
  const scoredDishes = dishes.map(dish => {
    const mindsetScore = calculateMindsetScore(dish, mindset);
    const finalScore = mindsetScore;
    
    return {
      ...dish,
      mindsetScore,
      finalScore,
      mindset: mindset,
      reasoning: generateReasoning(dish, mindset, mindsetScore)
    };
  });

  // Trier par score décroissant
  const sortedDishes = scoredDishes.sort((a, b) => b.finalScore - a.finalScore);

  // Sélectionner le top 3
  const top3 = sortedDishes.slice(0, 3);

  // Calculer les statistiques
  const averageScore = scoredDishes.reduce((sum, dish) => sum + dish.finalScore, 0) / scoredDishes.length;

  console.log(`✅ Generated ${top3.length} top recommendations`);
  console.log(`📊 Average score: ${averageScore.toFixed(2)}`);

  return {
    top3,
    all: sortedDishes,
    mindset: mindset,
    summary: {
      totalDishes: dishes.length,
      recommendationsGenerated: top3.length,
      averageScore: parseFloat(averageScore.toFixed(2))
    }
  };
}

/**
 * Génère une explication pour le score d'un plat
 * @param {Object} dish - Plat analysé
 * @param {string} mindset - Mindset utilisé
 * @param {number} score - Score calculé
 * @returns {Array} Raisons du score
 */
function generateReasoning(dish, mindset, score) {
  const reasons = [];
  const dishText = `${dish.title} ${dish.description}`.toLowerCase();
  const rules = MINDSET_RULES[mindset];

  if (!rules) return reasons;

  // Vérifier les mots-clés positifs présents
  const positiveMatches = rules.keywords.positive.filter(keyword => 
    dishText.includes(keyword)
  );
  
  if (positiveMatches.length > 0) {
    reasons.push(`Matches ${mindset} preferences: ${positiveMatches.slice(0, 2).join(', ')}`);
  }

  // Vérifier les mots-clés négatifs présents
  const negativeMatches = rules.keywords.negative.filter(keyword => 
    dishText.includes(keyword)
  );
  
  if (negativeMatches.length > 0) {
    reasons.push(`Contains ${mindset} concerns: ${negativeMatches.slice(0, 2).join(', ')}`);
  }

  // Ajouter une raison basée sur le score
  if (score >= 8) {
    reasons.push(`Excellent ${mindset} choice`);
  } else if (score >= 6) {
    reasons.push(`Good ${mindset} option`);
  } else if (score >= 4) {
    reasons.push(`Moderate ${mindset} fit`);
  } else {
    reasons.push(`Limited ${mindset} alignment`);
  }

  return reasons;
}

/**
 * Obtient les informations sur un mindset
 * @param {string} mindset - Nom du mindset
 * @returns {Object} Informations sur le mindset
 */
export function getMindsetInfo(mindset) {
  return MINDSET_RULES[mindset] || {
    name: 'Unknown',
    description: 'Unknown mindset',
    keywords: { positive: [], negative: [] },
    scoring: { base: 5, positiveMultiplier: 1, negativeMultiplier: -1 }
  };
}

/**
 * Liste tous les mindsets disponibles
 * @returns {Array} Liste des mindsets
 */
export function getAvailableMindsets() {
  return Object.keys(MINDSET_RULES).map(key => ({
    key,
    ...MINDSET_RULES[key]
  }));
}

export default {
  generateMindsetRecommendations,
  getMindsetInfo,
  getAvailableMindsets,
  calculateMindsetScore
};
