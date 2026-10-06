// Modal : mot de passe pour accéder aux bénéfices
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faLock } from '@fortawesome/free-solid-svg-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';

// ── Modal mot de passe pour les bénéfices ────────────────────────────────
const ModalMdpBenefice = ({ onValide, onFermer }) => {
  const [mdp, setMdp]       = useState('');
  const [charg, setCharg]   = useState(false);
  const [erreur, setErreur] = useState('');

  const verifier = async (e) => {
    e.preventDefault();
    setCharg(true); setErreur('');
    try {
      const email = auth.currentUser?.email;
      if (!email) { setErreur('Session expirée, reconnectez-vous'); return; }
      await signInWithEmailAndPassword(auth, email, mdp);
      onValide();
    } catch { setErreur('Mot de passe incorrect'); }
    finally { setCharg(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faLock} style={{ color: '#6366f1' }} />
              Accès aux bénéfices
            </h6>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 pb-4">
            <p className="text-muted small mb-3">Entrez votre mot de passe de connexion pour révéler les bénéfices.</p>
            {erreur && <div className="alert alert-danger py-1 small mb-2">{erreur}</div>}
            <form onSubmit={verifier}>
              <input type="password" className="form-control mb-3" required autoFocus
                placeholder="Mot de passe" value={mdp} onChange={e => setMdp(e.target.value)} />
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light flex-grow-1" onClick={onFermer}>Annuler</button>
                <button type="submit" className="btn text-white flex-grow-1"
                  style={{ background: '#6366f1' }} disabled={charg}>
                  {charg ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalMdpBenefice;
