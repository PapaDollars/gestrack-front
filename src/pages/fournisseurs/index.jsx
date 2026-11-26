// Fournisseurs — page parente de la liste (liste/) et de la fiche d'un fournisseur (detail/).
// Les modales communes aux deux sous-pages sont dans modals/.
import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';

// Transmet aux sous-pages ce que donne la mise en page (accès du compte : plan, dépôts…) —
// sans ça, useOutletContext() y renvoyait undefined
const Fournisseurs = () => <Outlet context={useOutletContext()} />;

export default Fournisseurs;
