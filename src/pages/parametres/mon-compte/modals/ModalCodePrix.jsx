// Modal : changement du code de l'application (≠ mot de passe de connexion), qui protège
// les prix d'achat et les bénéfices.
// Mode normal : code actuel + nouveau code (saisi deux fois).
// Mode « code oublié » : le mot de passe de connexion remplace le code actuel — on se
// reconnecte avec, ce qui prouve au serveur que c'est bien le titulaire du compte.
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faShieldAlt, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { profilAPI } from '@/services/api';
import { auth } from '@/services/firebase';
import { toast } from 'react-toastify';

const COULEUR = '#6366f1';

const ModalCodePrix = ({ email, personnalise, codeDefaut, longueurMin = 4, onModifie, onFermer }) => {
  const [oublie, setOublie]         = useState(false);
  const [actuel, setActuel]         = useState('');
  const [nouveau, setNouveau]       = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [voir, setVoir]             = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur]         = useState('');

  const valider = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!actuel) return setErreur(oublie ? 'Saisissez votre mot de passe de connexion' : 'Saisissez le code actuel');
    if (nouveau.trim().length < longueurMin) return setErreur(`Le code doit contenir au moins ${longueurMin} caractères`);
    if (nouveau !== confirmation) return setErreur('Les deux codes ne correspondent pas');
    setChargement(true);
    try {
      if (oublie) {
        try { await signInWithEmailAndPassword(auth, email, actuel); }
        catch { setErreur('Mot de passe de connexion incorrect'); return; }
        await profilAPI.changerCodePrix({ parMotDePasse: true, nouveauCode: nouveau });
      } else {
        await profilAPI.changerCodePrix({ codeActuel: actuel, nouveauCode: nouveau });
      }
      toast.success('Code de l\'application modifié');
      onModifie?.();
      onFermer();
    } catch (e2) {
      setErreur(e2.response?.data?.message || 'Erreur lors du changement du code');
    } finally { setChargement(false); }
  };

  const basculer = () => { setOublie(o => !o); setActuel(''); setErreur(''); };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      onClick={(e) => e.target === e.currentTarget && !chargement && onFermer()}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faShieldAlt} style={{ color: COULEUR }} /> Code de l'application
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer} disabled={chargement}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <form className="modal-body px-4 pb-4" onSubmit={valider}>
            <p className="text-muted small mb-3">
              Ce code protège les informations sensibles <strong>dans</strong> l'application : prix
              d'achat des produits et bénéfices de Mes finances. Il ne change pas votre mot de passe
              de connexion.
            </p>

            <label className="form-label small fw-semibold text-muted mb-1">
              {oublie ? 'Mot de passe de connexion' : 'Code actuel'}
            </label>
            <input type="password" className="form-control mb-1" autoFocus
              autoComplete={oublie ? 'current-password' : 'off'}
              value={actuel} onChange={(e) => setActuel(e.target.value)} />
            <button type="button" className="btn btn-link btn-sm p-0 mb-3 text-decoration-none" style={{ color: COULEUR }}
              onClick={basculer} disabled={chargement}>
              {oublie ? 'J\'ai mon code actuel' : 'Code oublié ? Utiliser mon mot de passe de connexion'}
            </button>
            {!personnalise && !oublie && (
              <div className="small text-muted mb-3" style={{ marginTop: -8 }}>
                Vous n'avez pas encore choisi votre code : le code actuel est le code par défaut
                {codeDefaut && <> <strong style={{ color: COULEUR }}>{codeDefaut}</strong></>}.
              </div>
            )}

            <label className="form-label small fw-semibold text-muted mb-1">Nouveau code</label>
            <div className="input-group mb-3">
              <input type={voir ? 'text' : 'password'} className="form-control" autoComplete="off"
                placeholder={`${longueurMin} caractères minimum`}
                value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
              <button type="button" className="btn btn-light border" onClick={() => setVoir(v => !v)}>
                <FontAwesomeIcon icon={voir ? faEyeSlash : faEye} />
              </button>
            </div>

            <label className="form-label small fw-semibold text-muted mb-1">Confirmer le nouveau code</label>
            <input type={voir ? 'text' : 'password'} className="form-control mb-3" autoComplete="off"
              value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />

            {erreur && <div className="alert alert-danger py-2 small">{erreur}</div>}

            <button type="submit" className="btn text-white w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ background: COULEUR, borderRadius: 10 }} disabled={chargement}>
              {chargement && <FontAwesomeIcon icon={faSpinner} spin />} Enregistrer le code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalCodePrix;
