#!/usr/bin/env node

// 🔗 Script final pour obtenir l'URL du tunnel Cloudflare
// Usage: node get-tunnel-url-final.js

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔒 Démarrage du tunnel Cloudflare...');
console.log('📱 Récupération de l\'URL HTTPS...\n');

// Arrêter les tunnels existants
import { execSync } from 'child_process';
try {
  execSync('pkill -f cloudflared', { stdio: 'ignore' });
  console.log('🔄 Tunnels existants arrêtés');
} catch (error) {
  // Ignore les erreurs si aucun tunnel n'était actif
}

// Attendre un peu
await new Promise(resolve => setTimeout(resolve, 2000));

// Démarrer le tunnel avec des paramètres optimisés pour éviter les erreurs DNS
const cloudflaredPath = join(__dirname, 'node_modules', '.bin', 'cloudflared');
const tunnel = spawn(cloudflaredPath, [
  'tunnel',
  '--url', 'http://localhost:5173', // Port mis à jour selon votre sortie
  '--protocol', 'http2',
  '--no-tls-verify',
  '--no-autoupdate',
  '--metrics', '127.0.0.1:0' // Désactiver les métriques qui causent des erreurs
]);

let urlFound = false;

// Fonction pour extraire l'URL du tunnel
function extractTunnelUrl(output) {
  // Chercher un pattern d'URL Cloudflare
  const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (urlMatch) {
    return urlMatch[0];
  }
  return null;
}

tunnel.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Chercher l'URL
  if (output.includes('trycloudflare.com') && !urlFound) {
    const tunnelUrl = extractTunnelUrl(output);
    if (tunnelUrl) {
      urlFound = true;
      console.log('\n🎉 URL TROUVÉE ! Copiez ceci sur votre téléphone :');
      console.log('🔗 ' + tunnelUrl);
      console.log('\n📱 Instructions :');
      console.log('1. Ouvrez le navigateur de votre téléphone');
      console.log('2. Collez l\'URL ci-dessus');
      console.log('3. Testez la caméra !');
      console.log('\n💡 Gardez ce terminal ouvert pour maintenir le tunnel actif');
      console.log('\n⚠️  Ignorez les erreurs DNS qui suivent - le tunnel fonctionne !');
    }
  }
});

tunnel.stderr.on('data', (data) => {
  const output = data.toString();
  
  // Filtrer les erreurs DNS connues pour éviter le spam
  if (!output.includes('Failed to initialize DNS local resolver') && 
      !output.includes('lookup region1.v2.argotunnel.com') &&
      !output.includes('Cannot determine default origin certificate path')) {
    console.log(output);
  }
  
  // Chercher l'URL dans les erreurs aussi
  if (output.includes('trycloudflare.com') && !urlFound) {
    const tunnelUrl = extractTunnelUrl(output);
    if (tunnelUrl) {
      urlFound = true;
      console.log('\n🎉 URL TROUVÉE ! Copiez ceci sur votre téléphone :');
      console.log('🔗 ' + tunnelUrl);
      console.log('\n📱 Instructions :');
      console.log('1. Ouvrez le navigateur de votre téléphone');
      console.log('2. Collez l\'URL ci-dessus');
      console.log('3. Testez la caméra !');
      console.log('\n💡 Gardez ce terminal ouvert pour maintenir le tunnel actif');
      console.log('\n⚠️  Ignorez les erreurs DNS qui suivent - le tunnel fonctionne !');
    }
  }
});

tunnel.on('close', (code) => {
  console.log(`\n❌ Tunnel fermé avec le code: ${code}`);
});

// Gérer l'interruption
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du tunnel...');
  tunnel.kill();
  process.exit(0);
});
