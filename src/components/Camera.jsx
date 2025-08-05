import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { getRecommendationsFromMenu, getDefaultUserProfile, getAdditionalRecommendations } from '../services/recommendations';
import { extractMenuText } from '../services/visionService';
import { getTopRecommendations } from '../../openai.js';

const Camera = () => {
  const navigate = useNavigate();
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCaptured, setIsCaptured] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(''); // 'ocr' ou 'analyzing'
  const [menuText, setMenuText] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [allRecommendations, setAllRecommendations] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const webcamRef = useRef(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImages(prev => [...prev, imageSrc]);
      setIsCaptured(true);
    }
  }, []);

  const addAnotherPage = useCallback(() => {
    console.log('🔄 addAnotherPage called');
    console.log('📊 Current images count:', capturedImages.length);
    console.log('🔍 webcamRef.current:', webcamRef.current);
    
    if (webcamRef.current) {
      try {
        console.log('📸 Taking screenshot...');
        const imageSrc = webcamRef.current.getScreenshot();
        console.log('✅ Screenshot taken, updating state...');
        
        if (imageSrc) {
          setCapturedImages(prev => {
            console.log('📊 Previous images count:', prev.length);
            const newImages = [...prev, imageSrc];
            console.log('📊 New images count:', newImages.length);
            return newImages;
          });
        } else {
          console.error('❌ Screenshot returned null');
        }
      } catch (error) {
        console.error('❌ Error taking screenshot:', error);
      }
    } else {
      console.error('❌ webcamRef.current is null - webcam might not be active');
      // Fallback: try to reactivate the webcam
      console.log('🔄 Attempting to reactivate webcam...');
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.play().then(() => {
          console.log('✅ Webcam reactivated, retrying...');
          setTimeout(() => addAnotherPage(), 500);
        }).catch(err => {
          console.error('❌ Failed to reactivate webcam:', err);
        });
      }
    }
  }, [capturedImages.length]);

  const deleteImage = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
    if (capturedImages.length === 1) {
      setIsCaptured(false);
    }
  };

  const retake = () => {
    setCapturedImages([]);
    setCurrentImageIndex(0);
    setIsCaptured(false);
    setMenuText(null);
    setRecommendations(null);
    setAllRecommendations(null);
    setShowMoreOptions(false);
    setProcessingStep('');
  };

  const analyzeMenu = async () => {
    if (capturedImages.length === 0) {
      console.error('Aucune image capturée');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('ocr');

    try {
      console.log(`Début de l'extraction de texte pour ${capturedImages.length} page(s)...`);
      
      // Extraction du texte de toutes les images avec Google Vision API
      const extractedTexts = await Promise.all(
        capturedImages.map(async (image, index) => {
          console.log(`Extraction de la page ${index + 1}...`);
          const text = await extractMenuText(image);
          return text;
        })
      );
      
      // Combiner tous les textes extraits
      const combinedText = extractedTexts.join('\n\n--- PAGE SUIVANTE ---\n\n');
      
      console.log('=== MENU TEXT EXTRACTION ===');
      console.log('Number of pages processed:', capturedImages.length);
      console.log('Combined text length:', combinedText?.length);
      console.log('Combined text preview:', combinedText?.substring(0, 200) + '...');
      console.log('Full combined text:', combinedText);
      console.log('Text quality check:');
      console.log('- Contains numbers:', /\d/.test(combinedText));
      console.log('- Contains currency symbols:', /[€$£¥]/.test(combinedText));
      console.log('- Contains food words:', /(menu|plat|entrée|dessert|salade|viande|poisson|pasta|pizza)/i.test(combinedText));
      console.log('- Contains prices:', /\d+[€$£¥]/.test(combinedText));
      console.log('=== END MENU TEXT ===');
      
      // Stocker le texte extrait
      setMenuText(combinedText);
      setProcessingStep('analyzing');
      
      // Obtenir le profil utilisateur
      const userProfile = getDefaultUserProfile();
      
      // Génération des recommandations avec OpenAI
      console.log('Génération des recommandations avec OpenAI...');
      const aiRecommendations = await getTopRecommendations(combinedText, userProfile);
      
      console.log('Recommandations générées:', aiRecommendations);
      
      // Redirection vers la page Recommendations avec les données
      navigate('/recommendations', { 
        state: { 
          recommendations: aiRecommendations,
          menuText: combinedText,
          source: 'scan'
        } 
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse du menu:', error);
      setMenuText('Erreur lors de l\'extraction du texte: ' + error.message);
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const generateRecommendations = (text) => {
    setIsGeneratingRecommendations(true);
    
    // Simulation d'un délai pour la génération des recommandations (2 secondes)
    setTimeout(() => {
      const userProfile = getDefaultUserProfile();
      const { topRecommendations, allRecommendations: allRecs } = getRecommendationsFromMenu(text, userProfile);
      setRecommendations(topRecommendations);
      setAllRecommendations(allRecs);
      setIsGeneratingRecommendations(false);
    }, 2000);
  };

  const handleCameraError = () => {
    setCameraError(true);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "environment" // Utilise la caméra arrière si disponible
  };

  // Affichage d'erreur si la caméra n'est pas disponible
  if (cameraError) {
    return (
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Caméra non disponible
          </h2>
          <p className="text-gray-600">
            Impossible d'accéder à la caméra. Vérifiez les permissions.
          </p>
        </div>
        
        <div className="card p-8 max-w-md">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-gray-600">
              To use the scanner, allow camera access in your browser.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Titre */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {recommendations ? 'Recommandations personnalisées' : menuText ? 'Menu analysé' : isCaptured ? 'Photo capturée' : 'Scanner de Menu'}
        </h2>
        <p className="text-gray-600">
          {recommendations 
            ? 'Découvrez nos suggestions basées sur votre menu'
            : menuText 
            ? 'Voici le texte extrait de votre menu'
            : isCaptured 
            ? 'Vérifiez votre photo avant de continuer'
            : 'Positionnez le menu dans le cadre pour le scanner'
          }
        </p>
      </div>

      {/* Conteneur de la caméra/photo - masqué quand les recommandations sont affichées */}
      {!recommendations && (
        <div className="relative">
          <div className={`card overflow-hidden transition-all duration-300 ${isCaptured ? 'ring-2 ring-green-200' : ''}`}>
            {!isCaptured ? (
              // Flux vidéo en direct
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-auto max-w-2xl"
                  onUserMediaError={handleCameraError}
                />
                {/* Overlay avec guide de cadrage */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                  <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    Cadrez le menu ici
                  </div>
                </div>
              </div>
            ) : (
              // Images capturées avec carousel
              <div className="relative">
                {capturedImages.length > 0 && (
                  <>
                    {/* Image principale */}
                    <img
                      src={capturedImages[currentImageIndex]}
                      alt={`Menu capturé - Page ${currentImageIndex + 1}`}
                      className="w-full h-auto max-w-2xl"
                    />
                    
                    {/* Indicateur de page */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-medium">
                        ✓ Page {currentImageIndex + 1} sur {capturedImages.length}
                      </div>
                    </div>
                    
                    {/* Navigation du carousel */}
                    {capturedImages.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between p-4">
                        <button
                          onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentImageIndex === 0}
                          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(prev => Math.min(capturedImages.length - 1, prev + 1))}
                          disabled={currentImageIndex === capturedImages.length - 1}
                          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ›
                        </button>
                      </div>
                    )}
                    
                    {/* Bouton supprimer */}
                    <button
                      onClick={() => deleteImage(currentImageIndex)}
                      className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-medium"
                      title="Supprimer cette page"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Indicateur d'état et contrôles */}
          {isCaptured && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Indicateur de pages */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm font-medium">
                    {capturedImages.length === 1 
                      ? '1 page capturée' 
                      : `${capturedImages.length} pages capturées`
                    }
                  </span>
                </div>
              </div>
              
              {/* Miniatures des pages */}
              {capturedImages.length > 1 && (
                <div className="flex justify-center">
                  <div className="flex space-x-2 overflow-x-auto max-w-full">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative flex-shrink-0">
                        <img
                          src={image}
                          alt={`Miniature page ${index + 1}`}
                          className={`w-16 h-12 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                            index === currentImageIndex 
                              ? 'border-green-500' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                        <button
                          onClick={() => deleteImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bouton Ajouter une autre page */}
              <div className="text-center">
                <button
                  onClick={addAnotherPage}
                  className="btn btn-secondary px-6 py-3 text-sm font-medium shadow-medium hover:bg-gray-300 transition-colors"
                >
                  📄 + Ajouter une autre page
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Cliquez pour capturer une page supplémentaire du menu
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Affichage du texte extrait */}
      {menuText && (
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Texte extrait</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 leading-relaxed">{menuText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Affichage des recommandations en grille moderne */}
      {recommendations && (
        <div className="w-full max-w-6xl animate-fade-in">
          {/* Recommandations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((dish, index) => (
              <div 
                key={index} 
                className="card overflow-hidden hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-staggered"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* En-tête avec nom et prix */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {dish.name}
                    </h3>
                    <div className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-medium">
                      {dish.price.toFixed(2)}€
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {dish.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dish.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Bouton d'action */}
                <div className="px-6 pb-6">
                  <button 
                    onClick={() => {
                      console.log('Voir détails pour:', dish.name);
                      // TODO: Implémenter la navigation vers les détails
                    }}
                    className="w-full btn btn-primary py-3 text-sm font-semibold shadow-medium hover:shadow-large transition-shadow"
                  >
                    Voir détails
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton "Voir plus d'options" */}
          {allRecommendations && allRecommendations.length > 3 && !showMoreOptions && (
            <div className="mt-8 text-center animate-fade-in">
              <button
                onClick={() => setShowMoreOptions(true)}
                className="btn btn-secondary px-8 py-4 text-base font-semibold shadow-medium hover:shadow-large transition-shadow"
              >
                🔍 Voir plus d'options
              </button>
            </div>
          )}

          {/* Recommandations supplémentaires */}
          {showMoreOptions && allRecommendations && (
            <div className="mt-8 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Autres suggestions</h3>
                <p className="text-gray-500 text-sm">Découvrez d'autres plats qui pourraient vous plaire</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {getAdditionalRecommendations(allRecommendations).map((dish, index) => (
                  <div 
                    key={`additional-${index}`} 
                    className="card overflow-hidden hover:shadow-soft transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-staggered bg-gray-50 border-gray-100"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    {/* En-tête avec nom et prix */}
                    <div className="p-4 pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-semibold text-gray-800 leading-tight">
                          {dish.name}
                        </h4>
                        <div className="bg-gray-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                          {dish.price.toFixed(2)}€
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-500 text-xs leading-relaxed mb-3">
                        {dish.description}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {dish.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span 
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full border border-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Bouton d'action */}
                    <div className="px-4 pb-4">
                      <button 
                        onClick={() => {
                          console.log('Voir détails pour:', dish.name);
                          // TODO: Implémenter la navigation vers les détails
                        }}
                        className="w-full btn btn-secondary py-2 text-xs font-medium shadow-soft hover:shadow-medium transition-shadow"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay de chargement OCR */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-8 max-w-sm mx-4">
            <div className="text-center space-y-4">
              {/* Spinner */}
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {processingStep === 'ocr' ? 'Extraction du texte...' : 'Analyse des plats pour recommandations...'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {processingStep === 'ocr' 
                    ? 'Extraction du texte du menu avec Google Vision API'
                    : 'Analyse des plats avec IA pour générer des recommandations personnalisées'
                  }
                </p>
              </div>
              
              {/* Barre de progression */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full animate-pulse" 
                  style={{ width: processingStep === 'ocr' ? '60%' : '90%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de chargement recommandations */}
      {isGeneratingRecommendations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-8 max-w-sm mx-4">
            <div className="text-center space-y-4">
              {/* Spinner */}
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Génération des recommandations...
                </h3>
                <p className="text-gray-600 text-sm">
                  Analyse du menu et création de suggestions personnalisées
                </p>
              </div>
              
              {/* Barre de progression */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {!isCaptured ? (
          <button
            onClick={capture}
            className="btn btn-primary px-8 py-4 text-lg font-semibold shadow-medium w-full"
          >
            📸 Prendre une photo
          </button>
        ) : menuText ? (
          <>
            <button
              onClick={retake}
              className="btn btn-secondary px-6 py-4 text-base font-medium w-full sm:w-auto"
            >
              🔄 Nouveau scan
            </button>
            <button
              onClick={() => {
                setMenuText(null);
                setRecommendations(null);
              }}
              className="btn btn-primary px-6 py-4 text-base font-medium w-full sm:w-auto shadow-medium"
            >
              🔄 Réanalyser
            </button>
            {!recommendations && !isGeneratingRecommendations && (
              <button
                onClick={() => generateRecommendations(menuText)}
                className="btn btn-primary px-6 py-4 text-base font-medium w-full sm:w-auto shadow-medium"
              >
                ⭐ Générer recommandations
              </button>
            )}
          </>
        ) : recommendations ? (
          <>
            <button
              onClick={retake}
              className="btn btn-secondary px-6 py-4 text-base font-medium w-full sm:w-auto"
            >
              📸 Nouveau scan
            </button>
            <button
              onClick={() => setRecommendations(null)}
              className="btn btn-primary px-6 py-4 text-base font-medium w-full sm:w-auto shadow-medium"
            >
              🔄 Nouvelles recommandations
            </button>
          </>
        ) : (
          <>
            <button
              onClick={retake}
              className="btn btn-secondary px-6 py-4 text-base font-medium w-full sm:w-auto"
            >
              🔄 Reprendre
            </button>
            <button
              onClick={analyzeMenu}
              disabled={isProcessing}
              className="btn btn-primary px-6 py-4 text-base font-medium w-full sm:w-auto shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '⏳ Analyse...' : `✅ Analyser le menu (${capturedImages.length} page${capturedImages.length > 1 ? 's' : ''})`}
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      {!isCaptured && (
        <div className="text-center text-sm text-gray-500 max-w-md">
          <p>Assurez-vous que le menu est bien éclairé et lisible</p>
        </div>
      )}
    </div>
  );
};

export default Camera; 