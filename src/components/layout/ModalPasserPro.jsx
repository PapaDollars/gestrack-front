// Fenêtre « Passer à la version Pro » : ouverte quand une action est réservée à la version
// Pro (version gratuite limitée — code ACCES_LIMITE) ou quand la limite d'utilisation du
// jour est atteinte (QUOTA_JOUR). Lien vers les tarifs + contact de l'administrateur.
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faTimes, faTags, faEnvelope, faGaugeHigh } from '@fortawesome/free-solid-svg-icons';
import { ROUTES, EMAIL_CONTACT, mailto } from '@/utils/url/frontend';

const ModalPasserPro = ({ detail = {}, onFermer }) => {
  const quota = detail.code === 'QUOTA_JOUR';
  const titre = quota ? 'Limite du jour atteinte' : detail.aboExpire ? 'Abonnement terminé'
    : detail.code === 'MODULE_PLAN' ? `Non inclus dans votre plan ${detail.plan || ''}` : 'Fonction réservée à la version Pro';
  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1070 }}
      onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 460 }}>
        <div className="modal-content border-0" style={{ borderRadius: 18, background: 'var(--bs-body-bg)' }}>
          <div className="modal-body p-4 text-center">
            <button className="btn btn-light btn-sm rounded-circle position-absolute" style={{ top: 12, right: 12 }} onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: 64, height: 64, background: quota ? '#fef3c7' : '#dcfce7' }}>
              <FontAwesomeIcon icon={quota ? faGaugeHigh : faCrown} style={{ fontSize: 26, color: quota ? '#d97706' : '#16a34a' }} />
            </div>
            <h5 className="fw-bold mb-2" style={{ color: 'var(--bs-body-color)' }}>{titre}</h5>
            <p className="text-muted mb-3" style={{ fontSize: 'var(--txt-md)' }}>
              {detail.message || 'Passez à la version Pro pour utiliser toutes les fonctionnalités de GesTrack.'}
            </p>
            {quota && detail.usage && detail.limites && (
              <div className="small mb-3 p-2 rounded-3" style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)' }}>
                Aujourd'hui : {detail.usage.lectures} / {detail.limites.lectures} lectures · {detail.usage.ecritures} / {detail.limites.ecritures} écritures
              </div>
            )}
            <ol className="text-start small mb-3 ps-3" style={{ color: 'var(--bs-body-color)' }}>
              <li>Choisissez votre plan sur la page des tarifs ;</li>
              <li>envoyez la demande à l'administrateur (le message est prérempli) ;</li>
              <li>votre compte est activé dès réception du paiement.</li>
            </ol>
            <div className="d-flex flex-column gap-2">
              <Link to={ROUTES.tarifs} onClick={onFermer}
                className="btn text-white d-flex align-items-center justify-content-center gap-2"
                style={{ background: '#00d4aa', borderRadius: 10 }}>
                <FontAwesomeIcon icon={faTags} /> Voir les tarifs et choisir un plan
              </Link>
              <a href={mailto(EMAIL_CONTACT, { sujet: 'Passage à GesTrack Pro' })}
                className="btn btn-light d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 10 }}>
                <FontAwesomeIcon icon={faEnvelope} /> Contacter l'administrateur ({EMAIL_CONTACT})
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPasserPro;
