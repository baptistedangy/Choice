// Test de scénarios réalistes basés sur les logs du serveur
// Simulation de plats avec des scores AI réels

const realisticScenarios = [
  {
    name: "Scénario 1: Menu avec plats végétariens et non-végétariens",
    dishes: [
      { title: "EL COLIFLOR", aiScore: 9.5, match: true, calories: 350, protein: 10, carbs: 40, fats: 20 },
      { title: "GREEN BUT NOT BORING", aiScore: 3.5, match: true, calories: 450, protein: 12, carbs: 60, fats: 20 },
      { title: "COSTILLAS DE LA MADRE", aiScore: 0, match: false, calories: 0, protein: 0, carbs: 0, fats: 0 },
      { title: "Autre plat", aiScore: 0, match: false, calories: 0, protein: 0, carbs: 0, fats: 0 }
    ]
  },
  {
    name: "Scénario 2: Seulement des plats non conformes avec scores variés",
    dishes: [
      { title: "Plat A", aiScore: 5.5, match: false, calories: 400, protein: 15, carbs: 45, fats: 18 },
      { title: "Plat B", aiScore: 4.2, match: false, calories: 380, protein: 12, carbs: 50, fats: 15 },
      { title: "Plat C", aiScore: 0, match: false, calories: 0, protein: 0, carbs: 0, fats: 0 },
      { title: "Plat D", aiScore: 0, match: false, calories: 0, protein: 0, carbs: 0, fats: 0 }
    ]
  },
  {
    name: "Scénario 3: Tous les plats ont un score de 0",
    dishes: [
      { title: "Plat X", aiScore: 0, match: false, calories: 0, protein: 0, carbs: 0, fats: 0 },
      { title: "Plat Y", aiScore: 0, match: false, calories: 0, protein: 0, carbs: 0, fats: 0 },
      { title: "Plat Z", aiScore: 0, match: false, calories: 0, protein: 0, carbs: 0, fats: 0 }
    ]
  }
];

function testRealisticScenarios() {
  console.log("🧪 Test de scénarios réalistes\n");
  
  realisticScenarios.forEach((scenario, scenarioIndex) => {
    console.log(`📋 ${scenario.name}`);
    console.log("=".repeat(50));
    
    // Appliquer la logique de filtrage
    const matchingDishes = scenario.dishes.filter(dish => dish.match === true);
    const nonMatchingDishes = scenario.dishes.filter(dish => dish.match === false);
    
    // Trier par score AI
    const sortedMatchingDishes = matchingDishes.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    const sortedNonMatchingDishes = nonMatchingDishes.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    
    // Filtrer les plats non conformes pour exclure ceux avec un score AI de 0
    const validNonMatchingDishes = sortedNonMatchingDishes.filter(dish => (dish.aiScore || 0) > 0);
    
    console.log(`📊 Plats conformes: ${matchingDishes.length}`);
    console.log(`📊 Plats non conformes: ${nonMatchingDishes.length}`);
    console.log(`🔍 Plats non conformes avec score > 0: ${validNonMatchingDishes.length}`);
    
    // Construire la liste finale
    let finalDishes = [];
    
    if (matchingDishes.length >= 3) {
      finalDishes = sortedMatchingDishes.slice(0, 3);
      console.log('✅ Utilisation des 3 meilleurs plats conformes');
    } else if (matchingDishes.length > 0) {
      const matchingCount = matchingDishes.length;
      const neededNonMatching = Math.min(3 - matchingCount, validNonMatchingDishes.length);
      
      finalDishes = [
        ...sortedMatchingDishes,
        ...validNonMatchingDishes.slice(0, neededNonMatching)
      ];
      console.log(`⚠️ Utilisation de ${matchingCount} plats conformes + ${neededNonMatching} plats non conformes (score > 0)`);
    } else if (validNonMatchingDishes.length > 0) {
      const maxDishes = Math.min(3, validNonMatchingDishes.length);
      finalDishes = validNonMatchingDishes.slice(0, maxDishes);
      console.log(`⚠️ Aucun plat conforme - utilisation de ${maxDishes} plats non conformes avec score > 0`);
    } else {
      finalDishes = [];
      console.log('❌ Aucun plat valide à afficher (tous ont un score de 0 ou sont exclus)');
    }
    
    console.log('\n🏆 PLATS FINAUX SÉLECTIONNÉS:');
    if (finalDishes.length === 0) {
      console.log('  Aucun plat à afficher');
    } else {
      finalDishes.forEach((dish, index) => {
        const status = dish.match ? '✅' : '⚠️';
        const scoreColor = dish.aiScore >= 8 ? '🟢' : dish.aiScore >= 6 ? '🟡' : dish.aiScore >= 4 ? '🟠' : '🔴';
        console.log(`  ${index + 1}. ${status} ${scoreColor} "${dish.title}" - AI Score: ${dish.aiScore || 0}`);
        if (dish.calories > 0) {
          console.log(`     📊 Calories: ${dish.calories}, P: ${dish.protein}g, C: ${dish.carbs}g, F: ${dish.fats}g`);
        }
      });
    }
    
    console.log(`📊 Résumé: ${finalDishes.length} plat(s) affiché(s) sur ${scenario.dishes.length} total`);
    
    // Vérifier qu'aucun plat avec score 0 n'est affiché
    const hasZeroScore = finalDishes.some(dish => (dish.aiScore || 0) === 0);
    if (hasZeroScore) {
      console.log('❌ ERREUR: Un plat avec score 0 est affiché !');
    } else if (finalDishes.length > 0) {
      console.log('✅ SUCCÈS: Aucun plat avec score 0 affiché');
    }
    
    console.log('\n' + '─'.repeat(50) + '\n');
  });
}

// Exécuter les tests
testRealisticScenarios();
