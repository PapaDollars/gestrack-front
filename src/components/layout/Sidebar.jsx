import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faUsers, faFileInvoiceDollar, faStore,
  faBell, faBars, faTimes, faChartBar,
  faWarehouse, faInfoCircle, faChartLine,
  faWallet, faChevronDown, faChevronUp, faBookOpen,
} from '@fortawesome/free-solid-svg-icons';
import logo from '@/assets/img/logo.png';

const lienStyle = (isActive) => ({
  background: isActive ? 'rgba(0,212,170,0.15)' : 'transparent',
  borderColor: isActive ? '#00d4aa' : 'transparent',
  transition: 'all 0.2s',
});

const lienClass = (isActive) =>
  `d-flex align-items-center gap-3 px-4 py-3 text-decoration-none position-relative ${
    isActive ? 'text-white border-start border-3' : 'text-white-50'
  }`;

const Sidebar = ({ nbNotifs = 0 }) => {
  const location = useLocation();
  const [ouvert, setOuvert] = useState(false);
  const [financesOuvert, setFinancesOuvert] = useState(location.pathname.startsWith('/finances'));

  const liens = [
    { to: '/dashboard',  icon: faHome,             label: 'Tableau de bord' },
    { to: '/clients',    icon: faUsers,             label: 'Clients' },
    { to: '/dettes',     icon: faFileInvoiceDollar, label: 'Dettes' },
    { to: '/produits',   icon: faStore,             label: 'Boutique' },
    { to: '/magasin',    icon: faWarehouse,         label: 'Magasin' },
  ];

  const liensApres = [
    { to: '/statistiques',  icon: faChartBar, label: 'Statistiques' },
    { to: '/notifications', icon: faBell,     label: 'Rappel', badge: nbNotifs },
  ];

  const sousLiensFinances = [
    { to: '/finances/mes-finances', icon: faChartLine, label: 'Mes Finances' },
    { to: '/finances/compte',       icon: faBookOpen,  label: 'Mon Compte' },
  ];

  const financesActif = location.pathname.startsWith('/finances');

  const SousLien = ({ to, icon, label }) => (
    <NavLink to={to}
      className={({ isActive }) =>
        `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none rounded ${
          isActive ? 'text-white' : 'text-white-50'
        }`
      }
      style={({ isActive }) => ({
        background: isActive ? 'rgba(0,212,170,0.2)' : 'transparent',
        fontSize: 13, transition: 'all 0.15s',
      })}
      onClick={() => setOuvert(false)}>
      <FontAwesomeIcon icon={icon} style={{ width: 14, fontSize: 12 }} />
      {label}
    </NavLink>
  );

  return (
    <>
      {/* Bouton mobile */}
      <button
        className="btn d-lg-none position-fixed m-3 z-3"
        style={{ background: '#00d4aa', color: '#fff', borderRadius: 10 }}
        onClick={() => setOuvert(!ouvert)}>
        <FontAwesomeIcon icon={ouvert ? faTimes : faBars} />
      </button>

      {/* Overlay mobile */}
      {ouvert && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-lg-none z-2"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOuvert(false)} />
      )}

      {/* Sidebar */}
      <nav
        className={`d-flex flex-column position-fixed start-0 z-3 ${ouvert ? '' : 'd-none d-lg-flex'}`}
        style={{
          top: 0, width: 240, height: '100vh',
          background: 'linear-gradient(180deg, #0f2027 0%, #203a43 100%)',
          transition: 'all 0.3s', overflowY: 'auto',
        }}>

        {/* Logo */}
        <div className="d-flex align-items-center justify-content-center p-3 border-bottom border-secondary">
          <div style={{ background: '#e8f0ef', borderRadius: 12, padding: '8px 16px', width: '100%', textAlign: 'center' }}>
            <img src={logo} alt="GesTrack" style={{ width: '85%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Liens principaux */}
        <div className="flex-grow-1 py-3">
          {liens.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => lienClass(isActive)}
              style={({ isActive }) => lienStyle(isActive)}
              onClick={() => setOuvert(false)}>
              <FontAwesomeIcon icon={icon} style={{ width: 18 }} />
              <span style={{ fontSize: 14 }}>{label}</span>
            </NavLink>
          ))}

          {/* ── Finances (sous-menu) ── */}
          <button
            className="d-flex align-items-center gap-3 px-4 py-3 w-100 border-0"
            style={{
              background: financesActif ? 'rgba(0,212,170,0.10)' : 'transparent',
              color: financesActif ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 14, cursor: 'pointer',
            }}
            onClick={() => setFinancesOuvert(v => !v)}>
            <FontAwesomeIcon icon={faWallet} style={{ width: 18 }} />
            <span style={{ fontSize: 14 }}>Finances</span>
            <FontAwesomeIcon icon={financesOuvert ? faChevronUp : faChevronDown} className="ms-auto" style={{ fontSize: 10 }} />
          </button>
          {financesOuvert && (
            <div style={{ paddingLeft: 16, borderLeft: '2px solid rgba(0,212,170,0.3)', marginLeft: 28 }}>
              {sousLiensFinances.map(l => <SousLien key={l.to} {...l} />)}
            </div>
          )}

          {/* Statistiques & Rappel */}
          {liensApres.map(({ to, icon, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => lienClass(isActive)}
              style={({ isActive }) => lienStyle(isActive)}
              onClick={() => setOuvert(false)}>
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

        {/* Bas de sidebar */}
        <div className="border-top border-secondary">
          <NavLink to="/guide"
            className={({ isActive }) => lienClass(isActive)}
            style={({ isActive }) => lienStyle(isActive)}
            onClick={() => setOuvert(false)}>
            <FontAwesomeIcon icon={faBookOpen} style={{ width: 18 }} />
            <span style={{ fontSize: 14 }}>Guide</span>
          </NavLink>

          <NavLink to="/apropos"
            className={({ isActive }) => lienClass(isActive)}
            style={({ isActive }) => lienStyle(isActive)}
            onClick={() => setOuvert(false)}>
            <FontAwesomeIcon icon={faInfoCircle} style={{ width: 18 }} />
            <span style={{ fontSize: 14 }}>À propos</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
