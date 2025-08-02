// Service pour Google Vision API
const API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Tentative d'utilisation du client officiel Google Cloud Vision
let visionClient = null;
try {
  // Import dynamique pour éviter les erreurs côté frontend
  import('@google-cloud/vision').then(({ ImageAnnotatorClient }) => {
    visionClient = new ImageAnnotatorClient({
      key: API_KEY
    });
    console.log('Client Google Vision initialisé avec succès');
  }).catch(error => {
    console.warn('Client Google Vision non disponible côté frontend:', error);
  });
} catch (error) {
  console.warn('Client Google Vision non disponible côté frontend:', error);
}

// Service avec appel REST direct (fallback)
export const visionApiService = {
  // Analyse d'image avec le client officiel (si disponible)
  async analyzeImageWithClient(imageData) {
    if (!visionClient) {
      throw new Error('Client Google Vision non disponible côté frontend');
    }

    try {
      const request = {
        image: {
          content: imageData // Base64 encoded image
        },
        features: [
          {
            type: 'TEXT_DETECTION'
          },
          {
            type: 'LABEL_DETECTION'
          }
        ]
      };

      const [result] = await visionClient.annotateImage(request);
      return result;
    } catch (error) {
      console.error('Erreur avec le client Google Vision:', error);
      throw error;
    }
  },

  // Analyse d'image avec appel REST direct
  async analyzeImageWithREST(imageData, features = ['TEXT_DETECTION', 'LABEL_DETECTION']) {
    try {
      const requestBody = {
        requests: [
          {
            image: {
              content: imageData // Base64 encoded image
            },
            features: features.map(type => ({ type }))
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
        const errorData = await response.json();
        throw new Error(`Vision API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      return result.responses[0];
    } catch (error) {
      console.error('Erreur lors de l\'appel REST Vision API:', error);
      throw error;
    }
  },

  // Méthode principale qui essaie le client puis le REST
  async analyzeImage(imageData, features = ['TEXT_DETECTION', 'LABEL_DETECTION']) {
    try {
      // Essayer d'abord avec le client officiel
      return await this.analyzeImageWithClient(imageData);
    } catch (error) {
      console.log('Client non disponible, utilisation de l\'appel REST...');
      // Fallback vers l'appel REST
      return await this.analyzeImageWithREST(imageData, features);
    }
  },

  // Méthode pour analyser du texte dans une image
  async extractText(imageData) {
    const result = await this.analyzeImage(imageData, ['TEXT_DETECTION']);
    return result.textAnnotations || [];
  },

  // Méthode pour détecter les labels dans une image
  async detectLabels(imageData) {
    const result = await this.analyzeImage(imageData, ['LABEL_DETECTION']);
    return result.labelAnnotations || [];
  },

  // Méthode pour analyser un menu complet
  async analyzeMenu(imageData) {
    const result = await this.analyzeImage(imageData, [
      'TEXT_DETECTION',
      'LABEL_DETECTION',
      'OBJECT_LOCALIZATION'
    ]);
    return result;
  }
};

export default visionApiService; 