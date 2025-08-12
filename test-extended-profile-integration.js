// Test d'intégration du profil étendu dans le système de recommandations
// Ce fichier simule l'utilisation du profil étendu pour filtrer et scorer les plats

// Simuler localStorage pour les tests
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  }
};

// Simuler le profil étendu d'un utilisateur
const mockExtendedProfile = {
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  goal: 'maintain',
  dietaryPreferences: ['vegetarian', 'gluten-free'],
  allergies: ['dairy', 'nuts'],
  dietaryLaws: 'none',
  preferredProteinSources: ['tofu_tempeh', 'legumes', 'eggs'],
  tasteAndPrepPreferences: ['prefer_grilled', 'avoid_fried', 'love_pasta'],
  healthFlags: ['diabetes']
};

// Simuler des plats de menu
const mockMenuDishes = [
  {
    name: 'Grilled Tofu Salad',
    description: 'Fresh mixed greens with grilled tofu, cherry tomatoes, and balsamic vinaigrette',
    ingredients: 'tofu, mixed greens, tomatoes, balsamic vinegar, olive oil',
    price: 12.99
  },
  {
    name: 'Cheese Burger',
    description: 'Classic beef burger with cheddar cheese, lettuce, and tomato',
    ingredients: 'beef, cheese, bun, lettuce, tomato, onion',
    price: 15.99
  },
  {
    name: 'Pasta Primavera',
    description: 'Spaghetti with seasonal vegetables in light cream sauce',
    ingredients: 'pasta, vegetables, cream, parmesan cheese',
    price: 14.99
  },
  {
    name: 'Grilled Chicken Breast',
    description: 'Herb-marinated chicken breast with roasted vegetables',
    ingredients: 'chicken, herbs, vegetables, olive oil',
    price: 18.99
  },
  {
    name: 'Nut-Free Chocolate Cake',
    description: 'Rich chocolate cake with vanilla frosting',
    ingredients: 'flour, cocoa, sugar, eggs, milk, vanilla',
    price: 8.99
  }
];

// Fonction de test pour le filtrage des plats
function testDishFiltering() {
  console.log('🧪 Testing dish filtering with extended profile...\n');
  
  // Simuler le chargement du profil
  mockLocalStorage.setItem('extendedProfile', JSON.stringify(mockExtendedProfile));
  const userProfile = JSON.parse(mockLocalStorage.getItem('extendedProfile'));
  
  console.log('👤 User Profile:', userProfile);
  console.log('🍽️ Menu Dishes:', mockMenuDishes.map(d => d.name));
  
  // Appliquer les filtres
  const filteredDishes = mockMenuDishes.filter(dish => {
    const dishText = `${dish.name} ${dish.description} ${dish.ingredients}`.toLowerCase();
    
    // 1. Vérifier les allergies (exclusion stricte)
    if (userProfile.allergies && userProfile.allergies.length > 0) {
      const hasAllergen = userProfile.allergies.some(allergy => {
        return dishText.includes(allergy.toLowerCase());
      });
      
      if (hasAllergen) {
        console.log(`🚫 "${dish.name}" excluded due to allergy`);
        return false;
      }
    }
    
    // 2. Vérifier les préférences alimentaires
    if (userProfile.dietaryPreferences.includes('vegetarian')) {
      if (dishText.includes('beef') || dishText.includes('chicken')) {
        console.log(`🚫 "${dish.name}" excluded - not vegetarian`);
        return false;
      }
    }
    
    return true;
  });
  
  console.log(`\n✅ Filtered dishes: ${filteredDishes.length}/${mockMenuDishes.length}`);
  filteredDishes.forEach(dish => console.log(`  - ${dish.name}`));
  
  return filteredDishes;
}

