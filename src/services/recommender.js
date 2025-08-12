// Service de recommandation avancé avec scoring contextuel
// Prend en compte la faim, le timing et le profil utilisateur

/**
 * Filtre préliminaire avec contraintes dures uniquement
 * @param {Array} items - Liste des plats à filtrer
 * @param {object} profile - Profil utilisateur
 * @returns {object} { safe: Array, rejected: Array }
 */
export const preFilter = (items, profile) => {
  if (!items || !Array.isArray(items)) {
    return { safe: [], rejected: [] };
  }

  console.log('🔒 Pre-filtering items with hard constraints...');
  
  const safe = [];
  const rejected = [];
  const rejectionReasons = {};

  items.forEach(item => {
    const itemText = `${item.name} ${item.description} ${item.ingredients || ''}`.toLowerCase();
    let isRejected = false;
    let reason = '';

    // 1. Vérifier les allergies (contrainte absolue)
    if (profile.allergies && profile.allergies.length > 0) {
      const hasAllergen = profile.allergies.some(allergy => 
        itemText.includes(allergy.toLowerCase())
      );
      if (hasAllergen) {
        isRejected = true;
        reason = `Contains allergen: ${profile.allergies.find(a => itemText.includes(a.toLowerCase()))}`;
        if (!rejectionReasons.allergies) rejectionReasons.allergies = 0;
        rejectionReasons.allergies++;
      }
    }

    // 2. Vérifier les lois alimentaires (contrainte absolue)
    if (!isRejected && profile.dietaryLaws && profile.dietaryLaws !== 'none') {
      if (profile.dietaryLaws === 'halal' && itemText.includes('pork')) {
        isRejected = true;
        reason = 'Not halal compliant (contains pork)';
        if (!rejectionReasons.dietaryLaws) rejectionReasons.dietaryLaws = 0;
        rejectionReasons.dietaryLaws++;
      } else if (profile.dietaryLaws === 'kosher' && itemText.includes('pork')) {
        isRejected = true;
        reason = 'Not kosher compliant (contains pork)';
        if (!rejectionReasons.dietaryLaws) rejectionReasons.dietaryLaws = 0;
        rejectionReasons.dietaryLaws++;
      }
    }

    // 3. Vérifier le régime alimentaire de base (contrainte absolue)
    if (!isRejected && profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
      if (profile.dietaryPreferences.includes('vegetarian')) {
        if (itemText.includes('beef') || itemText.includes('chicken') || 
            itemText.includes('pork') || itemText.includes('lamb') || 
            itemText.includes('meat') || itemText.includes('steak')) {
          isRejected = true;
          reason = 'Not vegetarian (contains meat)';
          if (!rejectionReasons.baseDiet) rejectionReasons.baseDiet = 0;
          rejectionReasons.baseDiet++;
        }
      } else if (profile.dietaryPreferences.includes('vegan')) {
        if (itemText.includes('beef') || itemText.includes('chicken') || 
            itemText.includes('pork') || itemText.includes('lamb') || 
            itemText.includes('meat') || itemText.includes('steak') ||
            itemText.includes('cheese') || itemText.includes('milk') || 
            itemText.includes('eggs') || itemText.includes('butter') ||
            itemText.includes('cream') || itemText.includes('yogurt')) {
          isRejected = true;
          reason = 'Not vegan (contains animal products)';
          if (!rejectionReasons.baseDiet) rejectionReasons.baseDiet = 0;
          rejectionReasons.baseDiet++;
        }
      } else if (profile.dietaryPreferences.includes('pescatarian')) {
        if (itemText.includes('beef') || itemText.includes('chicken') || 
            itemText.includes('pork') || itemText.includes('lamb') || 
            itemText.includes('meat') || itemText.includes('steak')) {
          isRejected = true;
          reason = 'Not pescatarian (contains meat)';
          if (!rejectionReasons.baseDiet) rejectionReasons.baseDiet = 0;
          rejectionReasons.baseDiet++;
        }
      }
    }

    // 4. Vérifier les tags "do-not-eat" (contrainte absolue)
    if (!isRejected && profile.doNotEat && profile.doNotEat.length > 0) {
      const hasDoNotEat = profile.doNotEat.some(item => 
        itemText.includes(item.toLowerCase())
      );
      if (hasDoNotEat) {
        isRejected = true;
        reason = `Contains forbidden item: ${profile.doNotEat.find(i => itemText.includes(i.toLowerCase()))}`;
        if (!rejectionReasons.doNotEat) rejectionReasons.doNotEat = 0;
        rejectionReasons.doNotEat++;
      }
    }

    if (isRejected) {
      rejected.push({ ...item, rejectionReason: reason });
    } else {
      safe.push(item);
    }
  });

  console.log(`🔒 Pre-filter results: ${safe.length} safe, ${rejected.length} rejected`);
  if (Object.keys(rejectionReasons).length > 0) {
    console.log('🚫 Rejection reasons:', rejectionReasons);
  }

  return { safe, rejected };
};

