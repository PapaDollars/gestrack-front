// Paramètres › Mon compte › Sécurité : les deux secrets du compte, bien distincts —
//  • mot de passe de connexion : uniquement pour entrer dans l'application (changé avec un
//    code envoyé par email) ;
//  • code de l'application : prix d'achat des fiches produits et bénéfices de Mes finances —
// puis la déconnexion.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faKey, faSignOutAlt, faEnvelope, faShieldAlt, faInfoCircle, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/context/AuthContext';
import { profilAPI } from '@/services/api';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import ModalMotDePasse from '@/pages/parametres/mon-compte/modals/ModalMotDePasse';
import ModalCodePrix from '@/pages/parametres/mon-compte/modals/ModalCodePrix';
import { ROUTES } from '@/utils/url/frontend';

const VERT = '#00d4aa';
const INDIGO = '#6366f1';

const dateFr = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Liste « Sert à … » d'une carte
const Usages = ({ couleur, items }) => (
  <ul className="list-unstyled small mb-3" style={{ color: 'var(--bs-body-color)' }}>
    {items.map((t) => (
      <li key={t} className="d-flex gap-2 mb-1">
        <FontAwesomeIcon icon={faCheck} className="mt-1 flex-shrink-0" style={{ color: couleur }} /> <span>{t}</span>
      </li>
    ))}
  </ul>
);

const Securite = () => {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();
  const [modalMdp, setModalMdp] = useState(false);
  const [modalCode, setModalCode] = useState(false);
  const [codePrix, setCodePrix] = useState(null);
  const [confirmDeco, setConfirmDeco] = useState(false);

  const chargerCodePrix = () => profilAPI.etatCodePrix().then(({ data }) => setCodePrix(data)).catch(() => {});
  useEffect(() => { chargerCodePrix(); }, []);

  const seDeconnecter = async () => {
    setConfirmDeco(false);
    await deconnexion();
    navigate(ROUTES.connexion);
  };

  return (
    <div className="row g-3">
      {/* Différence entre les deux secrets */}
      <div className="col-12">
        <div className="d-flex gap-2 p-3 small" style={{ borderRadius: 12, background: 'rgba(14,165,233,0.08)', color: 'var(--bs-body-color)' }}>
          <FontAwesomeIcon icon={faInfoCircle} className="mt-1 flex-shrink-0" style={{ color: '#0ea5e9' }} />
          <div>
            Votre compte a <strong>deux secrets différents</strong>, qui se changent séparément :
            le <strong style={{ color: '#00a881' }}>mot de passe de connexion</strong> sert uniquement à entrer
            dans GesTrack ; le <strong style={{ color: INDIGO }}>code de l'application</strong> protège, une fois
            connecté, vos prix d'achat et vos bénéfices. Vous pouvez ainsi laisser quelqu'un vendre sur votre
            session sans lui montrer vos marges, ni lui donner votre mot de passe.
          </div>
        </div>
      </div>

      {/* Mot de passe de connexion */}
      <div className="col-12 col-lg-6">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, borderTop: `4px solid ${VERT}` }}>
          <div className="card-body p-4 d-flex flex-column">
            <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faKey} style={{ color: VERT }} /> Mot de passe de connexion
            </h6>
            <div className="small fw-semibold text-muted mb-1">Sert à :</div>
            <Usages couleur={VERT} items={[
              'Se connecter à GesTrack avec votre email, et rien d\'autre',
              'Ne donne pas accès aux prix d\'achat ni aux bénéfices',
            ]} />
            <p className="text-muted small mb-3">
              Pour le changer, un code de vérification est envoyé à votre adresse email.
            </p>
            <div className="d-flex align-items-center gap-2 small mb-3 text-break" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faEnvelope} style={{ color: VERT }} /> {utilisateur?.email}
            </div>
            <div className="d-flex mt-auto">
              <button className="btn text-white d-flex align-items-center justify-content-center gap-2 ms-sm-auto flex-grow-1 flex-sm-grow-0"
                style={{ background: VERT, borderRadius: 10 }} onClick={() => setModalMdp(true)}>
                <FontAwesomeIcon icon={faKey} /> Changer le mot de passe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code de l'application */}
      <div className="col-12 col-lg-6">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, borderTop: `4px solid ${INDIGO}` }}>
          <div className="card-body p-4 d-flex flex-column">
            <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faShieldAlt} style={{ color: INDIGO }} /> Code de l'application
            </h6>
            <div className="small fw-semibold text-muted mb-1">Sert à :</div>
            <Usages couleur={INDIGO} items={[
              'Afficher le prix d\'achat (bouton « Voir ») sur les fiches produits de la Boutique et du Magasin',
              'Afficher les bénéfices dans Finances › Mes finances',
              'Ne permet pas de se connecter au compte',
            ]} />
            {codePrix && !codePrix.personnalise ? (
              <div className="small mb-3 p-2 rounded-3" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--bs-body-color)' }}>
                Code par défaut : <strong style={{ color: INDIGO, letterSpacing: 2 }}>{codePrix.codeDefaut}</strong>
                <div className="text-muted">Changez-le ici, avec le bouton ci-dessous, pour que personne d'autre ne le connaisse.</div>
              </div>
            ) : (
              <p className="text-muted small mb-3">
                {codePrix?.personnalise
                  ? `Code personnalisé${codePrix.modifieLe ? `, modifié le ${dateFr(codePrix.modifieLe)}` : ''}.`
                  : ''}
              </p>
            )}
            <div className="d-flex mt-auto">
              <button className="btn text-white d-flex align-items-center justify-content-center gap-2 ms-sm-auto flex-grow-1 flex-sm-grow-0"
                style={{ background: INDIGO, borderRadius: 10 }} onClick={() => setModalCode(true)}>
                <FontAwesomeIcon icon={faShieldAlt} /> Changer le code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Déconnexion */}
      <div className="col-12">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-4 d-flex flex-column flex-sm-row align-items-sm-center gap-3">
            <div className="flex-grow-1">
              <h6 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faSignOutAlt} style={{ color: '#ef4444' }} /> Déconnexion
              </h6>
              <p className="text-muted small mb-0">
                Fermer votre session sur cet appareil. Vos données restent enregistrées et vous
                retrouverez tout à votre prochaine connexion.
              </p>
            </div>
            <button className="btn d-flex align-items-center justify-content-center gap-2 flex-shrink-0"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 10 }}
              onClick={() => setConfirmDeco(true)}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {modalMdp && <ModalMotDePasse email={utilisateur?.email} onFermer={() => setModalMdp(false)} />}
      {modalCode && (
        <ModalCodePrix
          email={utilisateur?.email}
          personnalise={codePrix?.personnalise}
          codeDefaut={codePrix?.codeDefaut}
          longueurMin={codePrix?.longueurMin}
          onModifie={chargerCodePrix}
          onFermer={() => setModalCode(false)}
        />
      )}
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
