import React from 'react';

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
    if (dish.tags && dish.tags.length > 0) {
      const healthyTags = dish.tags.filter(tag => 
        ['Sain', 'Bio', 'Végétarien', 'Sans gluten'].includes(tag)
      );
      if (healthyTags.length > 0) {
        reasons.push(`Respects your preferences: ${healthyTags.join(', ')}`);
      }
    }

    // Retourner 2-3 raisons maximum
    return reasons.slice(0, 3);
  };

  const recommendationReasons = getRecommendationReasons(dish);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{dish.name}</h2>
              <p className="text-purple-100">{dish.restaurant}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Price */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-green-600">{dish.price}</div>
          </div>

          {/* Error Banner - Display if there's an error */}
          {dish.error && (
            <div className="mb-6">
              <div className="bg-red-500 text-white px-6 py-4 rounded-lg text-center">
                <div className="font-bold mb-2">⚠️ Analysis Error</div>
                <div className="text-sm">{dish.error}</div>
              </div>
            </div>
          )}
          
          {/* Score IA + Calories (only if no error) */}
          {!dish.error && (
            <div className="flex items-center justify-center space-x-6 mb-6">
              {/* Score IA Badge */}
              {dish.aiScore !== undefined && (
                <div className={`text-white px-4 py-2 rounded-full text-lg font-bold ${
                  dish.aiScore < 5 
                    ? 'bg-red-500' 
                    : dish.aiScore <= 7 
                      ? 'bg-orange-500' 
                      : 'bg-green-500'
                }`}>
                  AI Score: {dish.aiScore.toFixed(1)}/10
                </div>
              )}
              
              {/* Calories */}
              {dish.calories !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{dish.calories || 0}</div>
                  <div className="text-sm text-gray-600">calories</div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{dish.description}</p>
          </div>

          {/* Macronutrients with Icons */}
          {dish.protein !== undefined && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutritional Composition</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl mb-2">🥩</div>
                  <div className="text-xl font-bold text-red-600">{dish.protein || 0}g</div>
                  <div className="text-sm text-red-700">Protein</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl mb-2">🍞</div>
                  <div className="text-xl font-bold text-yellow-600">{dish.carbs || 0}g</div>
                  <div className="text-sm text-yellow-700">Carbs</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl mb-2">🥑</div>
                  <div className="text-xl font-bold text-orange-600">{dish.fats || 0}g</div>
                  <div className="text-sm text-orange-700">Fats</div>
                </div>
              </div>
            </div>
          )}

          {/* Pourquoi nous recommandons ce plat */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Why we recommend this dish
            </h3>
            <div className="space-y-3">
              {recommendationReasons.map((reason, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">{reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {dish.tags && dish.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Characteristics</h3>
              <div className="flex flex-wrap gap-2">
                {dish.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Justification AI */}
          {dish.shortJustification && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">AI Analysis</h3>
              <p className="text-purple-800 italic">
                "{dish.shortJustification}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
                      <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default DishDetailsModal; 