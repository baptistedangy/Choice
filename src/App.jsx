import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Profile from './pages/Profile';
import MenuScan from './pages/MenuScan';
import Recommendations from './pages/Recommendations';
import ExtendedProfile from './pages/ExtendedProfile';
import { extractMenuText } from './services/visionService';
import { checkBackendHealth } from './services/backendService';

function App() {
  useEffect(() => {
    console.log('App component mounted');
    
    // Test d'initialisation des services
    console.log('Test d\'initialisation des services...');
    console.log('Frontend API Key disponible:', !!import.meta.env.VITE_GOOGLE_VISION_API_KEY);
    
    // Test du service d'extraction de texte frontend
    console.log('Service d\'extraction de texte frontend disponible:', !!extractMenuText);
    
    // Test de la disponibilité du backend
    checkBackendHealth().then(available => {
      console.log('Backend disponible:', available);
    }).catch(error => {
      console.log('Backend non disponible:', error.message);
    });
  }, []);

  return (
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
  );
}

export default App;
