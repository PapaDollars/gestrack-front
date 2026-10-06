// Page publique — catalogue produits boutique (accessible sans connexion)
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import defaultProduit from '@/assets/img/defaultProduit.png';

// ── Carte "collection" — tuile fixe (pas de défilement) pour les 4 rangées Nouveautés/
// Populaire/Pour vous/Historique : photo d'un produit représentatif en fond flouté/assombri,
// titre en surimpression. Cliquer ouvre la liste complète de cette collection ────────────────
const CarteCollection = ({ titre, icone, image, onClick }) => (
  <div className="col-6 col-md-3">
    <div
      className="shadow-sm"
      style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '2 / 1', cursor: 'pointer' }}
      onClick={onClick}>
      <img src={image || defaultProduit} alt=""
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          filter: 'blur(2px) brightness(0.8)', transform: 'scale(1.06)',
        }} />
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

export default CarteCollection;
