// Page de réinitialisation du mot de passe GesTrack
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope, faLock, faEye, faEyeSlash, faSpinner,
  faShieldAlt, faCheckCircle, faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import api from '@/services/api';
import logo from '@/assets/img/logo.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1); // 1: email, 2: code, 3: nouveau mdp
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [voirMdp, setVoirMdp] = useState(false);
  const [voirConf, setVoirConf] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  // Étape 1 : envoyer le code de reset
  const envoyerCode = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await api.post('/auth/reset-send-code', { email });
      setSucces('Code de réinitialisation envoyé. Vérifiez votre boîte mail.');
      setEtape(2);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setChargement(false);
    }
  };

  // Étape 2 : valider le code
  const validerCode = (e) => {
    e.preventDefault();
    setErreur('');
    if (code.length !== 6) {
      setErreur('Le code doit contenir 6 chiffres');
      return;
    }
    setSucces('');
    setEtape(3);
  };

  // Étape 3 : réinitialiser le mot de passe
  const reinitialiser = async (e) => {
    e.preventDefault();
    setErreur('');
    if (nouveauMdp !== confirmation) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (nouveauMdp.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setChargement(true);
    try {
      await api.post('/auth/reset-password', { email, code, nouveauMotDePasse: nouveauMdp });
      setSucces('Mot de passe modifié avec succès !');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-4"
      style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' }}>
      <div className="col-11 col-sm-8 col-md-5 col-lg-4">
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3 p-2"
            style={{ background: '#e8f0ef', borderRadius: 14 }}>
            <img src={logo} alt="GesTrack" style={{ height: 52, objectFit: 'contain' }} />
          </div>
          <h1 className="text-white fw-bold fs-3 mb-1">GesTrack</h1>
          <p className="text-white-50 small">Réinitialisation du mot de passe</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="d-flex justify-content-center align-items-center gap-2 mb-4">
          {[1, 2, 3].map((n) => (
            <React.Fragment key={n}>
              <div
                className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
                style={{
                  width: 32, height: 32, fontSize: 13,
                  background: etape > n ? '#00d4aa' : etape === n ? '#00d4aa' : 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: etape === n ? '2px solid #fff' : 'none',
                }}>
                {etape > n ? <FontAwesomeIcon icon={faCheckCircle} /> : n}
              </div>
              {n < 3 && (
                <div style={{ width: 40, height: 2, background: etape > n ? '#00d4aa' : 'rgba(255,255,255,0.2)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Carte */}
        <div className="card border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <h5 className="fw-semibold mb-1 text-center" style={{ color: 'var(--bs-body-color)' }}>
              {etape === 1 ? 'Votre adresse email' : etape === 2 ? 'Vérification du code' : 'Nouveau mot de passe'}
            </h5>
            <p className="text-muted small text-center mb-4">
              {etape === 1
                ? 'Entrez l\'email associé à votre compte'
                : etape === 2
                ? `Code envoyé à ${email}`
                : 'Choisissez un nouveau mot de passe'}
            </p>

            {erreur && (
              <div className="alert alert-danger py-2 small d-flex align-items-center gap-2" role="alert">
                <FontAwesomeIcon icon={faShieldAlt} className="text-danger flex-shrink-0" />
                {erreur}
              </div>
            )}
            {succes && (
              <div className="alert alert-success py-2 small d-flex align-items-center gap-2" role="alert">
                <FontAwesomeIcon icon={faCheckCircle} className="text-success flex-shrink-0" />
                {succes}
              </div>
            )}

            {/* Étape 1 : Email */}
            {etape === 1 && (
              <form onSubmit={envoyerCode}>
                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold">Adresse email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-body-secondary border-end-0">
                      <FontAwesomeIcon icon={faEnvelope} className="text-muted" />
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn w-100 fw-semibold text-white py-2"
                  style={{ background: '#00d4aa', border: 'none', borderRadius: 10 }}
                  disabled={chargement}
                >
                  {chargement
                    ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Envoi...</>
                    : 'Envoyer le code'}
                </button>
              </form>
            )}

            {/* Étape 2 : Code */}
            {etape === 2 && (
              <form onSubmit={validerCode}>
                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold">Code de réinitialisation (6 chiffres)</label>
                  <input
                    type="text"
                    className="form-control text-center fw-bold"
                    style={{ fontSize: 28, letterSpacing: 12, borderRadius: 10 }}
                    placeholder="------"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                  <small className="text-muted">Ce code expire dans 10 minutes.</small>
                </div>
                <button
                  type="submit"
                  className="btn w-100 fw-semibold text-white py-2 mb-2"
                  style={{ background: '#00d4aa', border: 'none', borderRadius: 10 }}
                >
                  Valider le code
                </button>
                <button
                  type="button"
                  className="btn w-100 btn-light py-2"
                  style={{ borderRadius: 10 }}
                  onClick={() => { setEtape(1); setCode(''); setErreur(''); setSucces(''); }}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="me-2" />Changer d'email
                </button>
              </form>
            )}

            {/* Étape 3 : Nouveau mot de passe */}
            {etape === 3 && (
              <form onSubmit={reinitialiser}>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">Nouveau mot de passe</label>
                  <div className="input-group">
                    <span className="input-group-text bg-body-secondary border-end-0">
                      <FontAwesomeIcon icon={faLock} className="text-muted" />
                    </span>
                    <input
                      type={voirMdp ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0"
                      placeholder="Minimum 6 caractères"
                      value={nouveauMdp}
                      onChange={(e) => setNouveauMdp(e.target.value)}
                      required
                      autoFocus
                    />
                    <button type="button" className="input-group-text bg-body-secondary border-start-0" onClick={() => setVoirMdp(!voirMdp)}>
                      <FontAwesomeIcon icon={voirMdp ? faEyeSlash : faEye} className="text-muted" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-muted small fw-semibold">Confirmer le mot de passe</label>
                  <div className="input-group">
                    <span className="input-group-text bg-body-secondary border-end-0">
                      <FontAwesomeIcon icon={faLock} className="text-muted" />
                    </span>
                    <input
                      type={voirConf ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0"
                      placeholder="Répétez le mot de passe"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      required
                    />
                    <button type="button" className="input-group-text bg-body-secondary border-start-0" onClick={() => setVoirConf(!voirConf)}>
                      <FontAwesomeIcon icon={voirConf ? faEyeSlash : faEye} className="text-muted" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 fw-semibold text-white py-2 mb-2"
                  style={{ background: '#00d4aa', border: 'none', borderRadius: 10 }}
                  disabled={chargement}
                >
                  {chargement
                    ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Modification...</>
                    : 'Modifier le mot de passe'}
                </button>
                <button
                  type="button"
                  className="btn w-100 btn-light py-2"
                  style={{ borderRadius: 10 }}
                  onClick={() => { setEtape(2); setErreur(''); }}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="me-2" />Retour
                </button>
              </form>
            )}

            {/* Lien connexion */}
            <div className="text-center mt-3">
              <Link to="/login" className="small fw-semibold text-decoration-none" style={{ color: '#00d4aa' }}>
                <FontAwesomeIcon icon={faArrowLeft} className="me-1" />Retour à la connexion
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-white-50 small mt-3">
          © {new Date().getFullYear()} GesTrack
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
