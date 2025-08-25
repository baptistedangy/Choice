import React, { useState } from 'react';
import { trackRecommendationClick } from '../utils/analytics';
import Tooltip from './Tooltip';

// Icônes SVG modernes
const ProteinIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0zm4-6a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CarbsIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6 8a4 4 0 118 0 4 4 0 01-8 0z" />
  </svg>
);

const FatsIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 10a3 3 0 116 0 3 3 0 01-6 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);



// Composant MacroRow avec vraies barres de progression horizontales
const MacroRow = ({ 
  name, 
  percentage, 
  tooltipContent
}) => {
  // Couleurs des barres selon les spécifications
  const getBarColor = (macroName) => {
    switch(macroName.toLowerCase()) {
      case 'protein':
        return 'bg-red-500';
      case 'carbohydrates':
        return 'bg-yellow-400';
      case 'fats':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Pourcentage valide
  const validPercentage = Math.max(0, Math.min(100, percentage || 0));

  return (
    <div className="flex items-center gap-4 py-2">
      {/* Label avec icône tooltip - largeur fixe */}
      <div className="flex items-center gap-1 w-32 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <Tooltip
          content={tooltipContent}
          position="top"
          maxWidth="max-w-xs"
        >
          <InfoIcon className="info-icon w-3 h-3 text-gray-500 hover:text-gray-700 transition-colors" />
        </Tooltip>
      </div>
      
      {/* Barre de progression - conteneur flexible avec largeur fixe */}
      <div className="flex-1 max-w-xs">
        <div className="w-full h-2 bg-gray-200 rounded">
          <div 
            className={`h-2 rounded ${getBarColor(name)} transition-all duration-300 ease-in-out`}
            style={{ width: `${validPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Pourcentage - largeur fixe */}
      <div className="w-12 text-right flex-shrink-0">
        <span className="text-sm font-medium text-gray-600">
          {validPercentage}%
        </span>
      </div>
    </div>
  );
};

const NutritionCard = ({ dish, rank, onViewDetails }) => {
  // Vérification de sécurité
  if (!dish) {
    console.error('NutritionCard: dish prop is undefined or null');
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
        <div className="text-center text-red-600">
          <p>Erreur: Données du plat manquantes</p>
        </div>
      </div>
    );
  }
  
  // helpers
  const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
  const valOrTilde = v => (num(v) !== null && v > 0 ? v : '∼');
  const formatPrice = (p, cur) => (num(p) !== null ? `${p.toFixed(2)}${cur ? ' ' + cur : ''}` : '∼');

  // Fonction pour obtenir la couleur du score AI
  const getAIScoreColor = (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore >= 8) return 'from-emerald-500 to-green-600';
    if (numScore >= 6) return 'from-yellow-500 to-orange-500';
    if (numScore >= 4) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-600';
  };

  // Fonction pour obtenir l'icône du score AI
  const getAIScoreIcon = (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore >= 8) return '🌟';
    if (numScore >= 6) return '👍';
    if (numScore >= 4) return '⚠️';
    return '❌';
  };

  // Fonction pour obtenir le texte du score AI
  const getAIScoreText = (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore >= 8) return 'Excellent Match';
    if (numScore >= 6) return 'Good Match';
    if (numScore >= 4) return 'Fair Match';
    return 'Poor Match';
  };

  // Fonction pour obtenir la couleur du score
  const getScoreColor = (score) => {
    if (score >= 8) return 'from-green-500 to-emerald-600';
    if (score >= 6) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  // Fonction pour obtenir l'icône de médaille
  const getMedalIcon = (rank) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  // Fonction pour calculer les pourcentages des macros
  const getMacroPercentages = () => {
    // Use new macro structure: item.macros can be % (P/C/F) or grams
    const macros = dish.macros || {};
    const P = macros.protein_g ?? macros.protein ?? 0;
    const C = macros.carbs_g ?? macros.carbs ?? 0;
    const F = macros.fat_g ?? macros.fats ?? macros.fat ?? 0;
    
    const total = P + C + F;
    if (total === 0) return { protein: 0, carbs: 0, fats: 0 };
    
    return {
      protein: Math.round((P / total) * 100),
      carbs: Math.round((C / total) * 100),
      fats: Math.round((F / total) * 100)
    };
  };

  // Fonction pour générer des tags métadonnées pertinents
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
      const protein = dish.protein || 0;
      const carbs = dish.carbs || 0;
      const fats = dish.fats || 0;
      const calories = dish.calories || 0;

      if (protein > 20) tags.push('High Protein');
      if (carbs > 50) tags.push('High Carb');
      if (fats > 15) tags.push('High Fat');
      if (calories > 400) tags.push('High Calorie');
      if (calories < 200) tags.push('Low Calorie');
    }

    // Limiter à 3 tags maximum et éviter les doublons
    return [...new Set(tags)].slice(0, 3);
  };

  const macroPercentages = getMacroPercentages();
  const metaTags = generateMetaTags();
  const hasError = dish.shortJustification && dish.shortJustification.includes('Service temporarily unavailable');
  
  // Récupérer le score personnalisé (priorité au nouveau champ, sinon au score classique)
  const score = dish.personalizedMatchScore ?? dish.aiScore ?? dish.score ?? 1;
  const hasAIScore = dish.personalizedMatchScore !== undefined || dish.aiScore !== undefined;

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 transform hover:-translate-y-2">
      {/* Gradient overlay pour l'effet moderne */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6 space-y-4">
        {/* Score AI et Prix */}
        <div className="flex items-center justify-between mb-4">
          {/* Badge de score AI personnalisé avec gradient futuriste et tooltip */}
          <Tooltip 
            content={hasAIScore 
              ? `Score AI: ${score}/10 - ${getAIScoreText(score)}. Calculé en fonction de la correspondance avec vos préférences alimentaires, objectifs nutritionnels et niveau d'activité.`
              : "Score calculé en fonction de la correspondance avec vos préférences alimentaires, objectifs nutritionnels et niveau d'activité."
            }
            position="top"
            maxWidth="max-w-sm"
          >
            <div 
              className={`flex items-center justify-center px-4 py-2 text-white rounded-full shadow-lg font-bold cursor-help transition-all duration-300 ${
                hasAIScore ? 'bg-gradient-to-r ' + getAIScoreColor(score) : 'bg-gradient-to-r from-purple-600 to-pink-600'
              }`}
            >
              <span className="text-lg font-bold">{score}</span>
              <span className="text-sm ml-1">/10</span>
              {hasAIScore && (
                <span className="text-sm ml-2">{getAIScoreIcon(score)}</span>
              )}
              <span className="text-xs ml-2 opacity-80">ⓘ</span>
            </div>
          </Tooltip>
          
          {/* Badge de prix */}
          <div className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-lg">
            <span className="text-lg font-bold">{formatPrice(dish.price, dish.currency)}</span>
          </div>
        </div>

        {/* Indicateur de score AI avec barre de progression */}
        {hasAIScore && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Personalized Match Score</span>
              <span className="text-xs text-gray-500">{getAIScoreText(score)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  score >= 8 ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
                  score >= 6 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  score >= 4 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                  'bg-gradient-to-r from-red-500 to-pink-600'
                }`}
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>
        )}

        {/* Reasons badges */}
        {dish.reasons && dish.reasons.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Why this matches</span>
              <Tooltip
                content={
                  <div className="space-y-2">
                    <div className="font-semibold text-blue-900">Score breakdown:</div>
                    {dish.subscores && (
                      <div className="space-y-1 text-sm">
                        <div>Macro fit: {Math.round((dish.subscores.macroFit || 0) * 100)}%</div>
                        <div>Portion fit: {Math.round((dish.subscores.portionFit || 0) * 100)}%</div>
                        <div>Protein match: {Math.round((dish.subscores.proteinSourceMatch || 0) * 100)}%</div>
                        <div>Taste match: {Math.round((dish.subscores.tasteMatch || 0) * 100)}%</div>
                        <div>Goal alignment: {Math.round((dish.subscores.goalAlignment || 0) * 100)}%</div>
                      </div>
                    )}
                  </div>
                }
                position="top"
                maxWidth="max-w-xs"
              >
                <InfoIcon className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors" />
              </Tooltip>
            </div>
            <div className="flex flex-wrap gap-2">
              {dish.reasons.map((reason, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium border border-blue-200"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nom du plat et médaille */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 leading-tight flex-1 pr-2">
            {dish.name || dish.title}
          </h3>
          {getMedalIcon(rank) && (
            <div className="text-2xl drop-shadow-sm">
              {getMedalIcon(rank)}
            </div>
          )}
        </div>

        {/* Calories */}
        {dish.macros?.kcal && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg font-bold text-gray-900 text-center">
              {valOrTilde(dish.macros.kcal)} kcal
            </div>
          </div>
        )}

        {/* Macronutriments avec vraies barres de progression */}
        {dish.macros && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-3">
              <span>Macronutrients</span>
              <span className="text-xs text-gray-500">Total: {valOrTilde((dish.macros.protein_g ?? dish.macros.protein ?? 0) + (dish.macros.carbs_g ?? dish.macros.carbs ?? 0) + (dish.macros.fat_g ?? dish.macros.fats ?? dish.macros.fat ?? 0))}g</span>
            </div>
            
            <div className="space-y-1">
              {/* Protéines */}
              <MacroRow
                name="Protein"
                percentage={macroPercentages.protein}
                tooltipContent="Helps with muscle repair and growth"
              />

              {/* Glucides */}
              <MacroRow
                name="Carbohydrates"
                percentage={macroPercentages.carbs}
                tooltipContent="Primary energy source for the body"
              />

              {/* Lipides */}
              <MacroRow
                name="Fats"
                percentage={macroPercentages.fats}
                tooltipContent="Supports hormone production and healthy cells"
              />
            </div>
          </div>
        )}

        {/* Tags métadonnées */}
        {metaTags && metaTags.length > 0 && (
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
        )}

        {/* Description ou message d'erreur */}
        <div className="space-y-2">
          {hasError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <WarningIcon className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Service temporarily unavailable
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Unable to analyze dish
                  </p>
                </div>
              </div>
            </div>
          ) : (
            dish.shortJustification && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {dish.shortJustification}
              </p>
            )
          )}
        </div>

        {/* Bouton d'action */}
        <button 
          onClick={() => {
            trackRecommendationClick(dish.name || dish.title, rank, score);
            onViewDetails(dish);
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          View details
        </button>
      </div>
    </div>
  );
};

export default NutritionCard;
