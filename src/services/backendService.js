// Service pour communiquer avec le backend Express
const BACKEND_URL = 'http://localhost:3001';

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
  extractMenuTextBackend,
  getRecommendationsBackend,
  checkBackendHealth
}; 