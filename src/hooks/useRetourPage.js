import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router-dom';

// Retour en arrière (bouton retour du téléphone, flèche du navigateur ou navigate(-1)) : la page
// retrouve son état (filtres, numéro de page…) et sa position de défilement, au lieu de se
// rouvrir en haut comme une page neuve. Une ouverture « neuve » (menu, lien, barre du bas)
// repart de l'état par défaut, comme avant.
// Gardé dans sessionStorage : propre à l'onglet, effacé à sa fermeture.

const lire = (cle) => {
  try { return JSON.parse(sessionStorage.getItem(cle) || 'null'); } catch { return null; }
};
const ecrire = (cle, valeur) => {
  try { sessionStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* stockage indisponible */ }
};

const estRetour = (type) => type === 'POP'; // POP = retour / avance, ou rechargement de la page

// État de la page : etatRestaure = valeurs mémorisées si on revient en arrière, sinon null.
// memoriser(valeurs) : à appeler quand l'état change (filtres, page…).
export const useRetourPage = (cle) => {
  const retour = estRetour(useNavigationType());
  const [etatRestaure] = useState(() => (retour ? lire(`retour_${cle}`) : null));
  const memoriser = useCallback((valeurs) => ecrire(`retour_${cle}`, valeurs), [cle]);
  return { etatRestaure, memoriser };
};

// Position de défilement d'une zone (zoneRef) : mémorisée en continu, puis rétablie au retour
// en arrière dès que `pret` est vrai (données chargées et affichées).
export const useDefilementRetour = (cle, zoneRef, pret) => {
  const retour = estRetour(useNavigationType());
  // Tant que la position n'est pas rétablie, on n'écrase pas celle mémorisée (le défilement
  // à 0 de l'ouverture de la page la remplacerait)
  const fait = useRef(!retour);
  const raf = useRef(null);
  const cleStockage = `defilement_${cle}`;

  // Réattaché à chaque rendu : la zone peut changer (version mobile / ordinateur)
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return undefined;
    const surDefilement = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        if (fait.current) ecrire(cleStockage, zone.scrollTop);
      });
    };
    zone.addEventListener('scroll', surDefilement, { passive: true });
    return () => {
      zone.removeEventListener('scroll', surDefilement);
      if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null; }
    };
  });

  useEffect(() => {
    if (fait.current || !pret) return;
    const zone = zoneRef.current;
    if (!zone) return;
    const position = Number(lire(cleStockage)) || 0;
    // Après l'affichage complet de la liste (hauteur définitive)
    requestAnimationFrame(() => {
      if (position > 0) zone.scrollTop = position;
      fait.current = true;
    });
  }, [pret]); // eslint-disable-line
};
