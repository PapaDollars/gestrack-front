import { useCallback, useEffect, useState } from 'react';
import { depotsAPI } from '@/services/api';
import { moduleExclu, estModeLimite } from '@/utils/acces';
import { useParametres } from '@/context/ParametresContext';

// Dépôts du compte (plusieurs magasins de réserve). `autorise` : plan A.3 (création, transferts).
// La liste est lue même sans le plan A.3, pour qu'un compte passé à un plan inférieur voie
// encore les dépôts où il reste du stock (la consultation reste permise par le serveur).
// depots : tous (archivés compris) ; actifs : sans les archivés.
const useDepots = (acces) => {
  const [depots, setDepots] = useState([]);
  const [charge, setCharge] = useState(false);
  const autorise = !!acces && !moduleExclu(acces, 'depots');
  const lisible = !!acces && !estModeLimite(acces) && !moduleExclu(acces, 'magasin');
  // Dépôt principal : nom, adresse et responsable choisis dans Paramètres › Dépôts
  const { parametres } = useParametres();
  const principal = parametres.depotPrincipal || {};
  const nomPrincipal = (principal.nom || '').trim() || NOM_PRINCIPAL;

  const recharger = useCallback(() => {
    if (!lisible) { setDepots([]); setCharge(true); return Promise.resolve(); }
    return depotsAPI.getAll()
      .then(({ data }) => setDepots(Array.isArray(data) ? data : []))
      .catch(() => setDepots([]))
      .finally(() => setCharge(true));
  }, [lisible]);

  useEffect(() => { recharger(); }, [recharger]);

  return { depots, actifs: depots.filter(d => !d.archive), autorise, charge, recharger, principal, nomPrincipal };
};

// Nom d'un dépôt à partir de son identifiant (null = Dépôt principal, avec le nom choisi s'il y en a un)
export const NOM_PRINCIPAL = 'Dépôt principal';
export const nomDepot = (depots, depotId, nomPrincipal = NOM_PRINCIPAL) => (depotId ? (depots.find(d => d.id === depotId)?.nom || 'Dépôt supprimé') : nomPrincipal);

export default useDepots;
