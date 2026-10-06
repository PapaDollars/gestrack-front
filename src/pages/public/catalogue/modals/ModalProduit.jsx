// Modal : fiche produit du catalogue public
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import defaultProduit from '@/assets/img/defaultProduit.png';
import { fmtPrix } from '@/pages/public/catalogue/utils';

// ── Modal détail produit ──────────────────────────────────────────────────────
const ModalProduit = ({ produit, onFermer }) => {
  if (!produit) return null;
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1050, padding: 16 }}
      onClick={onFermer}>
      <div
        className="bg-white rounded-4 overflow-hidden"
        style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Image grande */}
        <div style={{ position: 'relative' }}>
          <img
            src={produit.image || defaultProduit}
            alt={produit.nom}
            style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
          <button
            onClick={onFermer}
            className="btn btn-sm"
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(0,0,0,0.5)', color: '#fff',
              borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {!produit.enStock && (
            <span className="badge position-absolute"
              style={{ bottom: 10, left: 10, background: '#dc2626', color: '#fff', fontSize: 11 }}>
              Épuisé
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="p-4">
          {produit.categorie && (
            <span className="badge mb-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 11 }}>
              {produit.categorie}
            </span>
          )}
          <h5 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: 20 }}>{produit.nom}</h5>
          {produit.prixVente !== undefined && (
            <div className="fw-bold mb-2" style={{ color: '#00a881', fontSize: 18 }}>{fmtPrix(produit.prixVente)}</div>
          )}
          {produit.description && (
            <p style={{ color: '#475569', lineHeight: 1.7, fontSize: 15 }}>{produit.description}</p>
          )}
          {!produit.description && (
            <p className="text-muted small">Aucune description disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalProduit;
