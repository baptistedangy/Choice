// Test de la logique de filtrage des plats avec score AI
// Ce script simule la logique du serveur pour vérifier le comportement

// Simulation des données de test
const testDishes = [
  { title: "Dish 1", aiScore: 8.5, match: true },
  { title: "Dish 2", aiScore: 7.2, match: true },
  { title: "Dish 3", aiScore: 6.8, match: true },
  { title: "Dish 4", aiScore: 5.5, match: false },
  { title: "Dish 5", aiScore: 4.2, match: false },
  { title: "Dish 6", aiScore: 0, match: false },
  { title: "Dish 7", aiScore: 0, match: false },
  { title: "Dish 8", aiScore: 0, match: false }
];

// Simulation de la logique de filtrage
function testFilteringLogic() {
  console.log("🧪 Test de la logique de filtrage des plats\n");
  
  // Séparer les plats conformes et non conformes
  const matchingDishes = testDishes.filter(dish => dish.match === true);
  const nonMatchingDishes = testDishes.filter(dish => dish.match === false);
  
  console.log(`📊 Plats conformes: ${matchingDishes.length}`);
  console.log(`📊 Plats non conformes: ${nonMatchingDishes.length}`);
  
  // Trier par score AI
  const sortedMatchingDishes = matchingDishes.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  const sortedNonMatchingDishes = nonMatchingDishes.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  
  console.log("\n🏆 Plats conformes triés par score AI:");
  sortedMatchingDishes.forEach((dish, index) => {
    console.log(`  ${index + 1}. "${dish.title}" - AI Score: ${dish.aiScore || 0} - ✅ Conforme`);
  });
  
  console.log("\n⚠️ Plats non conformes triés par score AI:");
  sortedNonMatchingDishes.forEach((dish, index) => {
    console.log(`  ${index + 1}. "${dish.title}" - AI Score: ${dish.aiScore || 0} - ❌ Non conforme`);
  });
  
  // Filtrer les plats non conformes pour exclure ceux avec un score AI de 0
  const validNonMatchingDishes = sortedNonMatchingDishes.filter(dish => (dish.aiScore || 0) > 0);
  
  console.log(`\n🔍 Plats non conformes avec score > 0: ${validNonMatchingDishes.length}`);
  
  // Construire la liste finale selon les nouvelles règles
  let finalDishes = [];
  
  if (matchingDishes.length >= 3) {
    // Si on a 3+ plats conformes, prendre les 3 meilleurs
    finalDishes = sortedMatchingDishes.slice(0, 3);
    console.log('\n✅ Utilisation des 3 meilleurs plats conformes');
  } else if (matchingDishes.length > 0) {
    // Si on a 1-2 plats conformes, les compléter avec les meilleurs non conformes (score > 0)
    const matchingCount = matchingDishes.length;
    const neededNonMatching = Math.min(3 - matchingCount, validNonMatchingDishes.length);
    
    finalDishes = [
      ...sortedMatchingDishes,
      ...validNonMatchingDishes.slice(0, neededNonMatching)
    ];
    console.log(`\n⚠️ Utilisation de ${matchingCount} plats conformes + ${neededNonMatching} plats non conformes (score > 0)`);
  } else if (validNonMatchingDishes.length > 0) {
    // Si aucun plat conforme mais des plats non conformes avec score > 0
    const maxDishes = Math.min(3, validNonMatchingDishes.length);
    finalDishes = validNonMatchingDishes.slice(0, maxDishes);
    console.log(`\n⚠️ Aucun plat conforme - utilisation de ${maxDishes} plats non conformes avec score > 0`);
  } else {
    // Aucun plat valide à afficher
    finalDishes = [];
    console.log('\n❌ Aucun plat valide à afficher (tous ont un score de 0 ou sont exclus)');
  }
  
  console.log('\n🏆 PLATS FINAUX SÉLECTIONNÉS:');
  if (finalDishes.length === 0) {
    console.log('  Aucun plat à afficher');
  } else {
    finalDishes.forEach((dish, index) => {
      const status = dish.match ? '✅' : '⚠️';
      console.log(`  ${index + 1}. ${status} "${dish.title}" - AI Score: ${dish.aiScore || 0}`);
    });
  }
  
  console.log(`\n📊 Résumé: ${finalDishes.length} plat(s) affiché(s) sur ${testDishes.length} total`);
  
  // Test des différents scénarios
  console.log('\n🧪 Tests des différents scénarios:');
  
  // Scénario 1: Beaucoup de plats conformes
  console.log('\n📋 Scénario 1: Beaucoup de plats conformes');
  const scenario1 = testDishes.filter(dish => dish.match).slice(0, 3);
  console.log(`  Résultat: ${scenario1.length} plats conformes affichés`);
  
  // Scénario 2: Peu de plats conformes, complétés par des non conformes valides
  console.log('\n📋 Scénario 2: Peu de plats conformes + compléments valides');
  const scenario2 = [
    ...testDishes.filter(dish => dish.match).slice(0, 1),
    ...testDishes.filter(dish => !dish.match && dish.aiScore > 0).slice(0, 2)
  ];
  console.log(`  Résultat: ${scenario2.length} plats affichés (1 conforme + 2 non conformes valides)`);
  
  // Scénario 3: Aucun plat conforme, seulement des non conformes valides
  console.log('\n📋 Scénario 3: Aucun plat conforme, seulement des non conformes valides');
  const scenario3 = testDishes.filter(dish => !dish.match && dish.aiScore > 0).slice(0, 3);
  console.log(`  Résultat: ${scenario3.length} plats non conformes valides affichés`);
  
  // Scénario 4: Tous les plats ont un score de 0
  console.log('\n📋 Scénario 4: Tous les plats ont un score de 0');
  const scenario4 = testDishes.filter(dish => dish.aiScore === 0);
  console.log(`  Résultat: ${scenario4.length} plats avec score 0 (aucun affiché)`);
}

// Exécuter le test
testFilteringLogic();
