import OpenAI from 'openai';

// Initialisation du client OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Nécessaire pour Vite/React
});

/**
 * Obtient les 3 meilleures recommandations de plats basées sur le menu et le profil utilisateur
 * @param {string} menuText - Texte extrait du menu
 * @param {Object} userProfile - Profil utilisateur avec préférences
 * @returns {Promise<Array>} - Liste des 3 meilleures recommandations
 */
export async function getTopRecommendations(menuText, userProfile) {
  try {
    // Validation des entrées
    if (!menuText) {
      throw new Error('Texte du menu requis');
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
    const prompt = `You are a nutrition assistant. Based on the following menu and user profile, select the 3 best dishes that match their health and dietary needs.

Menu:
${menuText}

User Profile:
- Age: ${completeUserProfile.age || 'Not provided'}
- Weight: ${completeUserProfile.weight || 'Not provided'} kg
- Height: ${completeUserProfile.height || 'Not provided'} cm
- Activity Level: ${completeUserProfile.activityLevel || 'Not provided'}
- Goal: ${completeUserProfile.goal || 'Not provided'}
- Dietary Preferences: ${extendedProfile.dietaryPreferences ? extendedProfile.dietaryPreferences.join(', ') : 'Not provided'}

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

If analysis is not possible or the menu is unclear, respond with:
{ "error": "Unable to analyze" }

Otherwise, return exactly 3 dishes in this exact JSON format:
[
  {
    "title": "Dish name",
    "description": "Brief description",
    "tags": ["tag1", "tag2"],
    "price": "price if mentioned"
  }
]

Provide all analysis and explanations in English. Avoid French or other languages.
Output ONLY the JSON response, nothing else.`;

    console.log('📤 Sending request to OpenAI API...');
    console.log('Prompt length:', prompt.length);

    // Optimized for cost reduction
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a nutrition assistant that provides personalized food recommendations. You must respond with ONLY valid JSON format. No additional text, commentary, or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Provide all analysis and explanations in English only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    console.log('📥 Raw OpenAI response:', completion);

    const responseText = completion.choices[0]?.message?.content;
    console.log('📄 Raw response text:', responseText);

    if (!responseText) {
      console.error('❌ No response text received from OpenAI');
      throw new Error('No response received from OpenAI API');
    }

    let cleanedResponse = responseText.trim();
    console.log('🧹 Cleaned response:', cleanedResponse);

    // Supprimer les backticks et "json" si présents
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/```\n?/, '');
    }

    console.log('🔧 Final cleaned response for parsing:', cleanedResponse);

    // Validation JSON avant parsing
    if (!cleanedResponse.trim().startsWith('[') && !cleanedResponse.trim().startsWith('{')) {
      console.error('❌ Invalid JSON format - response does not start with [ or {');
      console.error('Raw response:', cleanedResponse);
      return [
        {
          title: "Invalid Response",
          description: "AI returned invalid response format. Please try again.",
          tags: ["error", "format"],
          price: null
        },
        {
          title: "Check API",
          description: "Verify your OpenAI API key and try scanning again.",
          tags: ["error", "api"],
          price: null
        },
        {
          title: "Contact Support",
          description: "If the problem persists, contact our support team.",
          tags: ["error", "support"],
          price: null
        }
      ];
    }

    // Parsing du JSON
    let recommendations;
    try {
      recommendations = JSON.parse(cleanedResponse);
      console.log('✅ JSON parsed successfully:', recommendations);
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      console.error('Failed to parse:', cleanedResponse);
      return [
        {
          title: "Parse Error",
          description: `Failed to parse AI response: ${parseError.message}`,
          tags: ["error", "parse"],
          price: null
        },
        {
          title: "Try Again",
          description: "The response was malformed. Please try scanning again.",
          tags: ["error", "retry"],
          price: null
        },
        {
          title: "Check Menu",
          description: "Ensure the menu text is clear and readable.",
          tags: ["error", "menu"],
          price: null
        }
      ];
    }

    // Vérifier si l'API a retourné une erreur
    if (typeof recommendations === 'object' && recommendations.error) {
      console.error('❌ API returned error:', recommendations.error);
      return [
        {
          title: "Analysis Failed",
          description: `AI analysis failed: ${recommendations.error}`,
          tags: ["error", "analysis"],
          price: null
        },
        {
          title: "Try Again",
          description: "The menu might be unclear. Try scanning again with better lighting.",
          tags: ["error", "retry"],
          price: null
        },
        {
          title: "Check Menu",
          description: "Ensure the menu text is clear and readable.",
          tags: ["error", "menu"],
          price: null
        }
      ];
    }
    
    if (!Array.isArray(recommendations)) {
      console.error('❌ Response is not an array:', typeof recommendations);
      return [
        {
          title: "Invalid Format",
          description: "AI returned wrong format. Expected array of dishes.",
          tags: ["error", "format"],
          price: null
        },
        {
          title: "Try Again",
          description: "Please try scanning the menu again.",
          tags: ["error", "retry"],
          price: null
        },
        {
          title: "Contact Support",
          description: "If the problem persists, contact our support team.",
          tags: ["error", "support"],
          price: null
        }
      ];
    }

    // Validation et nettoyage des recommandations
    const validatedRecommendations = recommendations.slice(0, 3).map((dish, index) => ({
      id: index + 1,
      title: dish.title || `Dish ${index + 1}`,
      description: dish.description || 'No description available',
      tags: Array.isArray(dish.tags) ? dish.tags : [],
      price: dish.price || null
    }));

    console.log('✅ Final validated recommendations:', validatedRecommendations);
    return validatedRecommendations;

  } catch (error) {
    console.error('❌ Error in getTopRecommendations:', error);
    
    // Retour de recommandations par défaut en cas d'erreur
    return [
      {
        id: 1,
        title: "Error occurred",
        description: "Unable to generate recommendations. Please try again.",
        tags: ["error"],
        price: null
      },
      {
        id: 2,
        title: "Check connection",
        description: "Verify your internet connection and API keys.",
        tags: ["error", "connection"],
        price: null
      },
      {
        id: 3,
        title: "Contact support",
        description: "If the problem persists, contact our support team.",
        tags: ["error", "support"],
        price: null
      }
    ];
  }
} 