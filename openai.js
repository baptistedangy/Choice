import OpenAI from 'openai';

// Initialisation du client OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Nécessaire pour Vite/React
});

/**
 * Safe JSON parser with error handling and cleaning
 * @param {string} jsonString - The JSON string to parse
 * @returns {Object} - Parsed JSON or fallback error object
 */
function safeJsonParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error('❌ JSON parsing error:', parseError);
    console.error('Failed to parse:', jsonString);
    
    // Attempt to clean the JSON string
    let cleanedString = jsonString.trim();
    
    // Remove markdown code blocks
    if (cleanedString.startsWith('```json')) {
      cleanedString = cleanedString.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (cleanedString.startsWith('```')) {
      cleanedString = cleanedString.replace(/```\n?/, '').replace(/```\n?/, '');
    }
    
    // Remove trailing commas
    cleanedString = cleanedString.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unclosed strings
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    let cleanedChars = [];
    
    for (let i = 0; i < cleanedString.length; i++) {
      const char = cleanedString[i];
      
      if (escapeNext) {
        cleanedChars.push(char);
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        cleanedChars.push(char);
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        cleanedChars.push(char);
        continue;
      }
      
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }
      
      cleanedChars.push(char);
    }
    
    // Close unclosed strings and structures
    if (inString) {
      cleanedChars.push('"');
    }
    
    while (braceCount > 0) {
      cleanedChars.push('}');
      braceCount--;
    }
    
    while (bracketCount > 0) {
      cleanedChars.push(']');
      bracketCount--;
    }
    
    cleanedString = cleanedChars.join('');
    
    // Try parsing again
    try {
      return JSON.parse(cleanedString);
    } catch (secondError) {
      console.error('❌ Second JSON parsing attempt failed:', secondError);
      console.error('Raw response that failed to parse:', jsonString);
      
      // Return fallback error object
      return {
        status: "error",
        message: "Unable to analyze menu",
        error: parseError.message
      };
    }
  }
}

/**
 * Extrait des plats basiques du texte du menu quand l'IA ne peut pas analyser
 * @param {string} menuText - Texte du menu
 * @returns {Array} - Liste de plats basiques
 */