/**
 * Obtient les cibles macro selon le timing
 * @param {string} timing - 'regular', 'pre_workout', 'post_workout'
 * @returns {object} Cibles macro en pourcentages
 */
export const getMacroTargets = (timing) => {
  switch (timing) {
    case 'pre_workout':
      return { protein: [15, 25], carbs: [50, 65], fat: [15, 25] };
    case 'post_workout':
      return { protein: [30, 40], carbs: [30, 45], fat: [20, 30] };
    case 'regular':
    default:
      return { protein: [25, 35], carbs: [35, 45], fat: [25, 35] };
  }
};

/**
 * Calcule le fit macro d'un plat
 * @param {object} dish - Plat avec macros
 * @param {object} targets - Cibles macro
 * @returns {number} Score de 0 à 1
 */
export const calculateMacroFit = (dish, targets) => {
  if (!dish.macros) {
    // Estimation basée sur les mots-clés si pas de macros
    return estimateMacroFitFromKeywords(dish, targets);
  }

  const { protein, carbs, fat } = dish.macros;
  const total = protein + carbs + fat;
  
  if (total === 0) return 0.5; // Valeur par défaut

  const pRatio = (protein / total) * 100;
  const cRatio = (carbs / total) * 100;
  const fRatio = (fat / total) * 100;

  let fitScore = 0;
  
  // Vérifier chaque macro
  if (pRatio >= targets.protein[0] && pRatio <= targets.protein[1]) fitScore += 0.33;
  if (cRatio >= targets.carbs[0] && cRatio <= targets.carbs[1]) fitScore += 0.33;
  if (fRatio >= targets.fat[0] && fRatio <= targets.fat[1]) fitScore += 0.34;

  return Math.round(fitScore * 100) / 100;
};

/**
 * Estime le fit macro basé sur les mots-clés du plat
 * @param {object} dish - Plat
 * @param {object} targets - Cibles macro
 * @returns {number} Score estimé de 0 à 1
 */
const estimateMacroFitFromKeywords = (dish, targets) => {
  const text = `${dish.name} ${dish.description} ${dish.ingredients || ''}`.toLowerCase();
  
  // Estimation basée sur les types d'aliments
  let estimatedProtein = 0;
  let estimatedCarbs = 0;
  let estimatedFat = 0;

  // Protéines
  if (text.includes('chicken') || text.includes('beef') || text.includes('fish') || 
      text.includes('tofu') || text.includes('eggs') || text.includes('legumes')) {
    estimatedProtein = 30;
  } else if (text.includes('cheese') || text.includes('yogurt') || text.includes('milk')) {
    estimatedProtein = 20;
  } else {
    estimatedProtein = 15;
  }

  // Glucides
  if (text.includes('pasta') || text.includes('rice') || text.includes('bread') || 
      text.includes('potato') || text.includes('quinoa')) {
    estimatedCarbs = 50;
  } else if (text.includes('vegetables') || text.includes('salad')) {
    estimatedCarbs = 30;
  } else {
    estimatedCarbs = 40;
  }

  // Lipides
  if (text.includes('fried') || text.includes('cream') || text.includes('butter') || 
      text.includes('oil')) {
    estimatedFat = 35;
  } else if (text.includes('grilled') || text.includes('steamed')) {
    estimatedFat = 20;
  } else {
    estimatedFat = 25;
  }

  // Normaliser à 100%
  const total = estimatedProtein + estimatedCarbs + estimatedFat;
  const pRatio = (estimatedProtein / total) * 100;
  const cRatio = (estimatedCarbs / total) * 100;
  const fRatio = (estimatedFat / total) * 100;

  let fitScore = 0;
  if (pRatio >= targets.protein[0] && pRatio <= targets.protein[1]) fitScore += 0.33;
  if (cRatio >= targets.carbs[0] && cRatio <= targets.carbs[1]) fitScore += 0.34;
  if (fRatio >= targets.fat[0] && fRatio <= targets.fat[1]) fitScore += 0.33;

  return Math.round(fitScore * 100) / 100;
};

