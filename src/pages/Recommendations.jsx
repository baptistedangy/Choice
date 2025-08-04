import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { analyzeDish } from '../dishAnalysis';
import DishDetailsModal from '../components/DishDetailsModal';
import { createPortal } from 'react-dom';

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
  // Default recommendations (fallback)
  const defaultRecommendations = [
    {
      id: 1,
      name: 'Caesar Salad',
      restaurant: 'The Parisian Bistro',
      price: '14.50€',
      rating: 4.8,
      category: 'healthy',
      description: 'Fresh salad with grilled chicken, parmesan and croutons',
      image: '🥗',
      tags: ['Vegetarian', 'Gluten-free'],
      aiScore: 8.5,
      calories: 320,
      protein: 25,
      carbs: 15,
      fats: 18,
      shortJustification: 'High protein content with fresh ingredients, perfect for a healthy meal.'
    },
    {
      id: 2,
      name: 'Vegetarian Burger',
      restaurant: 'Green Kitchen',
      price: '16.00€',
      rating: 4.6,
      category: 'vegetarian',
      description: 'Vegetable burger with quinoa patty and goat cheese',
      image: '🍔',
      tags: ['Vegetarian', 'Organic'],
      aiScore: 7.8,
      calories: 450,
      protein: 18,
      carbs: 35,
      fats: 22,
      shortJustification: 'Plant-based protein with organic ingredients, great for vegetarian diets.'
    },
    {
      id: 3,
      name: 'Salmon Poke Bowl',
      restaurant: 'Sushi Express',
      price: '18.50€',
      rating: 4.9,
      category: 'healthy',
      description: 'Rice bowl with fresh salmon, avocado and vegetables',
      image: '🍣',
      tags: ['Fish', 'Healthy'],
      aiScore: 9.2,
      calories: 380,
      protein: 28,
      carbs: 25,
      fats: 16,
      shortJustification: 'Rich in omega-3 fatty acids and lean protein, excellent nutritional balance.'
    },
    {
      id: 4,
      name: 'Margherita Pizza',
      restaurant: 'Pizza Roma',
      price: '13.00€',
      rating: 4.5,
      category: 'classic',
      description: 'Traditional pizza with mozzarella and fresh basil',
      image: '🍕',
      tags: ['Vegetarian', 'Italian'],
      aiScore: 6.5,
      calories: 520,
      protein: 20,
      carbs: 45,
      fats: 25,
      shortJustification: 'Classic Italian dish with balanced macronutrients and authentic flavors.'
    },
    {
      id: 5,
      name: 'Carbonara Pasta',
      restaurant: 'Trattoria Bella',
      price: '15.50€',
      rating: 4.7,
      category: 'classic',
      description: 'Pasta with eggs, bacon and parmesan',
      image: '🍝',
      tags: ['Italian', 'Classic'],
      aiScore: 7.0,
      calories: 580,
      protein: 22,
      carbs: 55,
      fats: 28,
      shortJustification: 'Rich in protein and carbs, perfect for energy replenishment.'
    },
    {
      id: 6,
      name: 'Smoothie Bowl',
      restaurant: 'Fresh & Co',
      price: '12.00€',
      rating: 4.4,
      category: 'healthy',
      description: 'Smoothie bowl with fresh fruits and granola',
      image: '🥣',
      tags: ['Vegetarian', 'Vegan', 'Healthy'],
      aiScore: 8.8,
      calories: 280,
      protein: 8,
      carbs: 35,
      fats: 12,
      shortJustification: 'Low calorie option with natural sugars and fiber, ideal for light meals.'
    }
  ];

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
    console.log('🔄 Source state changed:', source);
    console.log('🔄 Current recommendations:', recommendations);
  }, [recommendations, source]);

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
    console.log('📋 Dishes to analyze:', dishes);
    console.log('👤 User profile:', userProfile);
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
              error: analysis.error // Inclure l'erreur si elle existe
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
            tags: dish.tags || []
          }));
          
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
          console.log('📋 No data in localStorage, using default recommendations');
          // Aucune donnée en localStorage - utiliser les recommandations par défaut
          console.log('📋 Default recommendations:', defaultRecommendations);
          // Les recommandations par défaut ont déjà des scores AI, pas besoin de les analyser à nouveau
          setRecommendations(defaultRecommendations);
          setSource('default');
          console.log('✅ Set recommendations to default, count:', defaultRecommendations.length);
        }
      }
    };

    processRecommendations();
  }, [location.state]);

  // Sort recommendations by AI score (descending) and add ranking
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const scoreA = a.aiScore || 0;
    const scoreB = b.aiScore || 0;
    return scoreB - scoreA;
  });

  const filteredRecommendations = selectedCategory === 'all' 
    ? sortedRecommendations 
    : sortedRecommendations.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All', color: 'bg-gray-500' },
    { id: 'healthy', name: 'Healthy', color: 'bg-green-500' },
    { id: 'vegetarian', name: 'Vegetarian', color: 'bg-emerald-500' },
    { id: 'classic', name: 'Classic', color: 'bg-blue-500' },
    { id: 'ai-recommendation', name: 'AI', color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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

          {/* Menu Text Display (if from scan) - Hidden for production, kept for debugging */}
          {/* {menuText && source === 'scan' && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu scanné</h2>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{menuText}</p>
              </div>
            </div>
          )} */}

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecommendations.map((item, index) => {
                const isFirstPlace = index === 0;
                const rankingBadge = index < 3 ? ['🥇', '🥈', '🥉'][index] : null;
                
                return (
                                                    <div 
                  key={item.id} 
                  className={`bg-white border-2 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 relative z-10 flex flex-col h-full ${
                    isFirstPlace 
                      ? 'border-green-500 shadow-xl scale-105 transform' 
                      : index === 1
                      ? 'border-blue-300 shadow-md scale-102 transform'
                      : index === 2
                      ? 'border-orange-300 shadow-sm scale-101 transform'
                      : 'border-gray-200 shadow-sm'
                  }`}
                >
                  {/* Top Right Section: Podium Badge and Price */}
                  <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                    {/* Price Badge */}
                    {item.price && item.price !== 'Price not indicated' && (
                      <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg shadow-md">
                        <span className="text-sm font-bold">{item.price}</span>
                      </div>
                    )}
                    {/* Podium Badge */}
                    {rankingBadge && (
                      <div className="text-3xl drop-shadow-lg filter brightness-110">{rankingBadge}</div>
                    )}
                  </div>
                  
                  <div className="p-8 flex flex-col h-full">
                    {/* Error Banner - Display if there's an error */}
                    {item.error && (
                      <div className="mb-4">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-center">
                          <div className="font-bold mb-1">⚠️ Error</div>
                          <div className="text-sm">{item.error}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* TOP SECTION: Vertically-stacked Personalized Match Score badge */}
                    {!item.error && item.aiScore !== undefined && (
                      <div className="mb-4">
                        <div className="relative inline-block">
                          <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-md">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium uppercase tracking-wide">Personalized Match Score</span>
                                <div className="relative">
                                  <Info 
                                    ref={(el) => tooltipRefs.current[item.id] = el}
                                    size={14}
                                    className="text-white cursor-help hover:text-gray-200 transition-colors"
                                    onMouseEnter={() => setTooltipVisible(item.id)}
                                    onMouseLeave={() => setTooltipVisible(null)}
                                    onClick={() => setTooltipVisible(tooltipVisible === item.id ? null : item.id)}
                                  />
                                </div>
                              </div>
                              <div className="text-xl font-bold">{item.aiScore.toFixed(1)}/10</div>
                            </div>
                          </div>
                          <Tooltip 
                            isVisible={tooltipVisible === item.id}
                            targetRef={{ current: tooltipRefs.current[item.id] }}
                          >
                            This score reflects how well this dish matches your dietary profile, preferences, and estimated nutritional needs.
                          </Tooltip>
                        </div>
                      </div>
                    )}
                    
                    {/* Dish name - immediately below AI Score */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                    </div>
                    
                    {/* Calories - below dish name */}
                    {item.calories !== undefined && (
                      <div className="mb-4">
                        <div className="text-xl font-bold text-gray-900">
                          {item.calories || 0} kcal
                        </div>
                      </div>
                    )}
                    

                    
                    {/* MACRONUTRIENTS SECTION: Pills with icons */}
                    {item.protein !== undefined && (
                      <div className="flex gap-3 mb-6">
                        <div className="bg-red-100 rounded-full px-4 py-2 flex items-center gap-2">
                          <span className="text-sm">🥩</span>
                          <span className="text-sm font-bold text-red-700">{item.protein || 0}g</span>
                        </div>
                        <div className="bg-yellow-100 rounded-full px-4 py-2 flex items-center gap-2">
                          <span className="text-sm">🍞</span>
                          <span className="text-sm font-bold text-yellow-700">{item.carbs || 0}g</span>
                        </div>
                        <div className="bg-orange-100 rounded-full px-4 py-2 flex items-center gap-2">
                          <span className="text-sm">🥑</span>
                          <span className="text-sm font-bold text-orange-700">{item.fats || 0}g</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Spacer to push content to bottom */}
                    <div className="flex-grow"></div>
                    
                    {/* Tags - before button */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Justification - at bottom, smaller and lighter */}
                    {item.shortJustification && (
                      <div className="mb-4">
                        <p className="text-xs italic text-gray-400 leading-relaxed line-clamp-2">
                          {item.shortJustification}
                        </p>
                      </div>
                    )}
                    
                    {/* BOTTOM: View details button - always at bottom */}
                    <div className="mt-auto">
                      <button 
                        onClick={() => openModal(item)}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>

            {filteredRecommendations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more options</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dish Details Modal */}
      <DishDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        dish={selectedDish}
      />
    </div>
  );
};

export default Recommendations; 