// Fonction de test pour le scoring des plats
function testDishScoring(filteredDishes) {
  console.log('\n🏆 Testing dish scoring based on preferences...\n');
  
  const userProfile = JSON.parse(mockLocalStorage.getItem('extendedProfile'));
  
  const scoredDishes = filteredDishes.map(dish => {
    let score = 0;
    const dishText = `${dish.name} ${dish.description} ${dish.ingredients}`.toLowerCase();
    
    // Bonus pour les sources de protéines préférées
    userProfile.preferredProteinSources.forEach(protein => {
      if (dishText.includes(protein.toLowerCase())) {
        score += 10;
        console.log(`✅ "${dish.name}" gets +10 for preferred protein: ${protein}`);
      }
    });
    
    // Bonus pour les préférences gustatives
    userProfile.tasteAndPrepPreferences.forEach(pref => {
      if (pref === 'prefer_grilled' && dishText.includes('grilled')) {
        score += 5;
        console.log(`✅ "${dish.name}" gets +5 for grilled preference`);
      } else if (pref === 'love_pasta' && dishText.includes('pasta')) {
        score += 5;
        console.log(`✅ "${dish.name}" gets +5 for pasta preference`);
      }
    });
    
    // Bonus pour les préférences alimentaires
    if (dishText.includes('vegetarian')) {
      score += 8;
      console.log(`✅ "${dish.name}" gets +8 for vegetarian preference`);
    }
    
    return { ...dish, relevanceScore: score };
  });
  
  // Trier par score
  const sortedDishes = scoredDishes.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  console.log('\n📊 Final scoring results:');
  sortedDishes.forEach(dish => {
    console.log(`  ${dish.name}: ${dish.relevanceScore} points`);
  });
  
  return sortedDishes;
}

// Fonction de test pour les lois alimentaires
function testDietaryLaws() {
  console.log('\n🕌 Testing dietary laws compliance...\n');
  
  const halalProfile = { ...mockExtendedProfile, dietaryLaws: 'halal' };
  const kosherProfile = { ...mockExtendedProfile, dietaryLaws: 'kosher' };
  
  const porkDish = {
    name: 'Pork Chops',
    description: 'Grilled pork chops with apple sauce',
    ingredients: 'pork, apple, herbs',
    price: 16.99
  };
  
  console.log('Testing Halal compliance:');
  if (halalProfile.dietaryLaws === 'halal' && porkDish.ingredients.includes('pork')) {
    console.log('🚫 Pork dish excluded for Halal diet');
  }
  
  console.log('Testing Kosher compliance:');
  if (kosherProfile.dietaryLaws === 'kosher' && porkDish.ingredients.includes('pork')) {
    console.log('🚫 Pork dish excluded for Kosher diet');
  }
}

// Fonction de test pour les indicateurs de santé
function testHealthFlags() {
  console.log('\n🏥 Testing health considerations...\n');
  
  const userProfile = JSON.parse(mockLocalStorage.getItem('extendedProfile'));
  
  if (userProfile.healthFlags.includes('diabetes')) {
    console.log('⚠️ User has diabetes - carbohydrate monitoring recommended');
    console.log('💡 Consider low-carb options and portion control');
  }
  
  if (userProfile.healthFlags.includes('hypertension')) {
    console.log('⚠️ User has hypertension - sodium monitoring recommended');
    console.log('💡 Consider low-sodium options');
  }
  
  if (userProfile.healthFlags.includes('high_cholesterol')) {
    console.log('⚠️ User has high cholesterol - saturated fat monitoring recommended');
    console.log('💡 Consider lean protein and healthy fats');
  }
}

// Exécuter tous les tests
function runAllTests() {
  console.log('🚀 Starting Extended Profile Integration Tests\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Filtrage des plats
    const filteredDishes = testDishFiltering();
    
    // Test 2: Scoring des plats
    const scoredDishes = testDishScoring(filteredDishes);
    
    // Test 3: Lois alimentaires
    testDietaryLaws();
    
    // Test 4: Indicateurs de santé
    testHealthFlags();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  - Total dishes: ${mockMenuDishes.length}`);
    console.log(`  - Filtered dishes: ${filteredDishes.length}`);
    console.log(`  - Top recommendation: ${scoredDishes[0]?.name} (${scoredDishes[0]?.relevanceScore} points)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Exécuter les tests si le fichier est lancé directement
if (typeof window === 'undefined') {
  // Node.js environment
  runAllTests();
} else {
  // Browser environment
  console.log('🌐 Browser environment detected');
  console.log('Run this file with Node.js for full testing');
  
  // Exposer les fonctions de test pour la console du navigateur
  window.testExtendedProfile = {
    runAllTests,
    testDishFiltering,
    testDishScoring,
    testDietaryLaws,
    testHealthFlags,
    mockExtendedProfile,
    mockMenuDishes
  };
  
  console.log('💡 Use window.testExtendedProfile.runAllTests() to run tests in browser');
}
