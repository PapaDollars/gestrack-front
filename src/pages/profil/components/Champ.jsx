import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Champ de formulaire : libellé + icône + input, en lecture seule hors édition
const Champ = ({ label, icon, aide, children }) => (
  <div>
    <label className="form-label small fw-semibold text-muted mb-1">{label}</label>
    <div className="input-group">
      <span className="input-group-text bg-body-secondary border-end-0">
        <FontAwesomeIcon icon={icon} className="text-muted" style={{ fontSize: 'var(--txt-base)', width: 14 }} />
      </span>
      {children}
    </div>
    {aide && <small className="text-muted d-block mt-1" style={{ fontSize: 'var(--txt-sm)' }}>{aide}</small>}
  </div>
);

export default Champ;
