// Modal : changement du mot de passe depuis le profil.
// Étape 1 : un code à 6 chiffres est envoyé à l'adresse du compte (confirmation de l'email,
// comme à l'inscription). Étape 2 : code + nouveau mot de passe (saisi deux fois).
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faKey, faEnvelope, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { profilAPI } from '@/services/api';
import { auth } from '@/services/firebase';
import { toast } from 'react-toastify';

const ModalMotDePasse = ({ email, onFermer }) => {
  const [etape, setEtape]           = useState(1);
  const [code, setCode]             = useState('');
  const [mdp, setMdp]               = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [voirMdp, setVoirMdp]       = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur]         = useState('');

  const envoyerCode = async () => {
    setChargement(true); setErreur('');
    try {
      await profilAPI.envoyerCodeMotDePasse();
      setEtape(2);
      toast.success(`Code envoyé à ${email}`);
    } catch (e) {
      setErreur(e.response?.data?.message || "Impossible d'envoyer le code");
    } finally { setChargement(false); }
  };

  const valider = async (e) => {
    e.preventDefault();
    setErreur('');
    if (code.trim().length !== 6) return setErreur('Le code contient 6 chiffres');
    if (mdp.length < 6) return setErreur('Le mot de passe doit contenir au moins 6 caractères');
    if (mdp !== confirmation) return setErreur('Les deux mots de passe ne correspondent pas');
    setChargement(true);
    try {
      await profilAPI.changerMotDePasse({ code: code.trim(), nouveauMotDePasse: mdp });
      // Le changement de mot de passe invalide la session : reconnexion immédiate avec le
      // nouveau mot de passe pour ne pas être déconnecté dans l'heure
      try { await signInWithEmailAndPassword(auth, email, mdp); } catch { /* reconnexion manuelle */ }
      toast.success('Mot de passe modifié');
      onFermer();
    } catch (e2) {
      setErreur(e2.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally { setChargement(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      onClick={(e) => e.target === e.currentTarget && !chargement && onFermer()}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faKey} style={{ color: '#00d4aa' }} /> Changer le mot de passe
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer} disabled={chargement}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-body px-4 pb-4">
            {etape === 1 ? (
              <>
                <p className="text-muted small mb-3">
                  Pour confirmer qu'il s'agit bien de vous, un code de vérification à 6 chiffres va
                  être envoyé à votre adresse email :
                </p>
                <div className="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style={{ background: 'var(--bs-secondary-bg)' }}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ color: '#00d4aa' }} />
                  <span className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{email}</span>
                </div>
                {erreur && <div className="alert alert-danger py-2 small">{erreur}</div>}
                <button className="btn text-white w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ background: '#00d4aa', borderRadius: 10 }} onClick={envoyerCode} disabled={chargement}>
                  {chargement && <FontAwesomeIcon icon={faSpinner} spin />} Envoyer le code
                </button>
              </>
            ) : (
              <form onSubmit={valider}>
                <p className="text-muted small mb-3">
                  Saisissez le code reçu à <strong>{email}</strong> (valable 10 minutes), puis votre
                  nouveau mot de passe.
                </p>
                <label className="form-label small fw-semibold text-muted mb-1">Code de vérification</label>
                <input className="form-control text-center fw-bold mb-3" inputMode="numeric" maxLength={6}
                  style={{ letterSpacing: 8, fontSize: 20 }} placeholder="••••••" autoFocus
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />

                <label className="form-label small fw-semibold text-muted mb-1">Nouveau mot de passe</label>
                <div className="input-group mb-3">
                  <input type={voirMdp ? 'text' : 'password'} className="form-control" placeholder="6 caractères minimum"
                    autoComplete="new-password" value={mdp} onChange={(e) => setMdp(e.target.value)} />
                  <button type="button" className="btn btn-light border" onClick={() => setVoirMdp(v => !v)}>
                    <FontAwesomeIcon icon={voirMdp ? faEyeSlash : faEye} />
                  </button>
                </div>

                <label className="form-label small fw-semibold text-muted mb-1">Confirmer le mot de passe</label>
                <input type={voirMdp ? 'text' : 'password'} className="form-control mb-3"
                  autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />

                {erreur && <div className="alert alert-danger py-2 small">{erreur}</div>}

                <button type="submit" className="btn text-white w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ background: '#00d4aa', borderRadius: 10 }} disabled={chargement}>
                  {chargement && <FontAwesomeIcon icon={faSpinner} spin />} Changer le mot de passe
                </button>
                <button type="button" className="btn btn-link btn-sm w-100 mt-2 text-decoration-none" style={{ color: '#00a881' }}
                  onClick={envoyerCode} disabled={chargement}>
                  Renvoyer le code
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalMotDePasse;
