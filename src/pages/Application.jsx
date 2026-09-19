import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faCheckCircle, faMobileAlt, faDesktop,
  faInfoCircle, faLink, faShareAlt, faTimes,
} from '@fortawesome/free-solid-svg-icons';
import useInstallPWA from '@/hooks/useInstallPWA';
import logo from '@/assets/img/logo.png';

const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const urlApp = window.location.origin;

const Application = () => {
  const { peutInstaller, estInstalle, installer } = useInstallPWA();
  const [modalRaccourci, setModalRaccourci] = useState(false);
  const [copie, setCopie] = useState(false);

  const partager = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GesTrack',
          text: 'Gérez vos dettes, clients et stocks avec GesTrack',
          url: urlApp,
        });
      } catch {}
    } else {
      // Fallback : copier le lien
      await navigator.clipboard.writeText(urlApp);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    }
  };

  return (
    <div className="mt-4" style={{ maxWidth: 640 }}>
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
        <FontAwesomeIcon icon={faMobileAlt} style={{ color: '#00d4aa' }} />
        Installer l'application
      </h6>
      <p className="text-secondary mb-4" style={{ fontSize: 'var(--txt-md)' }}>
        Installez GesTrack sur votre appareil pour y accéder rapidement.
      </p>

      {/* Carte principale */}
      <div className="rounded-3 p-4 mb-3 d-flex flex-column align-items-center text-center"
        style={{ background: 'var(--bs-secondary-bg)', border: '1px solid var(--bs-border-color)' }}>

        {/* Boutons d'action */}
        <div className="d-flex flex-wrap gap-2 justify-content-center mt-2">

          {/* Installer */}
          {estInstalle ? (
            <div className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill"
              style={{ background: '#203a43', border: '1px solid #00d4aa' }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#00d4aa' }} />
              <span style={{ color: '#00d4aa', fontWeight: 600, fontSize: 'var(--txt-base)' }}>Déjà installée</span>
            </div>
          ) : peutInstaller ? (
            <button onClick={installer}
              className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0"
              style={{ background: '#00d4aa', color: '#0f2027', fontWeight: 700, fontSize: 'var(--txt-base)', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faDownload} />
              Installer
            </button>
          ) : null}

          {/* Créer un raccourci (iOS ou navigateurs sans PWA) */}
          {(!peutInstaller || estIOS) && !estInstalle && (
            <button onClick={() => setModalRaccourci(true)}
              className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0"
              style={{ background: '#203a43', color: '#fff', fontSize: 'var(--txt-base)', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faLink} />
              Créer un raccourci
            </button>
          )}

          {/* Partager */}
          <button onClick={partager}
            className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill border-0"
            style={{ background: '#203a43', color: '#fff', fontSize: 'var(--txt-base)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)' }}>
            <FontAwesomeIcon icon={faShareAlt} />
            {copie ? 'Lien copié !' : 'Partager'}
          </button>

        </div>
      </div>

      {/* Instructions Android/Desktop */}
      {!estIOS && (
        <div className="rounded-3 p-3 mb-3"
          style={{ background: 'var(--bs-secondary-bg)', border: '1px solid var(--bs-border-color)' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faDesktop} style={{ color: '#00d4aa' }} />
            <span className="fw-semibold" >Sur Android / Ordinateur (Chrome)</span>
          </div>
          <ol className="mb-0 ps-3" style={{ fontSize: 'var(--txt-md)', color: 'var(--bs-secondary-color)', lineHeight: 1.8 }}>
            <li>Appuyez sur <strong>"Installer"</strong> ci-dessus</li>
            <li>Confirmez avec <strong>"Ajouter"</strong> dans la popup Chrome</li>
            <span>Si Google Play Protect affiche <strong>"Appli dangereuse bloquée"</strong></span>
            <li>Appuyez sur <strong>"Plus de détails"</strong> puis <strong>"Installer quand même"</strong></li>
            <li>GesTrack s'installe sur votre écran d'accueil</li>
          </ol>
          {/* Note Play Protect */}
          <div className="d-flex gap-2 mt-3 p-2 rounded-2" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <span style={{ fontSize: 'var(--txt-md)', color: 'var(--bs-secondary-color)' }}>
              L'avertissement Play Protect est normal pour les PWA. GesTrack est une application web sécurisée hébergée sur <strong>gestrack.business</strong>
            </span>
          </div>
        </div>
      )}

      {/* Instructions iOS */}
      <div className="rounded-3 p-3"
        style={{ background: 'var(--bs-secondary-bg)', border: '1px solid var(--bs-border-color)' }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faMobileAlt} style={{ color: '#00d4aa' }} />
          <span className="fw-semibold" >Sur iPhone / iPad (Safari)</span>
        </div>
        <ol className="mb-0 ps-3" style={{ fontSize: 'var(--txt-md)', color: 'var(--bs-secondary-color)', lineHeight: 1.8 }}>
          <li>Ouvrez GesTrack dans <strong>Safari</strong></li>
          <li>Appuyez sur le bouton <strong>Partager ⬆</strong> en bas</li>
          <li>Choisissez <strong>"Sur l'écran d'accueil"</strong></li>
          <li>Appuyez sur <strong>Ajouter</strong></li>
        </ol>
      </div>

      {/* Modal raccourci iOS */}
      {modalRaccourci && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 9999 }}
          onClick={() => setModalRaccourci(false)}>
          <div className="rounded-3 p-4 mx-3" style={{ background: '#1a2f3f', maxWidth: 360, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-bold text-white" style={{ fontSize: 'var(--txt-md)' }}>Créer un raccourci</span>
              <button onClick={() => setModalRaccourci(false)} className="border-0 p-0"
                style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="mb-3 p-3 rounded-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p className="mb-0 text-white-50" style={{ fontSize: 'var(--txt-md)' }}>{urlApp}</p>
            </div>

            <p className="text-white-50 mb-3" style={{ fontSize: 'var(--txt-md)' }}>
              Sur <strong className="text-white">iPhone / iPad</strong> avec Safari :
            </p>
            <ol style={{ fontSize: 'var(--txt-md)', color: 'rgba(255,255,255,0.6)', lineHeight: 2, paddingLeft: 20 }}>
              <li>Appuyez sur <strong className="text-white">Partager ⬆</strong></li>
              <li>Choisissez <strong className="text-white">"Sur l'écran d'accueil"</strong></li>
              <li>Appuyez sur <strong className="text-white">Ajouter</strong></li>
            </ol>

            <button onClick={partager}
              className="w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-2 border-0 mt-2"
              style={{ background: '#00d4aa', color: '#0f2027', fontWeight: 700, fontSize: 'var(--txt-base)', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faShareAlt} />
              {copie ? 'Lien copié !' : 'Copier le lien'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Application;
