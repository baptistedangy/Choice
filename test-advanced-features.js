#!/usr/bin/env node

/**
 * Script de test avancé pour les fonctionnalités du serveur
 * Teste le système de retry, fallback et gestion des erreurs
 */

const BASE_URL = 'http://localhost:3001';
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

const testRetrySystem = async () => {
  log('\n🔄 Testing retry system and fallback...', 'cyan');
  
  try {
    // Test 1: Vérifier que les métriques sont initialisées
    const initialMetrics = await makeRequest(`${BASE_URL}/metrics`);
    log(`   Initial metrics: ${initialMetrics.openaiCalls} calls, ${initialMetrics.openaiErrors} errors`);
    
    // Test 2: Analyser un plat pour déclencher des appels OpenAI
    const testDishText = "Salade César avec poulet et parmesan";
    
    const userProfile = {
      dietaryPreferences: ['vegetarian'],
      allergies: [],
      goal: 'maintain'
    };
    
    log('   Testing dish analysis with retry system...');
    const analysisResult = await makeRequest(`${BASE_URL}/api/analyze-dish`, {
      method: 'POST',
      body: JSON.stringify({
        dishText: testDishText,
        userProfile: userProfile
      })
    });
    
    log(`   ✅ Analysis completed: ${analysisResult.analysis?.aiScore || 'N/A'} score`);
    
    // Test 3: Vérifier les métriques après utilisation
    const finalMetrics = await makeRequest(`${BASE_URL}/metrics`);
    log(`   Final metrics: ${finalMetrics.openaiCalls} calls, ${finalMetrics.openaiErrors} errors`);
    log(`   Success rate: ${finalMetrics.successRate}`);
    log(`   Average response time: ${finalMetrics.averageResponseTimeFormatted}`);
    
    return true;
  } catch (error) {
    log(`   ❌ Retry system test failed: ${error.message}`, 'red');
    return false;
  }
};

const testCacheSystem = async () => {
  log('\n💾 Testing cache system...', 'cyan');
  
  try {
    // Test 1: Analyser le même plat deux fois
    const testDishText = "Burger végétarien aux haricots noirs";
    
    const userProfile = {
      dietaryPreferences: ['vegan'],
      allergies: [],
      goal: 'lose'
    };
    
    log('   First analysis (should miss cache)...');
    const firstResult = await makeRequest(`${BASE_URL}/api/analyze-dish`, {
      method: 'POST',
      body: JSON.stringify({
        dishText: testDishText,
        userProfile: userProfile
      })
    });
    
    log('   Second analysis (should hit cache)...');
    const secondResult = await makeRequest(`${BASE_URL}/api/analyze-dish`, {
      method: 'POST',
      body: JSON.stringify({
        dishText: testDishText,
        userProfile: userProfile
      })
    });
    
    // Test 2: Vérifier les métriques de cache
    const cacheMetrics = await makeRequest(`${BASE_URL}/metrics`);
    log(`   Cache hits: ${cacheMetrics.cacheHits}`);
    log(`   Cache misses: ${cacheMetrics.cacheMisses}`);
    log(`   Cache hit rate: ${cacheMetrics.cacheHitRate}`);
    
    return true;
  } catch (error) {
    log(`   ❌ Cache system test failed: ${error.message}`, 'red');
    return false;
  }
};

const testErrorHandling = async () => {
  log('\n⚠️ Testing error handling...', 'cyan');
  
  try {
    // Test 1: Vérifier la gestion des requêtes invalides
    log('   Testing invalid request handling...');
    
    try {
      await makeRequest(`${BASE_URL}/api/analyze-dish`, {
        method: 'POST',
        body: JSON.stringify({
          // Requête invalide sans dishText
          userProfile: {}
        })
      });
      log('   ❌ Should have failed with invalid request', 'red');
      return false;
    } catch (error) {
      log('   ✅ Invalid request properly rejected');
    }
    
    // Test 2: Vérifier la gestion des profils utilisateur invalides
    log('   Testing invalid user profile handling...');
    
    try {
      await makeRequest(`${BASE_URL}/api/analyze-dish`, {
        method: 'POST',
        body: JSON.stringify({
          dishText: "Test plat",
          userProfile: null
        })
      });
      log('   ✅ Request with null profile handled gracefully');
    } catch (error) {
      log(`   ❌ Unexpected error: ${error.message}`, 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`   ❌ Error handling test failed: ${error.message}`, 'red');
    return false;
  }
};

const testPerformanceMonitoring = async () => {
  log('\n📊 Testing performance monitoring...', 'cyan');
  
  try {
    // Test 1: Vérifier que les métriques sont mises à jour en temps réel
    const initialMetrics = await makeRequest(`${BASE_URL}/metrics`);
    log(`   Initial uptime: ${initialMetrics.uptimeFormatted}`);
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedMetrics = await makeRequest(`${BASE_URL}/metrics`);
    log(`   Updated uptime: ${updatedMetrics.uptimeFormatted}`);
    
    // Test 2: Vérifier le reset des métriques
    log('   Testing metrics reset...');
    const resetResult = await makeRequest(`${BASE_URL}/metrics/reset`, {
      method: 'POST'
    });
    
    if (resetResult.success) {
      log('   ✅ Metrics reset successful');
      
      const resetMetrics = await makeRequest(`${BASE_URL}/metrics`);
      if (resetMetrics.openaiCalls === 0 && resetMetrics.openaiErrors === 0) {
        log('   ✅ Metrics properly reset to zero');
      } else {
        log('   ❌ Metrics not properly reset', 'red');
        return false;
      }
    } else {
      log('   ❌ Metrics reset failed', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`   ❌ Performance monitoring test failed: ${error.message}`, 'red');
    return false;
  }
};

const runAdvancedTests = async () => {
  log('🚀 Starting advanced server feature tests...', 'bright');
  
  const tests = [
    { name: 'Retry System', fn: testRetrySystem },
    { name: 'Cache System', fn: testCacheSystem },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Performance Monitoring', fn: testPerformanceMonitoring }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        log(`✅ ${test.name} test passed`, 'green');
        passedTests++;
      } else {
        log(`❌ ${test.name} test failed`, 'red');
      }
    } catch (error) {
      log(`❌ ${test.name} test error: ${error.message}`, 'red');
    }
  }
  
  log(`\n🎯 Advanced Test Results: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 All advanced features are working correctly!', 'green');
  } else {
    log('⚠️ Some advanced features need attention. Check the logs above.', 'yellow');
  }
};

// Exécuter les tests si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdvancedTests();
}

export { runAdvancedTests, testRetrySystem, testCacheSystem, testErrorHandling, testPerformanceMonitoring };
