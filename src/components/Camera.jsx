import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { getRecommendationsFromMenu, loadExtendedUserProfile, getAdditionalRecommendations } from '../services/recommendations';
import { analyzeMenuImage, checkBackendHealth } from '../services/backendService';
import { trackMenuScan, trackError } from '../utils/analytics';
import { BACKEND_URL } from '../config/backend';
import AnalyzeMenuModal from './AnalyzeMenuModal';

const Camera = () => {
  console.log("🎬 Camera component rendering");
  const navigate = useNavigate();
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCaptured, setIsCaptured] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(''); // 'ocr' ou 'analyzing'
  const [menuText, setMenuText] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [allRecommendations, setAllRecommendations] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [analysisContext, setAnalysisContext] = useState(null);
  
  // local state for the context modal
  const [hunger, setHunger] = useState('moderate');
  const [timing, setTiming] = useState('regular');
  const [diagnostics, setDiagnostics] = useState(null);
  
  const webcamRef = useRef(null);

  // Fonction pour extraire les plats du texte du menu
  const extractDishesFromText = (text) => {
    console.log('🔍 extractDishesFromText called with text length:', text?.length);
    console.log('🔍 Text preview:', text?.substring(0, 200) + '...');
    
    if (!text) {
      console.log('❌ No text provided to extractDishesFromText');
      return [];
    }
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    console.log('📝 Processing', lines.length, 'lines');
    
    const dishes = [];
    let currentSection = '';
    let currentTitle = null;
    let currentDescription = '';
    
    // Mots-clés qui indiquent des accompagnements (à ignorer)
    const accompanimentKeywords = [
      'écrasé', 'mousseline', 'frites', 'carottes', 'navet', 'chou', 'pommes', 'sauce',
      'jus', 'compote', 'chantilly', 'crème', 'ricotta', 'parmesan', 'cheddar'
    ];
    
    // Mots-clés qui indiquent des plats principaux
    const mainDishKeywords = [
      'dos de saumon', 'burger', 'risotto', 'paleron', 'magret', 'ris de veau', 
      'cocotte', 'quenelles', 'noix d\'entrecôte', 'butternut', 'fondant', 'crème brûlée',
      'brie', 'baba', 'poêlée', 'tarte', 'quinoa', 'coliflor', 'cauliflower', 'chule', 'costillas'
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ignorer les artefacts OCR comme "Crop"
      if (line.toLowerCase() === 'crop' || line.length < 3) {
        continue;
      }
      
      // Détecter les sections (en majuscules, souvent suivies de ":")
      if (line.match(/^[A-Z\s]+:$/) || line.match(/^[A-Z\s]+$/)) {
        currentSection = line.replace(':', '').trim();
        console.log('🏷️ Found section:', currentSection);
        continue;
      }
      
      // Ignorer les traductions en anglais (lignes en italique)
      if (line.match(/^[a-z]/) && !line.match(/^[A-Z]/)) {
        continue;
      }
      
      // NOUVELLE LOGIQUE : Détecter les titres en majuscules suivis de ":"
      // Pattern amélioré pour capturer "GREEN BUT NOT BORING V GF:" ou "EL COLIFLOR V GF:"
      const titleMatch = line.match(/^([A-Z][A-Z\s]+?(?:\s+V\s+GF?)?)(?:\s*[:]|\s*$)/);
      
      if (titleMatch) {
        // Si on avait un titre précédent, sauvegarder le plat complet
        if (currentTitle) {
          const dish = createDish(currentTitle, currentDescription, currentSection);
          if (dish) {
            dishes.push(dish);
            console.log('🍽️ Completed dish:', dish.title, 'with description length:', dish.description.length);
          }
        }
        
        // Nouveau titre trouvé
        currentTitle = titleMatch[1].trim();
        currentDescription = line; // Commencer avec la ligne complète
        console.log('🎯 Found new title:', currentTitle);
        
        // Si le titre contient "V GF", c'est probablement végétarien
        if (currentTitle.includes('V GF') || currentTitle.includes('V G')) {
          console.log('🥬 Detected vegetarian indicator in title:', currentTitle);
        }
      } else {
        // Si pas de titre en majuscules, c'est probablement une description
        if (currentTitle) {
          // Ajouter à la description existante
          currentDescription += ' ' + line;
          console.log('📝 Added to description:', line.substring(0, 50) + '...');
        }
      }
    }
    
    // Sauvegarder le dernier plat
    if (currentTitle) {
      const dish = createDish(currentTitle, currentDescription, currentSection);
      if (dish) {
        dishes.push(dish);
        console.log('🍽️ Final dish:', dish.title, 'with description length:', dish.description.length);
      }
    }
    
    console.log('✅ extractDishesFromText returning', dishes.length, 'dishes');
    return dishes;
  };

  // Fonction helper pour créer un plat
  const createDish = (title, description, section) => {
    if (!title || title.length < 3) return null;
    
    const lowerTitle = title.toLowerCase();
    
    // FILTRER LES SECTIONS DE MENU (pas des plats)
    if (lowerTitle.includes('drinks') || lowerTitle.includes('menu') || 
        lowerTitle.includes('desserts') || lowerTitle.includes('kids') ||
        lowerTitle.includes('y más') || lowerTitle.includes('asados')) {
      console.log('🚫 Skipping menu section:', title);
      return null;
    }
    
    // Vérifier si c'est un accompagnement (à ignorer)
    const accompanimentKeywords = [
      'écrasé', 'mousseline', 'frites', 'carottes', 'navet', 'chou', 'pommes', 'sauce',
      'jus', 'compote', 'chantilly', 'crème', 'ricotta', 'parmesan', 'cheddar'
    ];
    
    const isAccompaniment = accompanimentKeywords.some(keyword => 
      lowerTitle.includes(keyword.toLowerCase())
    );
    
    // Vérifier si c'est un plat principal
    const mainDishKeywords = [
      'dos de saumon', 'burger', 'risotto', 'paleron', 'magret', 'ris de veau', 
      'cocotte', 'quenelles', 'noix d\'entrecôte', 'butternut', 'fondant', 'crème brûlée',
      'brie', 'baba', 'poêlée', 'tarte', 'quinoa', 'coliflor', 'cauliflower', 'chule', 'costillas'
    ];
    
    const isMainDish = mainDishKeywords.some(keyword => 
      lowerTitle.includes(keyword.toLowerCase())
    );
    
    // Ignorer les accompagnements et accepter seulement les plats principaux
    if (isAccompaniment && !isMainDish) {
      console.log('🚫 Skipping accompaniment:', title);
      return null;
    }
    
    // Détecter si c'est végétarien (marqué V)
    const isVegetarian = /\bV\b/.test(description) || /vegetarian|veggie/i.test(description);
    
    // Estimation des macros basée sur les mots-clés
    const txt = description.toLowerCase();
    let protein = 25, carbs = 40, fat = 35; // baseline
    
    if (/(viande|beef|poulet|chicken|poisson|fish|tofu|legumes?|oeufs?|saumon|salmon)/.test(txt)) protein += 10;
    if (/(pasta|riz|bread|pain|pomme|potato|quinoa|tortilla|pommes de terre|risotto|coquillettes)/.test(txt)) carbs += 15;
    if (/(frit|cream|beurre|butter|huile|oil|fromage|cheese|mayo|cheddar|parmesan)/.test(txt)) fat += 10;
    
    // Normaliser à 100%
    const total = protein + carbs + fat;
    protein = Math.round(protein / total * 100);
    carbs = Math.round(carbs / total * 100);
    fat = 100 - protein - carbs;
    
    const dish = {
      title: title,
      description: description,
      price: null, // Pas de prix pour l'instant
      currency: '€',
      section: section || 'Main',
      macros: { protein, carbs, fat },
      isVegetarian: isVegetarian,
      // Ajouter des classifications diététiques pour le filtrage
      dietaryClassifications: {
        vegetarian: isVegetarian,
        vegan: false, // À améliorer si nécessaire
        containsEggs: /oeuf|egg/i.test(description),
        containsMeat: /(viande|beuf|poulet|chicken|poisson|fish|saumon|salmon|boeuf|canard|veau|volaille|brochet)/i.test(description)
      }
    };
    
    console.log('🍽️ Created dish:', dish.title, 'section:', dish.section, 'vegetarian:', isVegetarian);
    return dish;
  };

  // Debug effect to monitor capturedImages changes
  useEffect(() => {
    console.log('📊 capturedImages state updated:', {
      count: capturedImages.length,
      currentIndex: currentImageIndex,
      isCaptured
    });
  }, [capturedImages, currentImageIndex, isCaptured]);

  // Debug effect to monitor camera state changes
  useEffect(() => {
    console.log('📹 Camera state changed:', {
      isCameraActive,
      isCaptured,
      imagesCount: capturedImages.length
    });
  }, [isCameraActive, isCaptured, capturedImages.length]);

  const capture = useCallback(() => {
    console.log('📸 capture function called');
    console.log('📸 Stack trace:', new Error().stack);
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      console.log('📸 Screenshot taken, adding to capturedImages');
      setCapturedImages(prev => {
        const newImages = [...prev, imageSrc];
        console.log(`📸 Image captured, total count: ${newImages.length}`);
        return newImages;
      });
      setIsCaptured(true);
      setIsCameraActive(false); // Turn off camera after capture
      console.log('📸 Image captured, camera turned off');
    } else {
      console.error('❌ webcamRef.current is null - webcam might not be active');
    }
  }, []);

  // Function to start camera preview mode
  const startCamera = useCallback(() => {
    console.log('📹 startCamera called - activating camera preview');
    setIsCameraActive(true);
    console.log('📹 Camera preview activated');
  }, []);

  const addAnotherPage = useCallback(() => {
    console.log('🔄 addAnotherPage called');
    console.log('📊 Current images count:', capturedImages.length);
    console.log('📊 Current state before change:', {
      isCameraActive,
      isCaptured,
      currentImageIndex
    });
    
    // Check if we've reached the maximum of 5 pages
    if (capturedImages.length >= 5) {
      console.log('⚠️ Maximum 5 pages reached');
      return;
    }
    
    // Start camera preview mode - same as first capture
    startCamera();
    console.log('📹 Camera preview started for new page capture');
    
    // Don't take screenshot automatically - wait for user to click "Prendre une photo"
  }, [capturedImages.length, isCameraActive, isCaptured, currentImageIndex, startCamera]);

  const deleteImage = (index) => {
    setCapturedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      console.log(`🗑️ Deleting image at index ${index}, new count: ${newImages.length}`);
      
      // Adjust currentImageIndex if necessary
      if (newImages.length === 0) {
        setIsCaptured(false);
        setCurrentImageIndex(0);
      } else if (currentImageIndex >= newImages.length) {
        setCurrentImageIndex(newImages.length - 1);
      }
      
      return newImages;
    });
  };

  const retake = () => {
    console.log('🔄 retake called');
    setCapturedImages([]);
    setCurrentImageIndex(0);
    setIsCaptured(false);
    setIsCameraActive(true);
    setMenuText(null);
    setRecommendations(null);
    setAllRecommendations(null);
    setShowMoreOptions(false);
    setIsGeneratingRecommendations(false);
    setIsProcessing(false);
    setProcessingStep('');
  };

  const analyzeMenu = async () => {
    if (capturedImages.length === 0) {
      console.error('No images captured');
      return;
    }

    // Ouvrir le modal d'analyse au lieu de commencer directement
    setShowAnalyzeModal(true);
  };

  const handleAnalysisContextConfirm = async (context) => {
    console.log('Analysis context confirmed:', context);
    setAnalysisContext(context);
    setShowAnalyzeModal(false);
    
    setIsProcessing(true);
    setProcessingStep('ocr');

    try {
      console.log(`Starting analysis for ${capturedImages.length} page(s) with context:`, context);
      
      // Vérifier si le backend est disponible
      const backendAvailable = await checkBackendHealth();
      console.log('Backend available:', backendAvailable);
      
      if (!backendAvailable) {
        trackMenuScan(false, 'Backend service not available');
        throw new Error('Backend service not available. Please ensure the server is running.');
      }
      
      // Obtenir le profil utilisateur étendu
      const userProfile = loadExtendedUserProfile();
      
      // Analyse complète de la première image
      const firstImage = capturedImages[0];
      console.log('Analyzing first image...');
      
      const analysisResult = await analyzeMenuImage(firstImage, userProfile);
      
      console.log('=== MENU ANALYSIS RESULT ===');
      console.log('Extracted text length:', analysisResult.extractedText?.length);
      console.log('Extracted text preview:', analysisResult.extractedText?.substring(0, 200) + '...');
      console.log('Recommendations count:', analysisResult.recommendations?.length);
      console.log('Full extracted text:', analysisResult.extractedText);
      console.log('Text quality check:');
      console.log('- Contains numbers:', /\d/.test(analysisResult.extractedText));
      console.log('- Contains currency symbols:', /[€$£¥]/.test(analysisResult.extractedText));
      console.log('- Contains food words:', /(menu|plat|entrée|dessert|salade|viande|poisson|pasta|pizza)/i.test(analysisResult.extractedText));
      console.log('- Contains food words:', /(menu|plat|entrée|dessert|salade|viande|poisson|pasta|pizza)/i.test(analysisResult.extractedText));
      console.log('- Contains prices:', /\d+[€$£¥]/.test(analysisResult.extractedText));
      console.log('=== END MENU ANALYSIS ===');
      
      // Stocker le texte extrait
      setMenuText(analysisResult.extractedText);
      setProcessingStep('analyzing');
      
      // Vérifier que nous avons des recommandations du backend
      if (!analysisResult.recommendations || analysisResult.recommendations.length === 0) {
        throw new Error('No recommendations received from backend analysis');
      }
      
      console.log('✅ Backend provided recommendations:', analysisResult.recommendations.length);
      
      // Transformer les recommandations du backend pour le format attendu par l'API /recommend
      const dishesFromBackend = analysisResult.recommendations.map(dish => ({
        title: dish.title,
        description: dish.description,
        price: dish.price,
        currency: '€',
        section: dish.section || 'Main',
        macros: dish.macros || { protein: 25, carbs: 40, fat: 35 },
        isVegetarian: dish.dietaryClassifications?.vegetarian || false,
        dietaryClassifications: dish.dietaryClassifications || {
          vegetarian: dish.dietaryClassifications?.vegetarian || false,
          vegan: dish.dietaryClassifications?.vegan || false,
          containsEggs: dish.dietaryClassifications?.containsEggs || false,
          containsMeat: dish.dietaryClassifications?.containsMeat || false
        }
      }));
      
      console.log('🔄 Transformed backend dishes for /recommend API:', dishesFromBackend);
      
      // Maintenant appeler l'API /recommend avec les plats du backend
      const finalPayload = {
        dishes: dishesFromBackend,
        profile: userProfile,
        context: context,
        timestamp: Date.now(), // Cache-busting: forcer de nouvelles analyses
        forceNewAnalysis: true // Forcer de nouvelles analyses
      };
      
      console.log('🚀 Calling /recommend API with payload:', finalPayload);
      console.log('👤 User profile details:', {
        dietaryPreferences: userProfile.dietaryPreferences,
        allergies: userProfile.allergies,
        goal: userProfile.goal,
        activityLevel: userProfile.activityLevel
      });
      console.log('🌐 Backend URL:', BACKEND_URL);
      console.log('📊 Payload size:', JSON.stringify(finalPayload).length, 'bytes');
      
      // Appeler l'API /recommend pour obtenir les recommandations contextuelles
      const recommendationsResponse = await fetch(`${BACKEND_URL}/recommend`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Forcer de nouvelles analyses
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(finalPayload)
      });
      
      console.log('📡 Response status:', recommendationsResponse.status);
      console.log('📡 Response headers:', Object.fromEntries(recommendationsResponse.headers.entries()));
      
      if (!recommendationsResponse.ok) {
        const errorText = await recommendationsResponse.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`Failed to get recommendations: ${recommendationsResponse.statusText} (${recommendationsResponse.status})`);
      }
      
      const recommendationsData = await recommendationsResponse.json();
      console.log('✅ Recommendations API response:', recommendationsData);
      
      if (!recommendationsData.success) {
        throw new Error(`Recommendations API error: ${recommendationsData.error}`);
      }
      
      console.log('🎯 Recommendations generated:', recommendationsData.top3);
      
      // Transformer les données de l'API pour le format attendu par le frontend
      const transformedRecommendations = recommendationsData.top3.map(item => ({
        ...item.dish, // Extraire les propriétés du plat
        aiScore: item.personalizedMatchScore,
        personalizedMatchScore: item.personalizedMatchScore,
        score: item.personalizedMatchScore,
        macros: item.macros,
        reasons: item.reasons,
        subscores: item.subscores
      }));
      
      console.log('🔄 Transformed recommendations for frontend:', transformedRecommendations);
      
      // Redirection vers la page Recommendations avec les données transformées
      trackMenuScan(true);
      navigate('/recommendations', { 
        state: { 
          recommendations: transformedRecommendations,
          menuText: analysisResult.extractedText,
          source: 'scan',
          context: context, // Passer le contexte d'analyse
          fallback: recommendationsData.diagnostics?.relaxedMode, // Passer le flag fallback
          diagnostics: recommendationsData.diagnostics
        } 
      });
      
    } catch (error) {
      console.error('Error during menu analysis:', error);
      trackMenuScan(false, error.message);
      trackError(error, { context: 'menu_analysis' });
      setMenuText('Error during analysis: ' + error.message);
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const generateRecommendations = (text) => {
    setIsGeneratingRecommendations(true);
    
    // Simulation d'un délai pour la génération des recommandations (2 secondes)
    setTimeout(() => {
      const userProfile = loadExtendedUserProfile();
      const { topRecommendations, allRecommendations: allRecs } = getRecommendationsFromMenu(text, userProfile);
      setRecommendations(topRecommendations);
      setAllRecommendations(allRecs);
      setIsGeneratingRecommendations(false);
    }, 2000);
  };

  async function analyzeWithRecommender(dishesFromOCR, userProfile) {
    const payload = {
      dishes: dishesFromOCR.map(d => ({
        id: d.id || undefined,
        title: d.title || d.name,
        description: d.description || '',
        price: (typeof d.price === 'number' && isFinite(d.price)) ? d.price : null,
        currency: d.currency || undefined,
        section: d.section || undefined,
        macros: d.macros || undefined   // may be % or grams; UI handles both
      })),
      profile: userProfile,             // keep this name: profile
      context: { hunger, timing }       // session-only
    };

    const res = await fetch('/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    // Expect shape: { success, top3: [{ dish, personalizedMatchScore, macros, reasons, subscores }], diagnostics }
    console.log('🔎 /recommend response', data);

    setRecommendations(Array.isArray(data.top3) ? data.top3 : []);
    setDiagnostics(data.diagnostics || null);
  }

  const handleCameraError = () => {
    console.error('❌ Camera error occurred');
    setCameraError(true);
    setIsCameraActive(false);
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
            Camera Not Available
          </h2>
          <p className="text-gray-600">
            Unable to access the camera. Check permissions.
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
      {console.log("isCameraActive", isCameraActive)}
      {/* Title */}
      <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {recommendations ? 'Personalized Recommendations' : menuText ? 'Menu Analyzed' : isCaptured ? 'Photo Captured' : 'Menu Scanner'}
            </h2>
            <p className="text-gray-600">
              {recommendations 
                ? 'Discover our suggestions based on your menu'
                : menuText 
                ? 'Here is the text extracted from your menu'
                : isCaptured 
                ? 'Check your photo before continuing'
                : 'Position the menu in the frame to scan it'
              }
            </p>
      </div>

      {/* Camera/photo container - hidden when recommendations are displayed */}
      {!recommendations && (
        <div className="relative">
          <div className={`card overflow-hidden transition-all duration-300 ${isCaptured ? 'ring-2 ring-green-200' : ''}`}>
            {/* Live video stream - visible only when camera is active */}
            {isCameraActive && (
              <div className="relative">
                {console.log("Webcam mounted")}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-auto max-w-2xl"
                  onUserMediaError={handleCameraError}
                  key="camera-webcam"
                  onUserMedia={() => console.log("Webcam mounted")}
                />
                {/* Overlay with framing guide */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                  <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    Frame the menu here
                  </div>
                </div>
              </div>
            )}
            
            {/* Display of captured images - visible when camera is inactive AND we have images */}
            {!isCameraActive && capturedImages.length > 0 && (
              <div className="relative">
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
              </div>
            )}
          </div>
          
          {/* Indicateur d'état et contrôles - affiché quand on a des images ET que la caméra n'est pas active */}
          {isCaptured && !isCameraActive && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Indicateur de pages */}
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm font-medium">
                    {capturedImages.length === 1 
                      ? '1 page captured' 
                      : `${capturedImages.length} pages captured`
                    }
                    {capturedImages.length >= 5 && (
                      <span className="text-orange-600 ml-1">(max 5)</span>
                    )}
                  </span>
                </div>
              </div>
              

              
              {/* Bouton Ajouter une autre page */}
              <div className="text-center">
                <button
                  onClick={addAnotherPage}
                  disabled={capturedImages.length >= 5}
                  className={`btn px-6 py-3 text-sm font-medium shadow-medium transition-colors ${
                    capturedImages.length >= 5 
                      ? 'btn-disabled opacity-50 cursor-not-allowed' 
                      : 'btn-secondary hover:bg-gray-300'
                  }`}
                >
                  📄 + Add Another Page
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {capturedImages.length >= 5 
                    ? 'Maximum 5 pages reached'
                    : 'Click to capture an additional menu page'
                  }
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
              <h3 className="text-lg font-semibold text-gray-900">Extracted Text</h3>
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
                    View Details
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
                                  🔍 See More Options
              </button>
            </div>
          )}

          {/* Recommandations supplémentaires */}
          {showMoreOptions && allRecommendations && (
            <div className="mt-8 animate-fade-in">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Other Suggestions</h3>
                <p className="text-gray-500 text-sm">Discover other dishes you might like</p>
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
                        View Details
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
                  {processingStep === 'ocr' ? 'Text Extraction...' : 'Dish Analysis for Recommendations...'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {processingStep === 'ocr' 
                    ? 'Extracting text from menu using Google Vision API'
                    : 'AI-powered dish analysis to generate personalized recommendations'
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
                  Generating recommendations...
                </h3>
                <p className="text-gray-600 text-sm">
                  Menu analysis and personalized suggestions creation
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

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">

        
        {isCameraActive ? (
          <button
            onClick={capture}
            className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full text-lg border-0 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          >
            <span className="flex items-center justify-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Take Photo</span>
            </span>
          </button>
        ) : menuText ? (
          <>
            <button
              onClick={retake}
              className="btn btn-secondary px-6 py-4 text-base font-medium w-full sm:w-auto"
            >
              🔄 New Scan
            </button>
            <button
              onClick={() => {
                setMenuText(null);
                setRecommendations(null);
              }}
              className="btn btn-primary px-6 py-4 text-base font-medium w-full sm:w-auto shadow-medium"
            >
              🔄 Re-analyze
            </button>
            {!recommendations && !isGeneratingRecommendations && (
              <button
                onClick={() => generateRecommendations(menuText)}
                className="btn btn-primary px-6 py-4 text-base font-medium w-full sm:w-auto shadow-medium"
              >
                ⭐ Generate Recommendations
              </button>
            )}
          </>
        ) : recommendations ? (
          <>
            <button
              onClick={retake}
              className="btn btn-secondary px-6 py-4 text-base font-medium w-full sm:w-auto"
            >
              📸 New Scan
            </button>
            <button
              onClick={() => setRecommendations(null)}
              className="btn btn-primary px-6 py-4 text-base font-medium w-full sm:w-auto shadow-medium"
            >
              🔄 New Recommendations
            </button>
          </>
        ) : (
          <>
            <button
              onClick={retake}
              className="btn btn-secondary px-6 py-4 text-base font-medium w-full sm:w-auto"
            >
              🔄 Retake
            </button>
            <button
              onClick={analyzeMenu}
              disabled={isProcessing}
              className="btn btn-primary px-6 py-4 text-base font-medium w-full sm:w-auto shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '⏳ Analyzing...' : `✅ Analyze Menu (${capturedImages.length} page${capturedImages.length > 1 ? 's' : ''})`}
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      {!isCaptured && (
        <div className="text-center text-sm text-gray-500 max-w-md">
          <p>Make sure the menu is well lit and readable</p>
        </div>
      )}

      {/* Analyze Menu Modal */}
      <AnalyzeMenuModal
        isOpen={showAnalyzeModal}
        onClose={() => setShowAnalyzeModal(false)}
        onConfirm={handleAnalysisContextConfirm}
      />
    </div>
  );
};

export default Camera; 