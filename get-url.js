#!/usr/bin/env node

// 🔗 Script pour obtenir l'URL du tunnel Cloudflare
// Usage: node get-url.js

import { execSync } from 'child_process';

console.log('🔍 Récupération de l\'URL du tunnel Cloudflare...\n');

try {
  // Vérifier que le tunnel est actif
  const tunnelProcesses = execSync('ps aux | grep cloudflared | grep -v grep | wc -l', { encoding: 'utf8' }).trim();
  console.log(`✅ Processus tunnel actifs: ${tunnelProcesses}`);
  
  // Instructions pour obtenir l'URL
  console.log('\n📱 Pour obtenir l\'URL HTTPS :');
  console.log('1. Regardez dans le terminal où le tunnel a été lancé');
  console.log('2. Cherchez la ligne qui commence par "🔗 URL:"');
  console.log('3. Copiez cette URL sur votre téléphone');
  
  console.log('\n💡 Si vous ne voyez pas l\'URL, redémarrez le tunnel :');
  console.log('   npm run tunnel');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
