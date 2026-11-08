// Point d'entrée principal de l'application React
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { bloquerMoletteSurChampsNombre } from '@/utils/champsNombre';

// La molette ne modifie plus les champs nombre (prix, quantités) — voir utils/champsNombre.js
bloquerMoletteSurChampsNombre();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