/**
 * Calcule le fit de portion selon la faim
 * @param {object} dish - Plat
 * @param {string} hunger - 'light', 'moderate', 'hearty'
 * @returns {number} Score de 0 à 1
 */
export const calculatePortionFit = (dish, hunger) => {
  // Mapper la faim aux tailles de portion
  const hungerToPortion = {
    light: 'small',
    moderate: 'medium',
    hearty: 'large'
  };

  const preferredPortion = hungerToPortion[hunger];
  
  // Déterminer la taille de portion du plat
  let dishPortion = 'medium'; // Par défaut
  
  if (dish.portionSize) {
    dishPortion = dish.portionSize;
  } else {
    // Estimation basée sur le prix et les mots-clés
    const text = `${dish.name} ${dish.description}`.toLowerCase();
    const price = dish.price || 0;
    
    if (price > 20 || text.includes('large') || text.includes('big') || text.includes('hearty')) {
      dishPortion = 'large';
    } else if (price < 12 || text.includes('small') || text.includes('light') || text.includes('appetizer')) {
      dishPortion = 'small';
    }
  }

  // Calculer le score de fit
  if (dishPortion === preferredPortion) return 1;
  if ((dishPortion === 'small' && preferredPortion === 'medium') || 
      (dishPortion === 'large' && preferredPortion === 'medium') ||
      (dishPortion === 'medium' && (preferredPortion === 'small' || preferredPortion === 'large'))) {
    return 0.5;
  }
  return 0;
};

/**
 * Calcule le score de match des sources de protéines
 * @param {object} dish - Plat
 * @param {object} profile - Profil utilisateur
 * @returns {number} Score de 0 à 1
 */
export const calculateProteinSourceMatch = (dish, profile) => {
  if (!profile.preferredProteinSources || profile.preferredProteinSources.length === 0) {
    return 0.5; // Neutre si pas de préférences
  }

  const text = `${dish.name} ${dish.description} ${dish.ingredients || ''}`.toLowerCase();
  
  let matchCount = 0;
  profile.preferredProteinSources.forEach(protein => {
    if (text.includes(protein.toLowerCase())) {
      matchCount++;
    }
  });

  return Math.round((matchCount / profile.preferredProteinSources.length) * 100) / 100;
};

/**
 * Calcule le score de match des préférences gustatives
 * @param {object} dish - Plat
 * @param {object} profile - Profil utilisateur
 * @returns {number} Score de 0 à 1
 */
export const calculateTasteMatch = (dish, profile) => {
  if (!profile.tasteAndPrepPreferences || profile.tasteAndPrepPreferences.length === 0) {
    return 0.5; // Neutre si pas de préférences
  }

  const text = `${dish.name} ${dish.description} ${dish.ingredients || ''}`.toLowerCase();
  
  let matchCount = 0;
  let totalPreferences = 0;

  profile.tasteAndPrepPreferences.forEach(pref => {
    totalPreferences++;
    
    if (pref === 'prefer_grilled' && text.includes('grilled')) {
      matchCount++;
    } else if (pref === 'prefer_spicy' && text.includes('spicy')) {
      matchCount++;
    } else if (pref === 'love_pasta' && text.includes('pasta')) {
      matchCount++;
    } else if (pref === 'avoid_fried' && !text.includes('fried')) {
      matchCount++;
    } else if (pref === 'avoid_spicy' && !text.includes('spicy')) {
      matchCount++;
    }
  });

  return Math.round((matchCount / totalPreferences) * 100) / 100;
};

