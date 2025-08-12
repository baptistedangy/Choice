// Test du système de recommandations contextuelles
// Vérifie que le contexte (faim + timing) affecte bien les scores

// Simuler le service de recommandation
import { filterAndScoreDishes } from './src/services/recommender.js';

// Profil utilisateur de test
const testProfile = {
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  goal: 'maintain',
  dietaryPreferences: ['vegetarian'],
  allergies: ['dairy'],
  dietaryLaws: 'none',
  preferredProteinSources: ['tofu_tempeh', 'legumes', 'eggs'],
  tasteAndPrepPreferences: ['prefer_grilled', 'avoid_fried', 'love_pasta'],
  healthFlags: ['diabetes']
};

// Plats de test avec différents profils
const testDishes = [
  {
    name: 'Grilled Tofu Salad',
    description: 'Fresh mixed greens with grilled tofu, cherry tomatoes, and balsamic vinaigrette',
    ingredients: 'tofu, mixed greens, tomatoes, balsamic vinegar, olive oil',
    price: 12.99,
    calories: 250,
    macros: { protein: 20, carbs: 15, fat: 15 }
  },
  {
    name: 'Pasta Primavera',
    description: 'Spaghetti with seasonal vegetables in light cream sauce',
    ingredients: 'pasta, vegetables, cream, parmesan cheese',
    price: 14.99,
    calories: 450,
    macros: { protein: 12, carbs: 65, fat: 18 }
  },
  {
    name: 'Grilled Chicken Breast',
    description: 'Herb-marinated chicken breast with roasted vegetables',
    ingredients: 'chicken, herbs, vegetables, olive oil',
    price: 18.99,
    calories: 380,
    macros: { protein: 35, carbs: 25, fat: 20 }
  },
  {
    name: 'Large Beef Burger',
    description: 'Classic beef burger with cheese, lettuce, and tomato',
    ingredients: 'beef, cheese, bun, lettuce, tomato, onion',
    price: 22.99,
    calories: 750,
    macros: { protein: 40, carbs: 45, fat: 35 }
  },
  {
    name: 'Light Quinoa Bowl',
    description: 'Small portion of quinoa with steamed vegetables',
    ingredients: 'quinoa, vegetables, olive oil',
    price: 9.99,
    calories: 180,
    macros: { protein: 8, carbs: 25, fat: 8 }
  }
];

// Test 1: Contexte "light + regular"
console.log('\n🧪 Test 1: Light hunger + Regular timing');
const lightRegularContext = { hunger: 'light', timing: 'regular' };
const lightRegularResult = filterAndScoreDishes(testDishes, testProfile, lightRegularContext);

console.log('Top recommendations:');
lightRegularResult.filteredDishes.forEach((dish, index) => {
  console.log(`  ${index + 1}. ${dish.name} - Score: ${dish.score} - Reasons: ${dish.reasons.join(', ')}`);
});

// Test 2: Contexte "hearty + post_workout"
console.log('\n🏋️ Test 2: Hearty hunger + Post-workout timing');
const heartyPostContext = { hunger: 'hearty', timing: 'post_workout' };
const heartyPostResult = filterAndScoreDishes(testDishes, testProfile, heartyPostContext);

console.log('Top recommendations:');
heartyPostResult.filteredDishes.forEach((dish, index) => {
  console.log(`  ${index + 1}. ${dish.name} - Score: ${dish.score} - Reasons: ${dish.reasons.join(', ')}`);
});

// Test 3: Contexte "moderate + pre_workout"
console.log('\n⚡ Test 3: Moderate hunger + Pre-workout timing');
const moderatePreContext = { hunger: 'moderate', timing: 'pre_workout' };
const moderatePreResult = filterAndScoreDishes(testDishes, testProfile, moderatePreContext);

console.log('Top recommendations:');
moderatePreResult.filteredDishes.forEach((dish, index) => {
  console.log(`  ${index + 1}. ${dish.name} - Score: ${dish.score} - Reasons: ${dish.reasons.join(', ')}`);
});

// Test 4: Vérification des filtres durs
console.log('\n🚫 Test 4: Vérification des filtres durs (allergies, végétarien)');
const filteredOutCount = lightRegularResult.debug.filteredOutCount;
console.log(`Plats filtrés: ${filteredOutCount}/${testDishes.length}`);

// Test 5: Comparaison des scores
console.log('\n📊 Test 5: Comparaison des scores par contexte');
const contexts = [
  { name: 'Light + Regular', context: lightRegularContext, result: lightRegularResult },
  { name: 'Hearty + Post-workout', context: heartyPostContext, result: heartyPostResult },
  { name: 'Moderate + Pre-workout', context: moderatePreContext, result: moderatePreResult }
];

contexts.forEach(({ name, context, result }) => {
  console.log(`\n${name}:`);
  console.log(`  Context: ${context.hunger} hunger, ${context.timing} timing`);
  console.log(`  Macro targets: ${JSON.stringify(result.debug.targetsUsed)}`);
  result.filteredDishes.forEach((dish, index) => {
    console.log(`    ${index + 1}. ${dish.name}: ${dish.score}/10`);
    if (dish.subscores) {
      console.log(`       Macro fit: ${Math.round(dish.subscores.macroFit * 100)}%`);
      console.log(`       Portion fit: ${Math.round(dish.subscores.portionFit * 100)}%`);
    }
  });
});

// Test 6: Vérification des raisons
console.log('\n🏷️ Test 6: Vérification des raisons et badges');
lightRegularResult.filteredDishes.forEach((dish, index) => {
  console.log(`\n${index + 1}. ${dish.name} (Score: ${dish.score}/10):`);
  console.log(`  Reasons: ${dish.reasons.join(', ')}`);
  if (dish.subscores) {
    console.log(`  Subscores:`);
    Object.entries(dish.subscores).forEach(([key, value]) => {
      console.log(`    ${key}: ${Math.round(value * 100)}%`);
    });
  }
});

console.log('\n✅ Tests terminés !');
console.log('\n📋 Résumé des tests:');
console.log('  • Test 1: Light + Regular - devrait favoriser les petites portions');
console.log('  • Test 2: Hearty + Post-workout - devrait favoriser les grandes portions riches en protéines');
console.log('  • Test 3: Moderate + Pre-workout - devrait favoriser les plats équilibrés avec plus de glucides');
console.log('  • Test 4: Vérification des filtres durs (allergies, végétarien)');
console.log('  • Test 5: Comparaison des scores par contexte');
console.log('  • Test 6: Vérification des raisons et sous-scores');
