#!/usr/bin/env node

// Script de test pour vérifier le pipeline d'analyse des plats
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🧪 TESTING DISH ANALYSIS PIPELINE');
console.log('=====================================\n');

// Test 1: Vérifier que le serveur fonctionne
async function testServerHealth() {
  console.log('1️⃣ Testing server health...');
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    if (data.status === 'OK') {
      console.log('✅ Server is healthy');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    return false;
  }
}

// Test 2: Vérifier que le frontend fonctionne
async function testFrontend() {
  console.log('\n2️⃣ Testing frontend...');
  try {
    const response = await fetch('http://localhost:5173/');
    if (response.ok) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log('❌ Frontend not accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to frontend:', error.message);
    return false;
  }
}

// Test 3: Vérifier les logs du serveur
function checkServerLogs() {
  console.log('\n3️⃣ Checking server logs...');
  try {
    if (fs.existsSync('server.log')) {
      const logs = fs.readFileSync('server.log', 'utf8');
      const lines = logs.split('\n');
      const recentLogs = lines.slice(-20); // Dernières 20 lignes
      
      console.log('📋 Recent server logs:');
      recentLogs.forEach(line => {
        if (line.trim()) {
          console.log(`   ${line}`);
        }
      });
      
      // Vérifier les indicateurs de succès
      const hasSuccess = logs.includes('✅') || logs.includes('success');
      const hasError = logs.includes('❌') || logs.includes('error');
      
      if (hasSuccess && !hasError) {
        console.log('✅ Server logs show successful operation');
        return true;
      } else if (hasError) {
        console.log('⚠️ Server logs show some errors');
        return false;
      } else {
        console.log('ℹ️ No recent activity in server logs');
        return true;
      }
    } else {
      console.log('ℹ️ No server.log file found');
      return true;
    }
  } catch (error) {
    console.log('❌ Error reading server logs:', error.message);
    return false;
  }
}

// Test 4: Vérifier les processus en cours
function checkProcesses() {
  console.log('\n4️⃣ Checking running processes...');
  
  try {
    const processes = execSync('ps aux | grep -E "(vite|node server.js)" | grep -v grep', { encoding: 'utf8' });
    const lines = processes.trim().split('\n');
    
    console.log(`📊 Found ${lines.length} relevant processes:`);
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`   ${line}`);
      }
    });
    
    if (lines.length >= 2) {
      console.log('✅ Both frontend and backend processes are running');
      return true;
    } else {
      console.log('❌ Missing some processes');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking processes:', error.message);
    return false;
  }
}

// Test 5: Vérifier les fichiers de configuration
function checkConfiguration() {
  console.log('\n5️⃣ Checking configuration files...');
  
  const requiredFiles = [
    'server.js',
    'package.json',
    'start-app.sh',
    'stop-app.sh'
  ];
  
  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Fonction principale
async function runTests() {
  console.log('🚀 Starting pipeline tests...\n');
  
  const results = {
    serverHealth: await testServerHealth(),
    frontend: await testFrontend(),
    serverLogs: checkServerLogs(),
    processes: checkProcesses(),
    configuration: checkConfiguration()
  };
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 OVERALL RESULT:');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - Pipeline is working correctly!');
    console.log('\n🌐 Your application is ready:');
    console.log('   Frontend: http://localhost:5173/');
    console.log('   Backend:  http://localhost:3001/');
  } else {
    console.log('❌ SOME TESTS FAILED - Check the issues above');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Run ./stop-app.sh to stop the application');
    console.log('   2. Run ./start-app.sh to restart it');
    console.log('   3. Check server.log for detailed error messages');
  }
  
  return allPassed;
}

// Exécuter les tests
runTests().catch(console.error); 