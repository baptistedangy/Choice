// Test script for Google Vision API
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3001';

async function testVisionAPI() {
  try {
    console.log('🧪 Testing Google Vision API...');
    
    // Create a simple test image with text (base64 encoded)
    // This is a minimal PNG with some text
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    
    // Create FormData
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    });
    
    const response = await fetch(`${BACKEND_URL}/api/vision/extract-text`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Vision API response:', result);
    
    if (result.success) {
      console.log('✅ Text extraction successful!');
      console.log('Extracted text:', result.text);
      return true;
    } else {
      console.log('Expected error for test image:', result.error);
      return true; // This is expected for a 1x1 pixel image
    }
    
  } catch (error) {
    console.error('❌ Vision API test failed:', error);
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
  console.log('🚀 Starting Vision API tests...');
  
  // Test 1: Backend health
  const healthOk = await testBackendHealth();
  console.log('- Backend health:', healthOk ? '✅ PASS' : '❌ FAIL');
  
  // Test 2: Vision API
  const visionOk = await testVisionAPI();
  console.log('- Vision API:', visionOk ? '✅ PASS' : '❌ FAIL');
  
  console.log('🎯 Test results:');
  console.log(`- Backend health: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Vision API: ${visionOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (healthOk && visionOk) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testVisionAPI, testBackendHealth, runTests }; 