// Carte de statistique du tableau de bord admin
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Stat = ({ icon, color, label, value, sub }) => (
  <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
    <div className="card-body p-4">
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{ width: 48, height: 48, background: `${color}18` }}>
          <FontAwesomeIcon icon={icon} style={{ color, fontSize: 'var(--txt-2xl)' }} />
        </div>
        <div>
          <div style={{ fontSize: 'calc(var(--txt-3xl) + 4px)', fontWeight: 700, color: 'var(--bs-body-color)', lineHeight: 1 }}>{value ?? '—'}</div>
          <div className="text-muted small mt-1">{label}</div>
          {sub && <div style={{ fontSize: 'var(--txt-sm)', color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  </div>
);

export default Stat;
