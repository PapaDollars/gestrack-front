// Dettes — page parente de « Toutes les dettes » (liste/) et « Dettes d'un client » (client/).
// Les modales communes aux deux sous-pages sont dans modals/.
import React from 'react';
import { Outlet } from 'react-router-dom';

const Dettes = () => <Outlet />;

export default Dettes;
