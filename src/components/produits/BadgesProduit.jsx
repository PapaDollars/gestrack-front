// Badge d'une carte produit — un seul à la fois, par priorité : Vente Flash (rouge), Soldes
// (orange), puis Nouveau (vert) si le produit n'a pas de promotion
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faTag } from '@fortawesome/free-solid-svg-icons';
import { estNouveau } from '@/utils/promotions';

const Badge = ({ fond, couleur, titre, taille, children }) => (
  <span className="badge" title={titre} style={{ fontSize: taille, background: fond, color: couleur }}>{children}</span>
);

// gestion : carte de l'application (explique l'effet des Soldes au survol) ; sinon page publique
const BadgesProduit = ({ produit, gestion = false, taille = 'var(--txt-sm)' }) => {
  if (produit.venteFlash) {
    return <Badge fond="#dc2626" couleur="#fff" taille={taille}><FontAwesomeIcon icon={faBolt} className="me-1" />Vente Flash</Badge>;
  }
  if (produit.enSolde) {
    return (
      <Badge fond="#fef3c7" couleur="#b45309" taille={taille}
        titre={gestion ? 'En solde : ses ventes ne comptent pas dans les bénéfices' : undefined}>
        <FontAwesomeIcon icon={faTag} className="me-1" />Soldes
      </Badge>
    );
  }
  return estNouveau(produit) ? <Badge fond="#16a34a" couleur="#fff" taille={taille}>Nouveau</Badge> : null;
};

export default BadgesProduit;
