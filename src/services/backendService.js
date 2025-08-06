// Service pour communiquer avec le backend Express
const BACKEND_URL = 'http://localhost:3001';

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
 * Analyse un plat via le backend
 * @param {string} dishText - Description du plat à analyser
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Promise<Object>} - Analyse du plat
 */
export async function analyzeDishBackend(dishText, userProfile) {
  try {
    console.log('📤 Sending dish analysis request to backend...');
    
    const response = await fetch(`${BACKEND_URL}/api/analyze-dish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dishText,
        userProfile
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Dish analysis failed');
    }
    
    console.log('✅ Dish analysis completed via backend');
    console.log('Analysis result:', result.analysis);
    
    return result.analysis;
    
  } catch (error) {
    console.error('❌ Error analyzing dish via backend:', error);
    
    // Return fallback analysis with error message
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

/**
 * Analyse plusieurs plats via le backend
 * @param {Array} dishes - Liste des plats à analyser
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Promise<Array>} - Liste des analyses
 */
export async function analyzeMultipleDishesBackend(dishes, userProfile) {
  try {
    console.log('📤 Sending multiple dishes analysis request to backend...');
    
    const response = await fetch(`${BACKEND_URL}/api/analyze-dishes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dishes,
        userProfile
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Multiple dishes analysis failed');
    }
    
    console.log('✅ Multiple dishes analysis completed via backend');
    console.log('Analyses count:', result.analyses?.length);
    
    return result.analyses;
    
  } catch (error) {
    console.error('❌ Error analyzing multiple dishes via backend:', error);
    
    // Return fallback analyses with error message
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

/**
 * Analyse complète d'une image de menu (extraction + recommandations)
 * @param {string} imageBase64 - Image encodée en base64
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Promise<Object>} - Résultat de l'analyse
 */
export async function analyzeMenuImage(imageBase64, userProfile) {
  try {
    console.log('📤 Sending image for comprehensive analysis...');
    
    // Convertir base64 en Blob
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    // Créer FormData
    const formData = new FormData();
    formData.append('image', blob, 'menu.jpg');
    formData.append('userProfile', JSON.stringify(userProfile));
    
    // Appel au backend
    const response = await fetch(`${BACKEND_URL}/analyze-image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === "error") {
      throw new Error(result.message || 'Analysis failed');
    }
    
    // Handle partial results
    if (result.status === "partial") {
      console.log('⚠️ Partial analysis results received');
      console.log('Partial recommendations:', result.recommendations);
      return {
        extractedText: result.extractedText || "Texte extrait avec succès",
        recommendations: result.recommendations || []
      };
    }
    
    console.log('✅ Comprehensive analysis completed via backend');
    console.log('Extracted text length:', result.extractedText?.length);
    console.log('Recommendations count:', result.recommendations?.length);
    
    return {
      extractedText: result.extractedText,
      recommendations: result.recommendations
    };
    
  } catch (error) {
    console.error('❌ Error in comprehensive analysis:', error);
    throw error;
  }
}

/**
 * Extrait le texte d'une image en utilisant le backend
 * @param {string} imageBase64 - Image encodée en base64
 * @returns {Promise<string>} - Texte extrait
 */
export async function extractMenuTextBackend(imageBase64) {
  try {
    console.log('📤 Sending image to backend for text extraction...');
    
    // Convertir base64 en Blob
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    
    // Créer FormData
    const formData = new FormData();
    formData.append('image', blob, 'menu.jpg');
    
    // Appel au backend
    const response = await fetch(`${BACKEND_URL}/api/vision/extract-text`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Extraction failed');
    }
    
    console.log('✅ Text extracted via backend');
    console.log('Text length:', result.text.length);
    console.log('Text preview:', result.text.substring(0, 200));
    
    return result.text;
    
  } catch (error) {
    console.error('❌ Error extracting text via backend:', error);
    throw error;
  }
}

/**
 * Génère des recommandations en utilisant le backend
 * @param {string} menuText - Texte du menu
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Promise<Array>} - Recommandations générées
 */
export async function getRecommendationsBackend(menuText, userProfile) {
  try {
    console.log('📤 Sending request to backend for recommendations...');
    
    const response = await fetch(`${BACKEND_URL}/api/openai/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        menuText,
        userProfile
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Recommendation generation failed');
    }
    
    console.log('✅ Recommendations generated via backend');
    console.log('Recommendations:', result.recommendations);
    
    return result.recommendations;
    
  } catch (error) {
    console.error('❌ Error generating recommendations via backend:', error);
    throw error;
  }
}

/**
 * Vérifie si le backend est disponible
 * @returns {Promise<boolean>} - True si le backend est disponible
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch (error) {
    console.warn('Backend not available:', error);
    return false;
  }
}

export default {
  analyzeDishBackend,
  analyzeMultipleDishesBackend,
  analyzeMenuImage,
  extractMenuTextBackend,
  getRecommendationsBackend,
  checkBackendHealth
}; 