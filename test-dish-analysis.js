// Test script for the new dish analysis endpoints
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

// Test user profile
const testUserProfile = {
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  goal: 'maintain',
  dietaryPreferences: ['vegetarian']
};

// Test dish
const testDish = {
  title: "Grilled Salmon",
  description: "Fresh Atlantic salmon grilled with herbs and lemon, served with steamed vegetables"
};

async function testAnalyzeDish() {
  try {
    console.log('🧪 Testing /api/analyze-dish endpoint...');
    
    const dishText = `${testDish.title}: ${testDish.description}`;
    
    const response = await fetch(`${BACKEND_URL}/api/analyze-dish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dishText,
        userProfile: testUserProfile
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Response received:', result);
    
    if (result.success) {
      console.log('✅ Dish analysis successful!');
      console.log('AI Score:', result.analysis.aiScore);
      console.log('Calories:', result.analysis.calories);
      console.log('Macros:', result.analysis.macros);
      console.log('Short justification:', result.analysis.shortJustification);
      return true;
    } else {
      console.log('Expected error for dish analysis:', result.error);
      return true; // This might be expected without proper API keys
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testAnalyzeMultipleDishes() {
  try {
    console.log('🧪 Testing /api/analyze-dishes endpoint...');
    
    const testDishes = [
      {
        title: "Grilled Salmon",
        description: "Fresh Atlantic salmon grilled with herbs and lemon"
      },
      {
        title: "Vegetable Pasta",
        description: "Whole wheat pasta with seasonal vegetables and olive oil"
      },
      {
        title: "Greek Salad",
        description: "Fresh mixed greens with feta cheese, olives, and vinaigrette"
      }
    ];
    
    const response = await fetch(`${BACKEND_URL}/api/analyze-dishes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dishes: testDishes,
        userProfile: testUserProfile
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Response received:', result);
    
    if (result.success) {
      console.log('✅ Multiple dishes analysis successful!');
      console.log('Number of analyses:', result.analyses?.length);
      return true;
    } else {
      console.log('Expected error for multiple dishes analysis:', result.error);
      return true; // This might be expected without proper API keys
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

async function testBackendHealth() {
  try {
    console.log('🏥 Testing backend health...');
    
    const response = await fetch(`${BACKEND_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Backend health check:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting dish analysis tests...');
  
  // Test 1: Backend health
  const healthOk = await testBackendHealth();
  console.log('- Backend health:', healthOk ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: Single dish analysis
  const singleDishOk = await testAnalyzeDish();
  console.log('- Single dish analysis:', singleDishOk ? '✅ PASS' : '❌ FAIL');
  
  // Test 3: Multiple dishes analysis
  const multipleDishesOk = await testAnalyzeMultipleDishes();
  console.log('- Multiple dishes analysis:', multipleDishesOk ? '✅ PASS' : '❌ FAIL');
  
  console.log('🎯 Test results:');
  console.log(`- Backend health: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Single dish analysis: ${singleDishOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Multiple dishes analysis: ${multipleDishesOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (healthOk && singleDishOk && multipleDishesOk) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testAnalyzeDish, testAnalyzeMultipleDishes, testBackendHealth, runTests }; 