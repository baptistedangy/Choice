import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingFlow from './components/OnboardingFlow';
import Profile from './pages/Profile';
import MenuScan from './pages/MenuScan';
import Recommendations from './pages/Recommendations';
import ExtendedProfile from './pages/ExtendedProfile';
import { checkBackendHealth } from './services/backendService';
import usePageTracking from './hooks/usePageTracking';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track page views
  usePageTracking();

  useEffect(() => {
    console.log('App component mounted');
    
    // Check if user has completed onboarding
    const hasOnboarded = localStorage.getItem('userOnboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
    setIsLoading(false);
    
    // Test d'initialisation des services
    console.log('Test d\'initialisation des services...');
    console.log('Frontend API Key disponible:', !!import.meta.env.VITE_GOOGLE_VISION_API_KEY);
    
    // Test de la disponibilité du backend
    checkBackendHealth().then(available => {
      console.log('Backend disponible:', available);
    }).catch(error => {
      console.log('Backend non disponible:', error.message);
    });
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Choice...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/profile" replace />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/menu-scan" element={<MenuScan />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/extended-profile" element={<ExtendedProfile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
