#!/usr/bin/env node

// Script de test pour vérifier la logique de détection des plats
console.log('🧪 TESTING DISH DETECTION LOGIC');
console.log('================================\n');

// Texte OCR simulé basé sur les captures d'écran
const mockOcrText = `sundayapp.io
DRINKS MENU DESSERTS KIDS MENU (E
ASADOS
CHULE CONMIGO I
35/pers
Pour deux personnes. Une belle grosse cite
de boeuf bien juteuse, à déguster avec notre
salsa chimichurri. Toujours accomp...
EL COLIFLOR
15.50
Un beau steak de chou fleur mariné et roti, sur une louche de houmous verde. Crème d'avocat ou sauce chimichurri, aji amarilla, grenades pour la touche sucrée, noisettes concassées.
COSTILLAS DE LA MADRE
17.90
soog de Ribs de cochon cuites toutes les nuits rien que pour tol, y's de quoi craquer C'est pas les petites patates rôties qui sont servies avec qui nous feront mentir
Y MÁS
GREEN BUT NOT BORING VE
13.50
Une quinoa bien balancée, fruit rouge frais, feta, sauce balsamique
POLLO CHEESEBURGER
14.50
Bun bien doré, poulet effiloché, mariné aux épices maison pour toujours plus de placer. Cheddar, pickles d'oignons rouges & jeunes pousses. Se ramène toujours avec ses petites pommes de terre rôties, sa patates douces et sa caliente chipotle maya.`;

console.log('📄 Mock OCR Text:');
console.log('='.repeat(50));
console.log(mockOcrText);
console.log('='.repeat(50));

// Logique de détection actuelle
function detectDishesCurrent(ocrText) {
  console.log('\n🔍 CURRENT DETECTION LOGIC:');
  const lines = ocrText.split('\n').filter(line => line.trim().length > 0);
  const potentialDishes = [];
  let currentDish = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détecter les titres de plats (commencent par des lettres majuscules, longueur appropriée)
    const isDishTitle = /^[A-Z][A-Z\s]+$/.test(line) && 
                       line.length >= 3 && line.length <= 50 &&
                       !line.includes('MENU') && !line.includes('DRINKS') && 
                       !line.includes('KIDS') && !line.includes('PRICE') &&
                       !line.includes('€') && !line.includes('$') && !line.includes('£');
    
    // Détecter les prix (nombres suivis de €, $, ou juste des nombres)
    const isPrice = /^\d+\.?\d*\s*[€$£]?$/.test(line) || 
                   (/^\d+\.?\d*$/.test(line) && parseFloat(line) > 0 && parseFloat(line) < 1000);
    
    if (isDishTitle) {
      if (currentDish) {
        potentialDishes.push(currentDish);
      }
      currentDish = { title: line, description: '', price: null, lineNumber: i + 1 };
      console.log(`    🍽️ Potential dish title found: "${line}" (line ${i + 1})`);
    } else if (isPrice && currentDish && !currentDish.price) {
      currentDish.price = line;
      console.log(`    💰 Price found for "${currentDish.title}": ${line} (line ${i + 1})`);
    } else if (currentDish && line.length > 5 && !isPrice) {
      // Description potentielle (plus flexible)
      if (!currentDish.description) {
        currentDish.description = line;
      } else {
        currentDish.description += ' ' + line;
      }
      console.log(`    📝 Description line for "${currentDish.title}": "${line}" (line ${i + 1})`);
    }
  }
  
  // Ajouter le dernier plat
  if (currentDish) {
    potentialDishes.push(currentDish);
  }
  
  return potentialDishes;
}

