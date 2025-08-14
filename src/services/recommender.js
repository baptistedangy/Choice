// Service de recommandation avancé avec scoring contextuel
// Prend en compte la faim, le timing et le profil utilisateur

// ---- Scoring constants
export const SCORE_WEIGHTS = {
  macroFit: 0.35,
  portionFit: 0.10,
  proteinSourceMatch: 0.20,
  tasteMatch: 0.15,
  goalAlignment: 0.10,
  healthGuardrails: 0.10
};
export const FALLBACK_TRIGGER_MAX_RAW = 60; // si max<60, on relaxe
export const SCORE_FLOOR = 1;
export const SCORE_CEIL = 10;

const mapGoal = (g) => (g === 'lose weight' || g === 'lose') ? 'lose' : (g === 'gain' ? 'gain' : 'maintain');

// Convertit {protein|protein_g, carbs|carbs_g, fat|fats|fat_g} en ratios %
const asRatios = (macros) => {
  if (!macros) return null;
  const p = Number(macros.protein ?? macros.protein_g ?? 0);
  const c = Number(macros.carbs ?? macros.carbs_g ?? 0);
  const f = Number(macros.fat ?? macros.fats ?? macros.fat_g ?? 0);
  const sum = p + c + f;
  if (!sum) return null;
  return { p: (p / sum) * 100, c: (c / sum) * 100, f: (f / sum) * 100 };
};

/**
 * Filtre préliminaire avec contraintes dures uniquement
 * @param {Array} items - Liste des plats à filtrer
 * @param {object} profile - Profil utilisateur
 * @returns {object} { safe: Array, rejected: Array }
 */
export const preFilter = (items, profile) => {
  if (!Array.isArray(items)) return { safe: [], rejected: [], hardFilteredAll:false };
  const safe = [], rejected = [];

  // dictionaries
  const ALLERGY_MAP = {
    egg: ['egg','eggs','oeuf','oeufs','huevo','mayonnaise','mayo'],
    nuts: ['nut','nuts','noisette','noisettes','almond','noix','walnut','cajou','pistache','hazelnut'],
    gluten: ['bread','bun','pain','pasta','pizza','flour','farine'],
    dairy: ['cheese','fromage','milk','lait','cream','crème','butter','beurre','yogurt','yaourt'],
    soy: ['soy','soja','tofu','tempeh'],
    shellfish: ['shrimp','prawn','crevette','crab','crabe','lobster','homard','mussel','clam','oyster']
  };
  const containsAny = (t, arr) => arr.some(w => t.includes(w));

  items.forEach(item => {
    const txt = `${item.name||''} ${item.description||''} ${item.ingredients||''}`.toLowerCase();
    let reject = false, reason='';

    // 1) allergies (hard)
    if (Array.isArray(profile.allergies) && profile.allergies.length) {
      for (const a of profile.allergies) {
        const keys = ALLERGY_MAP[a] || [a.toLowerCase()];
        if (containsAny(txt, keys)) { reject=true; reason=`Contains allergen: ${a}`; break; }
      }
    }

    // 2) dietary laws (hard)
   if (!reject && profile.dietaryLaws && profile.dietaryLaws!=='none') {
      const hasPork = containsAny(txt, ['pork','porc','cochon','bacon','lardon','jamon']);
      if (hasPork && (profile.dietaryLaws==='halal' || profile.dietaryLaws==='kosher')) {
        reject=true; reason = `Not ${profile.dietaryLaws} compliant (pork)`;
      }
    }

    // 3) base diet (hard, but only when confidently detected)
    if (!reject && Array.isArray(profile.dietaryPreferences) && profile.dietaryPreferences.length) {
      const veg = profile.dietaryPreferences.includes('vegetarian');
      const vegan = profile.dietaryPreferences.includes('vegan');
      const meatWords = ['beef','boeuf','steak','chicken','poulet','pollo','pork','porc','lamb','agneau','ribs','costillas','jamon','ham','turkey','thon','tuna','salmon','saumon','fish','poisson'];
      const dairyEggWords = ['cheese','fromage','milk','lait','cream','crème','butter','beurre','egg','oeuf','huevo','yogurt','yaourt','mayo','mayonnaise','honey','miel'];
      if (vegan && (containsAny(txt, [...meatWords, ...dairyEggWords]))) { reject=true; reason='Not vegan'; }
      else if (veg && containsAny(txt, meatWords)) { reject=true; reason='Not vegetarian'; }
    }

    // 4) do-not-eat list (hard)
    if (!reject && Array.isArray(profile.doNotEat) && profile.doNotEat.length) {
      if (containsAny(txt, profile.doNotEat.map(x=>String(x).toLowerCase()))) {
        reject=true; reason='Contains forbidden ingredient';
      }
    }

    if (reject) rejected.push({ ...item, rejectionReason: reason });
    else safe.push(item);
  });

  const hardFilteredAll = safe.length===0 && items.length>0;
  return { safe, rejected, hardFilteredAll };
};

export const getMacroTargets = (timing) => {
  switch (timing) {
    case 'pre_workout':  return { protein: [15, 25], carbs: [50, 65], fat: [15, 25] };
    case 'post_workout': return { protein: [30, 40], carbs: [30, 45], fat: [20, 30] };
    default:             return { protein: [25, 35], carbs: [35, 45], fat: [25, 35] };
  }
};

const estimateMacroRatiosFromKeywords = (dish) => {
  const t = `${dish.name || dish.title || ''} ${dish.description || ''} ${dish.ingredients || ''}`.toLowerCase();
  let P = 33, C = 34, F = 33; // baseline équilibrée
  if (/(chicken|beef|fish|tofu|legumes?|eggs?)/.test(t)) P += 7;
  if (/(pasta|rice|bread|potato|quinoa|tortilla|bun)/.test(t)) C += 10;
  if (/(fried|cream|butter|oil|cheese|mayo|avocado)/.test(t)) F += 8;
  const S = P + C + F; return { p: (P / S) * 100, c: (C / S) * 100, f: (F / S) * 100 };
};

export const calculateMacroFit = (dish, targets) => {
  const ratios = asRatios(dish.macros) ?? estimateMacroRatiosFromKeywords(dish);
  const inRange = (x, [lo, hi]) => x >= lo && x <= hi;
  let fit = 0;
  if (inRange(ratios.p, targets.protein)) fit += 0.33;
  if (inRange(ratios.c, targets.carbs))   fit += 0.33;
  if (inRange(ratios.f, targets.fat))     fit += 0.34;
  return Math.round(fit * 100) / 100; // 0..1
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
