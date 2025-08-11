/**
 * Configuration dynamique de l'URL du backend
 * Détecte automatiquement si l'application tourne sur une IP locale
 * et configure l'URL du backend en conséquence
 */

function getBackendUrl() {
  // Vérifier si une variable d'environnement est définie
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Détecter si l'application tourne sur une IP locale
  const hostname = window.location.hostname;
  
  // Vérifier si c'est une IP locale (IPv4 ou IPv6)
  const isLocalIP = /^(?:10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|::1$|fe80:|fc00:|fd00:)/.test(hostname);
  
  if (isLocalIP) {
    // Utiliser la même IP que le frontend avec le port du backend
    return `http://${hostname}:3001`;
  }
  
  // Par défaut, utiliser localhost
  return 'http://localhost:3001';
}

export const BACKEND_URL = getBackendUrl();

// Afficher l'URL du backend au démarrage
console.log('🌐 Backend URL configurée:', BACKEND_URL);
console.log('📍 Frontend accessible sur:', window.location.href);
console.log('🔧 Hostname détecté:', window.location.hostname);

// Log spécial pour le mode développement
if (import.meta.env.DEV) {
  console.log('🚀 Mode développement détecté');
  if (import.meta.env.VITE_BACKEND_URL) {
    console.log('✅ VITE_BACKEND_URL configuré:', import.meta.env.VITE_BACKEND_URL);
  } else {
    console.log('💡 Pour tester sur mobile, configurez VITE_BACKEND_URL dans .env.development');
  }
}
