import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function analyzeDish(menuText, userProfile) {
  console.log('=== DISH ANALYSIS START ===');
  console.log('Dish text:', menuText);
  console.log('User profile:', userProfile);
  
  // Vérifier la clé API
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI API KEY MISSING for dish analysis');
    throw new Error('OpenAI API key is missing for dish analysis');
  }
  console.log('✅ OpenAI API key present for dish analysis');
  
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

    const prompt = `Analyze this dish for a user with the following profile: ${JSON.stringify(completeUserProfile, null, 2)}.

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

If analysis is not possible or the dish description is unclear, respond with:
{ "error": "Unable to analyze" }

Otherwise, return a JSON object with exactly these fields:

{
  "aiScore": 0-10 (float, relevance to user profile & needs),
  "calories": integer (kcal),
  "macros": {
    "protein": integer (grams),
    "carbs": integer (grams), 
    "fats": integer (grams)
  },
  "shortJustification": "One sentence explaining why this dish was recommended",
  "longJustification": [
    "First bullet point about nutritional benefits",
    "Second bullet point about user preference match",
    "Third bullet point about health goals alignment"
  ]
}

Dish: ${menuText}

Provide all analysis and explanations in English. Avoid French or other languages.
Output ONLY the JSON response, nothing else.`;

    console.log('📤 Sending dish analysis request to OpenAI...');
    console.log('Prompt length:', prompt.length);
    
    // Optimized for cost reduction
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a nutrition expert that analyzes dishes for personalized recommendations. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Be precise with nutritional values and provide meaningful justifications. Provide all analysis and explanations in English only." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    console.log('📥 Raw dish analysis response:', completion);

    const responseText = completion.choices[0]?.message?.content;
    console.log('📄 Raw dish analysis response text:', responseText);
    
    if (!responseText) {
      console.error('❌ No response text received from OpenAI for dish analysis');
      throw new Error('No response received from OpenAI API for dish analysis');
    }

    let cleanedResponse = responseText.trim();
    console.log('🧹 Cleaned dish analysis response:', cleanedResponse);
    
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/```\n?/, '');
    }
    
    console.log('🔧 Final cleaned dish analysis response for parsing:', cleanedResponse);

    // Validation JSON avant parsing
    if (!cleanedResponse.trim().startsWith('{') || !cleanedResponse.trim().endsWith('}')) {
      console.error('❌ Invalid JSON format - response does not start with { and end with }');
      console.error('Raw response:', cleanedResponse);
      return {
        error: "Invalid JSON response from AI",
        aiScore: 5.0,
        calories: 0,
        macros: { protein: 0, carbs: 0, fats: 0 },
        shortJustification: "AI returned invalid response format",
        longJustification: ["Response format error", "Unable to parse AI analysis", "Please try again"]
      };
    }

    let analysis;
    try {
      analysis = JSON.parse(cleanedResponse);
      console.log('✅ Dish analysis JSON parsed successfully:', analysis);
    } catch (parseError) {
      console.error('❌ Dish analysis JSON parsing error:', parseError);
      console.error('Failed to parse dish analysis:', cleanedResponse);
      return {
        error: `JSON parsing failed: ${parseError.message}`,
        aiScore: 5.0,
        calories: 0,
        macros: { protein: 0, carbs: 0, fats: 0 },
        shortJustification: "Failed to parse AI response",
        longJustification: ["JSON parsing error", "AI response was malformed", "Please try again"]
      };
    }

    // Vérifier si l'API a retourné une erreur
    if (analysis.error) {
      console.error('❌ API returned error:', analysis.error);
      return {
        error: analysis.error,
        aiScore: 5.0,
        calories: 0,
        macros: { protein: 0, carbs: 0, fats: 0 },
        shortJustification: `Analysis failed: ${analysis.error}`,
        longJustification: ["AI analysis failed", "Unable to process dish information", "Please try again"]
      };
    }
    
    // Validation des champs requis
    const requiredFields = ['aiScore', 'calories', 'macros', 'shortJustification', 'longJustification'];
    const missingFields = requiredFields.filter(field => !(field in analysis));
    if (missingFields.length > 0) {
      throw new Error(`Missing fields in analysis: ${missingFields.join(', ')}`);
    }

    // Validation des macros
    const requiredMacros = ['protein', 'carbs', 'fats'];
    const missingMacros = requiredMacros.filter(macro => !(macro in analysis.macros));
    if (missingMacros.length > 0) {
      throw new Error(`Macronutriments manquants: ${missingMacros.join(', ')}`);
    }

    // Validation et nettoyage des données
    const validatedAnalysis = {
      aiScore: Math.max(0, Math.min(10, parseFloat(analysis.aiScore) || 0)),
      calories: Math.max(0, parseInt(analysis.calories) || 0),
      macros: {
        protein: Math.max(0, parseInt(analysis.macros.protein) || 0),
        carbs: Math.max(0, parseInt(analysis.macros.carbs) || 0),
        fats: Math.max(0, parseInt(analysis.macros.fats) || 0)
      },
      shortJustification: analysis.shortJustification || 'Analysis not available',
      longJustification: Array.isArray(analysis.longJustification) 
        ? analysis.longJustification.slice(0, 3) 
        : ['Detailed analysis not available']
    };

    console.log('🎉 Final dish analysis result:', validatedAnalysis);
    console.log('=== DISH ANALYSIS SUCCESS ===');
    return validatedAnalysis;

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
      shortJustification: `Unable to analyze this dish: ${error.message}`,
      longJustification: [
        'Nutritional analysis failed due to API error',
        'Recommendation based on limited data',
        'Please try again or contact support'
      ]
    };
  }
}

// Fonction utilitaire pour analyser plusieurs plats
export async function analyzeMultipleDishes(dishes, userProfile) {
  try {
    const analyses = await Promise.all(
      dishes.map(async (dish) => {
        try {
          const dishText = `${dish.name}: ${dish.description}`;
          const analysis = await analyzeDish(dishText, userProfile);
          return {
            ...dish,
            ...analysis,
            protein: analysis.macros.protein,
            carbs: analysis.macros.carbs,
            fats: analysis.macros.fats
          };
        } catch (error) {
          console.error(`Erreur lors de l'analyse du plat ${dish.name}:`, error);
          return {
            ...dish,
            aiScore: 5.0,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            shortJustification: 'Analyse non disponible',
            longJustification: ['Analyse non disponible']
          };
        }
      })
    );
    
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
      shortJustification: 'Analyse non disponible',
      longJustification: ['Analyse non disponible']
    }));
  }
}

export default { analyzeDish, analyzeMultipleDishes }; 