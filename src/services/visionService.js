// Service spécialisé pour l'extraction de texte de menus avec Google Vision API
const API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

/**
 * Extrait le texte d'une image de menu en utilisant Google Vision API
 * @param {string} imageBase64 - Image encodée en base64 (sans le préfixe data:image/...)
 * @returns {Promise<string>} - Texte extrait ou message d'erreur
 */
export async function extractMenuText(imageBase64) {
  try {
    // Validation de l'entrée
    if (!imageBase64) {
      throw new Error('Aucune image fournie');
    }

    if (!API_KEY) {
      throw new Error('Clé API Google Vision non configurée');
    }

    // Nettoyer l'image base64 si elle contient un préfixe data URL
    let cleanImageData = imageBase64;
    if (imageBase64.includes('data:image/')) {
      cleanImageData = imageBase64.split(',')[1];
    }

    // Préparer la requête pour l'API Vision
    const requestBody = {
      requests: [
        {
          image: {
            content: cleanImageData
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ],
          imageContext: {
            languageHints: ['fr', 'en'] // Optimiser pour le français et l'anglais
          }
        }
      ]
    };

    // Appel à l'API Google Vision
    const response = await fetch(`${VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Erreur HTTP: ${response.status}`;
      throw new Error(`Erreur API Vision: ${errorMessage}`);
    }

    const result = await response.json();
    
    // Vérifier si la réponse contient des données
    if (!result.responses || !result.responses[0]) {
      throw new Error('Aucune réponse reçue de l\'API Vision');
    }

    const visionResponse = result.responses[0];

    // Vérifier s'il y a des erreurs dans la réponse
    if (visionResponse.error) {
      throw new Error(`Erreur Vision API: ${visionResponse.error.message}`);
    }

    // Extraire le texte détecté
    if (visionResponse.textAnnotations && visionResponse.textAnnotations.length > 0) {
      // Le premier élément contient tout le texte détecté
      const extractedText = visionResponse.textAnnotations[0].description;
      
      if (!extractedText || extractedText.trim() === '') {
        return 'Aucun texte détecté dans l\'image';
      }

      return extractedText.trim();
    } else {
      return 'Aucun texte détecté dans l\'image';
    }

  } catch (error) {
    console.error('Erreur lors de l\'extraction de texte:', error);
    
    // Retourner un message d'erreur convivial
    if (error.message.includes('API Vision')) {
      return `Erreur lors de l'analyse de l'image: ${error.message}`;
    } else if (error.message.includes('HTTP')) {
      return 'Erreur de connexion à l\'API Google Vision. Vérifiez votre connexion internet.';
    } else if (error.message.includes('Clé API')) {
      return 'Erreur de configuration: Clé API Google Vision manquante.';
    } else {
      return `Erreur lors de l'extraction du texte: ${error.message}`;
    }
  }
}

/**
 * Extrait le texte d'une image avec des options personnalisées
 * @param {string} imageBase64 - Image encodée en base64
 * @param {Object} options - Options d'extraction
 * @param {string[]} options.languages - Langues à détecter (ex: ['fr', 'en'])
 * @param {number} options.maxResults - Nombre maximum de résultats
 * @returns {Promise<string>} - Texte extrait ou message d'erreur
 */
export async function extractTextWithOptions(imageBase64, options = {}) {
  try {
    const { languages = ['fr', 'en'], maxResults = 1 } = options;

    if (!imageBase64) {
      throw new Error('Aucune image fournie');
    }

    if (!API_KEY) {
      throw new Error('Clé API Google Vision non configurée');
    }

    // Nettoyer l'image base64
    let cleanImageData = imageBase64;
    if (imageBase64.includes('data:image/')) {
      cleanImageData = imageBase64.split(',')[1];
    }

    const requestBody = {
      requests: [
        {
          image: {
            content: cleanImageData
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: maxResults
            }
          ],
          imageContext: {
            languageHints: languages
          }
        }
      ]
    };

    const response = await fetch(`${VISION_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Erreur API Vision: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.responses || !result.responses[0]) {
      return 'Aucun texte détecté dans l\'image';
    }

    const visionResponse = result.responses[0];

    if (visionResponse.error) {
      throw new Error(`Erreur Vision API: ${visionResponse.error.message}`);
    }

    if (visionResponse.textAnnotations && visionResponse.textAnnotations.length > 0) {
      return visionResponse.textAnnotations[0].description.trim();
    }

    return 'Aucun texte détecté dans l\'image';

  } catch (error) {
    console.error('Erreur lors de l\'extraction de texte avec options:', error);
    return `Erreur lors de l'extraction du texte: ${error.message}`;
  }
}

export default {
  extractMenuText,
  extractTextWithOptions
}; 