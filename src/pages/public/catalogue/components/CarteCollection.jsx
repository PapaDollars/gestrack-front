// Page publique — catalogue produits boutique (accessible sans connexion)
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import defaultProduit from '@/assets/img/defaultProduit.png';
import { imageOptimisee } from '@/utils/images';

// Animation du fond : bande de photos qui défile de la droite vers la gauche en continu
// (la bande est doublée pour boucler sans saut). Désactivée si l'appareil demande moins
// d'animations (réglage d'accessibilité).
const STYLE_DEFILEMENT = `
@keyframes gt-defile-collection { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.gt-bande-collection { display: flex; height: 100%; width: max-content; animation: gt-defile-collection linear infinite; }
@media (prefers-reduced-motion: reduce) { .gt-bande-collection { animation: none; } }
`;

// ── Carte "collection" — tuile des 4 rangées Nouveautés / Populaire / Pour vous / Historique :
// photos des produits de la collection en fond (défilantes, floutées / assombries), titre en
// surimpression. Cliquer ouvre la liste complète de cette collection ──────────────────────────
const CarteCollection = ({ titre, icone, images = [], onClick }) => {
  const photos = images.filter(Boolean).slice(0, 6);
  const liste = photos.length ? photos : [null];
  // Durée selon le nombre de photos : vitesse constante, quelle que soit la collection
  const duree = Math.max(12, liste.length * 6);
  return (
    <div className="col-6 col-md-3">
      <style>{STYLE_DEFILEMENT}</style>
      <div
        className="shadow-sm"
        style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '2 / 1', cursor: 'pointer' }}
        onClick={onClick}>
        <div className="gt-bande-collection"
          style={{ animationDuration: `${duree}s`, filter: 'blur(1.5px) brightness(0.75)' }}>
          {[...liste, ...liste].map((img, i) => (
            <img key={i} src={imageOptimisee(img, 400) || defaultProduit} alt="" loading="lazy" decoding="async"
              style={{ height: '100%', aspectRatio: '1 / 1', objectFit: 'cover', flexShrink: 0 }} />
          ))}
        </div>
        <div className="d-flex flex-column align-items-center justify-content-center gap-2 text-center px-2"
          style={{ position: 'absolute', inset: 0 }}>
          <FontAwesomeIcon icon={icone} style={{ color: '#fff', fontSize: 20 }} />
          <span className="fw-bold text-white" style={{ fontSize: 15, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {titre}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CarteCollection;
