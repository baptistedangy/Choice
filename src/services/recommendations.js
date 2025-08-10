// Service de recommandations pour l'application Choice
// Génère des recommandations de plats basées sur le menu scanné et le profil utilisateur

/**
 * Génère des recommandations de plats basées sur le texte du menu et le profil utilisateur
 * @param {string} menuText - Le texte extrait du menu par OCR
 * @param {object} userProfile - Le profil utilisateur avec préférences
 * @returns {Array} Array d'objets plats recommandés
 */
export const getRecommendationsFromMenu = (menuText, userProfile = {}) => {
  // Simulation d'un délai de traitement
  console.log('Analyse du menu:', menuText);
  console.log('Profil utilisateur:', userProfile);

  // Aucun plat hardcodé - seuls les plats extraits du menu scanné sont utilisés
  console.log('✅ No hardcoded dishes - only scanned menu dishes will be used');
  
  // Retourner un objet vide car les plats viendront de l'analyse AI du menu scanné
  return {
    topRecommendations: [],
    allRecommendations: []
  };
};

/**
 * Extrait les mots-clés du texte du menu
 * @param {string} menuText - Le texte du menu
 * @returns {Array} Array de mots-clés
 */
const extractKeywords = (menuText) => {
  if (!menuText) return [];

  // Conversion en minuscules et nettoyage
  const cleanText = menuText.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Supprime la ponctuation
    .replace(/\s+/g, ' ') // Normalise les espaces
    .trim();

  // Mots-clés à rechercher
  const keywords = [
    'salade', 'quinoa', 'poulet', 'rôti', 'tarte', 'pommes', 'soupe', 'oignon',
    'steak', 'frites', 'crème', 'brûlée', 'viande', 'poisson', 'végétarien',
    'dessert', 'entrée', 'plat', 'principal', 'fromage', 'herbes', 'citron'
  ];

  // Extraction des mots-clés présents dans le texte
  const foundKeywords = keywords.filter(keyword => 
    cleanText.includes(keyword)
  );

  return foundKeywords;
};

/**
 * Génère des recommandations basées sur les mots-clés et le profil utilisateur
 * @param {Array} availableDishes - Plats disponibles (maintenant vide)
 * @param {Array} menuKeywords - Mots-clés extraits du menu
 * @param {object} userProfile - Profil utilisateur
 * @returns {Array} Array de 3 plats recommandés
 */
const generateRecommendations = (availableDishes, menuKeywords, userProfile) => {
  // Aucun plat hardcodé à traiter
  console.log('✅ No hardcoded dishes to process - only scanned menu dishes will be analyzed');
  
  return {
    topRecommendations: [],
    allRecommendations: []
  };
};

/**
 * Obtient des recommandations supplémentaires (plats 4-8)
 * @param {Array} allRecommendations - Toutes les recommandations disponibles
 * @returns {Array} Array de 5 plats supplémentaires
 */
export const getAdditionalRecommendations = (allRecommendations) => {
  return allRecommendations.slice(3, 8);
};

/**
 * Génère un profil utilisateur par défaut pour les tests
 * @returns {object} Profil utilisateur par défaut
 */
export const getDefaultUserProfile = () => {
  return {
    name: "Utilisateur",
    dietaryPreferences: [], // ['vegetarian', 'gluten-free', 'vegan'] - CORRIGÉ pour correspondre au backend
    budget: "medium", // 'low', 'medium', 'high'
    cuisinePreferences: [], // ['italien', 'français', 'asiatique', 'méditerranéen']
    allergies: [], // ['noix', 'lactose', 'gluten']
    spiceTolerance: "medium" // 'low', 'medium', 'high'
  };
};

/**
 * Met à jour le profil utilisateur avec de nouvelles préférences
 * @param {object} currentProfile - Profil actuel
 * @param {object} newPreferences - Nouvelles préférences
 * @returns {object} Profil mis à jour
 */
export const updateUserProfile = (currentProfile, newPreferences) => {
  return {
    ...currentProfile,
    ...newPreferences
  };
}; 