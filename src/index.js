// Point d'entrée principal de l'application React
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { bloquerMoletteSurChampsNombre } from '@/utils/champsNombre';
import { activerToucheRecherche } from '@/utils/champsRecherche';

// La molette ne modifie plus les champs nombre (prix, quantités) — voir utils/champsNombre.js
bloquerMoletteSurChampsNombre();
// Champs de recherche : touche « Rechercher » qui ferme le clavier — voir utils/champsRecherche.js
activerToucheRecherche();

// Service worker : page « Pas de connexion » personnalisée au lieu de l'erreur du navigateur
// (voir public/sw.js). En production seulement : en local il gênerait le rechargement à chaud.
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* non bloquant */ });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
