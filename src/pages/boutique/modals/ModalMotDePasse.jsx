// Modal : mot de passe pour afficher le prix d'achat
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faLock } from '@fortawesome/free-solid-svg-icons';
import { produitsAPI } from '@/services/api';

// ============================
// Modal mot de passe pour voir le prix d'achat
// ============================
export const ModalMotDePasse = ({ produit, onValide, onFermer }) => {
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    try {
      const { data } = await produitsAPI.verifierMdp(motDePasse);
      if (data.autorise) {
        onValide();
      }
    } catch {
      setErreur('Mot de passe incorrect');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faLock} style={{ color: '#6366f1' }} />
              Prix d'achat — {produit?.nom}
            </h6>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
          <div className="modal-body px-4">
            <p className="text-muted small mb-3">Entrez votre mot de passe de connexion pour voir le prix d'achat.</p>
            {erreur && <div className="alert alert-danger py-1 small">{erreur}</div>}
            <form onSubmit={handleSubmit} id="form-mdp">
              <input
                type="password" className="form-control" required autoFocus
                placeholder="Mot de passe"
                value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
              />
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light btn-sm" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-mdp" className="btn btn-sm text-white"
              style={{ background: '#6366f1' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalMotDePasse;
