import React from 'react';
import Tooltip from './Tooltip';

const DishDetailsModal = ({ isOpen, onClose, dish }) => {
  if (!isOpen || !dish) return null;

  // Utiliser les raisons de recommandation générées par l'IA ou générer des raisons par défaut
  const getRecommendationReasons = (dish) => {
    if (dish.longJustification && Array.isArray(dish.longJustification) && dish.longJustification.length > 0) {
      return dish.longJustification;
    }
    
    // Raisons par défaut si l'IA n'a pas fourni de longJustification
    const reasons = [];
    
    // Raison basée sur le score IA
    if (dish.aiScore >= 8) {
      reasons.push("Excellent match with your dietary preferences");
    } else if (dish.aiScore >= 6) {
      reasons.push("Good match with your nutritional profile");
    } else {
      reasons.push("Moderate match with your needs");
    }

    // Raison basée sur les calories
    if (dish.calories && dish.calories < 400) {
      reasons.push("Low in calories, ideal for a balanced meal");
    } else if (dish.calories && dish.calories > 600) {
      reasons.push("High in energy, perfect for active days");
    }

    // Raison basée sur les protéines
    if (dish.protein && dish.protein > 20) {
      reasons.push("High in protein, excellent for muscle recovery");
    }

    // Raison basée sur l'équilibre nutritionnel
    if (dish.protein && dish.carbs && dish.fats) {
      const total = dish.protein + dish.carbs + dish.fats;
      if (total > 0) {
        const proteinRatio = (dish.protein / total) * 100;
        const carbRatio = (dish.carbs / total) * 100;
        const fatRatio = (dish.fats / total) * 100;
        
        if (proteinRatio > 25 && carbRatio > 40 && fatRatio > 20) {
          reasons.push("Optimal nutritional balance between proteins, carbs and fats");
        }
      }
    }

    // Raison basée sur les tags
    if (dish.tags && dish.tags.includes('vegetarian')) {
      reasons.push("Perfect for vegetarian dietary preferences");
    }
    if (dish.tags && dish.tags.includes('gluten-free')) {
      reasons.push("Suitable for gluten-free diet");
    }

    return reasons.length > 0 ? reasons : ["This dish aligns well with your nutritional goals"];
  };

  const recommendationReasons = getRecommendationReasons(dish);

  // Fonction pour obtenir la couleur du score
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-green-500 to-emerald-600';
    if (score >= 6) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Dish Details
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="px-6 py-6 space-y-6">
            {/* Nom du plat et score personnalisé */}
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                {dish.name || dish.title}
              </h3>
              {dish.aiScore !== undefined && (
                <Tooltip 
                  content="Calculé en fonction de la correspondance avec vos préférences alimentaires, objectifs nutritionnels et niveau d'activité."
                  position="left"
                  maxWidth="max-w-sm"
                >
                  <div className={`bg-gradient-to-r ${getScoreColor(dish.aiScore)} text-white rounded-full px-4 py-2 shadow-lg cursor-help`}>
                    <div className="text-center">
                      <div className="text-xl font-bold">{dish.aiScore || 0}/10</div>
                      <div className="text-xs opacity-90">Personalized Match</div>
                    </div>
                  </div>
                </Tooltip>
              )}
            </div>

            {/* Prix */}
            {dish.price && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg inline-block">
                <span className="font-bold text-lg">{dish.price}</span>
              </div>
            )}

            {/* Description */}
            {dish.description && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600 leading-relaxed">
                  {dish.description}
                </p>
              </div>
            )}

            {/* Calories */}
            {dish.calories !== undefined && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Calories</h4>
                <div className="text-2xl font-bold text-gray-900 text-center">
                  {dish.calories || 0} kcal
                </div>
              </div>
            )}

            {/* Composition nutritionnelle */}
            {dish.protein !== undefined && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Nutritional Composition</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="text-2xl mb-2">💪</div>
                    <div className="text-xl font-bold text-red-600">{dish.protein || 0}g</div>
                    <div className="text-sm text-red-700 font-medium">Protein</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="text-2xl mb-2">🍞</div>
                    <div className="text-xl font-bold text-yellow-600">{dish.carbs || 0}g</div>
                    <div className="text-sm text-yellow-700 font-medium">Carbs</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-2xl mb-2">🥑</div>
                    <div className="text-xl font-bold text-green-600">{dish.fats || 0}g</div>
                    <div className="text-sm text-green-700 font-medium">Fats</div>
                  </div>
                </div>
              </div>
            )}

            {/* Pourquoi nous recommandons ce plat */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Why we recommend this dish
              </h4>
              <div className="space-y-3">
                {recommendationReasons.map((reason, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2"></div>
                    <p className="text-gray-700 leading-relaxed">{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {dish.tags && dish.tags.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {dish.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Justification courte */}
            {dish.shortJustification && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Quick Analysis</h4>
                <p className="text-gray-600 leading-relaxed">
                  {dish.shortJustification}
                </p>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishDetailsModal; 