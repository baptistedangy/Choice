import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navigation from './components/Navigation';
import Profile from './pages/Profile';
import MenuScan from './pages/MenuScan';
import Recommendations from './pages/Recommendations';
import ExtendedProfile from './pages/ExtendedProfile';
import visionApiService from './services/visionApi';
import { extractMenuText } from './services/visionService';

function App() {
  useEffect(() => {
    // Test d'initialisation du service Vision API
    console.log('Test d\'initialisation du service Vision API...');
    console.log('API Key disponible:', !!import.meta.env.VITE_GOOGLE_VISION_API_KEY);
    
    // Test simple pour vérifier que le service est accessible
    if (visionApiService) {
      console.log('Service Vision API initialisé avec succès');
    }

    // Test du nouveau service d'extraction de texte
    console.log('Service d\'extraction de texte disponible:', !!extractMenuText);
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