function extractBasicDishesFromText(menuText) {
  if (!menuText) return [];
  
  console.log('🔄 Extracting basic dishes from text...');
  console.log('Text length:', menuText.length);
  console.log('Text preview:', menuText.substring(0, 200));
  
  const dishes = [];
  const lines = menuText.split('\n').filter(line => line.trim());
  
  console.log('Number of lines:', lines.length);
  
  // Patterns pour détecter des plats
  const dishPatterns = [
    // Pattern: "Nom du plat - Prix€"
    /^([^-€\d]+?)\s*[-–]\s*(\d+[€$£¥]?)/i,
    // Pattern: "Nom du plat Prix€"
    /^([^-€\d]+?)\s+(\d+[€$£¥]?)/i,
    // Pattern: "- Nom du plat"
    /^[-–]\s*([^-€\d]+?)(?:\s*[-–]\s*(\d+[€$£¥]?))?/i,
    // Pattern: "Nom du plat: Description"
    /^([^:]+?):\s*([^-€\d]+?)(?:\s*[-–]\s*(\d+[€$£¥]?))?/i,
    // Pattern: "NOM DU PLAT" (en majuscules)
    /^([A-Z\s]+?)(?:\s*[-–]\s*(\d+[€$£¥]?))?$/,
    // Pattern: "Nom du plat" (avec des mots en majuscules)
    /^([A-Z][a-z\s]+?)(?:\s*[-–]\s*(\d+[€$£¥]?))?$/
  ];
  
  // Mots-clés pour identifier des plats (plus étendus)
  const foodKeywords = [
    'salade', 'soupe', 'steak', 'poisson', 'poulet', 'veau', 'agneau',
    'pasta', 'pâtes', 'risotto', 'pizza', 'burger', 'sandwich',
    'crème', 'tarte', 'dessert', 'glace', 'gâteau', 'mousse',
    'entrée', 'plat', 'dessert', 'fromage', 'charcuterie',
    'ceviche', 'coliflor', 'costillas', 'pollo', 'quesadilla',
    'menu', 'drinks', 'kids', 'asados', 'green', 'boring'
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 3) continue;
    
    console.log('Processing line:', trimmedLine);
    
    // Vérifier si la ligne contient des mots-clés de nourriture
    const hasFoodKeyword = foodKeywords.some(keyword => 
      trimmedLine.toLowerCase().includes(keyword)
    );
    
    // Vérifier si la ligne contient des prix
    const hasPrice = /\d+[€$£¥]/.test(trimmedLine);
    
    // Vérifier si la ligne est en majuscules (souvent des noms de plats)
    const isAllCaps = /^[A-Z\s]+$/.test(trimmedLine);
    
    if (hasFoodKeyword || hasPrice || isAllCaps) {
      console.log('Found potential dish:', trimmedLine);
      
      // Essayer d'extraire le nom et le prix
      let dishName = trimmedLine;
      let price = null;
      
      for (const pattern of dishPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          dishName = match[1]?.trim() || trimmedLine;
          price = match[2] || match[3] || null;
          break;
        }
      }
      
      // Nettoyer le nom du plat
      dishName = dishName
        .replace(/^[-–•]\s*/, '') // Enlever les tirets au début
        .replace(/\s*[-–]\s*\d+[€$£¥]?\s*$/, '') // Enlever le prix à la fin
        .trim();
      
      if (dishName.length > 2) {
        console.log('Adding dish:', dishName, 'Price:', price);
        dishes.push({
          title: dishName,
          description: `Extracted from menu: ${dishName}`,
          tags: ["extracted", "basic"],
          price: price || null
        });
      }
    }
  }
  
  console.log('Extracted dishes:', dishes);
  
  // Limiter à 3 plats maximum
  return dishes.slice(0, 3);
}

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

    // Fonction pour générer des règles alimentaires dynamiques
    const generateDietaryRules = (dietaryPreferences, goal) => {
      const rules = [];
      
      if (dietaryPreferences && dietaryPreferences.length > 0) {
        dietaryPreferences.forEach(pref => {
          switch (pref) {
            case 'vegan':
              rules.push('- VEGAN: EXCLUDE all animal products (meat, fish, poultry, dairy, eggs, honey, gelatin)');
              break;
            case 'vegetarian':
              rules.push('- VEGETARIAN: EXCLUDE all meat, fish, poultry, and animal products');
              break;
            case 'pescatarian':
              rules.push('- PESCATARIAN: EXCLUDE all meat and poultry, but fish/seafood is allowed');
              break;
            case 'gluten-free':
              rules.push('- GLUTEN-FREE: EXCLUDE wheat, barley, rye, and any gluten-containing ingredients');
              break;
            case 'dairy-free':
              rules.push('- DAIRY-FREE: EXCLUDE milk, cheese, yogurt, butter, cream, and dairy derivatives');
              break;
            case 'nut-free':
              rules.push('- NUT-FREE: EXCLUDE all nuts (peanuts, almonds, walnuts, cashews, etc.) and nut products');
              break;
            case 'low-carb':
              rules.push('- LOW-CARB: PRIORITIZE dishes with <30g carbs per serving, avoid high-carb foods (bread, pasta, rice, potatoes)');
              break;
            case 'keto':
              rules.push('- KETO: PRIORITIZE high-fat, very low-carb dishes (<20g net carbs), avoid all grains, sugars, most fruits');
              break;
            case 'paleo':
              rules.push('- PALEO: EXCLUDE grains, legumes, dairy, processed foods, refined sugars; PRIORITIZE meat, fish, vegetables, fruits, nuts');
              break;
            case 'mediterranean':
              rules.push('- MEDITERRANEAN: PRIORITIZE fish, olive oil, vegetables, whole grains, legumes; moderate red meat and dairy');
              break;
          }
        });
      }
      
      // Règles basées sur l'objectif
      if (goal) {
        switch (goal) {
          case 'lose':
            rules.push('- WEIGHT LOSS: PRIORITIZE lower-calorie dishes, high protein, high fiber, avoid high-calorie/fatty foods');
            break;
          case 'gain':
            rules.push('- WEIGHT GAIN: PRIORITIZE higher-calorie dishes with good protein content, healthy fats');
            break;
          case 'maintain':
            rules.push('- WEIGHT MAINTENANCE: PRIORITIZE balanced meals with moderate calories and good nutrition');
            break;
        }
      }
      
      return rules.join('\n');
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

CRITICAL DIETARY COMPLIANCE RULES:
${generateDietaryRules(extendedProfile.dietaryPreferences, completeUserProfile.goal)}

GENERAL COMPLIANCE RULES:
- ONLY recommend dishes that STRICTLY comply with ALL user preferences and restrictions
- PRIORITIZE dishes that align with the user's health goals
- If multiple dietary restrictions apply, ALL must be satisfied
- If no compliant dishes are found, return fewer dishes rather than non-compliant ones
- Consider nutritional balance and health benefits when ranking compliant dishes

CRITICAL: You must respond with ONLY valid JSON. No additional text, commentary, or explanations outside the JSON.

ANALYSIS INSTRUCTIONS:
1. Look for any text that could be dish names, even if incomplete or unclear
2. Look for numbers that could be prices (€, $, £, ¥ symbols or just numbers)
3. Look for food-related words like: menu, plat, entrée, dessert, salade, viande, poisson, pasta, pizza, burger, steak, etc.
4. Even if the text is partially unclear, try to extract ANY recognizable dish information
5. If you find ANY dish-like text, create a dish entry with the best possible information
6. FILTER OUT dishes that don't match dietary preferences before ranking

If the menu text is completely empty, contains no recognizable food words, or is completely unreadable, respond with:
{ "error": "Unable to analyze" }

Otherwise, return up to 3 dishes in this exact JSON format (only include dietary-compliant dishes):
[
  {
    "title": "Dish name (or best guess)",
    "description": "Brief description or 'Extracted from menu'",
    "tags": ["extracted", "menu"],
    "price": "price if found, otherwise null"
  }
]

IMPORTANT: Be very tolerant of unclear text. If you see ANY food-related content, try to extract it. Only return "Unable to analyze" if the text is completely empty or contains no food-related words at all. However, ALWAYS prioritize dietary compliance over quantity of recommendations.

Provide all analysis and explanations in English. Avoid French or other languages.
Output ONLY the JSON response, nothing else.`;

    console.log('📤 Sending request to OpenAI API...');
    console.log('Prompt length:', prompt.length);
    console.log('=== MENU TEXT BEING SENT TO AI ===');
    console.log('Menu text length:', menuText?.length);
    console.log('Menu text preview (first 300 chars):', menuText?.substring(0, 300));
    console.log('Menu text contains food words:', /(menu|plat|entrée|dessert|salade|viande|poisson|pasta|pizza|burger|steak|chicken|fish|meat)/i.test(menuText));
    console.log('Menu text contains prices:', /\d+[€$£¥]/.test(menuText));
    console.log('Menu text contains numbers:', /\d/.test(menuText));
    console.log('Full menu text:', menuText);
    console.log('=== END MENU TEXT ===');

    // Optimized for cost reduction
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a nutrition assistant that provides personalized food recommendations. Only recommend meals that strictly align with the user's dietary preferences (e.g., vegetarian, vegan, etc.). Discard or downgrade meals that do not comply. Respond with ONLY valid JSON format. No commentary or explanations outside the JSON. If analysis is not possible, return { \"error\": \"Unable to analyze\" }. Provide all analysis and explanations in English only. Keep descriptions short and concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    console.log('📥 Raw OpenAI response:', completion);

    const responseText = completion.choices[0]?.message?.content;
    console.log('📄 Raw response text:', responseText);

    if (!responseText) {
      console.error('❌ No response text received from OpenAI');
      throw new Error('No response received from OpenAI API');
    }

    // Use safe JSON parsing
    const recommendations = safeJsonParse(responseText);
    
    // Check if parsing returned an error
    if (recommendations.status === "error") {
      console.error('❌ JSON parsing failed:', recommendations.message);
      return [
        {
          title: "Parse Error",
          description: `Failed to parse AI response: ${recommendations.message}`,
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
      
      // Essayer d'extraire des plats basiques du texte même si l'IA ne peut pas analyser
      const basicDishes = extractBasicDishesFromText(menuText);
      
      if (basicDishes.length > 0) {
        console.log('🔄 Using basic dish extraction as fallback:', basicDishes);
        return basicDishes;
      }
      
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