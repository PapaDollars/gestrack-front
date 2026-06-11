// Modal de choix du périmètre d'impression des dettes d'un client
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPrint } from '@fortawesome/free-solid-svg-icons';

const OPTIONS = [
  {
    value: 'non_soldees',
    label: 'Dettes non soldées',
    description: 'En cours et en retard',
    color: '#dc2626',
  },
  {
    value: 'toutes',
    label: 'Toutes les dettes',
    description: 'Soldées, abandonnées et non soldées',
    color: '#00a881',
  },
];

const ModalImprimerDettes = ({ dettes, onImprimer, onFermer }) => {
  const [perimetre, setPerimetre] = useState('non_soldees');

  const nbNonSoldees = dettes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD').length;
  const nbToutes = dettes.length;

  const compter = (value) => (value === 'non_soldees' ? nbNonSoldees : nbToutes);

  const handleImprimer = () => {
    const selection = perimetre === 'non_soldees'
      ? dettes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD')
      : dettes;
    onImprimer(selection);
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
      onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>Imprimer les dettes</h6>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 pt-3">
            <p className="text-muted small mb-3">Quelles dettes souhaitez-vous inclure dans l'impression ?</p>
            <div className="d-flex flex-column gap-2">
              {OPTIONS.map(opt => (
                <label key={opt.value} className="d-flex align-items-start gap-2 px-3 py-2 rounded"
                  style={{
                    border: `2px solid ${perimetre === opt.value ? opt.color : '#e2e8f0'}`,
                    background: perimetre === opt.value ? `${opt.color}12` : 'var(--bs-body-bg)',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}>
                  <input type="radio" name="perimetreImpression" value={opt.value}
                    checked={perimetre === opt.value}
                    onChange={() => setPerimetre(opt.value)}
                    className="form-check-input m-0 mt-1" />
                  <span>
                    <span className="d-block fw-semibold" style={{ color: perimetre === opt.value ? opt.color : 'var(--bs-body-color)' }}>
                      {opt.label}
                      <span className="text-muted fw-normal ms-1">({compter(opt.value)})</span>
                    </span>
                    <span className="text-muted small">{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer border-0 px-4 pb-4 gap-2">
            <button className="btn btn-light btn-sm" onClick={onFermer}>Annuler</button>
            <button
              className="btn btn-sm text-white d-flex align-items-center gap-2"
              style={{ background: '#00d4aa' }}
              disabled={compter(perimetre) === 0}
              onClick={handleImprimer}
            >
              <FontAwesomeIcon icon={faPrint} /> Imprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalImprimerDettes;
