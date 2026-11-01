// Modal : confirmation avant de mettre un produit en Vente Flash
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';

const ModalConfirmerVenteFlash = ({ nomProduit, onConfirmer, onAnnuler }) => (
  <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
    onClick={(e) => e.target === e.currentTarget && onAnnuler()}>
    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
      <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
        <div className="modal-body p-4 text-center">
          <div className="d-flex align-items-center justify-content-center mb-3"
            style={{ width: 56, height: 56, background: '#fee2e2', borderRadius: '50%', margin: '0 auto' }}>
            <FontAwesomeIcon icon={faBolt} style={{ color: '#dc2626', fontSize: 22 }} />
          </div>
          <h6 className="fw-bold mb-2" style={{ color: 'var(--bs-body-color)' }}>
            Mettre {nomProduit ? `« ${nomProduit} »` : 'ce produit'} en Vente Flash ?
          </h6>
          <p className="text-muted small mb-4">
            Un badge rouge « Vente Flash » s'affichera sur le produit, avec le prix d'avant barré si vous
            le renseignez. Ses ventes continuent de compter normalement dans les bénéfices.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button type="button" className="btn btn-light btn-sm px-4" onClick={onAnnuler}>Annuler</button>
            <button type="button" className="btn btn-sm px-4 text-white" style={{ background: '#dc2626' }} onClick={onConfirmer}>
              Activer la Vente Flash
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ModalConfirmerVenteFlash;
