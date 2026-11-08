import { useEffect, useRef, useState } from 'react';

// Vrai quand on descend dans la zone qui défile (au-delà de `seuil` px), faux dès qu'on remonte
// ou qu'on revient près du haut. Sert à replier l'en-tête et cacher la barre du bas des pages
// publiques pour laisser toute la place aux produits.
const useMasquerAuDefilement = (zoneRef, seuil = 80) => {
  const [masque, setMasque] = useState(false);
  const dernier = useRef(0);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return undefined;
    const surDefilement = () => {
      const y = zone.scrollTop;
      const delta = y - dernier.current;
      if (y < seuil) setMasque(false);
      else if (delta > 8) setMasque(true);   // descend
      else if (delta < -8) setMasque(false); // remonte
      if (Math.abs(delta) > 8 || y < seuil) dernier.current = y;
    };
    zone.addEventListener('scroll', surDefilement, { passive: true });
    return () => zone.removeEventListener('scroll', surDefilement);
  });

  return masque;
};

export default useMasquerAuDefilement;
