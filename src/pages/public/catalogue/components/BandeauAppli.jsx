// Bandeau « Télécharger l'appli » : affiché seulement aux visiteurs Android qui ouvrent le
// catalogue dans le navigateur (pas dans l'appli), et seulement pour le catalogue qui a son appli.
// Fermé avec la croix → caché 7 jours sur cet appareil (simple confort, stockage local).
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faGooglePlay } from '@fortawesome/free-brands-svg-icons';
import { APPLI_ANDROID } from '@/utils/url/frontend';

const CLE_FERME = 'gt-bandeau-appli-ferme';
const CLE_DANS_APPLI = 'gt-dans-appli';
const SEPT_JOURS = 7 * 24 * 60 * 60 * 1000;

// L'appli (TWA) ouvre le site avec un « referrer » android-app://<paquet> au premier
// chargement seulement : on le retient pour la session, la navigation interne le perd ensuite.
const estDansAppli = () => {
  try {
    if (document.referrer.startsWith(`android-app://${APPLI_ANDROID.paquet}`)) {
      sessionStorage.setItem(CLE_DANS_APPLI, '1');
      return true;
    }
    if (sessionStorage.getItem(CLE_DANS_APPLI) === '1') return true;
  } catch { /* stockage indisponible : on se fie au mode d'affichage ci-dessous */ }
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.matchMedia?.('(display-mode: fullscreen)').matches;
};

const fermeRecemment = () => {
  try { return Date.now() - Number(localStorage.getItem(CLE_FERME) || 0) < SEPT_JOURS; }
  catch { return false; }
};

const BandeauAppli = ({ slug }) => {
  const [visible, setVisible] = useState(() =>
    slug === APPLI_ANDROID.slug
    && /Android/i.test(navigator.userAgent)
    && !estDansAppli()
    && !fermeRecemment());

  if (!visible) return null;

  const fermer = () => {
    try { localStorage.setItem(CLE_FERME, String(Date.now())); } catch { /* rien à faire */ }
    setVisible(false);
  };

  return (
    <div className="d-flex align-items-center gap-2 px-3 py-2"
      style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
      <button type="button" className="btn btn-sm p-1 flex-shrink-0" aria-label="Fermer"
        style={{ color: '#94a3b8', border: 'none' }} onClick={fermer}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <img src="/logo_apk.png" alt="" width={36} height={36} className="flex-shrink-0"
        style={{ borderRadius: 8, objectFit: 'cover' }} />
      <div className="flex-grow-1" style={{ minWidth: 0, lineHeight: 1.25 }}>
        <div className="fw-semibold text-truncate" style={{ fontSize: 14, color: '#1e293b' }}>Notre appli Android</div>
        <div className="text-truncate" style={{ fontSize: 12, color: '#64748b' }}>Plus rapide, toujours à portée de main</div>
      </div>
      <a href={APPLI_ANDROID.playStore} target="_blank" rel="noopener noreferrer"
        className="btn btn-sm fw-semibold d-flex align-items-center gap-2 flex-shrink-0"
        style={{ background: '#00a881', color: '#fff', borderRadius: 999, border: 'none', padding: '6px 14px' }}>
        <FontAwesomeIcon icon={faGooglePlay} />
        Télécharger
      </a>
    </div>
  );
};

export default BandeauAppli;
