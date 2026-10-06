// Tableau de bord principal GesTrack
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

// ── Dashboard ─────────────────────────────────────────────────────────────────
// Lien « Voir plus » — toujours en bas à droite des cartes du tableau de bord
const VoirPlus = ({ to, couleur, className = 'px-3 pb-3' }) => (
  <div className={`text-end ${className}`}>
    <Link to={to} className="btn btn-sm text-decoration-none" style={{ color: couleur }}>
      Voir plus <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
    </Link>
  </div>
);

export default VoirPlus;
