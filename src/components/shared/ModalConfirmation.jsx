// Modal de confirmation générique (suppression, etc.)
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const ModalConfirmation = ({ message, onConfirmer, onAnnuler, labelConfirmer = 'Supprimer' }) => (
  <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }} onClick={(e) => e.target === e.currentTarget && onAnnuler()}>
    <div className="modal-dialog modal-sm modal-dialog-centered">
      <div className="modal-content border-0" style={{ borderRadius: 16 }}>
        <div className="modal-body p-4 text-center">
          <div className="d-flex align-items-center justify-content-center mb-3"
            style={{ width: 56, height: 56, background: '#fef2f2', borderRadius: '50%', margin: '0 auto' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444', fontSize: 22 }} />
          </div>
          <p className="mb-4 text-muted" style={{ fontSize: 14 }}>{message}</p>
          <div className="d-flex gap-2 justify-content-center">
            <button className="btn btn-light btn-sm px-4" onClick={onAnnuler}>Annuler</button>
            <button
              className="btn btn-danger btn-sm px-4"
              onClick={onConfirmer}
            >
              {labelConfirmer}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ModalConfirmation;
