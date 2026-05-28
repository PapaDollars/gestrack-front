import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldAlt, faChartBar, faUsers, faFlag,
  faStore, faBullhorn, faClipboardList, faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/img/logo.png';

const NAV = [
  { to: '/admin',              label: 'Tableau de bord', icon: faChartBar,    exact: true },
  { to: '/admin/utilisateurs', label: 'Utilisateurs',    icon: faUsers },
  { to: '/admin/moderation',   label: 'Modération',      icon: faFlag },
  { to: '/admin/vitrines',     label: 'Vitrines',        icon: faStore },
  { to: '/admin/journal',      label: 'Journal',         icon: faClipboardList },
];

const AdminLayout = () => {
  const { deconnexion } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await deconnexion();
    navigate('/login');
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: 'var(--bs-tertiary-bg)' }}>
      {/* Sidebar admin */}
      <aside style={{
        width: 240, minHeight: '100vh', background: '#0f2027',
        position: 'fixed', top: 0, left: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div className="d-flex align-items-center gap-2 px-3 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 36, height: 36, background: '#fff', borderRadius: 10,
            overflow: 'hidden', padding: 4, flexShrink: 0 }}>
            <img src={logo} alt="GesTrack" style={{ width: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div className="fw-bold text-white" style={{ fontSize: 14, lineHeight: 1.2 }}>GesTrack</div>
            <div style={{ fontSize: 10, color: '#00d4aa', fontWeight: 600 }}>ADMINISTRATION</div>
          </div>
        </div>

        {/* Badge admin */}
        <div className="px-3 py-2">
          <div className="d-flex align-items-center gap-2 rounded-2 px-2 py-1"
            style={{ background: 'rgba(0,212,170,0.12)' }}>
            <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#00d4aa', fontSize: 11 }} />
            <span style={{ fontSize: 11, color: '#00d4aa', fontWeight: 600 }}>Accès administrateur</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 px-2 py-1">
          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(0,212,170,0.18)' : 'transparent',
                transition: 'all 0.15s',
              })}>
              <FontAwesomeIcon icon={icon} style={{ fontSize: 13, width: 16, flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleLogout}
            className="btn w-100 d-flex align-items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, background: 'transparent', border: 'none' }}>
            <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: 13 }} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main style={{ marginLeft: 240, flex: 1, padding: '2rem', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
