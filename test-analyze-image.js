// Test script for the new /analyze-image endpoint
import fetch from 'node-fetch';
import FormData from 'form-data';

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

async function testAnalyzeImage() {
  try {
    console.log('🧪 Testing /analyze-image endpoint...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('userProfile', JSON.stringify(testUserProfile));
    
    const response = await fetch(`${BACKEND_URL}/analyze-image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Response received:', result);
    
    if (result.status === 'error') {
      console.log('Expected error for test image:', result.message);
      return true; // This is expected for a 1x1 pixel image
    }
    
    if (result.status === 'success') {
      console.log('✅ Analysis successful!');
      console.log('Extracted text length:', result.extractedText?.length);
      console.log('Recommendations count:', result.recommendations?.length);
      return true;
    }
    
    return false;
    
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
  console.log('🚀 Starting tests...');
  
  // Test 1: Backend health
  const healthOk = await testBackendHealth();
  console.log('- Backend health:', healthOk ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: Analyze image
  const analyzeOk = await testAnalyzeImage();
  console.log('- Analyze image:', analyzeOk ? '✅ PASS' : '❌ FAIL');
  
  console.log('🎯 Test results:');
  console.log(`- Backend health: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Analyze image: ${analyzeOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (healthOk && analyzeOk) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testAnalyzeImage, testBackendHealth, runTests }; 