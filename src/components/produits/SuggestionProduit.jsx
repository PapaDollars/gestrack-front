// Ligne d'une liste de suggestions de produits (facture, commande fournisseur, transfert).
// Le nom peut tenir sur 2 lignes au lieu d'être coupé ; le prix reste à droite (la liste
// prend toute la largeur sous les champs de recherche, y compris sur mobile).
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';

const deuxLignes = {
  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  wordBreak: 'break-word', lineHeight: 1.25,
};

const SuggestionProduit = ({ produit, detail, prix, onChoisir }) => {
  const prixJSX = prix ? (
    <span className="fw-bold" style={{ color: '#00a881', fontSize: 'var(--txt-xs)', whiteSpace: 'nowrap' }}>{prix}</span>
  ) : null;
  return (
    <div className="d-flex align-items-center gap-2 px-2 py-2"
      style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-sm)' }}
      onMouseDown={onChoisir}>
      {produit.image
        ? <img src={produit.image} alt="" className="rounded flex-shrink-0" style={{ width: 36, height: 36, objectFit: 'contain', background: '#f8fafc' }} />
        : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 36, height: 36, background: 'var(--bs-secondary-bg)' }}>
            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 12 }} />
          </div>}
      <div className="flex-grow-1 min-w-0">
        <div className="fw-semibold" style={{ color: 'var(--bs-body-color)', ...deuxLignes }}>{produit.nom}</div>
        {detail && <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>{detail}</div>}
      </div>
      {prixJSX && <div className="flex-shrink-0">{prixJSX}</div>}
    </div>
  );
};

export default SuggestionProduit;
