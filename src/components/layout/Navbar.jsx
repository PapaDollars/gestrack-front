import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle, faWifi, faSync, faExclamationTriangle, faBell,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/context/AuthContext';
import { useConnexion } from '@/context/ConnexionContext';
import { ROUTES } from '@/utils/url/frontend';

const INFOS_STATUT = {
  connecte:        { couleur: '#22c55e', label: 'Connecté',        icon: faWifi },
  horsLigne:       { couleur: '#ef4444', label: 'Hors ligne',      icon: faExclamationTriangle },
  synchronisation: { couleur: '#f59e0b', label: 'Synchronisation…', icon: faSync },
};

const Navbar = ({ nbNotifs = 0 }) => {
  const { utilisateur } = useAuth();
  const { statut, nbEnAttente } = useConnexion();

  const info = INFOS_STATUT[statut] || INFOS_STATUT.connecte;
  const nomAffiche = utilisateur?.displayName || utilisateur?.email?.split('@')[0] || 'Mon compte';

  return (
    <>
      <header
        className="gestrack-navbar position-fixed d-flex align-items-center px-4 z-2"
        style={{
          top: 0, left: 240, right: 0, height: 56,
          background: 'linear-gradient(90deg, #0f2027 0%, #1a3040 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* ── Statut connexion — visible seulement si hors ligne ou en sync ── */}
        {statut !== 'connecte' && (
          <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${info.couleur}33` }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: info.couleur, flexShrink: 0,
              animation: statut === 'synchronisation' ? 'pulse 1s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: 12, color: info.couleur, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {info.label}
              {statut === 'horsLigne' && nbEnAttente > 0 && ` — ${nbEnAttente} en attente`}
            </span>
            <FontAwesomeIcon icon={info.icon} style={{
              fontSize: 10, color: info.couleur,
              animation: statut === 'synchronisation' ? 'spin 1s linear infinite' : 'none',
            }} />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-grow-1" />

        {/* ── Icône Rappel ── */}
        <NavLink to={ROUTES.notifications} className="position-relative d-flex align-items-center justify-content-center me-2"
          style={{ width: 36, height: 36, borderRadius: 8, color: '#fff', textDecoration: 'none',
            background: 'rgba(255,255,255,0.06)' }}>
          <FontAwesomeIcon icon={faBell} style={{ fontSize: 16, color: '#00d4aa' }} />
          {nbNotifs > 0 && (
            <span className="position-absolute top-0 end-0 badge rounded-pill"
              style={{ fontSize: 9, background: '#ef4444', transform: 'translate(25%,-25%)', minWidth: 16, padding: '2px 4px' }}>
              {nbNotifs > 99 ? '99+' : nbNotifs}
            </span>
          )}
        </NavLink>

        {/* ── Compte : ouvre Paramètres › Mon compte › Profil (déconnexion dans Sécurité) ── */}
        <NavLink to={ROUTES.parametresOnglet('compte-profil')}
          className="d-flex align-items-center gap-2 px-3 py-2 rounded text-decoration-none"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13 }}
          title="Mon compte">
          <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: 18, color: '#00d4aa' }} />
          <span className="d-none d-sm-inline" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nomAffiche}
          </span>
        </NavLink>
      </header>

    </>
  );
};

export default Navbar;
