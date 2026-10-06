import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Ligne d'information (carte « Compte & sécurité »)
const Info = ({ icon, label, valeur, couleur = '#64748b' }) => (
  <div className="d-flex align-items-center gap-3 py-2">
    <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
      style={{ width: 34, height: 34, background: 'var(--bs-secondary-bg)' }}>
      <FontAwesomeIcon icon={icon} style={{ color: couleur, fontSize: 'var(--txt-base)' }} />
    </div>
    <div className="min-w-0">
      <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>{label}</div>
      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{valeur}</div>
    </div>
  </div>
);

export default Info;
