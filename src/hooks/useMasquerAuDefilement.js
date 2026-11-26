import { useEffect, useRef, useState } from 'react';

// Vrai quand on descend dans la zone qui défile (au-delà de `seuil` px), faux dès qu'on remonte
// ou qu'on revient près du haut. Sert à replier l'en-tête des pages publiques pour laisser
// toute la place aux produits.
//
// Replier l'en-tête agrandit la zone qui défile : en bas de page, le navigateur remonte alors
// un peu la position de défilement. Sans précaution, ce recul était pris pour « l'utilisateur
// remonte » → en-tête réaffiché → zone rétrécie → en-tête replié… et l'en-tête clignotait en
// boucle en bas de page. D'où :
//  - un temps de pause après chaque changement (le temps de l'animation), où le défilement
//    provoqué par le changement de taille est ignoré ;
//  - en bas de page, on ne réaffiche pas l'en-tête (le recul vient du changement de taille).
const PAUSE_MS = 400;

const useMasquerAuDefilement = (zoneRef, seuil = 80) => {
  const [masque, setMasque] = useState(false);
  const masqueRef = useRef(false);
  const dernier = useRef(0);
  const pauseJusqua = useRef(0);

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return undefined;
    const changer = (valeur) => {
      if (masqueRef.current === valeur) return;
      masqueRef.current = valeur;
      pauseJusqua.current = Date.now() + PAUSE_MS;
      setMasque(valeur);
    };
    const surDefilement = () => {
      const y = zone.scrollTop;
      // Pendant l'animation : on suit la position sans rien décider
      if (Date.now() < pauseJusqua.current) { dernier.current = y; return; }
      const delta = y - dernier.current;
      const enBas = y + zone.clientHeight >= zone.scrollHeight - 4;
      if (y < seuil) changer(false);
      else if (delta > 8) changer(true);                // descend
      else if (delta < -8 && !enBas) changer(false);     // remonte vraiment
      if (Math.abs(delta) > 8 || y < seuil) dernier.current = y;
    };
    zone.addEventListener('scroll', surDefilement, { passive: true });
    return () => zone.removeEventListener('scroll', surDefilement);
  });

  return masque;
};

export default useMasquerAuDefilement;
