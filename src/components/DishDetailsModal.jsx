import React from 'react';

const DishDetailsModal = ({ isOpen, onClose, dish }) => {
  if (!isOpen || !dish) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{dish.name}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-purple-100 mt-1">{dish.restaurant}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{dish.description}</p>
          </div>

          {/* AI Score */}
          {dish.aiScore !== undefined && (
            <div className="mb-6">
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  Score IA: {dish.aiScore}/10
                </div>
                <div className="text-sm text-gray-600">
                  Pertinence pour votre profil
                </div>
              </div>
            </div>
          )}

          {/* Nutritional Information */}
          {dish.calories !== undefined && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations nutritionnelles</h3>
              
              {/* Calories */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{dish.calories || 0}</div>
                  <div className="text-sm text-gray-600">calories</div>
                </div>
              </div>

              {/* Macronutrients */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{dish.protein || 0}</div>
                  <div className="text-xs text-red-700">Protéines (g)</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{dish.carbs || 0}</div>
                  <div className="text-xs text-yellow-700">Glucides (g)</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{dish.fats || 0}</div>
                  <div className="text-xs text-orange-700">Lipides (g)</div>
                </div>
              </div>
            </div>
          )}

          {/* Why this was recommended */}
          {dish.shortJustification && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Pourquoi cette recommandation ?
              </h3>
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-blue-900 italic">
                  "{dish.shortJustification}"
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          {dish.tags && dish.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Caractéristiques</h3>
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

          {/* Price */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-4">{dish.price}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishDetailsModal; 