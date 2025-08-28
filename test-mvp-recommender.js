// Test simple pour le MVP Recommender
import { scoreAndLabel } from './src/lib/mvpRecommender.js';

// Test avec des plats fictifs
const testDishes = [
  {
    title: "GRILLED CHICKEN SALAD",
    description: "Fresh mixed greens with grilled chicken breast, avocado, cherry tomatoes, and balsamic vinaigrette",
    price: 15.50
  },
  {
    title: "QUINOA BOWL",
    description: "Quinoa with roasted vegetables, hummus, and olive oil dressing",
    price: 12.00
  },
  {
    title: "CREAMY PASTA CARBONARA",
    description: "Fettuccine with creamy sauce, bacon, and parmesan cheese",
    price: 18.00
  },
  {
    title: "GRILLED SALMON",
    description: "Atlantic salmon with lemon herb butter and steamed vegetables",
    price: 22.00
  }
];

console.log('🧪 Testing MVP Recommender...');
console.log('📝 Input dishes:', testDishes.length);

try {
  const result = scoreAndLabel(testDishes);
  
  console.log('✅ MVP Recommender executed successfully');
  console.log('🏆 Top3 results:');
  result.top3.forEach((dish, index) => {
    console.log(`  ${index + 1}. ${dish.title} - Score: ${dish.score}/10 - Label: ${dish.label}`);
    console.log(`     Reasons: ${dish.reasons.join(', ')}`);
    console.log(`     Debug: Raw=${dish.debug.raw}, CatScores=${JSON.stringify(dish.debug.catScores)}`);
  });
  
  console.log('📊 All dishes scored:', result.all.length);
  
} catch (error) {
  console.error('❌ Error testing MVP Recommender:', error);
}
