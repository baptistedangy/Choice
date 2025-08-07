import { analyzeDishBackend, analyzeMultipleDishesBackend } from './services/backendService';

export async function analyzeDish(menuText, userProfile) {
  console.log('=== DISH ANALYSIS START ===');
  console.log('Dish text:', menuText);
  console.log('User profile:', userProfile);
  
  // Log dish name extraction
  const dishName = menuText.split(':')[0] || 'Unknown Dish';
  console.log('🍽️ Analyzing dish:', dishName);
  console.log('📝 Raw text from OCR:', menuText);
  console.log('🔍 Dish name extracted:', dishName);
  
  // Validate dish data - More permissive validation
  const hasValidName = dishName && dishName !== 'Unknown Dish' && dishName.length >= 2;
  const hasValidText = menuText && menuText.length > 0;
  const hasAnyDescription = menuText.includes(':') && menuText.split(':')[1] && menuText.split(':')[1].trim().length > 0;
  
  console.log('📊 Dish validation (PERMISSIVE):');
  console.log(`  - Has valid name: ${hasValidName}`);
  console.log(`  - Has valid text: ${hasValidText}`);
  console.log(`  - Has any description: ${hasAnyDescription}`);
  console.log(`  - Text length: ${menuText.length}`);
  
  try {
    if (!menuText) throw new Error('Dish description required');
    if (!userProfile) throw new Error('User profile required');

    // Récupérer le profil étendu depuis localStorage
    let extendedProfile = {};
    try {
      const savedExtendedProfile = localStorage.getItem('extendedProfile');
      if (savedExtendedProfile) {
        extendedProfile = JSON.parse(savedExtendedProfile);
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération du profil étendu:', error);
    }

    const completeUserProfile = { ...userProfile, ...extendedProfile };

    console.log('📤 Sending dish analysis request to backend...');
    
    // Use backend service instead of direct OpenAI call
    const analysis = await analyzeDishBackend(menuText, completeUserProfile);
    
    console.log('🎉 Final dish analysis result:', analysis);
    console.log('📊 Analysis summary for', dishName, ':');
    console.log(`  - AI Score: ${analysis.aiScore || 'N/A'}`);
    console.log(`  - Calories: ${analysis.calories || 'N/A'}`);
    console.log(`  - Protein: ${analysis.macros?.protein || 'N/A'}`);
    console.log(`  - Carbs: ${analysis.macros?.carbs || 'N/A'}`);
    console.log(`  - Fats: ${analysis.macros?.fats || 'N/A'}`);
    console.log(`  - Has error: ${!!analysis.error}`);
    console.log(`  - Error message: ${analysis.error || 'None'}`);
    
    // More permissive inclusion criteria - only exclude if GPT call completely failed
    const shouldExclude = analysis.error && analysis.error.includes('Service temporarily unavailable');
    if (shouldExclude) {
      console.log(`❌ DISH EXCLUDED: "${dishName}" - Reason: ${analysis.error}`);
    } else {
      console.log(`✅ DISH INCLUDED: "${dishName}" - Score: ${analysis.aiScore || 'Default 5.0'}`);
    }
    
    console.log('=== DISH ANALYSIS SUCCESS ===');
    return analysis;

  } catch (error) {
    console.error('❌ DISH ANALYSIS FAILED ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Retourner une analyse par défaut en cas d'erreur
    return {
      aiScore: 5.0,
      calories: 0,
      macros: {
        protein: 0,
        carbs: 0,
        fats: 0
      },
      shortJustification: `Service temporarily unavailable: ${error.message}`,
      longJustification: [
        'Nutritional analysis service is currently unavailable',
        'Please try again later or contact support',
        'Recommendation based on limited data'
      ]
    };
  }
}

// Fonction utilitaire pour analyser plusieurs plats
export async function analyzeMultipleDishes(dishes, userProfile) {
  try {
    console.log('📤 Sending multiple dishes analysis request to backend...');
    
    // Use backend service instead of direct OpenAI calls
    const analyses = await analyzeMultipleDishesBackend(dishes, userProfile);
    
    console.log('✅ Multiple dishes analysis completed');
    return analyses;
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse de plusieurs plats:', error);
    return dishes.map(dish => ({
      ...dish,
      aiScore: 5.0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      shortJustification: `Service temporarily unavailable: ${error.message}`,
      longJustification: [
        'Nutritional analysis service is currently unavailable',
        'Please try again later or contact support',
        'Recommendation based on limited data'
      ]
    }));
  }
}

export default { analyzeDish, analyzeMultipleDishes }; 