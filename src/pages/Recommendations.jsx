import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { analyzeDish } from '../dishAnalysis';
import DishDetailsModal from '../components/DishDetailsModal';
import { createPortal } from 'react-dom';
import NutritionCard from '../components/NutritionCard';

// Tooltip Component using Portal
const Tooltip = ({ isVisible, targetRef, children }) => {
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' });

  useEffect(() => {
    if (isVisible && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const tooltipWidth = 260; // max-width of tooltip
      const tooltipHeight = 80; // estimated height
      const offset = 8;
      
      // Calculate available space
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      
      // Determine placement
      let placement = 'top';
      if (spaceAbove < tooltipHeight + offset && spaceBelow > tooltipHeight + offset) {
        placement = 'bottom';
      }
      
      // Calculate horizontal position
      let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      if (left < 10) left = 10;
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      
      // Calculate vertical position
      let top;
      if (placement === 'top') {
        top = rect.top - tooltipHeight - offset;
      } else {
        top = rect.bottom + offset;
      }
      
      setPosition({ top, left, placement });
    }
  }, [isVisible, targetRef]);

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        maxWidth: '260px'
      }}
    >
      <div className="bg-black text-white px-3.5 py-2.5 rounded-lg shadow-lg text-sm leading-relaxed">
        {children}
        <div 
          className={`absolute w-0 h-0 border-l-4 border-r-4 border-transparent ${
            position.placement === 'top' 
              ? 'top-full border-t-4 border-t-black' 
              : 'bottom-full border-b-4 border-b-black'
          }`}
          style={{
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    </div>,
    document.body
  );
};

