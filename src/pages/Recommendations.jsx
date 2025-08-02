import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzeDish } from '../aiAnalysis';
import DishDetailsModal from '../components/DishDetailsModal';

const Recommendations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [menuText, setMenuText] = useState('');
  const [source, setSource] = useState('');
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsAnalyzing(true);
    
    try {
      const analyzedDishes = await Promise.all(
        dishes.map(async (dish) => {
          try {
            // Créer un texte de description pour l'analyse
            const dishText = `${dish.name}: ${dish.description}`;
            
            // Analyser le plat
            const analysis = await analyzeDish(dishText, userProfile);
            
            // Retourner le plat avec les informations d'analyse
            return {
              ...dish,
              aiScore: analysis.aiScore,
              calories: analysis.calories,
              protein: analysis.protein,
              carbs: analysis.carbs,
              fats: analysis.fats,
              shortJustification: analysis.shortJustification
            };
          } catch (error) {
            console.error(`Erreur lors de l'analyse du plat ${dish.name}:`, error);
            // Retourner le plat sans analyse en cas d'erreur
            return {
              ...dish,
              aiScore: 5,
              calories: 0,
              protein: 0,
              carbs: 0,
              fats: 0,
              shortJustification: 'Analyse non disponible'
            };
          }
        })
      );
      
      setRecommendations(analyzedDishes);
      console.log('Plats analysés:', analyzedDishes);
    } catch (error) {
      console.error('Erreur lors de l\'analyse des plats:', error);
      setRecommendations(dishes); // Utiliser les plats non analysés
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

  // Recommandations par défaut (fallback)
  const defaultRecommendations = [
    {
      id: 1,
      name: 'Salade César',
      restaurant: 'Le Bistrot Parisien',
      price: '14.50€',
      rating: 4.8,
      category: 'healthy',
      description: 'Salade fraîche avec poulet grillé, parmesan et croûtons',
      image: '🥗',
      tags: ['Végétarien', 'Sans gluten']
    },
    {
      id: 2,
      name: 'Burger Végétarien',
      restaurant: 'Green Kitchen',
      price: '16.00€',
      rating: 4.6,
      category: 'vegetarian',
      description: 'Burger aux légumes avec galette de quinoa et fromage de chèvre',
      image: '🍔',
      tags: ['Végétarien', 'Bio']
    },
    {
      id: 3,
      name: 'Poke Bowl Saumon',
      restaurant: 'Sushi Express',
      price: '18.50€',
      rating: 4.9,
      category: 'healthy',
      description: 'Bowl de riz avec saumon frais, avocat et légumes',
      image: '🍣',
      tags: ['Poisson', 'Sain']
    },
    {
      id: 4,
      name: 'Pizza Margherita',
      restaurant: 'Pizza Roma',
      price: '13.00€',
      rating: 4.5,
      category: 'classic',
      description: 'Pizza traditionnelle avec mozzarella et basilic frais',
      image: '🍕',
      tags: ['Végétarien', 'Italien']
    },
    {
      id: 5,
      name: 'Pasta Carbonara',
      restaurant: 'Trattoria Bella',
      price: '15.50€',
      rating: 4.7,
      category: 'classic',
      description: 'Pâtes aux œufs, lardons et parmesan',
      image: '🍝',
      tags: ['Italien', 'Classique']
    },
    {
      id: 6,
      name: 'Smoothie Bowl',
      restaurant: 'Fresh & Co',
      price: '12.00€',
      rating: 4.4,
      category: 'healthy',
      description: 'Bowl de smoothie avec fruits frais et granola',
      image: '🥣',
      tags: ['Végétarien', 'Végan', 'Sain']
    }
  ];

  // Récupérer les données passées via navigation et vérifier le profil étendu
  useEffect(() => {
    // Vérifier le profil étendu
    checkExtendedProfile();

    const processRecommendations = async () => {
      if (location.state) {
        const { recommendations: aiRecommendations, menuText: scannedMenuText, source: scanSource } = location.state;
        
        if (aiRecommendations && aiRecommendations.length > 0) {
          // Convertir le format OpenAI vers le format d'affichage
          const formattedRecommendations = aiRecommendations.map((dish, index) => ({
            id: index + 1,
            name: dish.title,
            restaurant: 'Menu scanné',
            price: dish.price ? `${dish.price.toFixed(2)}€` : 'Prix non indiqué',
            rating: 4.5 + (Math.random() * 0.5), // Rating aléatoire entre 4.5 et 5.0
            category: 'ai-recommendation',
            description: dish.description,
            image: '🤖',
            tags: dish.tags || []
          }));
          
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
          
          // Analyser les plats avec AI
          await analyzeDishes(formattedRecommendations, userProfile);
          
          console.log('Recommandations reçues:', formattedRecommendations);
        }
      } else {
        // Utiliser les recommandations par défaut si aucune donnée n'est passée
        const userProfile = {
          dietaryRestrictions: [],
          budget: "medium",
          cuisinePreferences: [],
          allergies: [],
          spiceTolerance: "medium"
        };
        
        await analyzeDishes(defaultRecommendations, userProfile);
      }
    };

    processRecommendations();
  }, [location.state]);

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'Toutes', color: 'bg-gray-500' },
    { id: 'healthy', name: 'Sain', color: 'bg-green-500' },
    { id: 'vegetarian', name: 'Végétarien', color: 'bg-emerald-500' },
    { id: 'classic', name: 'Classique', color: 'bg-blue-500' },
    { id: 'ai-recommendation', name: 'IA', color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Recommandations</h1>
            <p className="text-purple-100 mt-2">Découvrez nos suggestions personnalisées</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtrer par catégorie</h2>
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
                  <span className="text-purple-600 font-medium">Analyse des plats en cours...</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecommendations.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Top section: Dish name + Price */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.restaurant}</p>
                      </div>
                      <span className="text-lg font-bold text-green-600">{item.price}</span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-4">{item.description}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Middle section: AI Score and Calories */}
                    {item.aiScore !== undefined && (
                      <div className="mb-4">
                        <div className="text-center mb-3">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            Score IA: {item.aiScore}/10
                          </div>
                          <div className="text-sm text-gray-600">
                            Calories: {item.calories || 0} kcal
                          </div>
                        </div>
                        
                        {/* Bottom section: Macronutrients as colored tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                            Protein: {item.protein || 0}g
                          </span>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                            Carbs: {item.carbs || 0}g
                          </span>
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                            Fats: {item.fats || 0}g
                          </span>
                        </div>
                        
                        {/* Justification */}
                        {item.shortJustification && (
                          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                            <p className="text-xs text-purple-700 italic">
                              "{item.shortJustification}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Bottom: Voir détails button */}
                    <div className="flex justify-center">
                      <button 
                        onClick={() => openModal(item)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredRecommendations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune recommandation trouvée</h3>
                <p className="text-gray-600">Essayez de modifier vos filtres pour voir plus d'options</p>
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