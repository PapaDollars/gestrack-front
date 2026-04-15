// Barre de navigation latérale principale
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faUsers, faFileInvoiceDollar, faBox,
  faBell, faSignOutAlt, faBars, faTimes, faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ nbNotifs = 0 }) => {
  const { deconnexion } = useAuth();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);

  const liens = [
    { to: '/dashboard', icon: faHome, label: 'Tableau de bord' },
    { to: '/clients', icon: faUsers, label: 'Clients' },
    { to: '/dettes', icon: faFileInvoiceDollar, label: 'Dettes' },
    { to: '/produits', icon: faBox, label: 'Produits' },
    { to: '/statistiques', icon: faChartBar, label: 'Statistiques' },
    { to: '/notifications', icon: faBell, label: 'Notifications', badge: nbNotifs },
  ];

  const handleDeconnexion = async () => {
    await deconnexion();
    navigate('/login');
  };

  return (
    <>
      {/* Bouton mobile pour ouvrir le menu */}
      <button
        className="btn d-lg-none position-fixed top-0 start-0 m-3 z-3"
        style={{ background: '#00d4aa', color: '#fff', borderRadius: 10 }}
        onClick={() => setOuvert(!ouvert)}
      >
        <FontAwesomeIcon icon={ouvert ? faTimes : faBars} />
      </button>

      {/* Overlay mobile */}
      {ouvert && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none z-2"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOuvert(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`d-flex flex-column position-fixed top-0 start-0 h-100 z-3 ${ouvert ? '' : 'd-none d-lg-flex'}`}
        style={{
          width: 240,
          background: 'linear-gradient(180deg, #0f2027 0%, #203a43 100%)',
          transition: 'all 0.3s',
        }}
      >
        {/* Logo */}
        <div className="d-flex align-items-center gap-3 p-4 border-bottom border-secondary">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0"
            style={{ width: 40, height: 40, background: '#00d4aa', fontSize: 18 }}
          >
            G
          </div>
          <div>
            <div className="text-white fw-bold fs-6 lh-1">GesTrack</div>
            <div className="text-white-50" style={{ fontSize: 11 }}>Gestion dettes & clients</div>
          </div>
        </div>

        {/* Liens de navigation */}
        <div className="flex-grow-1 py-3">
          {liens.map(({ to, icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `d-flex align-items-center gap-3 px-4 py-3 text-decoration-none position-relative ${isActive
                  ? 'text-white border-start border-3'
                  : 'text-white-50'}`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(0,212,170,0.15)' : 'transparent',
                borderColor: isActive ? '#00d4aa' : 'transparent',
                transition: 'all 0.2s',
              })}
              onClick={() => setOuvert(false)}
            >
              <FontAwesomeIcon icon={icon} style={{ width: 18 }} />
              <span style={{ fontSize: 14 }}>{label}</span>
              {badge > 0 && (
                <span className="badge rounded-pill ms-auto" style={{ background: '#00d4aa', fontSize: 10 }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Déconnexion */}
        <div className="p-3 border-top border-secondary">
          <button
            className="btn w-100 d-flex align-items-center gap-3 text-white-50 py-2"
            style={{ background: 'transparent', fontSize: 14 }}
            onClick={handleDeconnexion}
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Déconnexion</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
