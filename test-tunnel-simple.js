#!/usr/bin/env node

// 🧪 Test simple du tunnel Cloudflare
// Usage: node test-tunnel-simple.js

import { execSync } from 'child_process';

console.log('🔍 Test simple du tunnel Cloudflare...\n');

try {
  // Test 1: Vérifier le port local
  console.log('1️⃣ Vérification du port 5174...');
  const portCheck = execSync('lsof -i :5174', { encoding: 'utf8' });
  console.log('✅ Port 5174 actif:', portCheck.split('\n')[0]);
  
  // Test 2: Test de l'application locale
  console.log('\n2️⃣ Test de l\'application locale...');
  const localTest = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5174', { encoding: 'utf8' });
  console.log(`✅ Application locale répond: HTTP ${localTest}`);
  
  // Test 3: Démarrer un tunnel simple
  console.log('\n3️⃣ Démarrage d\'un tunnel simple...');
  console.log('🚀 Commande: cloudflared tunnel --url http://localhost:5174');
  console.log('📱 Une URL HTTPS sera affichée ci-dessous');
  console.log('💡 Copiez-la sur votre téléphone pour tester');
  console.log('');
  
  // Démarrer le tunnel
  execSync('cloudflared tunnel --url http://localhost:5174', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
