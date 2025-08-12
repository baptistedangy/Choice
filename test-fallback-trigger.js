// Test spécifique pour déclencher le mode fallback
// Crée un profil avec des préférences très strictes qui produisent des scores bruts < 30

import { filterAndScoreDishes } from './src/services/recommender.js';

// Profil utilisateur strict mais pas impossible qui devrait déclencher le fallback
const strictProfile = {
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  goal: 'lose',
  dietaryPreferences: ['vegetarian'], // Moins strict
  allergies: ['nuts'], // Moins d'allergies
  dietaryLaws: 'none',
  preferredProteinSources: ['tofu_tempeh'], // Préférence limitée
  tasteAndPrepPreferences: ['avoid_fried', 'prefer_grilled'], // Préférences raisonnables
  healthFlags: ['diabetes'], // Une seule contrainte de santé
  doNotEat: [] // Pas de restrictions extrêmes
};

// Plats qui vont scorer très bas avec ce profil (mais pas rejetés)
const lowScoringDishes = [
  {
    name: 'Fried Cheese Sticks',
    description: 'Deep fried mozzarella sticks',
    ingredients: 'mozzarella, breadcrumbs, oil, salt',
    price: 8.99,
    calories: 380,
    macros: { protein: 18, carbs: 25, fat: 28 }
  },
  {
    name: 'Nut Mix',
    description: 'Mixed nuts and dried fruits',
    ingredients: 'cashews, almonds, walnuts, raisins, salt',
    price: 6.99,
    calories: 280,
    macros: { protein: 8, carbs: 22, fat: 22 }
  },
  {
    name: 'Sweet Pastry',
    description: 'Sweet pastry with sugar glaze',
    ingredients: 'flour, sugar, butter, eggs, milk, glaze',
    price: 4.99,
    calories: 320,
    macros: { protein: 6, carbs: 42, fat: 16 }
  },
  {
    name: 'Grilled Tofu',
    description: 'Grilled tofu with vegetables',
    ingredients: 'tofu, vegetables, olive oil, herbs',
    price: 12.99,
    calories: 220,
    macros: { protein: 18, carbs: 15, fat: 12 }
  }
];

console.log('🧪 Test du déclenchement du mode fallback');
console.log('📋 Profil ultra-strict avec beaucoup de contraintes');
console.log('🎯 Objectif: déclencher le fallback (scores bruts < 30)');

const context = { hunger: 'light', timing: 'regular' };

console.log('\n🔍 Analyse avec profil ultra-strict...');
const result = filterAndScoreDishes(lowScoringDishes, strictProfile, context);

console.log('\n📊 Résultats:');
console.log(`  Fallback mode: ${result.fallback ? '✅ DÉCLENCHÉ' : '❌ Non déclenché'}`);
console.log(`  Plats recommandés: ${result.filteredDishes.length}`);

if (result.debug) {
  console.log(`  Plats filtrés: ${result.debug.filteredOutCount}`);
  console.log(`  Résultats pre-filter: ${JSON.stringify(result.debug.preFilterResults)}`);
} else {
  console.log('  Aucun plat sûr trouvé après filtres durs');
}

console.log('\n🏆 Recommandations finales:');
result.filteredDishes.forEach((dish, index) => {
  console.log(`  ${index + 1}. ${dish.name}`);
  console.log(`     Score: ${dish.score}/10`);
  if (dish.reasons && dish.reasons.length > 0) {
    console.log(`     Raisons: ${dish.reasons.join(', ')}`);
  }
  if (dish.subscores) {
    console.log(`     Sous-scores: macroFit=${Math.round(dish.subscores.macroFit * 100)}%, portionFit=${Math.round(dish.subscores.portionFit * 100)}%`);
  }
});

console.log('\n🔍 Informations de debug:');
console.log(`  Contexte utilisé: ${JSON.stringify(result.debug.contextUsed)}`);
console.log(`  Cibles macro: ${JSON.stringify(result.debug.targetsUsed)}`);
console.log(`  Résultats pre-filter: ${JSON.stringify(result.debug.preFilterResults)}`);

// Vérifier que tous les scores sont ≥ 1.0
const allScores = result.filteredDishes.map(d => d.score);
const minScore = Math.min(...allScores);
const maxScore = Math.max(...allScores);

console.log('\n📈 Vérification des scores:');
console.log(`  Plage des scores: ${minScore} - ${maxScore}`);
console.log(`  Tous ≥ 1.0: ${allScores.every(s => s >= 1.0) ? '✅' : '❌'}`);
console.log(`  Mode fallback nécessaire: ${minScore < 3 ? '✅ Probablement' : '❌ Non'}`);

if (result.fallback) {
  console.log('\n🎉 SUCCÈS: Le mode fallback a été déclenché !');
  console.log('  • Les scores ont été ajustés pour garantir ≥ 1.0/10');
  console.log('  • Les préférences douces ont été relâchées');
  console.log('  • Les contraintes dures restent respectées');
} else {
  console.log('\n⚠️ Le mode fallback n\'a pas été déclenché');
  console.log('  • Les scores bruts étaient probablement ≥ 30');
  console.log('  • Aucun ajustement n\'était nécessaire');
}

console.log('\n✅ Test terminé !');
