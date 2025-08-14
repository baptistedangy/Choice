// Test du fallback avec un profil très restrictif
// Simule le profil de l'utilisateur avec beaucoup de contraintes

import { filterAndScoreDishes } from './src/services/recommender.js';

// Profil très restrictif (comme celui de l'utilisateur)
const restrictiveProfile = {
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  goal: 'maintain',
  dietaryPreferences: ['vegetarian'], // Végétarien
  allergies: ['eggs'], // Allergie aux œufs
  dietaryLaws: 'halal', // Lois alimentaires halal
  preferredProteinSources: ['fish'], // Préfère le poisson
  tasteAndPrepPreferences: [], // Pas de préférences spécifiques
  healthFlags: ['diabetes'] // Considérations de santé
};

// Menu avec des plats qui vont scorer très bas avec ce profil
const challengingMenu = [
  {
    name: 'I\'M ON A DATE QUESADILLA V',
    description: 'Champignons de saison, mozzarella, cheddar, crème jalapeño, pickles d\'oignons, parmesan, salade de jeunes pousses et grenades.',
    price: 13.50,
    calories: 380,
    macros: { protein: 18, carbs: 28, fat: 22 }
  },
  {
    name: 'TIGERMILK CEVICHE GF',
    description: 'El único. Lieu noir cru, leche de tigre au lait de coco, mangue, grenade, coriandre fraîche, pickles d\'oignons rouges, patates douces rôties.',
    price: 14.50,
    calories: 280,
    macros: { protein: 22, carbs: 18, fat: 12 }
  },
  {
    name: 'AMARILLO GF',
    description: 'Un ceviche vraiment loco loco! On a pris du Lieu noir cru que l\'on a fait mariner dans un leche de tigre twisté à l\'aji amarillo dont tu te souviendras longtemps, une crème d\'avocat pour la douceur, des petites noisettes croquantes, grenade, patates douces rôties et coriandre fraîche.',
    price: 15.00,
    calories: 320,
    macros: { protein: 25, carbs: 22, fat: 15 }
  }
];

console.log('🧪 Test du fallback avec profil très restrictif');
console.log('📋 Profil utilisateur:', {
  dietaryPreferences: restrictiveProfile.dietaryPreferences,
  allergies: restrictiveProfile.allergies,
  dietaryLaws: restrictiveProfile.dietaryLaws,
  healthFlags: restrictiveProfile.healthFlags
});

console.log('\n🍽️ Menu à analyser:', challengingMenu.length, 'plats');
challengingMenu.forEach((dish, index) => {
  console.log(`  ${index + 1}. ${dish.name} - ${dish.description.substring(0, 50)}...`);
});

// Test avec contexte modéré
const context = { hunger: 'moderate', timing: 'regular' };

console.log('\n🔍 Analyse avec profil restrictif...');
const result = filterAndScoreDishes(challengingMenu, restrictiveProfile, context);

console.log('\n📊 Résultats:');
console.log(`  Fallback mode: ${result.fallback ? '✅ DÉCLENCHÉ' : '❌ Non déclenché'}`);
console.log(`  Plats recommandés: ${result.filteredDishes.length}`);
console.log(`  Plats filtrés: ${result.debug.filteredOutCount}`);

console.log('\n🏆 Recommandations finales:');
result.filteredDishes.forEach((dish, index) => {
  console.log(`  ${index + 1}. ${dish.name}`);
  console.log(`     Score: ${dish.score}/10`);
  console.log(`     Price: ${dish.price}€`);
  console.log(`     Calories: ${dish.calories} kcal`);
  if (dish.macros) {
    console.log(`     Macros: P${dish.macros.protein}g C${dish.macros.carbs}g F${dish.macros.fat}g`);
  }
  if (dish.reasons && dish.reasons.length > 0) {
    console.log(`     Raisons: ${dish.reasons.join(', ')}`);
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

if (result.fallback) {
  console.log('\n🎉 SUCCÈS: Le mode fallback a été déclenché !');
  console.log('  • Les scores ont été ajustés pour garantir ≥ 1.0/10');
  console.log('  • Les préférences douces ont été relâchées');
  console.log('  • Les contraintes dures restent respectées');
} else {
  console.log('\n⚠️ Le mode fallback n\'a pas été déclenché');
  console.log('  • Les scores bruts étaient probablement ≥ 60');
  console.log('  • Aucun ajustement n\'était nécessaire');
}

console.log('\n✅ Test terminé !');
console.log('\n🎯 Résumé:');
console.log('  • Avec un profil très restrictif, le système doit déclencher le fallback');
console.log('  • Les scores doivent être ajustés pour garantir ≥ 1.0/10');
console.log('  • Les recommandations doivent être les "closest safe options"');
console.log('  • L\'interface doit afficher la bannière de fallback');
