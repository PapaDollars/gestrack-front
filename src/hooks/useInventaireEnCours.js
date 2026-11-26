import { useEffect, useState } from 'react';
import { inventairesAPI } from '@/services/api';
import { moduleExclu, estModeLimite } from '@/utils/acces';

// Inventaire en cours d'un lieu ('boutique' | 'magasin'), ou null. Pas d'appel en version
// gratuite ni quand le plan exclut le Magasin (la route serait refusée et ouvrirait la fenêtre
// « Passer à la version Pro » à chaque ouverture de la page).
// depot : dépôt du Magasin (null = Dépôt principal)
const useInventaireEnCours = (lieu, acces, depot = null) => {
  const [session, setSession] = useState(null);
  const permis = !!acces && !estModeLimite(acces) && !(lieu === 'magasin' && moduleExclu(acces, 'magasin'));

  useEffect(() => {
    if (!permis) { setSession(null); return undefined; }
    let actif = true;
    inventairesAPI.enCours(lieu, depot).then(({ data }) => { if (actif) setSession(data); }).catch(() => {});
    return () => { actif = false; };
  }, [lieu, permis, depot]);

  return session;
};

export default useInventaireEnCours;
