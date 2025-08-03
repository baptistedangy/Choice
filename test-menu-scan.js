// Test script pour simuler un scan de menu
import { getTopRecommendations } from './openai.js';

// Menus de test avec différents niveaux de qualité
const testMenus = [
  // Menu clair et complet
  {
    name: "Menu clair",
    text: `MENU DU JOUR

ENTRÉES:
- Salade César: Laitue, parmesan, croûtons, vinaigrette - 8€
- Soupe à l'oignon: Oignons caramélisés, fromage gratiné - 6€

PLATS:
- Steak Frites: Bœuf grillé, frites maison, sauce au poivre - 18€
- Poisson du jour: Filet de bar, légumes de saison - 16€
- Pasta Carbonara: Pâtes, œufs, lardons, parmesan - 14€

DESSERTS:
- Crème brûlée: Vanille de Madagascar - 7€
- Tarte Tatin: Pommes caramélisés - 6€`
  },
  
  // Menu partiellement lisible
  {
    name: "Menu partiel",
    text: `MENU
Salade César 8€
Steak Frites 18€
Poisson 16€`
  },
  
  // Menu très flou
  {
    name: "Menu flou",
    text: `menu du jour
quelque chose avec du poulet
plat du jour
dessert`
  },
  
  // Texte non-menu
  {
    name: "Non-menu",
    text: `Bienvenue dans notre restaurant
Horaires d'ouverture: 12h-14h, 19h-22h
Réservations: 01 23 45 67 89`
  }
];

const testUserProfile = {
  dietaryRestrictions: [],
  budget: "medium",
  cuisinePreferences: ["French", "Italian"],
  allergies: [],
  spiceTolerance: "medium"
};

async function testMenuAnalysis() {
  console.log('🧪 Testing menu analysis with different quality levels...\n');
  
  for (const menu of testMenus) {
    console.log(`📋 Testing: ${menu.name}`);
    console.log(`📝 Menu text: ${menu.text.substring(0, 100)}...`);
    
    try {
      const recommendations = await getTopRecommendations(menu.text, testUserProfile);
      
      if (recommendations && recommendations.length > 0 && !recommendations[0].error) {
        console.log('✅ SUCCESS - Got recommendations:', recommendations.length);
        recommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. ${rec.title} - ${rec.description}`);
        });
      } else {
        console.log('❌ FAILED - No valid recommendations');
        if (recommendations && recommendations[0] && recommendations[0].error) {
          console.log(`   Error: ${recommendations[0].error}`);
        }
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
    
    console.log('---\n');
  }
}

// Test avec un vrai menu français
async function testFrenchMenu() {
  console.log('🇫🇷 Testing with French menu...\n');
  
  const frenchMenu = `
  CARTE DU JOUR
  
  ENTREES
  Salade composée maison - 7€
  Velouté de légumes - 6€
  
  PLATS
  Filet de bar à la provençale - 22€
  Escalope de veau à la crème - 20€
  Risotto aux champignons - 16€
  
  DESSERTS
  Tarte au citron - 6€
  Crème brûlée - 7€
  `;
  
  try {
    const recommendations = await getTopRecommendations(frenchMenu, testUserProfile);
    console.log('French menu analysis result:', recommendations);
  } catch (error) {
    console.log('French menu analysis error:', error.message);
  }
}

// Exécuter les tests
async function runMenuTests() {
  console.log('🚀 Starting menu analysis tests...\n');
  
  await testMenuAnalysis();
  await testFrenchMenu();
  
  console.log('✅ Menu analysis tests completed!');
}

// Exécuter si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runMenuTests();
}

export { testMenuAnalysis, testFrenchMenu, runMenuTests }; 