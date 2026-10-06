// Page de connexion GesTrack
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import logo from '@/assets/img/logo.png';
import { ROUTES } from '@/utils/url/frontend';

const Login = () => {
  const { connexion, erreur, utilisateur } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [voir, setVoir] = useState(false);
  const [chargement, setChargement] = useState(false);

  // Rediriger vers le dashboard si déjà connecté
  useEffect(() => {
    if (utilisateur) navigate(ROUTES.dashboard, { replace: true });
  }, [utilisateur, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    await connexion(email, motDePasse);
    setChargement(false);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' }}>
      <div className="col-11 col-sm-8 col-md-5 col-lg-4">
        {/* Logo et titre */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3 p-2"
            style={{ background: '#e8f0ef', borderRadius: 14 }}>
            <img src={logo} alt="GesTrack" style={{ height: 56, objectFit: 'contain' }} />
          </div>
          <h1 className="text-white fw-bold fs-3 mb-1">GesTrack</h1>
          <p className="text-white-50 small">Gestion de dettes &amp; clients</p>
        </div>

        {/* Carte de connexion */}
        <div className="card border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <h5 className="fw-semibold mb-4 text-center" style={{ color: 'var(--bs-body-color)' }}>Connexion</h5>

            {erreur && (
              <div className="alert alert-danger d-flex align-items-center py-2" role="alert">
                <FontAwesomeIcon icon={faLock} className="me-2 text-danger" />
                <small>{erreur}</small>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold">Identifiant</label>
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary border-end-0">
                    <FontAwesomeIcon icon={faEnvelope} className="text-muted" />
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0 ps-0"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="mb-2">
                <label className="form-label text-muted small fw-semibold">Mot de passe</label>
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary border-end-0">
                    <FontAwesomeIcon icon={faLock} className="text-muted" />
                  </span>
                  <input
                    type={voir ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0 ps-0"
                    placeholder="••••••••"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    required
                  />
                  <button type="button" className="input-group-text bg-body-secondary border-start-0" onClick={() => setVoir(!voir)}>
                    <FontAwesomeIcon icon={voir ? faEyeSlash : faEye} className="text-muted" />
                  </button>
                </div>
              </div>

              {/* Mot de passe oublié */}
              <div className="text-end mb-4">
                <Link to={ROUTES.motDePasseOublie} className="small text-decoration-none" style={{ color: '#00d4aa' }}>
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                className="btn w-100 fw-semibold text-white py-2"
                style={{ background: '#00d4aa', border: 'none', borderRadius: 10 }}
                disabled={chargement}
              >
                {chargement
                  ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Connexion...</>
                  : 'Se connecter'}
              </button>
            </form>

            {/* Lien inscription */}
            <div className="text-center mt-3">
              <span className="text-muted small">Pas encore de compte ? </span>
              <Link to={ROUTES.inscription} className="small fw-semibold text-decoration-none" style={{ color: '#00d4aa' }}>
                Créer un compte
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-white-50 small mt-3">
          © {new Date().getFullYear()} GesTrack — Accès réservé
        </p>
      </div>
    </div>
  );
};

export default Login;
