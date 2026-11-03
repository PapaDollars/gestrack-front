// Tuile « Voir plus » : prend la place de la dernière carte d'une grille du tableau de bord.
// Sans bordure, fond teinté de la couleur de la section (hex + « 1f » ≈ 12 % d'opacité).
// ligne : tout sur une ligne (icône, texte, détail), à la hauteur d'une ligne de liste (hauteur)
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const TuileVoirPlus = ({ to, couleur, detail, ligne = false, hauteur = 50 }) => (
  <Link to={to}
    className={`d-flex align-items-center justify-content-center text-center text-decoration-none fw-semibold ${ligne ? 'flex-row gap-2 px-2 text-nowrap' : 'flex-column gap-2 p-3 h-100'}`}
    style={{ borderRadius: ligne ? 8 : 14, color: couleur, ...(ligne ? { height: hauteur } : { minHeight: 160 }) }}>
    <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
      style={{ width: ligne ? 26 : 40, height: ligne ? 26 : 40, background: couleur, color: '#fff' }}>
      <FontAwesomeIcon icon={faArrowRight} />
    </span>
    {ligne ? (
      <>
        <span>Voir plus</span>
        {detail && <small className="fw-normal text-muted text-truncate">· {detail}</small>}
      </>
    ) : (
      <span className="d-flex flex-column" style={{ lineHeight: 1.2 }}>
        Voir plus
        {detail && <small className="fw-normal text-muted">{detail}</small>}
      </span>
    )}
  </Link>
);

export default TuileVoirPlus;