/**
 * Calcule l'alignement avec les objectifs
 * @param {object} dish - Plat
 * @param {object} profile - Profil utilisateur
 * @returns {number} Score de 0 à 1
 */
export const calculateGoalAlignment = (dish, profile) => {
  if (!profile.goal) return 0.5;

  const text = `${dish.name} ${dish.description} ${dish.ingredients || ''}`.toLowerCase();
  
  switch (profile.goal) {
    case 'lose':
      // Privilégier les plats légers, faibles en calories
      if (text.includes('salad') || text.includes('grilled') || text.includes('steamed')) {
        return 0.8;
      } else if (text.includes('fried') || text.includes('cream') || text.includes('cheese')) {
        return 0.2;
      }
      return 0.5;
      
    case 'gain':
      // Privilégier les plats riches en calories et protéines
      if (text.includes('beef') || text.includes('chicken') || text.includes('pasta')) {
        return 0.8;
      } else if (text.includes('salad') || text.includes('light')) {
        return 0.3;
      }
      return 0.5;
      
    case 'maintain':
    default:
      return 0.5; // Neutre pour le maintien
  }
};

/**
 * Calcule les garde-fous de santé
 * @param {object} dish - Plat
 * @param {object} profile - Profil utilisateur
 * @returns {number} Score de 0 à 1 (0 = problème, 1 = bon)
 */
export const calculateHealthGuardrails = (dish, profile) => {
  if (!profile.healthFlags || profile.healthFlags.length === 0) {
    return 1; // Pas de contraintes de santé
  }

  const text = `${dish.name} ${dish.description} ${dish.ingredients || ''}`.toLowerCase();
  let healthScore = 1;

  profile.healthFlags.forEach(flag => {
    switch (flag) {
      case 'diabetes':
        if (text.includes('sugar') || text.includes('sweet') || text.includes('dessert')) {
          healthScore *= 0.7; // Réduire le score pour les plats sucrés
        }
        break;
      case 'hypertension':
        if (text.includes('salt') || text.includes('sodium') || text.includes('cured')) {
          healthScore *= 0.7; // Réduire le score pour les plats salés
        }
        break;
      case 'high_cholesterol':
        if (text.includes('fried') || text.includes('cream') || text.includes('butter')) {
          healthScore *= 0.6; // Réduire davantage pour les plats riches en graisses
        }
        break;
      case 'ibs_sensitive':
        if (text.includes('spicy') || text.includes('onion') || text.includes('garlic')) {
          healthScore *= 0.8; // Réduire pour les plats irritants
        }
        break;
    }
  });

  return Math.round(healthScore * 100) / 100;
};

/**
 * Calcule le score principal d'un plat avec scoring brut 0-100
 * @param {object} dish - Plat
 * @param {object} profile - Profil utilisateur
 * @param {object} context - Contexte d'analyse { hunger, timing }
 * @returns {object} Score brut et sous-scores détaillés
 */
