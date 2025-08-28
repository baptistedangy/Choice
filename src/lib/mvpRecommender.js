// MVP Recommender - Local scoring without AI dependencies
// Categories: Recovery, Healthy, Comforting

// Extended keyword dictionaries (French + English)
const KW = {
  protein: [
    'chicken','turkey','beef','lamb','pork','salmon','tuna','cod','seabass',
    'shrimp','prawns','seafood','tofu','tempeh','seitan','eggs','lentils',
    'chickpeas','beans','edamame','quinoa',
    // FR
    'poulet','dinde','boeuf','agneau','porc','saumon','thon','cabillaud','bar',
    'crevettes','fruits de mer','tofu','tempeh','seitan','oeuf','lentilles',
    'pois chiches','haricots','edamame','quinoa'
  ],
  grilled: [
    'grilled','roasted','baked','oven','seared','plancha',
    'rôti','grillé','au four','poêlé','plancha','braisé'
  ],
  fried: [
    'fried','breaded','tempura',
    'frit','pané','beignet'
  ],
  creamy: [
    'cream','creamy','cheese','cheesy','butter','béchamel',
    'crème','fromage','beurre'
  ],
  vegForward: [
    'salad','bowl','quinoa','couscous','tabbouleh','roasted vegetables','hummus',
    'avocado','olive oil','zucchini','eggplant','greens','spinach','kale','poke',
    // FR
    'salade','bol','quinoa','couscous','taboulé','légumes rôtis','houmous',
    'avocat','huile d\'olive','courgette','aubergine','verts','épinards','poke'
  ],
  light: [
    'light','fresh','seasonal',
    'léger','frais','de saison'
  ],
  indulgent: [
    'fried','crispy','creamy','cheesy','buttery','bbq','burger','pizza','pasta',
    'lasagna','gratin','ribs','stew','braised','mayo','béchamel','quesadilla','birria',
    // FR
    'frit','croquant','crémeux','fromage','beurre','burger','pizza','pâtes',
    'lasagnes','gratin','ribs','ragout','braisé','mayo','béchamel','quesadilla'
  ]
};

// Utility functions
function hasAny(text, arr) { 
  return arr.some(k => text.includes(k)); 
}

function clamp(n, min, max) { 
  return Math.min(max, Math.max(min, n)); 
}

function normalizeDish(dish, idx) {
  const title = String(dish?.title || dish?.name || `Dish ${idx + 1}`).trim();
  const description = String(dish?.description || dish?.desc || '').trim();

  let priceNum = null;
  try {
    const priceStr = (dish?.price ?? '').toString();
    if (priceStr) {
      const cleaned = priceStr.replace(/[€$]/g, '').replace(',', '.');
      const match = cleaned.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        const parsed = parseFloat(match[1]);
        if (isFinite(parsed)) priceNum = parsed;
      }
    }
  } catch {}

  const text = `${title} ${description}`.toLowerCase();
  return {
    ...dish,
    title,
    description,
    price: priceNum,
    text,
    _idx: idx
  };
}

// Category scorers with refined label inference
function scoreRecovery(text) {
  let s = 0, reasons = [];
  
  // Recovery applies only if explicit protein keywords are present
  const hasProtein = hasAny(text, KW.protein);
  const hasCookingMethod = hasAny(text, KW.grilled) || text.includes('protein') || text.includes('protéine');
  
  // Do not set Recovery if clearly indulgent
  const isIndulgent = hasAny(text, ['burger', 'ribs', 'fried', 'crispy', 'creamy', 'cheesy', 'mayo', 'béchamel']);
  
  if (hasProtein && hasCookingMethod && !isIndulgent) {
    s += 2; 
    reasons.push('protéine principale');
    if (hasAny(text, KW.grilled)) reasons.push('grillé/rôti');
  }
  
  // Cap penalties/bonuses to prevent extreme scores
  s = Math.max(-2, Math.min(3, s));
  return { s, reasons };
}

function scoreHealthy(text) {
  let s = 0, reasons = [];
  
  // Healthy applies if veg/mediterranean/light cues present and indulgent cues absent
  const hasVegCues = hasAny(text, KW.vegForward);
  const hasLightCues = hasAny(text, KW.light);
  const hasIndulgentCues = hasAny(text, KW.indulgent);
  
  if (hasVegCues && !hasIndulgentCues) {
    s += 2; 
    reasons.push('orienté légumes/bol');
  }
  if (hasLightCues && !hasIndulgentCues) {
    s += 1; 
    reasons.push('léger/frais');
  }
  
  // Cap penalties/bonuses to prevent extreme scores
  s = Math.max(-2, Math.min(3, s));
  return { s, reasons };
}

