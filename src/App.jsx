import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import MenuScan from './pages/MenuScan';
import Recommendations from './pages/Recommendations';
import { checkBackendHealth } from './services/backendService';
import usePageTracking from './hooks/usePageTracking';

// Composant séparé pour le contenu de l'application avec le Router
function AppContent() {
  // Track page views - maintenant à l'intérieur du Router
  usePageTracking();
  
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navigation />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/menu-scan" replace />} />
          <Route path="/menu-scan" element={<MenuScan />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('App component mounted');
    setIsLoading(false);
    // Test de la disponibilité du backend
    checkBackendHealth().then(available => {
      console.log('Backend disponible:', available);
    }).catch(error => {
      console.log('Backend non disponible:', error.message);
    });
  }, []);

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

  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
