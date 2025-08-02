import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Test de la variable d'environnement
console.log('Google Vision Key:', import.meta.env.VITE_GOOGLE_VISION_API_KEY);
console.log('OpenAI Key:', import.meta.env.VITE_OPENAI_API_KEY ? 'Present' : 'Missing');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
