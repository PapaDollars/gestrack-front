// Pages publiques (sans connexion) — page parente de l'accueil, du catalogue public,
// de la boutique publique et de la politique de confidentialité.
import React from 'react';
import { Outlet } from 'react-router-dom';

const PagesPubliques = () => <Outlet />;

export default PagesPubliques;
