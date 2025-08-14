import React from 'react';
import Tooltip from './Tooltip';

const DishDetailsModal = ({ dish, isOpen, onClose }) => {
  if (!isOpen || !dish) return null;
  
  // helpers
  const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
  const valOrTilde = v => (num(v) !== null && v > 0 ? v : '∼');
  const formatPrice = (p, cur) => (num(p) !== null ? `${p.toFixed(2)}${cur ? ' ' + cur : ''}` : '∼');

  // Fonction pour obtenir la couleur du score AI (cohérente avec NutritionCard)
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-emerald-500 to-green-600';
    if (score >= 6) return 'from-yellow-500 to-orange-500';
    if (score >= 4) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-600';
  };

  // Fonction pour obtenir le texte du score AI (cohérente avec NutritionCard)
  const getScoreText = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  // Fonction pour générer les tags métadonnées (cohérente avec NutritionCard)
  const generateMetaTags = () => {
    const tags = [];
    
    // Récupérer le profil utilisateur depuis localStorage
    let userProfile = null;
    try {
      const savedProfile = localStorage.getItem('extendedProfile');
      if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération du profil:', error);
    }

    // Tags basés sur les préférences alimentaires de l'utilisateur
    if (userProfile && userProfile.dietaryPreferences) {
      userProfile.dietaryPreferences.forEach(pref => {
        // Formater les préférences pour l'affichage
        const formattedPref = pref.charAt(0).toUpperCase() + pref.slice(1).replace('-', ' ');
        tags.push(formattedPref);
      });
    }

    // Tags basés sur l'objectif de l'utilisateur
    if (userProfile && userProfile.goal) {
      switch (userProfile.goal) {
        case 'lose':
          tags.push('Weight Loss');
          break;
        case 'gain':
          tags.push('Weight Gain');
          break;
        case 'maintain':
          tags.push('Weight Maintenance');
          break;
      }
    }

    // Tags basés sur le niveau d'activité
    if (userProfile && userProfile.activityLevel) {
      switch (userProfile.activityLevel) {
        case 'low':
          tags.push('Low Activity');
          break;
        case 'moderate':
          tags.push('Moderate Activity');
          break;
        case 'high':
          tags.push('High Activity');
          break;
      }
    }

    // Tags basés sur le profil nutritionnel du plat (seulement si pas assez de tags personnalisés)
    if (tags.length < 3) {
      const macros = dish.macros || {};
      const protein = macros.protein_g ?? macros.protein ?? 0;
      const carbs = macros.carbs_g ?? macros.carbs ?? 0;
      const fats = macros.fat_g ?? macros.fats ?? macros.fat ?? 0;
      const calories = macros.kcal ?? dish.calories ?? 0;

      if (protein > 20) tags.push('High Protein');
      if (carbs > 50) tags.push('High Carb');
      if (fats > 15) tags.push('High Fat');
      if (calories > 400) tags.push('High Calorie');
      if (calories < 200) tags.push('Low Calorie');
    }

    // Limiter à 3 tags maximum et éviter les doublons
    return [...new Set(tags)].slice(0, 3);
  };

  // Générer les tags pour l'affichage
  const metaTags = generateMetaTags();



  // Fonction pour traduire la description en anglais si nécessaire
  const getEnglishDescription = (description) => {
    if (!description) return 'No description available';
    
    // Si la description est déjà en anglais, la retourner
    if (description.includes('Extracted from menu') || 
        description.includes('High in protein') || 
        description.includes('Rich in') ||
        description.includes('Contains') ||
        description.includes('Balanced meal')) {
      return description;
    }
    
    // Si c'est en français, retourner une description générique en anglais
    if (description.includes('Un beau') || description.includes('Une quinoa') || description.includes('Crème d')) {
      return 'Fresh and flavorful dish prepared with quality ingredients. Perfect balance of flavors and textures for a satisfying meal experience.';
    }
    
    return description;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête avec bouton de fermeture */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Dish Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu de la modale */}
        <div className="px-6 py-6 space-y-6">
          {/* Nom du plat et score personnalisé */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">
              {dish.name || dish.title}
            </h3>
            {(dish.personalizedMatchScore !== undefined || dish.aiScore !== undefined) && (
              <Tooltip 
                content="Calculé en fonction de la correspondance avec vos préférences alimentaires, objectifs nutritionnels et niveau d'activité."
                position="left"
                maxWidth="max-w-sm"
              >
                <div className={`bg-gradient-to-r ${getScoreColor(dish.personalizedMatchScore ?? dish.aiScore ?? 1)} text-white rounded-full px-4 py-2 shadow-lg cursor-help`}>
                  <div className="text-center">
                    <div className="text-xl font-bold">{dish.personalizedMatchScore ?? dish.aiScore ?? 1}/10</div>
                    <div className="text-xs opacity-90">{getScoreText(dish.personalizedMatchScore ?? dish.aiScore ?? 1)}</div>
                  </div>
                </div>
              </Tooltip>
            )}
          </div>

          {/* Prix avec devise */}
          {dish.price && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg inline-block">
              <span className="font-bold text-lg">{formatPrice(dish.price, dish.currency)}</span>
            </div>
          )}

          {/* Tags métadonnées (cohérents avec les cartes) */}
          {metaTags && metaTags.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {metaTags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs rounded-full font-medium border border-blue-200 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description en anglais */}
          {dish.description && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600 leading-relaxed">
                {getEnglishDescription(dish.description)}
              </p>
            </div>
          )}

          {/* Calories */}
          {dish.calories !== undefined && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Calories</h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-gray-900 text-center">
                  {valOrTilde(dish.macros?.kcal ?? dish.calories ?? 0)} kcal
                </div>
              </div>
            </div>
          )}

          {/* Macronutriments */}
          {dish.macros && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Macronutrients</h4>
              <div className="grid grid-cols-3 gap-4">
                {/* Protéines */}
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{valOrTilde(dish.macros.protein_g ?? dish.macros.protein ?? 0)}g</div>
                  <div className="text-sm text-red-500 font-medium">Protein</div>
                </div>
                
                {/* Glucides */}
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{valOrTilde(dish.macros.carbs_g ?? dish.macros.carbs ?? 0)}g</div>
                  <div className="text-sm text-yellow-500 font-medium">Carbohydrates</div>
                </div>
                
                {/* Lipides */}
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{valOrTilde(dish.macros.fat_g ?? dish.macros.fats ?? dish.macros.fat ?? 0)}g</div>
                  <div className="text-sm text-green-500 font-medium">Fats</div>
                </div>
              </div>
              
              {/* Total des macronutriments */}
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-500">
                  Total: {valOrTilde((dish.macros.protein_g ?? dish.macros.protein ?? 0) + (dish.macros.carbs_g ?? dish.macros.carbs ?? 0) + (dish.macros.fat_g ?? dish.macros.fats ?? dish.macros.fat ?? 0))}g
                </span>
              </div>
            </div>
          )}

          {/* Justification courte */}
          {dish.shortJustification && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Why This Dish?</h4>
              <p className="text-gray-600 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-200">
                {dish.shortJustification}
              </p>
            </div>
          )}

          {/* Justification longue */}
          {dish.longJustification && Array.isArray(dish.longJustification) && dish.longJustification.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Detailed Benefits</h4>
              <ul className="space-y-2">
                {dish.longJustification.map((point, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Informations de conformité diététique */}
          {dish.dietaryClassifications && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Dietary Information</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(dish.dietaryClassifications).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avertissement de conformité */}
          {dish.complianceWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <svg className="text-amber-600 mt-0.5 flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Dietary Compliance Notice
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {dish.complianceWarning}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bouton de fermeture */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishDetailsModal; 