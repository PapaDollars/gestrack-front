// Pourcentage de réduction d'un produit en Soldes ou Vente Flash (pages vitrine) : « −55 % ».
// Rouge pour Vente Flash, orange pour Soldes. Rien si le prix d'avant n'est pas barré.
// surPhoto : pastille posée dans le coin de la photo (le parent doit être en position relative) ;
// sinon petite étiquette à côté du prix.
import React from 'react';
import { pourcentageReduction } from '@/utils/promotions';

const BadgeReduction = ({ produit, surPhoto = false }) => {
  const pourcentage = pourcentageReduction(produit);
  if (pourcentage <= 0) return null;
  const fond = produit.venteFlash ? '#dc2626' : '#f97316';
  const texte = `−${pourcentage} %`;

  if (surPhoto) {
    return (
      <span className="position-absolute fw-bold" aria-label={`Réduction de ${pourcentage} %`}
        style={{
          top: 8, left: 8, background: fond, color: '#fff', fontSize: 12, lineHeight: 1,
          padding: '5px 8px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
        {texte}
      </span>
    );
  }
  return (
    <span className="badge ms-2 align-middle" style={{ background: fond, color: '#fff', fontSize: 11 }}>
      {texte}
    </span>
  );
};

export default BadgeReduction;
