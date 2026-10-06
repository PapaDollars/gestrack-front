// Accès payant : écran de blocage (compte en attente / expiré / bloqué) et bandeau de
// période d'essai. L'état vient de /auth/me (champ `acces`) et des réponses 403 « ACCES_* »
// du serveur (événement `gestrack:acces-refuse` émis par services/api.js).
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHourglassHalf, faBan, faLock, faEnvelope, faSignOutAlt, faTimes, faCrown, faRedo,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/context/AuthContext';

export const ADMIN_CONTACT = 'gestrack.gt@gmail.com';

const dateFr = (iso) => iso
  ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : '';

const CONTENUS = {
  ACCES_EN_ATTENTE: {
    icon: faHourglassHalf, couleur: '#d97706', fond: '#fef3c7',
    titre: 'Compte en attente d\'approbation',
    texte: 'Votre compte a bien été créé. Il doit être approuvé par l\'administrateur avant que vous puissiez utiliser GesTrack.',
  },
  ACCES_EXPIRE: {
    icon: faLock, couleur: '#dc2626', fond: '#fee2e2',
    titre: 'Période gratuite terminée',
    texte: 'Votre accès gratuit à GesTrack est arrivé à son terme. Contactez l\'administrateur pour passer à la version Pro et retrouver toutes vos données.',
  },
  ACCES_BLOQUE: {
    icon: faBan, couleur: '#dc2626', fond: '#fee2e2',
    titre: 'Accès bloqué',
    texte: 'L\'accès de votre compte à GesTrack a été bloqué par l\'administrateur.',
  },
};

// Écran plein contenu affiché à la place de l'application
export const EcranAccesBloque = ({ acces }) => {
  const { utilisateur, deconnexion } = useAuth();
  const c = CONTENUS[acces?.code] || CONTENUS.ACCES_EN_ATTENTE;
  const sujet = encodeURIComponent('Activation de mon compte GesTrack Pro');
  const corps = encodeURIComponent(`Bonjour,\n\nJe souhaite activer mon compte GesTrack (${utilisateur?.email || ''}).\n\nMerci.`);

  return (
    <div className="d-flex align-items-center justify-content-center h-100 py-4">
      <div className="card border-0 shadow-sm text-center" style={{ borderRadius: 20, maxWidth: 520, width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: 76, height: 76, background: c.fond }}>
            <FontAwesomeIcon icon={c.icon} style={{ color: c.couleur, fontSize: 32 }} />
          </div>
          <h4 className="fw-bold mb-2" style={{ color: 'var(--bs-body-color)' }}>{c.titre}</h4>
          <p className="text-muted mb-4">{c.texte}</p>

          <div className="rounded-3 p-3 mb-4 text-start" style={{ background: 'var(--bs-secondary-bg)' }}>
            <div className="small text-muted mb-1">Contactez l'administrateur :</div>
            <div className="fw-semibold d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faEnvelope} style={{ color: '#00d4aa' }} /> {ADMIN_CONTACT}
            </div>
            {utilisateur?.email && (
              <div className="small text-muted mt-2">Votre compte : <strong>{utilisateur.email}</strong></div>
            )}
          </div>

          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <a className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa', borderRadius: 10 }}
              href={`mailto:${ADMIN_CONTACT}?subject=${sujet}&body=${corps}`}>
              <FontAwesomeIcon icon={faEnvelope} /> Écrire à l'administrateur
            </a>
            <button className="btn btn-light d-flex align-items-center gap-2" style={{ borderRadius: 10 }}
              onClick={() => window.location.reload()} title="Vérifier si mon compte a été approuvé">
              <FontAwesomeIcon icon={faRedo} /> Vérifier
            </button>
            <button className="btn btn-light d-flex align-items-center gap-2" style={{ borderRadius: 10 }}
              onClick={deconnexion}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bandeau discret pendant la période d'essai (masquable pour la session en cours)
export const BandeauEssai = ({ acces }) => {
  const cle = 'gestrack_bandeau_essai_masque';
  const [masque, setMasque] = useState(() => {
    try { return sessionStorage.getItem(cle) === '1'; } catch { return false; }
  });
  if (masque || acces?.statutAcces !== 'essai' || !acces?.dateLimiteAcces) return null;

  const jours = Math.max(0, Math.ceil((new Date(acces.dateLimiteAcces).getTime() - Date.now()) / 86400000));
  const urgent = jours <= 7;
  const masquer = () => {
    setMasque(true);
    try { sessionStorage.setItem(cle, '1'); } catch { /* navigation privée */ }
  };

  return (
    <div className="d-flex align-items-center gap-2 px-3 py-2 mb-3 flex-wrap"
      style={{ borderRadius: 12, background: urgent ? '#fee2e2' : '#e0f2fe', color: urgent ? '#991b1b' : '#075985', fontSize: 'var(--txt-base)' }}>
      <FontAwesomeIcon icon={urgent ? faHourglassHalf : faCrown} />
      <span className="flex-grow-1">
        <strong>{jours} jour{jours > 1 ? 's' : ''} d'accès gratuit restant{jours > 1 ? 's' : ''}</strong>
        {' '}(jusqu'au {dateFr(acces.dateLimiteAcces)}). Contactez l'administrateur ({ADMIN_CONTACT}) pour passer à la version Pro.
      </span>
      <a className="btn btn-sm text-white" style={{ background: urgent ? '#dc2626' : '#0369a1', borderRadius: 8 }}
        href={`mailto:${ADMIN_CONTACT}?subject=${encodeURIComponent('Passage à GesTrack Pro')}`}>
        Contacter
      </a>
      <button className="btn btn-sm p-1" style={{ color: 'inherit' }} onClick={masquer} title="Masquer">
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};