function scoreComforting(text) {
  let s = 0, reasons = [];
  
  // Comforting applies if indulgent markers present
  const hasIndulgent = hasAny(text, KW.indulgent);
  
  if (hasIndulgent) {
    s += 2; 
    reasons.push('réconfort/indulgent');
    if (hasAny(text, KW.creamy)) reasons.push('crémeux/fromagé');
  }
  
  // Cap penalties/bonuses to prevent extreme scores
  s = Math.max(-2, Math.min(3, s));
  return { s, reasons };
}

// Main scoring function
export function scoreAndLabel(dishes = []) {
  try {
    // Normalize first
    const normalized = Array.isArray(dishes) ? dishes.map((d, i) => normalizeDish(d, i)) : [];

    // Score every dish
    const scored = normalized.map((d) => {
      const r = scoreRecovery(d.text);
      const h = scoreHealthy(d.text);
      const c = scoreComforting(d.text);

      // Priority rule for label assignment (only one label per dish):
      // Recovery > Healthy > Comforting
      let label, reasons, score;
      const base = 5;
      
      if (r.s > 0) {
        // Recovery hit
        label = 'Recovery';
        reasons = [...r.reasons, 'protein-focused'];
        score = clamp(Math.round(base + r.s + 0.5), 1, 10);
      } else if (h.s > 0) {
        // Healthy hit
        label = 'Healthy';
        reasons = [...h.reasons, 'veg-forward / lighter prep'];
        score = clamp(Math.round(base + h.s + 0.5), 1, 10);
      } else if (c.s > 0) {
        // Comforting hit
        label = 'Comforting';
        reasons = [...c.reasons, 'indulgent / richer prep'];
        score = clamp(Math.round(base + c.s + 0.5), 1, 10);
      } else {
        // Default fallback
        label = 'Healthy';
        reasons = ['balanced option'];
        score = base;
      }

      // Limit reasons to 3
      reasons = Array.from(new Set(reasons)).slice(0, 3);

      return {
        ...d,
        score,
        label,
        reasons,
        debug: {
          catScores: { Recovery: r.s, Healthy: h.s, Comforting: c.s },
          idx: d._idx
        }
      };
    });

    // Sort by score desc, then alphabetically for stability
    scored.sort((a, b) => (b.score - a.score) || a.title.localeCompare(b.title));

    // Build category buckets for balanced selection
    const byLabel = { Recovery: [], Healthy: [], Comforting: [] };
    
    // Push each item into its label bucket (only if label is set)
    scored.forEach(item => {
      if (item.label && byLabel[item.label]) {
        byLabel[item.label].push(item);
      }
    });

    // Sort each bucket desc by score
    Object.keys(byLabel).forEach(label => {
      byLabel[label].sort((a, b) => b.score - a.score);
    });

    // Start top3 with at most one item from each label in priority order
    const top3 = [];
    const usedTitles = new Set();
    const usedLabels = new Set();
    
    // Priority: Recovery > Healthy > Comforting
    ['Recovery', 'Healthy', 'Comforting'].forEach(label => {
      if (byLabel[label].length > 0 && top3.length < 3 && !usedLabels.has(label)) {
        const item = byLabel[label][0];
        top3.push(item);
        usedTitles.add(item.title.toLowerCase().trim());
        usedLabels.add(label);
      }
    });

    // If top3.length < 3, fill remaining from global scored (sorted desc)
    // while skipping any already chosen titles and labels
    for (const item of scored) {
      if (top3.length >= 3) break;
      
      const normalizedTitle = item.title.toLowerCase().trim();
      if (!usedTitles.has(normalizedTitle) && !usedLabels.has(item.label)) {
        top3.push(item);
        usedTitles.add(normalizedTitle);
        usedLabels.add(item.label);
      }
    }

    // Guarantee top3 has up to 3 unique dishes
    // If not enough dishes overall, duplicate the last one with " (Alt)" suffix
    // BUT assign a different label to avoid category duplication
    while (top3.length < 3 && scored.length > 0) {
      const last = scored[scored.length - 1];
      
      // Find an available label that's not used yet
      const availableLabels = ['Recovery', 'Healthy', 'Comforting'].filter(
        label => !usedLabels.has(label)
      );
      
      // Use first available label, or fallback to 'Other'
      const newLabel = availableLabels.length > 0 ? availableLabels[0] : 'Other';
      
      top3.push({ 
        ...last, 
        title: `${last.title} (Alt)`,
        // Assign different label to avoid duplication
        label: newLabel,
        score: Math.max(1, last.score - 1), // Slightly lower score for alt
        reasons: [`${newLabel.toLowerCase()} alternative`]
      });
      
      // Mark this label as used
      usedLabels.add(newLabel);
    }

    // Debug log for balanced selection
    console.debug('[MVP] top3 balanced:', top3.map(x => ({
      title: x.title, 
      label: x.label, 
      score: x.score
    })));

    return {
      top3: top3.slice(0, 3),
      all: scored
    };
  } catch (e) {
    console.error('[MVP] scoreAndLabel error', e);
    return { top3: [], all: [] };
  }
}
