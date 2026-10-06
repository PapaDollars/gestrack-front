// Carte de résumé d'une source (boutique / magasin / global)
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';

// ── Carte de résumé source ────────────────────────────────────────────────
const CarteSource = ({ icon, label, total, nbTx, benefice, couleur, bg, actif, onClick }) => (
  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12, cursor: 'pointer', border: actif ? `2px solid ${couleur}` : '2px solid transparent' }}
    onClick={onClick}>
    <div className="card-body px-3 py-2 d-flex align-items-center gap-3">
      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 36, height: 36, background: bg }}>
        <FontAwesomeIcon icon={icon} style={{ color: couleur, fontSize: 'var(--txt-lg)' }} />
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className="text-muted small text-truncate">{label} · {nbTx} transaction(s)</div>
        <div className="fw-bold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>{total}</div>
      </div>
      <div className="text-end flex-shrink-0">
        <div className="small" style={{ color: couleur, opacity: 0.8 }}>
          <FontAwesomeIcon icon={faChartLine} className="me-1" />Bénéfice
        </div>
        <div className="fw-bold" style={{ color: couleur, fontSize: 'var(--txt-lg)' }}>{benefice}</div>
      </div>
    </div>
  </div>
);

export default CarteSource;
