// Paramètres › Mon compte › Sécurité : changement du mot de passe (confirmé par un code envoyé
// par email) et déconnexion
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faSignOutAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/context/AuthContext';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import ModalMotDePasse from '@/pages/parametres/mon-compte/modals/ModalMotDePasse';
import { ROUTES } from '@/utils/url/frontend';

const Securite = () => {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();
  const [modalMdp, setModalMdp] = useState(false);
  const [confirmDeco, setConfirmDeco] = useState(false);

  const seDeconnecter = async () => {
    setConfirmDeco(false);
    await deconnexion();
    navigate(ROUTES.connexion);
  };

  return (
    <div className="row g-3">
      {/* Mot de passe */}
      <div className="col-12 col-lg-6">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
          <div className="card-body p-4 d-flex flex-column">
            <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faKey} style={{ color: '#00d4aa' }} /> Mot de passe
            </h6>
            <p className="text-muted small mb-3">
              Pour confirmer qu'il s'agit bien de vous, un code de vérification sera envoyé à votre
              adresse email avant de pouvoir choisir un nouveau mot de passe.
            </p>
            <div className="d-flex align-items-center gap-2 small mb-3" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faEnvelope} style={{ color: '#00d4aa' }} /> {utilisateur?.email}
            </div>
            <button className="btn text-white d-flex align-items-center justify-content-center gap-2 mt-auto"
              style={{ background: '#00d4aa', borderRadius: 10 }} onClick={() => setModalMdp(true)}>
              <FontAwesomeIcon icon={faKey} /> Changer le mot de passe
            </button>
          </div>
        </div>
      </div>

      {/* Déconnexion */}
      <div className="col-12 col-lg-6">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
          <div className="card-body p-4 d-flex flex-column">
            <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faSignOutAlt} style={{ color: '#ef4444' }} /> Déconnexion
            </h6>
            <p className="text-muted small mb-3">
              Fermer votre session sur cet appareil. Vos données restent enregistrées et vous
              retrouverez tout à votre prochaine connexion.
            </p>
            <button className="btn d-flex align-items-center justify-content-center gap-2 mt-auto"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 10 }}
              onClick={() => setConfirmDeco(true)}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {modalMdp && <ModalMotDePasse email={utilisateur?.email} onFermer={() => setModalMdp(false)} />}
      {confirmDeco && (
        <ModalConfirmation
          message="Voulez-vous vraiment vous déconnecter ?"
          labelConfirmer="Déconnexion"
          onConfirmer={seDeconnecter}
          onAnnuler={() => setConfirmDeco(false)}
        />
      )}
    </div>
  );
};

export default Securite;
