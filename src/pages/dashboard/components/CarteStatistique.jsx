// Carte de statistique (compteur cliquable)
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// ── Carte statistique réutilisable ────────────────────────────────────────────
const CarteStatistique = ({ titre, valeur, icone, couleur, lien, chargement }) => (
  <Link to={lien} className="card border-0 shadow-sm h-100 text-decoration-none" style={{ borderRadius: 14 }}>
    <div className="card-body p-2 d-flex align-items-center gap-2">
      <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
        style={{ width: 30, height: 30, background: `${couleur}20` }}>
        <FontAwesomeIcon icon={icone} style={{ color: couleur, fontSize: 13 }} />
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)', lineHeight: 1.2 }}>{titre}</div>
        {chargement
          ? <FontAwesomeIcon icon={faSpinner} spin className="text-muted" style={{ fontSize: 12 }} />
          : <div className="fw-bold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-xl)', lineHeight: 1.3 }}>{valeur}</div>}
      </div>
    </div>
  </Link>
);

export default CarteStatistique;