export const scoreItem = (dish, profile, context) => {
  const { hunger = 'moderate', timing = 'regular' } = context;
  
  // Obtenir les cibles macro
  const macroTargets = getMacroTargets(timing);
  
  // Calculer tous les sous-scores
  const macroFit = calculateMacroFit(dish, macroTargets);
  const portionFit = calculatePortionFit(dish, hunger);
  const proteinSourceMatch = calculateProteinSourceMatch(dish, profile);
  const tasteMatch = calculateTasteMatch(dish, profile);
  const goalAlignment = calculateGoalAlignment(dish, profile);
  const healthGuardrails = calculateHealthGuardrails(dish, profile);
  
  // Calculer le score brut (0-100)
  const rawScore = 100 * (
    0.25 * macroFit +
    0.15 * portionFit +
    0.15 * proteinSourceMatch +
    0.15 * tasteMatch +
    0.15 * goalAlignment +
    0.15 * healthGuardrails
  );
  
  // Générer les raisons pour les badges
  const reasons = [];
  
  if (macroFit > 0.7) {
    if (timing === 'pre_workout') reasons.push('Great pre-workout balance');
    else if (timing === 'post_workout') reasons.push('Great post-workout balance');
    else reasons.push('Balanced macros');
  }
  
  if (portionFit === 1) {
    reasons.push('Portion fits hunger');
  }
  
  if (proteinSourceMatch > 0.7) {
    reasons.push('High protein');
  }
  
  if (tasteMatch > 0.7) {
    if (profile.tasteAndPrepPreferences?.includes('prefer_grilled')) reasons.push('Grilled not fried');
    if (profile.tasteAndPrepPreferences?.includes('love_pasta')) reasons.push('Pasta lover');
  }
  
  // Ajouter des raisons contextuelles
  if (hunger === 'hearty' && portionFit > 0.5) {
    reasons.push('Substantial portion');
  } else if (hunger === 'light' && portionFit > 0.5) {
    reasons.push('Light portion');
  }
  
  if (timing === 'post_workout' && macroFit > 0.6) {
    reasons.push('Post-workout recovery');
  }
  
  return {
    raw: Math.round(rawScore),
    subscores: {
      macroFit,
      portionFit,
      proteinSourceMatch,
      tasteMatch,
      goalAlignment,
      healthGuardrails
    },
    reasons: reasons.slice(0, 3) // Maximum 3 raisons
  };
};

/**
 * Normalise les scores bruts vers l'échelle 1-10 avec logique de fallback
 * @param {Array} scoredItems - Items avec scores bruts
 * @param {object} options - { floor = 1, ceil = 10 }
 * @returns {Array} Items avec scores normalisés et flag fallback
 */
export const normalizeToTen = (scoredItems, { floor = 1, ceil = 10 } = {}) => {
  if (!scoredItems || scoredItems.length === 0) {
    return [];
  }

  // Extraire les scores bruts
  const rawScores = scoredItems.map(item => item.raw);
  const maxRawScore = Math.max(...rawScores);
  const minRawScore = Math.min(...rawScores);

  console.log(`📊 Raw scores: min=${minRawScore}, max=${maxRawScore}`);

  // Déterminer si le mode fallback est nécessaire
  let fallbackMode = false;
  let processedScores = [...scoredItems];

  if (maxRawScore < 60 || maxRawScore === 0) {
    console.log('⚠️ Fallback mode triggered: max raw score < 60');
    fallbackMode = true;
    
    // Appliquer la relaxation douce
    processedScores = processedScores.map(item => {
      let adjustedRaw = item.raw * 0.8; // Multiplier par 0.8
      
      // Ajouter des bonus de similarité basés sur les préférences douces
      const text = `${item.name} ${item.description} ${item.ingredients || ''}`.toLowerCase();
      
      // Bonus pour la méthode de cuisson
      if (item.subscores?.tasteMatch > 0.6) {
        adjustedRaw += 10;
        console.log(`✅ ${item.item?.name || 'Unknown dish'} gets +10 cooking method bonus`);
      }
      
      // Bonus pour les protéines préférées
      if (item.subscores?.proteinSourceMatch > 0.6) {
        adjustedRaw += 8;
        console.log(`✅ ${item.item?.name || 'Unknown dish'} gets +8 preferred protein bonus`);
      }
      
      // Bonus pour la cuisine préférée
      if (item.subscores?.tasteMatch > 0.5) {
        adjustedRaw += 6;
        console.log(`✅ ${item.item?.name || 'Unknown dish'} gets +6 cuisine preference bonus`);
      }
      
      return { ...item, raw: Math.max(0, adjustedRaw) };
    });
    
    // Mettre à jour les scores bruts après ajustement
    const adjustedRawScores = processedScores.map(item => item.raw);
    const newMaxRawScore = Math.max(...adjustedRawScores);
    console.log(`🔄 After soft relaxation: max raw score = ${newMaxRawScore}`);
  }

  // Normaliser vers l'échelle [floor, ceil]
  const finalScores = processedScores.map(item => {
    let normalizedScore;
    
    if (maxRawScore === minRawScore) {
      // Tous les scores sont identiques
      normalizedScore = (floor + ceil) / 2;
    } else {
      // Normalisation min-max
      normalizedScore = floor + ((item.raw - minRawScore) / (maxRawScore - minRawScore)) * (ceil - floor);
    }
    
    // S'assurer qu'aucun score n'est inférieur au floor
    if (normalizedScore < floor) {
      normalizedScore = floor;
    }
    
    return {
      ...item,
      score: Math.round(normalizedScore * 10) / 10, // Arrondir à 1 décimale
      fallbackMode
    };
  });

  // Marquer le lot comme étant en mode fallback si nécessaire
  if (fallbackMode) {
    finalScores.__fallback = true;
  }

  console.log(`📈 Normalized scores: ${finalScores.map(i => i.score).join(', ')}`);
  
  return finalScores;
};

