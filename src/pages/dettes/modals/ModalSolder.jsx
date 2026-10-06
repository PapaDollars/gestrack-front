// Modal : solder une dette
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { MOYENS_PAIEMENT } from '@/pages/dettes/constants';

// Modal confirmation de solde avec choix du moyen de paiement
export const ModalSolder = ({ dette, onConfirmer, onFermer }) => {
  const [moyenPaiement, setMoyenPaiement] = useState('especes');
  const [chargement, setChargement] = useState(false);
  const fmt = (m) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  const handleConfirmer = async () => {
    if (chargement) return;
    setChargement(true);
    try {
      await onConfirmer(moyenPaiement);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>Solder la dette</h6>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer} disabled={chargement}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <p className="text-muted small mb-3">
              Solder intégralement <strong>{fmt(dette.montantActuel)}</strong> ? Choisissez le moyen de paiement :
            </p>
            <div className="d-flex flex-column gap-2">
              {MOYENS_PAIEMENT.map(m => (
                <label key={m.value} className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                  style={{ border: `2px solid ${moyenPaiement === m.value ? m.color : '#e2e8f0'}`,
                           background: moyenPaiement === m.value ? `${m.color}15` : '#fff',
                           cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="moyenSolder" value={m.value}
                    checked={moyenPaiement === m.value}
                    onChange={() => setMoyenPaiement(m.value)}
                    className="form-check-input m-0" />
                  <span style={{ color: moyenPaiement === m.value ? m.color : '#374151', fontWeight: 500 }}>{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light btn-sm" onClick={onFermer} disabled={chargement}>Annuler</button>
            <button className="btn btn-sm text-white d-flex align-items-center gap-2" style={{ background: '#16a34a' }}
              onClick={handleConfirmer} disabled={chargement}>
              {chargement && <FontAwesomeIcon icon={faSpinner} spin />}
              Confirmer le solde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSolder;