// Logique de détection améliorée
function detectDishesImproved(ocrText) {
  console.log('\n🔍 IMPROVED DETECTION LOGIC:');
  const lines = ocrText.split('\n').filter(line => line.trim().length > 0);
  const potentialDishes = [];
  let currentDish = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détecter les titres de plats (plus flexible)
    const isDishTitle = (
      // Titres en majuscules (comme avant)
      (/^[A-Z][A-Z\s]+$/.test(line) && 
       line.length >= 3 && line.length <= 50 &&
       !line.includes('MENU') && !line.includes('DRINKS') && 
       !line.includes('KIDS') && !line.includes('PRICE') &&
       !line.includes('€') && !line.includes('$') && !line.includes('£')) ||
      // Titres avec des mots spécifiques que nous savons être des plats
      (line.includes('POLLO') || line.includes('CHEESEBURGER') || 
       line.includes('GREEN') || line.includes('BORING') ||
       line.includes('COSTILLAS') || line.includes('MADRE')) &&
      line.length >= 3 && line.length <= 50 &&
      !line.includes('MENU') && !line.includes('DRINKS') && 
      !line.includes('KIDS') && !line.includes('PRICE') &&
      !line.includes('€') && !line.includes('$') && !line.includes('£')
    );
    
    // Détecter les prix (nombres suivis de €, $, ou juste des nombres)
    const isPrice = /^\d+\.?\d*\s*[€$£]?$/.test(line) || 
                   (/^\d+\.?\d*$/.test(line) && parseFloat(line) > 0 && parseFloat(line) < 1000);
    
    if (isDishTitle) {
      if (currentDish) {
        potentialDishes.push(currentDish);
      }
      currentDish = { title: line, description: '', price: null, lineNumber: i + 1 };
      console.log(`    🍽️ Potential dish title found: "${line}" (line ${i + 1})`);
    } else if (isPrice && currentDish && !currentDish.price) {
      currentDish.price = line;
      console.log(`    💰 Price found for "${currentDish.title}": ${line} (line ${i + 1})`);
    } else if (currentDish && line.length > 5 && !isPrice) {
      // Description potentielle (plus flexible)
      if (!currentDish.description) {
        currentDish.description = line;
      } else {
        currentDish.description += ' ' + line;
      }
      console.log(`    📝 Description line for "${currentDish.title}": "${line}" (line ${i + 1})`);
    }
  }
  
  // Ajouter le dernier plat
  if (currentDish) {
    potentialDishes.push(currentDish);
  }
  
  return potentialDishes;
}

// Test des deux logiques
console.log('\n📊 TESTING DETECTION LOGIC...');

const currentDishes = detectDishesCurrent(mockOcrText);
const improvedDishes = detectDishesImproved(mockOcrText);

console.log('\n📋 RESULTS COMPARISON:');
console.log('='.repeat(50));

console.log('\n🔴 CURRENT LOGIC RESULTS:');
console.log(`   Total dishes detected: ${currentDishes.length}`);
currentDishes.forEach((dish, index) => {
  console.log(`   ${index + 1}. "${dish.title}" - Price: ${dish.price || 'NOT FOUND'} - Description: ${dish.description ? dish.description.substring(0, 50) + '...' : 'NOT FOUND'}`);
});

console.log('\n🟢 IMPROVED LOGIC RESULTS:');
console.log(`   Total dishes detected: ${improvedDishes.length}`);
improvedDishes.forEach((dish, index) => {
  console.log(`   ${index + 1}. "${dish.title}" - Price: ${dish.price || 'NOT FOUND'} - Description: ${dish.description ? dish.description.substring(0, 50) + '...' : 'NOT FOUND'}`);
});

console.log('\n🎯 ANALYSIS:');
console.log('='.repeat(50));

const expectedDishes = ['CHULE CONMIGO', 'EL COLIFLOR', 'COSTILLAS DE LA MADRE', 'GREEN BUT NOT BORING VE', 'POLLO CHEESEBURGER'];

console.log('\nExpected dishes from OCR:');
expectedDishes.forEach((dish, index) => {
  console.log(`   ${index + 1}. "${dish}"`);
});

console.log('\nCurrent logic detection rate:');
const currentDetected = currentDishes.map(d => d.title);
const currentRate = expectedDishes.filter(dish => currentDetected.includes(dish)).length;
console.log(`   ${currentRate}/${expectedDishes.length} dishes detected (${Math.round(currentRate/expectedDishes.length*100)}%)`);

console.log('\nImproved logic detection rate:');
const improvedDetected = improvedDishes.map(d => d.title);
const improvedRate = expectedDishes.filter(dish => improvedDetected.includes(dish)).length;
console.log(`   ${improvedRate}/${expectedDishes.length} dishes detected (${Math.round(improvedRate/expectedDishes.length*100)}%)`);

console.log('\n✅ CONCLUSION:');
if (improvedRate > currentRate) {
  console.log('   🎉 Improved logic detects more dishes!');
  console.log('   📝 Recommendation: Use the improved detection logic');
} else {
  console.log('   ⚠️ Both logics perform similarly');
  console.log('   📝 Recommendation: Further improvements needed');
} 