/**
 * Classe et retourne les recommandations avec gestion du fallback
 * @param {Array} safeItems - Items sûrs après pre-filter
 * @param {object} profile - Profil utilisateur
 * @param {object} context - Contexte d'analyse
 * @returns {object} { top3, all, fallback }
 */
export const rankRecommendations = (safeItems, profile, context) => {
  if (!safeItems || safeItems.length === 0) {
    return { top3: [], all: [], fallback: false };
  }

  console.log(`🏆 Ranking ${safeItems.length} safe items...`);

  // Scorer tous les items
  const scored = safeItems.map(item => ({
    item,
    ...scoreItem(item, profile, context)
  }));

  // Normaliser les scores vers 1-10
  const withScores = normalizeToTen(scored, { floor: 1, ceil: 10 });

  // Trier par score décroissant et prendre le top 3
  const sorted = withScores.sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

  // Vérifier si le mode fallback a été activé
  const fallback = withScores.__fallback === true;

  console.log(`🏆 Top 3 recommendations:`, top3.map(d => ({ name: d.item.name, score: d.score })));
  console.log(`🔄 Fallback mode: ${fallback}`);

  return {
    top3,
    all: withScores,
    fallback
  };
};

/**
 * Filtre et score les plats selon le profil et le contexte (version améliorée)
 * @param {Array} dishes - Liste des plats
 * @param {object} profile - Profil utilisateur
 * @param {object} context - Contexte d'analyse
 * @returns {object} Résultats filtrés et scorés
 */
export const filterAndScoreDishes = (dishes, profile, context) => {
  if (!dishes || !Array.isArray(dishes)) {
    return { filteredDishes: [], fallback: false };
  }

  console.log('🔍 Filtering and scoring dishes:', { dishesCount: dishes.length, profile, context });

  // 1. Appliquer le pre-filter avec contraintes dures
  const { safe, rejected } = preFilter(dishes, profile);
  
  if (safe.length === 0) {
    console.log('❌ No safe dishes found after hard constraints');
    return { filteredDishes: [], fallback: false };
  }

  // 2. Classer les recommandations avec gestion du fallback
  const rankingResult = rankRecommendations(safe, profile, context);

  // 3. Préparer la réponse finale
  const finalDishes = rankingResult.top3.map(item => ({
    ...item.item,
    score: item.score,
    reasons: item.reasons || [],
    subscores: item.subscores || {}
  }));

  return {
    filteredDishes: finalDishes,
    fallback: rankingResult.fallback,
    debug: {
      contextUsed: context,
      targetsUsed: getMacroTargets(context.timing),
      filteredOutCount: rejected.length,
      fallback: rankingResult.fallback,
      preFilterResults: { safe: safe.length, rejected: rejected.length }
    }
  };
};
