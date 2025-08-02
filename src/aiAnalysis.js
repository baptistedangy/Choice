import OpenAI from 'openai';

// Initialisation du client OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Nécessaire pour Vite/React
});

/**
 * Analyse un plat pour un utilisateur avec un profil spécifique
 * @param {string} dishText - Description du plat à analyser
 * @param {Object} userProfile - Profil utilisateur avec préférences et objectifs
 * @returns {Promise<Object>} - Analyse du plat avec score, calories, macronutriments et justification
 */
export async function analyzeDish(dishText, userProfile) {
  try {
    // Validation des entrées
    if (!dishText) {
      throw new Error('Description du plat requise');
    }

    if (!userProfile) {
      throw new Error('Profil utilisateur requis');
    }

    // Récupération du profil étendu depuis localStorage
    let extendedProfile = {};
    try {
      const savedExtendedProfile = localStorage.getItem('extendedProfile');
      if (savedExtendedProfile) {
        extendedProfile = JSON.parse(savedExtendedProfile);
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération du profil étendu:', error);
    }

    // Fusion du profil de base avec le profil étendu
    const completeUserProfile = {
      ...userProfile,
      ...extendedProfile
    };

    // Construction du prompt pour OpenAI
    const prompt = `Analyze this dish for a user with the following profile: ${JSON.stringify(completeUserProfile, null, 2)}.

Return a JSON object with:

aiScore (0–10, relevance to user profile & needs),
calories (kcal),
protein (g),
carbs (g),
fats (g),
shortJustification (1 sentence explaining why it was recommended).

Dish: ${dishText}

Provide the analysis and explanation in English. Avoid French or other languages.
Please return only valid JSON, no additional text.`;

    // Appel à l'API OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert that analyzes dishes for personalized recommendations. Always respond with valid JSON format containing nutritional analysis and scoring. Provide all analysis and explanations in English only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    // Extraction de la réponse
    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Aucune réponse reçue d\'OpenAI');
    }

    // Nettoyage et parsing de la réponse JSON
    let cleanedResponse = responseText.trim();
    
    // Supprimer les backticks et "json" si présents
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/```\n?/, '');
    }

    // Parsing du JSON
    const analysis = JSON.parse(cleanedResponse);

    // Validation des champs requis
    const requiredFields = ['aiScore', 'calories', 'protein', 'carbs', 'fats', 'shortJustification'];
    const missingFields = requiredFields.filter(field => !(field in analysis));

    if (missingFields.length > 0) {
      throw new Error(`Champs manquants dans l'analyse: ${missingFields.join(', ')}`);
    }

    // Retour de l'analyse formatée
    return {
      aiScore: analysis.aiScore,
      calories: analysis.calories,
      macros: {
        protein: analysis.protein,
        carbs: analysis.carbs,
        fats: analysis.fats
      },
      shortJustification: analysis.shortJustification
    };

  } catch (error) {
    console.error('Erreur lors de l\'analyse du plat:', error);
    
    // Retour d'une analyse par défaut en cas d'erreur
    return {
      aiScore: 5.0,
      calories: 0,
      macros: {
        protein: 0,
        carbs: 0,
        fats: 0
      },
      shortJustification: 'Analyse non disponible'
    };
  }
}

/**
 * Analyse plusieurs plats en parallèle
 * @param {Array} dishes - Liste des plats à analyser
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Promise<Array>} - Liste des analyses
 */
export async function analyzeMultipleDishes(dishes, userProfile) {
  try {
    const analysisPromises = dishes.map(dish => 
      analyzeDish(dish.title || dish.name, userProfile)
    );
    
    const analyses = await Promise.all(analysisPromises);
    
    // Fusion des analyses avec les plats
    return dishes.map((dish, index) => ({
      ...dish,
      ...analyses[index]
    }));
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse multiple:', error);
    return dishes.map(dish => ({
      ...dish,
      aiScore: 5.0,
      calories: 0,
      macros: { protein: 0, carbs: 0, fats: 0 },
      shortJustification: 'Analyse non disponible'
    }));
  }
} 