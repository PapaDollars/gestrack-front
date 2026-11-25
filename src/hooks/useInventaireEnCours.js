import { useEffect, useState } from 'react';
import { inventairesAPI } from '@/services/api';
import { moduleExclu, estModeLimite } from '@/utils/acces';

// Inventaire en cours d'un lieu ('boutique' | 'magasin'), ou null. Pas d'appel en version
// gratuite ni quand le plan exclut le Magasin (la route serait refusée et ouvrirait la fenêtre
// « Passer à la version Pro » à chaque ouverture de la page).
const useInventaireEnCours = (lieu, acces) => {
  const [session, setSession] = useState(null);
  const permis = !!acces && !estModeLimite(acces) && !(lieu === 'magasin' && moduleExclu(acces, 'magasin'));

  useEffect(() => {
    if (!permis) { setSession(null); return undefined; }
    let actif = true;
    inventairesAPI.enCours(lieu).then(({ data }) => { if (actif) setSession(data); }).catch(() => {});
    return () => { actif = false; };
  }, [lieu, permis]);

  return session;
};

export default useInventaireEnCours;
