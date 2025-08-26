import React, { useState, useEffect } from 'react';
import { trackOnboardingComplete, trackUserPreferences } from '../utils/analytics';

const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime] = useState(Date.now());
  const [formData, setFormData] = useState({
    dietaryPreferences: [],
    allergies: [],
    budget: 'medium',
    goal: 'maintain'
  });

  const steps = [
    {
      title: "Welcome to Choice! 👋",
      subtitle: "Get personalized meal recommendations from any menu",
      component: WelcomeStep
    },
    {
      title: "Dietary Preferences",
      subtitle: "Help us understand your food preferences",
      component: DietaryStep
    },
    {
      title: "Budget & Goals",
      subtitle: "Set your dining preferences",
      component: BudgetStep
    },
    {
      title: "You're all set! 🎉",
      subtitle: "Start scanning menus for personalized recommendations",
      component: CompleteStep
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    // Save preferences to localStorage
    localStorage.setItem('userOnboarded', 'true');
    localStorage.setItem('extendedProfile', JSON.stringify(formData));
    
    // Track completion
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    trackOnboardingComplete(timeSpent);
    trackUserPreferences(formData);
    
    // Call completion callback - the parent App component will handle navigation
    onComplete();
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-2 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep].subtitle}
            </p>
          </div>

          <CurrentStepComponent 
            formData={formData}
            setFormData={setFormData}
            onNext={nextStep}
            onPrev={prevStep}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
          />
        </div>
      </div>
    </div>
  );
};

// Welcome Step
const WelcomeStep = ({ onNext, isFirst }) => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">📱</div>
    <div className="space-y-4">
      <div className="flex items-center space-x-3 text-left">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600">📷</span>
        </div>
        <span className="text-gray-700">Scan any restaurant menu</span>
      </div>
      <div className="flex items-center space-x-3 text-left">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600">🤖</span>
        </div>
        <span className="text-gray-700">Get AI-powered recommendations</span>
      </div>
      <div className="flex items-center space-x-3 text-left">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600">🎯</span>
        </div>
        <span className="text-gray-700">Personalized to your preferences</span>
      </div>
    </div>
    <button
      onClick={onNext}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
    >
      Get Started
    </button>
  </div>
);

// Dietary Preferences Step
const DietaryStep = ({ formData, setFormData, onNext, onPrev }) => {
  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥬', desc: 'No meat, but eggs and dairy OK' },
    { value: 'vegan', label: 'Vegan', icon: '🌱', desc: 'No animal products at all' },
    { value: 'flexitarian', label: 'Flexitarian', icon: '🍽️', desc: 'Mostly plant-based, some meat' }
  ];

  const selectPreference = (preference) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: [preference] // Only one selection allowed
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {dietaryOptions.map(option => (
          <button
            key={option.value}
            onClick={() => selectPreference(option.value)}
            className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
              formData.dietaryPreferences.includes(option.value)
                ? 'border-purple-600 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{option.icon}</div>
              <div className="text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-500">{option.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Choose your primary dietary preference
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onPrev}
          className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={formData.dietaryPreferences.length === 0}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            formData.dietaryPreferences.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Budget & Goals Step
const BudgetStep = ({ formData, setFormData, onNext, onPrev }) => {
  const budgetOptions = [
    { value: 'low', label: 'Budget-friendly', icon: '💰', desc: 'Under $15 per meal' },
    { value: 'medium', label: 'Moderate', icon: '💳', desc: '$15-30 per meal' },
    { value: 'high', label: 'Premium', icon: '💎', desc: '$30+ per meal' }
  ];

  const goalOptions = [
    { value: 'lose', label: 'Lose weight', icon: '📉' },
    { value: 'maintain', label: 'Maintain weight', icon: '⚖️' },
    { value: 'gain', label: 'Gain weight', icon: '📈' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Budget preference</h3>
        <div className="space-y-2">
          {budgetOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFormData(prev => ({ ...prev, budget: option.value }))}
              className={`w-full p-3 rounded-lg border-2 transition-colors text-left flex items-center space-x-3 ${
                formData.budget === option.value
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-500">{option.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Health goal</h3>
        <div className="grid grid-cols-3 gap-2">
          {goalOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFormData(prev => ({ ...prev, goal: option.value }))}
              className={`p-3 rounded-lg border-2 transition-colors text-center ${
                formData.goal === option.value
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-1">{option.icon}</div>
              <div className="text-xs font-medium">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onPrev}
          className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
};

// Complete Step
const CompleteStep = ({ onNext }) => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">🎉</div>
    <div className="space-y-2">
      <h3 className="text-xl font-semibold text-gray-900">You're all set!</h3>
      <p className="text-gray-600">
        Start scanning restaurant menus to get personalized meal recommendations.
      </p>
    </div>
    <button
      onClick={onNext}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
    >
      Start Scanning Menus 📷
    </button>
  </div>
);

export default OnboardingFlow;