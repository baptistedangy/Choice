#!/usr/bin/env node

// 🧪 Script de test pour le tunnel Cloudflare
// Usage: node test-tunnel.js

import { tunnelConfig, validateConfig } from './tunnel.config.js';

console.log('🧪 Test de la configuration du tunnel Cloudflare...\n');

// Test 1: Validation de la configuration
console.log('1️⃣ Validation de la configuration...');
const validation = validateConfig();
if (validation.isValid) {
  console.log('✅ Configuration valide');
} else {
  console.log('❌ Problèmes détectés:');
  validation.issues.forEach(issue => console.log(`   - ${issue}`));
  process.exit(1);
}

// Test 2: Vérification des dépendances
console.log('\n2️⃣ Vérification des dépendances...');
try {
  const { execSync } = await import('child_process');
  const cloudflaredVersion = execSync('npx cloudflared --version', { encoding: 'utf8' }).trim();
  console.log(`✅ cloudflared installé: ${cloudflaredVersion}`);
} catch (error) {
  console.log('❌ cloudflared non installé');
  console.log('💡 Installez avec: npm install --save-dev cloudflared');
  process.exit(1);
}

// Test 3: Vérification du port
console.log('\n3️⃣ Vérification du port...');
try {
  const { execSync } = await import('child_process');
  const portCheck = execSync(`lsof -i :${tunnelConfig.localPort}`, { encoding: 'utf8' });
  if (portCheck.trim()) {
    console.log(`⚠️  Port ${tunnelConfig.localPort} déjà utilisé:`);
    console.log(portCheck);
  } else {
    console.log(`✅ Port ${tunnelConfig.localPort} disponible`);
  }
} catch (error) {
  console.log(`✅ Port ${tunnelConfig.localPort} disponible`);
}

// Test 4: Génération de la commande
console.log('\n4️⃣ Commande du tunnel...');
console.log(`🔗 Commande: ${tunnelConfig.localUrl}`);
console.log(`📱 Prêt pour les tests mobiles !`);

// Test 5: Instructions de démarrage
console.log('\n🚀 Instructions de démarrage:');
console.log('1. npm run dev:tunnel');
console.log('2. Copier l\'URL HTTPS affichée');
console.log('3. Tester sur mobile !');

console.log('\n✅ Tests terminés avec succès !');
console.log('🎯 Votre tunnel est prêt à être utilisé.');
