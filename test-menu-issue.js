// Test pour reproduire le problème du menu végétarien
// Vérifie pourquoi "I'M ON A DATE QUESADILLA" n'apparaît pas et pourquoi les scores sont 0/10

import { preFilter, filterAndScoreDishes } from './src/services/recommender.js';

// Profil utilisateur végétarien (comme dans l'image)
const vegetarianProfile = {
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  goal: 'maintain',
  dietaryPreferences: ['vegetarian'], // ✅ Végétarien sélectionné
  allergies: [],
  dietaryLaws: 'none',
  preferredProteinSources: [],
  tasteAndPrepPreferences: [],
  healthFlags: []
};

// Menu réel du restaurant (basé sur l'image)
const realMenu = [
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
  },
  {
    name: 'SALMÓN MÓN MÓN GF',
    description: 'Ceviche de saumon aux suprêmes d\'orange, leche de tigre et crème jalapeños. Un peu de pickles d\'oignon rouge, de la sauce chimichurri et de la coriandre. Servi avec des patates douces rôties bien fondantes et leur mayo chipotle.',
    price: 16.00,
    calories: 290,
    macros: { protein: 24, carbs: 20, fat: 14 }
  },
  {
    name: 'I\'M ON A DATE QUESADILLA V',
    description: 'Champignons de saison, mozzarella, cheddar, crème jalapeño, pickles d\'oignons, parmesan, salade de jeunes pousses et grenades.',
    price: 13.50,
    calories: 380,
    macros: { protein: 18, carbs: 28, fat: 22 }
  },
  {
    name: 'COCHINITA PIBIL QUESADILLA',
    description: 'Cochinita Pibil c\'est un cochon bien bien bien mariné, Yucatan style, posé sur du cheese. That\'s it. Mais qu\'est ce que c\'est bon! Servie avec une petite salade de jeunes pousses et grenades.',
    price: 14.00,
    calories: 420,
    macros: { protein: 26, carbs: 25, fat: 24 }
  },
  {
    name: 'CHEESY BIRRIA QUESADILLA',
    description: 'Quesadilla au triple cheese et paleron de boeuf effiloché, mijoté longtemps et avec beaucoup d\'amour, accompagné d\'un petit bouillon de viande pour y tremper ta quesadilla toute cheesy. Un peu de coriandre pour la fraîcheur, une petite salade de jeunes pousses & grenades pour la bonne conscience.',
    price: 15.90,
    calories: 450,
    macros: { protein: 28, carbs: 26, fat: 26 }
  }
];

console.log('🧪 Test du problème du menu végétarien');
console.log('📋 Profil utilisateur:', vegetarianProfile.dietaryPreferences);
console.log('🍽️ Menu du restaurant:', realMenu.length, 'plats');

// Test 1: Pre-filter avec profil végétarien
console.log('\n🔒 Test 1: Pre-filter avec profil végétarien');
const preFilterResult = preFilter(realMenu, vegetarianProfile);

console.log(`Pre-filter results:`);
console.log(`  Safe items: ${preFilterResult.safe.length}`);
console.log(`  Rejected items: ${preFilterResult.rejected.length}`);

console.log('\nRejected items and reasons:');
preFilterResult.rejected.forEach(item => {
  console.log(`  🚫 ${item.name}: ${item.rejectionReason}`);
});

console.log('\nSafe items:');
preFilterResult.safe.forEach(item => {
  console.log(`  ✅ ${item.name}`);
});

// Test 2: Analyse complète avec scoring
console.log('\n🏆 Test 2: Analyse complète avec scoring');
const context = { hunger: 'moderate', timing: 'regular' };
const analysisResult = filterAndScoreDishes(realMenu, vegetarianProfile, context);

console.log(`Analysis results:`);
console.log(`  Fallback mode: ${analysisResult.fallback}`);
console.log(`  Final recommendations: ${analysisResult.filteredDishes.length}`);

console.log('\nFinal recommendations:');
analysisResult.filteredDishes.forEach((dish, index) => {
  console.log(`  ${index + 1}. ${dish.name}`);
  console.log(`     Score: ${dish.score}/10`);
  console.log(`     Price: ${dish.price}€`);
  console.log(`     Calories: ${dish.calories} kcal`);
  if (dish.macros) {
    console.log(`     Macros: P${dish.macros.protein}g C${dish.macros.carbs}g F${dish.macros.fat}g`);
  }
  if (dish.reasons && dish.reasons.length > 0) {
    console.log(`     Reasons: ${dish.reasons.join(', ')}`);
  }
});

// Test 3: Vérification spécifique du plat végétarien
console.log('\n🔍 Test 3: Vérification spécifique du plat végétarien');
const vegetarianDish = realMenu.find(dish => dish.name.includes('I\'M ON A DATE'));
if (vegetarianDish) {
  console.log(`Plat végétarien trouvé: ${vegetarianDish.name}`);
  console.log(`  Description: ${vegetarianDish.description}`);
  console.log(`  Vérification des mots-clés problématiques:`);
  
  const description = vegetarianDish.description.toLowerCase();
  const problematicWords = ['beef', 'chicken', 'pork', 'lamb', 'meat', 'steak', 'fish'];
  
  problematicWords.forEach(word => {
    if (description.includes(word)) {
      console.log(`    ❌ Contient "${word}"`);
    } else {
      console.log(`    ✅ Pas de "${word}"`);
    }
  });
  
  // Vérifier s'il est dans les plats sûrs
  const isSafe = preFilterResult.safe.some(dish => dish.name === vegetarianDish.name);
  console.log(`  Est dans les plats sûrs: ${isSafe ? '✅' : '❌'}`);
  
  // Vérifier s'il est dans les recommandations finales
  const isRecommended = analysisResult.filteredDishes.some(dish => dish.name === vegetarianDish.name);
  console.log(`  Est dans les recommandations finales: ${isRecommended ? '✅' : '❌'}`);
} else {
  console.log('❌ Plat végétarien non trouvé dans le menu');
}

// Test 4: Debug des scores
console.log('\n📊 Test 4: Debug des scores');
if (analysisResult.debug) {
  console.log('Debug info:', analysisResult.debug);
}

console.log('\n✅ Test terminé !');
console.log('\n🎯 Problèmes identifiés:');
console.log('  1. Le plat végétarien devrait apparaître dans les plats sûrs');
console.log('  2. Les scores ne devraient pas être 0/10');
console.log('  3. Les macros et calories devraient être affichées correctement');
