// 🔒 Configuration du tunnel Cloudflare
// Modifiez ces valeurs selon vos besoins

export const tunnelConfig = {
  // Port de votre application locale
  localPort: 5174,

  // URL locale complète
  localUrl: 'http://localhost:5174',
  
  // Options du tunnel
  options: {
    // Nom du tunnel (optionnel)
    name: 'choice-app-tunnel',
    
    // Métadonnées du tunnel
    metadata: {
      description: 'Tunnel pour l\'application Choice - Tests mobiles',
      environment: 'development'
    }
  },
  
  // Configuration des headers (optionnel)
  headers: {
    'X-Tunnel-For': 'Choice App Development',
    'X-Environment': 'Development'
  }
};

// Fonction pour générer la commande tunnel
export function getTunnelCommand() {
  return `cloudflared tunnel --url ${tunnelConfig.localUrl}`;
}

// Fonction pour vérifier la configuration
export function validateConfig() {
  const issues = [];
  
  if (tunnelConfig.localPort < 1 || tunnelConfig.localPort > 65535) {
    issues.push('Port local invalide (doit être entre 1 et 65535)');
  }
  
  if (!tunnelConfig.localUrl.startsWith('http://')) {
    issues.push('URL locale doit commencer par http://');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

console.log('🔒 Configuration du tunnel chargée');
console.log(`📍 Port local: ${tunnelConfig.localPort}`);
console.log(`🔗 URL locale: ${tunnelConfig.localUrl}`);
