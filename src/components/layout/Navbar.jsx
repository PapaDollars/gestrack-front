import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle, faUser, faCog, faSignOutAlt,
  faChevronDown, faWifi, faSync, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/context/AuthContext';
import { useConnexion } from '@/context/ConnexionContext';
import ModalConfirmation from '@/components/shared/ModalConfirmation';

const INFOS_STATUT = {
  connecte:        { couleur: '#22c55e', label: 'Connecté',        icon: faWifi },
  horsLigne:       { couleur: '#ef4444', label: 'Hors ligne',      icon: faExclamationTriangle },
  synchronisation: { couleur: '#f59e0b', label: 'Synchronisation…', icon: faSync },
};

const Navbar = () => {
  const { utilisateur, deconnexion } = useAuth();
  const { statut, nbEnAttente } = useConnexion();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [confirmDeco, setConfirmDeco]  = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu si clic hors du dropdown
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDeconnexion = async () => {
    setConfirmDeco(false);
    await deconnexion();
    navigate('/login');
  };

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
        {/* ── Statut connexion ── */}
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

        {/* Spacer */}
        <div className="flex-grow-1" />

        {/* ── Menu Comptes ── */}
        <div className="position-relative" ref={menuRef}>
          <button
            className="d-flex align-items-center gap-2 px-3 py-2 border-0 rounded"
            style={{
              background: menuOuvert ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.06)',
              color: '#fff', cursor: 'pointer', transition: 'all 0.2s', fontSize: 13,
            }}
            onClick={() => setMenuOuvert(v => !v)}
          >
            <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: 18, color: '#00d4aa' }} />
            <span className="d-none d-sm-inline" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nomAffiche}
            </span>
            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 10, opacity: 0.7,
              transform: menuOuvert ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {menuOuvert && (
            <div
              className="position-absolute end-0 rounded shadow"
              style={{
                top: 'calc(100% + 8px)', minWidth: 180,
                background: '#162330', border: '1px solid rgba(255,255,255,0.12)',
                zIndex: 1000,
              }}
            >
              <NavLink to="/profil"
                className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-white-50"
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(0,212,170,0.15)' : 'transparent',
                  color: isActive ? '#fff' : undefined, fontSize: 13,
                })}
                onClick={() => setMenuOuvert(false)}
              >
                <FontAwesomeIcon icon={faUser} style={{ width: 14 }} />
                Mon compte
              </NavLink>

              <NavLink to="/parametres"
                className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-white-50"
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(0,212,170,0.15)' : 'transparent',
                  color: isActive ? '#fff' : undefined, fontSize: 13,
                })}
                onClick={() => setMenuOuvert(false)}
              >
                <FontAwesomeIcon icon={faCog} style={{ width: 14 }} />
                Paramètres
              </NavLink>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />

              <button
                className="d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 text-white-50"
                style={{ background: 'transparent', fontSize: 13, cursor: 'pointer' }}
                onClick={() => { setMenuOuvert(false); setConfirmDeco(true); }}
              >
                <FontAwesomeIcon icon={faSignOutAlt} style={{ width: 14, color: '#ef4444' }} />
                <span style={{ color: '#ef4444' }}>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {confirmDeco && (
        <ModalConfirmation
          message="Voulez-vous vraiment vous déconnecter ?"
          labelConfirmer="Déconnexion"
          onConfirmer={handleDeconnexion}
          onAnnuler={() => setConfirmDeco(false)}
        />
      )}
    </>
  );
};

export default Navbar;
