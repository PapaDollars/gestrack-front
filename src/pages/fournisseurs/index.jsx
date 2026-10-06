// Fournisseurs — page parente de la liste (liste/) et de la fiche d'un fournisseur (detail/).
// Les modales communes aux deux sous-pages sont dans modals/.
import React from 'react';
import { Outlet } from 'react-router-dom';

const Fournisseurs = () => <Outlet />;

export default Fournisseurs;
