import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BACKEND_URL } from './config/backend.js'

// Test de la variable d'environnement
console.log('Google Vision Key:', import.meta.env.VITE_GOOGLE_VISION_API_KEY);
console.log('OpenAI Key:', import.meta.env.VITE_OPENAI_API_KEY ? 'Present' : 'Missing');

// Affichage de la configuration du backend
console.log('🚀 Application démarrée avec la configuration suivante:');
console.log('🌐 Backend URL:', BACKEND_URL);
console.log('📍 Frontend URL:', window.location.href);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
