import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldAlt, faChartBar, faUsers, faFlag,
  faStore, faClipboardList, faSignOutAlt, faBars, faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/context/AuthContext';
import useIsMobile from '@/hooks/useIsMobile';
import logo from '@/assets/img/logo.png';
import { ROUTES } from '@/utils/url/frontend';

const NAV = [
  { to: ROUTES.admin,              label: 'Tableau de bord', icon: faChartBar,    exact: true },
  { to: ROUTES.adminUtilisateurs, label: 'Utilisateurs',    icon: faUsers },
  { to: ROUTES.adminModeration,   label: 'Modération',      icon: faFlag },
  { to: ROUTES.adminVitrines,     label: 'Vitrines',        icon: faStore },
  { to: ROUTES.adminJournal,      label: 'Journal',         icon: faClipboardList },
];

const AdminLayout = () => {
  const { deconnexion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  // Mobile : la barre latérale devient un tiroir ouvert par le bouton menu
  const [menuOuvert, setMenuOuvert] = useState(false);
  useEffect(() => { setMenuOuvert(false); }, [location.pathname]);
  const pageCourante = NAV.find(n => (n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label || 'Administration';

  const handleLogout = async () => {
    await deconnexion();
    navigate(ROUTES.connexion);
  };

  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden', background: 'var(--bs-tertiary-bg)' }}>
      {/* Barre du haut — mobile uniquement */}
      {isMobile && (
        <header className="d-flex align-items-center gap-3 px-3"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 90, background: '#0f2027' }}>
          <button type="button" className="btn p-0 d-flex align-items-center justify-content-center"
            style={{ width: 38, height: 38, borderRadius: 10, background: '#00d4aa', color: '#fff' }}
            onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="min-w-0">
            <div style={{ fontSize: 'var(--txt-xs)', color: '#00d4aa', fontWeight: 600, letterSpacing: 0.5 }}>ADMINISTRATION</div>
            <div className="fw-semibold text-white text-truncate" style={{ fontSize: 'var(--txt-lg)' }}>{pageCourante}</div>
          </div>
        </header>
      )}

      {/* Fond sombre derrière le tiroir (mobile) */}
      {isMobile && menuOuvert && (
        <div onClick={() => setMenuOuvert(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99 }} />
      )}

      {/* Sidebar admin — fixe sur grand écran, tiroir coulissant sur mobile */}
      <aside style={{
        width: 240, height: '100vh', background: '#0f2027',
        position: 'fixed', top: 0, left: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
        transform: isMobile && !menuOuvert ? 'translateX(-100%)' : 'none',
        transition: 'transform 0.25s ease',
        boxShadow: isMobile && menuOuvert ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Logo */}
        <div className="d-flex align-items-center gap-2 px-3 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 36, height: 36, background: '#fff', borderRadius: 10,
            overflow: 'hidden', padding: 4, flexShrink: 0 }}>
            <img src={logo} alt="GesTrack" style={{ width: '100%', objectFit: 'contain' }} />
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold text-white" style={{ fontSize: 'var(--txt-lg)', lineHeight: 1.2 }}>GesTrack</div>
            <div style={{ fontSize: 'var(--txt-xs)', color: '#00d4aa', fontWeight: 600 }}>ADMINISTRATION</div>
          </div>
          {isMobile && (
            <button type="button" className="btn p-1" style={{ color: 'rgba(255,255,255,0.7)' }}
              onClick={() => setMenuOuvert(false)} aria-label="Fermer le menu">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        {/* Badge admin */}
        <div className="px-3 py-2">
          <div className="d-flex align-items-center gap-2 rounded-2 px-2 py-1"
            style={{ background: 'rgba(0,212,170,0.12)' }}>
            <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#00d4aa', fontSize: 'var(--txt-sm)' }} />
            <span style={{ fontSize: 'var(--txt-sm)', color: '#00d4aa', fontWeight: 600 }}>Accès administrateur</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 px-2 py-2">
          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 8, marginBottom: 6,
                textDecoration: 'none', fontSize: 'var(--txt-md)', fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(0,212,170,0.18)' : 'transparent',
                transition: 'all 0.15s',
              })}>
              <FontAwesomeIcon icon={icon} style={{ fontSize: 'var(--txt-md)', width: 16, flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleLogout}
            className="btn w-100 d-flex align-items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'var(--txt-md)', background: 'transparent', border: 'none' }}>
            <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: 'var(--txt-md)' }} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu — hauteur figée : chaque page garde son en-tête fixe (.admin-entete) et
          fait défiler son contenu (.admin-contenu), voir index.css */}
      <main style={{
        marginLeft: isMobile ? 0 : 240, marginTop: isMobile ? 56 : 0, flex: 1, minWidth: 0,
        height: isMobile ? 'calc(100vh - 56px)' : '100vh', overflow: 'hidden',
        padding: isMobile ? '1rem 1rem 0' : '2rem 2rem 0',
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
