import React, { useState } from 'react';

const AnalyzeMenuModal = ({ isOpen, onClose, onConfirm }) => {
  const [context, setContext] = useState({
    hunger: 'moderate',
    timing: 'regular'
  });

  const hungerOptions = [
    { value: 'light', label: 'Light', description: 'Small portion, light meal' },
    { value: 'moderate', label: 'Moderate', description: 'Standard portion, balanced meal' },
    { value: 'hearty', label: 'Hearty', description: 'Large portion, substantial meal' }
  ];

  const timingOptions = [
    { value: 'regular', label: 'Regular', description: 'Standard meal time' },
    { value: 'pre_workout', label: 'Pre-workout', description: 'Before exercise session' },
    { value: 'post_workout', label: 'Post-workout', description: 'After exercise session' }
  ];

  const handleConfirm = () => {
    onConfirm(context);
  };

  const handleSkip = () => {
    onConfirm({ hunger: 'moderate', timing: 'regular' });
  };

  const handleRadioChange = (field, value) => {
    setContext(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Adjust Analysis</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-blue-100 mt-2">
              Help us provide better recommendations based on your current needs
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Hunger Level */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How hungry are you?
              </h3>
              <div className="space-y-3">
                {hungerOptions.map(option => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="hunger"
                      value={option.value}
                      checked={context.hunger === option.value}
                      onChange={() => handleRadioChange('hunger', option.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Timing Context */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What's the context?
              </h3>
              <div className="space-y-3">
                {timingOptions.map(option => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="timing"
                      value={option.value}
                      checked={context.timing === option.value}
                      onChange={() => handleRadioChange('timing', option.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
              >
                Use These
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyzeMenuModal;