const Recommendations = () => {
  // No default recommendations - only use scanned menu dishes
  const defaultRecommendations = [];

  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recommendations, setRecommendations] = useState(defaultRecommendations);
  const [menuText, setMenuText] = useState('');
  const [source, setSource] = useState('default');
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(null);
  const tooltipRefs = useRef({});

  // Log quand les recommandations changent
  useEffect(() => {
    console.log('🔄 Recommendations state changed:', recommendations.length, 'dishes');
    console.log('📊 Current recommendations:', recommendations);
  }, [recommendations]);

  // Clean up localStorage on component mount to avoid stale data
  useEffect(() => {
    // Clear any stale recommendations data on mount
    const clearStaleData = () => {
      try {
        const storedData = localStorage.getItem('recommendations');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          // If stored data is older than 5 minutes, clear it
          if (parsed.timestamp && (Date.now() - parsed.timestamp > 5 * 60 * 1000)) {
            localStorage.removeItem('recommendations');
            console.log('🧹 Cleared stale recommendations data');
          }
        }
      } catch (error) {
        console.warn('Error clearing stale data:', error);
      }
    };
    
    clearStaleData();
  }, []);

  // Fonction pour vérifier si le profil étendu est complet
  const checkExtendedProfile = () => {
    try {
      const savedProfile = localStorage.getItem('extendedProfile');
      if (!savedProfile) {
        setShowProfileBanner(true);
        return;
      }

      const profile = JSON.parse(savedProfile);
      const requiredFields = ['age', 'weight', 'height', 'activityLevel', 'goal'];
      const missingFields = requiredFields.filter(field => !profile[field] || profile[field] === '');

      if (missingFields.length > 0) {
        setShowProfileBanner(true);
      } else {
        setShowProfileBanner(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du profil étendu:', error);
      setShowProfileBanner(true);
    }
  };

  // Fonction pour analyser les plats avec AI
  const analyzeDishes = async (dishes, userProfile) => {
    console.log('🔍 Starting dish analysis for', dishes.length, 'dishes');
    console.log('📋 Total dishes detected:', dishes.length);
    console.log('📋 Dishes to analyze:', dishes);
    console.log('👤 User profile:', userProfile);
    
    // Log each dish details
    dishes.forEach((dish, index) => {
      console.log(`🍽️ Dish ${index + 1}: "${dish.name}" (ID: ${dish.id})`);
    });
    setIsAnalyzing(true);
    
    try {
      const analyzedDishes = await Promise.all(
        dishes.map(async (dish, index) => {
          try {
            console.log(`🍽️ Analyzing dish ${index + 1}/${dishes.length}:`, dish.name);
            // Créer un texte de description pour l'analyse
            const dishText = `${dish.name}: ${dish.description}`;
            console.log('📝 Dish text for analysis:', dishText);
            
            // Analyser le plat
            const analysis = await analyzeDish(dishText, userProfile);
            console.log('✅ Analysis result for', dish.name, ':', analysis);
            
            // Retourner le plat avec les informations d'analyse
            const analyzedDish = {
              ...dish,
              aiScore: analysis.aiScore,
              calories: analysis.calories,
              protein: analysis.macros.protein,
              carbs: analysis.macros.carbs,
              fats: analysis.macros.fats,
              shortJustification: analysis.shortJustification,
              longJustification: analysis.longJustification,
              error: analysis.error, // Inclure l'erreur si elle existe
              // 🔥 PRÉSERVER les propriétés de conformité si elles existent déjà
              match: dish.match !== undefined ? dish.match : undefined,
              dietaryClassifications: dish.dietaryClassifications || undefined,
              complianceWarning: dish.complianceWarning || undefined,
              violations: dish.violations || undefined
            };
            
            console.log('🎯 Final analyzed dish:', analyzedDish);
            return analyzedDish;
          } catch (error) {
            console.error(`❌ Error analyzing dish ${dish.name}:`, error);
            // Retourner le plat sans analyse en cas d'erreur
            return {
              ...dish,
              aiScore: 5,
              calories: 0,
              protein: 0,
              carbs: 0,
              fats: 0,
              shortJustification: 'Analysis not available',
              error: `Analysis failed: ${error.message}`
            };
          }
        })
      );
      
      console.log('🎉 All dishes analyzed successfully:', analyzedDishes);
      console.log('📊 Analysis results summary:');
      analyzedDishes.forEach((dish, index) => {
        console.log(`  ${index + 1}. "${dish.name}" - Personalized Match Score: ${dish.aiScore || 'N/A'}, Category: ${dish.category || 'N/A'}`);
        
        // Check for exclusion reasons
        const hasError = !!dish.error;
        const hasValidScore = dish.aiScore && dish.aiScore > 0;
        const hasValidName = dish.name && dish.name !== 'Unknown Dish';
        const hasValidCategory = dish.category && dish.category !== 'N/A';
        
        console.log(`     - Has error: ${hasError}`);
        console.log(`     - Has valid personalized match score: ${hasValidScore}`);
        console.log(`     - Has valid name: ${hasValidName}`);
        console.log(`     - Has valid category: ${hasValidCategory}`);
        
        if (hasError) {
          console.log(`     ❌ EXCLUDED: "${dish.name}" - Reason: ${dish.error}`);
        } else if (!hasValidScore) {
          console.log(`     ❌ EXCLUDED: "${dish.name}" - Reason: Invalid personalized match score (${dish.aiScore})`);
        } else {
          console.log(`     ✅ INCLUDED: "${dish.name}" - Personalized Match Score: ${dish.aiScore}`);
        }
      });
      console.log('💾 Setting recommendations state with:', analyzedDishes.length, 'dishes');
      setRecommendations(analyzedDishes);
      
      // Sauvegarder les recommandations analysées
      console.log('💾 Saving to localStorage...');
      saveRecommendationsToStorage(analyzedDishes, menuText, source);
      console.log('✅ Recommendations saved to localStorage');
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse des plats:', error);
      setRecommendations(dishes); // Utiliser les plats non analysés
      
      // Sauvegarder même les plats non analysés
      saveRecommendationsToStorage(dishes, menuText, source);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fonctions pour gérer la modal
  const openModal = (dish) => {
    setSelectedDish(dish);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDish(null);
  };

  // Fonctions pour la persistance localStorage
  const saveRecommendationsToStorage = (recommendations, menuText, source) => {
    try {
      const dataToSave = {
        recommendations,
        menuText,
        source,
        timestamp: Date.now()
      };
      localStorage.setItem('lastRecommendations', JSON.stringify(dataToSave));
      console.log('Recommandations sauvegardées dans localStorage');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des recommandations:', error);
    }
  };

  const loadRecommendationsFromStorage = () => {
    try {
      const savedData = localStorage.getItem('lastRecommendations');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const { recommendations, menuText, source, timestamp } = parsedData;
        
        // Vérifier si les données ne sont pas trop anciennes (24h)
        const isDataFresh = Date.now() - timestamp < 24 * 60 * 60 * 1000;
        
        if (isDataFresh && recommendations && recommendations.length > 0) {
          setRecommendations(recommendations);
          setMenuText(menuText || '');
          setSource(source || '');
          console.log('Recommandations chargées depuis localStorage');
          return true;
        } else {
          console.log('Données localStorage expirées ou invalides');
          localStorage.removeItem('lastRecommendations');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recommandations:', error);
      localStorage.removeItem('lastRecommendations');
    }
    return false;
  };

  const clearStoredRecommendations = () => {
    try {
      localStorage.removeItem('lastRecommendations');
      console.log('Recommandations localStorage supprimées');
    } catch (error) {
      console.error('Erreur lors de la suppression des recommandations:', error);
    }
  };



  // Récupérer les données passées via navigation et vérifier le profil étendu
  useEffect(() => {
    console.log('🎯 Recommendations component mounted');
    console.log('📍 Location state:', location.state);
    console.log('📍 Location state type:', typeof location.state);
    console.log('📍 Location state keys:', location.state ? Object.keys(location.state) : 'null');
    
    // Vérifier le profil étendu
    checkExtendedProfile();

    const processRecommendations = async () => {
      // Si de nouvelles données sont passées via navigation (nouveau scan)
      if (location.state) {
        console.log('📥 Processing new scan data...');
        const { recommendations: aiRecommendations, menuText: scannedMenuText, source: scanSource } = location.state;
        
        console.log('📋 AI Recommendations:', aiRecommendations);
        console.log('📋 Menu Text:', scannedMenuText);
        console.log('📋 Source:', scanSource);
        
        if (aiRecommendations && aiRecommendations.length > 0) {
          console.log('✅ AI Recommendations received, count:', aiRecommendations.length);
          console.log('📋 Raw AI recommendations:', aiRecommendations);
          
          // Log des données de debug du backend si disponibles
          if (location.state.debug) {
            console.log('🔍 BACKEND DEBUG DATA RECEIVED:');
            console.log('🔍 DEBUG - ALL DISHES WITH PERSONALIZED MATCH SCORES:', location.state.debug.allDishesWithScores);
            console.log('🔍 DEBUG - TOP 3 DISHES:', location.state.debug.top3Dishes);
            console.log('🔍 DEBUG - EXCLUDED BY SLICE:', location.state.debug.excludedBySlice);
            console.log('🔍 DEBUG - FINAL RESULTS:', location.state.debug.finalResults);
            
            // Log détaillé de chaque plat avec son score
            if (location.state.debug.allDishesWithScores) {
              console.log('📊 BACKEND - DETAILED DISH SCORES:');
              location.state.debug.allDishesWithScores.forEach((dish, index) => {
                console.log(`  ${index + 1}. "${dish.title}" - Personalized Match Score: ${dish.aiScore || 0} - Calories: ${dish.calories || 0} - Price: ${dish.price || 'N/A'}`);
              });
              
              // Log des plats exclus
              if (location.state.debug.excludedBySlice && location.state.debug.excludedBySlice.length > 0) {
                console.log('❌ BACKEND - DISHES EXCLUDED BY SLICE:');
                location.state.debug.excludedBySlice.forEach((dish, index) => {
                  console.log(`  ${index + 4}. "${dish.title}" - Personalized Match Score: ${dish.aiScore || 0} - EXCLUDED: Slice limit (0, 3)`);
                });
              }
            }
          }
          
          // Convertir le format OpenAI vers le format d'affichage
          const formattedRecommendations = aiRecommendations.map((dish, index) => ({
            id: index + 1,
            name: dish.title,
            restaurant: 'Scanned Menu',
            price: dish.price && typeof dish.price === 'number' ? `${dish.price.toFixed(2)}€` : (dish.price || 'Price not indicated'),
            rating: 4.5 + (Math.random() * 0.5), // Rating aléatoire entre 4.5 et 5.0
            category: 'ai-recommendation',
            description: dish.description,
            image: '🤖',
            tags: dish.tags || [],
            // 🔥 PRÉSERVER les propriétés de conformité du backend
            match: dish.match,
            dietaryClassifications: dish.dietaryClassifications,
            complianceWarning: dish.complianceWarning,
            violations: dish.violations
          }));
          
          console.log('📋 Formatted recommendations count:', formattedRecommendations.length);
          formattedRecommendations.forEach((dish, index) => {
            console.log(`  ${index + 1}. "${dish.name}" (ID: ${dish.id})`);
          });
          
          console.log('🔄 Formatted recommendations:', formattedRecommendations);
          
          setMenuText(scannedMenuText || '');
          setSource(scanSource || '');
          
          // Obtenir le profil utilisateur
          const userProfile = {
            dietaryRestrictions: [],
            budget: "medium",
            cuisinePreferences: [],
            allergies: [],
            spiceTolerance: "medium"
          };
          
          // Analyser les plats avec AI et sauvegarder
          console.log('🔍 Starting dish analysis...');
          await analyzeDishes(formattedRecommendations, userProfile);
          
          console.log('✅ Nouvelles recommandations reçues et sauvegardées');
        } else {
          console.log('❌ No AI recommendations in location state');
        }
      } else {
        // Aucune nouvelle donnée - essayer de charger depuis localStorage
        console.log('📂 No new scan data, checking localStorage...');
        const loadedFromStorage = loadRecommendationsFromStorage();
        
        if (loadedFromStorage) {
          console.log('✅ Successfully loaded recommendations from localStorage');
        } else {
          console.log('📋 No data in localStorage, no default recommendations available');
          // Aucune donnée en localStorage et pas de recommandations par défaut
          setRecommendations([]);
          setSource('empty');
          console.log('✅ Set recommendations to empty array - no dishes available');
        }
      }
      
      // Nettoyer le localStorage pour éviter les anciens plats
      clearStoredRecommendations();
    };

    processRecommendations();
  }, [location.state]);

  // Sort recommendations by AI score (descending) and add ranking
        console.log('🔄 Sorting recommendations by personalized match score...');
  console.log('📋 Original recommendations count:', recommendations.length);
  
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const scoreA = a.aiScore || 0;
    const scoreB = b.aiScore || 0;
    return scoreB - scoreA;
  });
  
  console.log('📊 Sorted recommendations:');
  sortedRecommendations.forEach((dish, index) => {
            console.log(`  ${index + 1}. "${dish.name}" - Personalized Match Score: ${dish.aiScore || 'N/A'}`);
  });

  console.log('🔍 Filtering recommendations by category:', selectedCategory);
  
  // Logique de filtrage simplifiée
  let filteredRecommendations;
  
  if (selectedCategory === 'all') {
    filteredRecommendations = sortedRecommendations;
  } else if (selectedCategory.startsWith('pref-')) {
    // Filtrage par préférence spécifique
    const preference = selectedCategory.replace('pref-', '');
    filteredRecommendations = sortedRecommendations.filter(item => {
      if (!item.dietaryClassifications) return false;
      return item.dietaryClassifications[preference] === true;
    });
  } else {
    // Fallback vers l'ancien système de catégories
    filteredRecommendations = sortedRecommendations.filter(item => item.category === selectedCategory);
  }
    
  console.log('📋 Filtered recommendations count:', filteredRecommendations.length);
  console.log('📊 Filtered recommendations:');
  filteredRecommendations.forEach((dish, index) => {
            console.log(`  ${index + 1}. "${dish.name}" - Personalized Match Score: ${dish.aiScore || 'N/A'}, Category: ${dish.category || 'N/A'}`);
  });
  
  // Log excluded dishes by category filter
  if (selectedCategory !== 'all') {
    const excludedByCategory = sortedRecommendations.filter(item => item.category !== selectedCategory);
    console.log('❌ EXCLUDED BY CATEGORY FILTER:', excludedByCategory.length, 'dishes');
    excludedByCategory.forEach((dish, index) => {
      console.log(`  ${index + 1}. "${dish.name}" - Category: ${dish.category || 'N/A'} (filter: ${selectedCategory})`);
    });
  }
  
  // Check for any slicing or limiting
  console.log('🔍 Checking for any .slice() or limiting operations...');
  console.log('📋 Final recommendations to display:', filteredRecommendations.length);

  // Debug: Log component render
  console.log('🎨 Recommendations component rendering...');
  console.log('📊 Current state:', {
    recommendationsCount: recommendations.length,
    filteredCount: filteredRecommendations.length,
    isAnalyzing,
    selectedCategory,
    source
  });

  // Récupérer les préférences alimentaires de l'utilisateur
  const [userPreferences, setUserPreferences] = useState([]);
  
  useEffect(() => {
    try {
      const savedExtendedProfile = localStorage.getItem('extendedProfile');
      if (savedExtendedProfile) {
        const extendedProfile = JSON.parse(savedExtendedProfile);
        setUserPreferences(extendedProfile.dietaryPreferences || []);
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des préférences:', error);
    }
  }, []);

  // Générer les catégories de filtrage dynamiquement
  const generateCategories = () => {
    const baseCategories = [
      { id: 'all', name: 'All', color: 'bg-gray-500' }
    ];
    
    // Ajouter des catégories spécifiques basées sur les préférences utilisateur
    const preferenceCategories = userPreferences.map(pref => ({
      id: `pref-${pref}`,
      name: pref.charAt(0).toUpperCase() + pref.slice(1).replace('-', ' '),
      color: 'bg-blue-500'
    }));
    
    return [...baseCategories, ...preferenceCategories];
  };

  const categories = generateCategories();

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Recommendations</h1>
                  <p className="text-purple-100 mt-2">Discover our personalized suggestions</p>
                </div>
                {source === 'scan' && (
                  <button
                    onClick={clearStoredRecommendations}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Clear saved recommendations"
                  >
                    🗑️ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Profile Completion Banner */}
            {showProfileBanner && (
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-blue-600 text-lg">💡</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        For more accurate recommendations, complete your profile information.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/extended-profile')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Complete now
                  </button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by category</h2>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? `${category.color} text-white`
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="p-6">
              {/* Loading Indicator */}
              {isAnalyzing && (
                <div className="text-center py-8 mb-6">
                  <div className="inline-flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-purple-600 font-medium">Analyzing dishes...</span>
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {filteredRecommendations.length === 0 && !isAnalyzing && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">📷</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No dishes available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Scan a menu to get personalized food recommendations based on your dietary preferences.
                    </p>
                    <button
                      onClick={() => navigate('/menu-scan')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      📸 Scan Menu
                    </button>
                  </div>
                </div>
              )}

              {/* Recommendations Grid */}
              {filteredRecommendations.length > 0 && (
                <>
                  {/* Info Banner for Limited Results */}
                  {filteredRecommendations.length < 3 && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <span className="text-amber-600 text-lg">ℹ️</span>
                        </div>
                        <div>
                          <p className="text-sm text-amber-800">
                            <strong>Limited Results:</strong> Only {filteredRecommendations.length} dish{filteredRecommendations.length > 1 ? 'es' : ''} met our quality standards. 
                            We only show dishes with meaningful AI scores to ensure helpful recommendations.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRecommendations.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="animate-fade-in-staggered"
                        style={{ animationDelay: `${index * 200}ms` }}
                      >
                        <NutritionCard
                          dish={item}
                          rank={index + 1}
                          onViewDetails={openModal}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dish Details Modal */}
      <DishDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        dish={selectedDish}
      />
    </>
  );
};

export default Recommendations; 