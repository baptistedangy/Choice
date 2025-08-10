import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Profil utilisateur de test
const testUserProfile = {
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  goal: 'maintain',
  dietaryPreferences: ['vegetarian', 'gluten-free']
};

// Plats de test
const testDishes = [
  "Quesadilla de queso con aguacate",
  "Ensalada César con pollo",
  "Pasta carbonara con panceta",
  "Sopa de lentejas",
  "Hamburguesa vegetariana"
];

async function testSingleDishAnalysis() {
  console.log('🧪 Testing single dish analysis performance...');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analyze-dish`, {
      dishText: testDishes[0],
      userProfile: testUserProfile
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Single dish analysis completed in ${duration}ms`);
    console.log(`📊 AI Score: ${response.data.analysis.aiScore}`);
    console.log(`🔥 Calories: ${response.data.analysis.calories}`);
    
    return duration;
  } catch (error) {
    console.error('❌ Error in single dish analysis:', error.message);
    return null;
  }
}

async function testMultipleDishesAnalysis() {
  console.log('\n🧪 Testing multiple dishes analysis performance...');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/analyze-dishes`, {
      dishes: testDishes.slice(0, 3).map(dish => ({ title: dish, description: dish })),
      userProfile: testUserProfile
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Multiple dishes analysis completed in ${duration}ms`);
    console.log(`📊 Analyzed ${response.data.analyses.length} dishes`);
    
    return duration;
  } catch (error) {
    console.error('❌ Error in multiple dishes analysis:', error.message);
    return null;
  }
}

async function testRecommendations() {
  console.log('\n🧪 Testing recommendations generation performance...');
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(`${BASE_URL}/api/openai/recommendations`, {
      menuText: testDishes.join('\n'),
      userProfile: testUserProfile
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Recommendations generated in ${duration}ms`);
    console.log(`📊 Generated ${response.data.recommendations.length} recommendations`);
    
    return duration;
  } catch (error) {
    console.error('❌ Error in recommendations generation:', error.message);
    return null;
  }
}

async function testCachePerformance() {
  console.log('\n🧪 Testing cache performance (second run should be faster)...');
  
  // Premier appel
  console.log('📞 First call...');
  const firstCall = await testSingleDishAnalysis();
  
  // Deuxième appel (devrait utiliser le cache)
  console.log('\n📞 Second call (should use cache)...');
  const secondCall = await testSingleDishAnalysis();
  
  if (firstCall && secondCall) {
    const improvement = ((firstCall - secondCall) / firstCall * 100).toFixed(1);
    console.log(`\n🚀 Cache performance improvement: ${improvement}%`);
    console.log(`⏱️  First call: ${firstCall}ms`);
    console.log(`⚡ Second call: ${secondCall}ms`);
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting performance tests...\n');
  
  const results = {
    singleDish: await testSingleDishAnalysis(),
    multipleDishes: await testMultipleDishesAnalysis(),
    recommendations: await testRecommendations()
  };
  
  console.log('\n📊 Performance Test Results:');
  console.log('============================');
  console.log(`🍽️  Single dish analysis: ${results.singleDish || 'Failed'}ms`);
  console.log(`🍽️  Multiple dishes analysis: ${results.multipleDishes || 'Failed'}ms`);
  console.log(`🤖 Recommendations generation: ${results.recommendations || 'Failed'}ms`);
  
  // Test du cache
  await testCachePerformance();
  
  console.log('\n✅ Performance tests completed!');
}

// Exécuter les tests
runPerformanceTests().catch(console.error);
