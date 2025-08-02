import React, { useState, useEffect } from 'react';

const ExtendedProfile = () => {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    activityLevel: '',
    goal: '',
    dietaryPreferences: []
  });

  const [isSaved, setIsSaved] = useState(false);

  // Options pour les dropdowns
  const activityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'high', label: 'High' }
  ];

  const goals = [
    { value: 'maintain', label: 'Maintain weight' },
    { value: 'lose', label: 'Lose weight' },
    { value: 'gain', label: 'Gain weight' }
  ];

  const dietaryOptions = [
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'gluten-free', label: 'Gluten-Free' },
    { value: 'dairy-free', label: 'Dairy-Free' },
    { value: 'nut-free', label: 'Nut-Free' },
    { value: 'low-carb', label: 'Low-Carb' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'pescatarian', label: 'Pescatarian' }
  ];

  // Charger les données existantes au montage du composant
  useEffect(() => {
    const savedProfile = localStorage.getItem('extendedProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setFormData(parsedProfile);
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      }
    }
  }, []);

  // Gestion des changements dans les champs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestion des préférences alimentaires (multiselect)
  const handleDietaryPreferenceChange = (preference) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
    }));
  };

  // Sauvegarde du profil
  const handleSave = () => {
    try {
      localStorage.setItem('extendedProfile', JSON.stringify(formData));
      setIsSaved(true);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setIsSaved(false), 3000);
      
      console.log('Profil étendu sauvegardé:', formData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Complete your information</h1>
            <p className="text-blue-100 text-lg">
              Completing these fields helps us provide more accurate meal recommendations.
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="space-y-6">
                {/* Age */}
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your weight in kg"
                    min="20"
                    max="300"
                    step="0.1"
                  />
                </div>

                {/* Height */}
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your height in cm"
                    min="100"
                    max="250"
                  />
                </div>

                {/* Activity Level */}
                <div>
                  <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Level
                  </label>
                  <select
                    id="activityLevel"
                    value={formData.activityLevel}
                    onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select activity level</option>
                    {activityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Goal */}
                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                    Goal
                  </label>
                  <select
                    id="goal"
                    value={formData.goal}
                    onChange={(e) => handleInputChange('goal', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select your goal</option>
                    {goals.map(goal => (
                      <option key={goal.value} value={goal.value}>
                        {goal.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dietary Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dietary Preferences
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {dietaryOptions.map(option => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.dietaryPreferences.includes(option.value)}
                          onChange={() => handleDietaryPreferenceChange(option.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    Save Profile
                  </button>
                </div>

                {/* Success Message */}
                {isSaved && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Profile saved successfully!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for better recommendations:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• The more information you provide, the more personalized your recommendations will be</li>
                <li>• You can update this information anytime</li>
                <li>• All fields are optional - you can save partial information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtendedProfile; 