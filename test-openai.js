// Test script pour vérifier les fonctions OpenAI
import { getTopRecommendations } from './openai.js';
import { analyzeDish } from './src/dishAnalysis.js';

// Test de getTopRecommendations
async function testGetTopRecommendations() {
  console.log('🧪 Testing getTopRecommendations...');
  
  const testMenuText = `
  MENU DU JOUR
  
  Entrées:
  - Salade César: Laitue, parmesan, croûtons, vinaigrette - 8€
  - Soupe à l'oignon: Oignons caramélisés, fromage gratiné - 6€
  
  Plats:
  - Steak Frites: Bœuf grillé, frites maison, sauce au poivre - 18€
  - Poisson du jour: Filet de bar, légumes de saison - 16€
  - Pasta Carbonara: Pâtes, œufs, lardons, parmesan - 14€
  
  Desserts:
  - Crème brûlée: Vanille de Madagascar - 7€
  - Tarte Tatin: Pommes caramélisées - 6€
  `;
  
  const testUserProfile = {
    dietaryRestrictions: [],
    budget: "medium",
    cuisinePreferences: ["French", "Italian"],
    allergies: [],
    spiceTolerance: "medium"
  };
  
  try {
    const recommendations = await getTopRecommendations(testMenuText, testUserProfile);
    console.log('✅ getTopRecommendations result:', recommendations);
    return recommendations;
  } catch (error) {
    console.error('❌ getTopRecommendations error:', error);
    return null;
  }
}

// Test de analyzeDish
async function testAnalyzeDish() {
  console.log('🧪 Testing analyzeDish...');
  
  const testDishText = "Salade César: Laitue fraîche, parmesan, croûtons, vinaigrette maison";
  const testUserProfile = {
    dietaryRestrictions: [],
    budget: "medium",
    cuisinePreferences: ["French", "Italian"],
    allergies: [],
    spiceTolerance: "medium"
  };
  
  try {
    const analysis = await analyzeDish(testDishText, testUserProfile);
    console.log('✅ analyzeDish result:', analysis);
    return analysis;
  } catch (error) {
    console.error('❌ analyzeDish error:', error);
    return null;
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Starting OpenAI API tests...');
  
  // Test 1: getTopRecommendations
  const recommendations = await testGetTopRecommendations();
  
  // Test 2: analyzeDish
  const analysis = await testAnalyzeDish();
  
  console.log('📊 Test Results:');
  console.log('- getTopRecommendations:', recommendations ? '✅ PASS' : '❌ FAIL');
  console.log('- analyzeDish:', analysis ? '✅ PASS' : '❌ FAIL');
  
  if (recommendations && analysis) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above.');
  }
}

// Exécuter si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testGetTopRecommendations, testAnalyzeDish, runTests }; 