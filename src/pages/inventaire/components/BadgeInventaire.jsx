// Statut d'inventaire posé sur la photo d'une carte produit (pages Boutique et Magasin)
import React from 'react';
import { STATUTS, dansPerimetre, statutDe, ecartDe, formatEcart } from '@/pages/inventaire/utils';

// Carte d'un produit pas encore compté : estompée
export const styleCarteInventaire = (session, produit) => (
  session && dansPerimetre(session, produit) && statutDe(session, produit.id) === 'a_compter'
    ? { opacity: 0.55, filter: 'grayscale(0.6)' }
    : {}
);

const BadgeInventaire = ({ session, produit }) => {
  if (!session || !dansPerimetre(session, produit)) return null;
  const statut = statutDe(session, produit.id);
  const s = STATUTS[statut];
  const ecart = ecartDe(session, produit.id);
  const texte = statut === 'conforme' ? '✓ Compté'
    : statut === 'manquant' ? `Écart ${formatEcart(produit, ecart)}`
      : statut === 'surplus' ? `En trop ${formatEcart(produit, ecart)}`
        : s.libelle;
  return (
    <span className="position-absolute top-0 start-0 m-1 fw-semibold"
      style={{ background: s.fond, color: s.texte, borderRadius: 8, padding: '3px 8px', fontSize: 11, lineHeight: 1.3 }}>
      {texte}
    </span>
  );
};

export default BadgeInventaire;
