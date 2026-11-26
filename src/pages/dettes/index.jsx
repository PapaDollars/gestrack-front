// Dettes — page parente de « Toutes les dettes » (liste/) et « Dettes d'un client » (client/).
// Les modales communes aux deux sous-pages sont dans modals/.
import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';

// Transmet aux sous-pages ce que donne la mise en page (accès du compte, compteurs…)
const Dettes = () => <Outlet context={useOutletContext()} />;

export default Dettes;
