import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome, faUsers, faFileInvoiceDollar, faStore,
  faBars, faTimes,
  faWarehouse, faChartLine,
  faWallet, faChevronDown, faChevronUp, faBookOpen, faReceipt, faTruck, faCog,
  faCommentDots, faLock, faShieldAlt, faFileContract, faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import logo from '@/assets/img/logo-gt.png';
import { ROUTES, EMAIL_CONTACT, mailto } from '@/utils/url/frontend';
import useIsMobile from '@/hooks/useIsMobile';

const lienStyle = (isActive) => ({
  background: isActive ? 'rgba(0,212,170,0.15)' : 'transparent',
  borderColor: isActive ? '#00d4aa' : 'transparent',
  transition: 'all 0.2s',
});

const lienClass = (isActive) =>
  `d-flex align-items-center gap-3 px-4 py-3 text-decoration-none position-relative ${
    isActive ? 'text-white border-start border-3' : 'text-white-50'
  }`;

// Pages non incluses (version gratuite limitée, ou module absent du plan) : cadenas, et
// ouvrent la fenêtre « Passer à la version Pro » (onPageVerrouillee) au lieu de s'afficher
// pageVerrouillee(to) : page non incluse (version gratuite ou plan sans ce module)
const Sidebar = ({ nbMessages = 0, nbDettes = 0, nbCommandes = 0, pageVerrouillee, onPageVerrouillee }) => {
  const location = useLocation();
  // Mobile : ces pages sont déjà dans la barre du bas (BarreMobile) → retirées du menu ☰
  // (le Tableau de bord reste aussi dans le menu, à la demande)
  const isMobile = useIsMobile();
  const DANS_BARRE_MOBILE = [ROUTES.factures, ROUTES.boutique, ROUTES.dettes, ROUTES.messages];
  const horsBarre = ({ to }) => !isMobile || !DANS_BARRE_MOBILE.includes(to);
  const [ouvert, setOuvert] = useState(false);
  const [financesOuvert, setFinancesOuvert] = useState(location.pathname.startsWith(ROUTES.finances));

  const liens = [
    { to: ROUTES.dashboard,  icon: faHome,             label: 'Tableau de bord' },
    { to: ROUTES.clients,    icon: faUsers,             label: 'Clients' },
    { to: ROUTES.dettes,     icon: faFileInvoiceDollar, label: 'Dettes', badge: nbDettes, couleurBadge: '#f59e0b' },
    { to: ROUTES.factures,   icon: faReceipt,           label: 'Factures' },
    { to: ROUTES.boutique,     icon: faStore,             label: 'Boutique' },
    { to: ROUTES.magasin,      icon: faWarehouse,         label: 'Magasin' },
    { to: ROUTES.fournisseurs, icon: faTruck,             label: 'Fournisseurs', badge: nbCommandes, couleurBadge: '#f97316' },
  ];

  const liensApres = [
    { to: ROUTES.messages, icon: faCommentDots, label: 'Messages', badge: nbMessages },
  ];

  const sousLiensFinances = [
    { to: ROUTES.mesFinances, icon: faChartLine, label: 'Mes Finances' },
    { to: ROUTES.monCompte,       icon: faBookOpen,  label: 'Mon Compte' },
  ];

  const financesActif = location.pathname.startsWith(ROUTES.finances);

  const verrouille = (to) => !!pageVerrouillee?.(to);
  const cliquer = (to) => (e) => {
    setOuvert(false);
    if (verrouille(to)) { e.preventDefault(); onPageVerrouillee?.(); }
  };
  const Cadenas = ({ to }) => (verrouille(to)
    ? <FontAwesomeIcon icon={faLock} className="ms-auto" style={{ fontSize: 11, color: '#f59e0b' }} title="Version Pro" />
    : null);

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
      onClick={cliquer(to)}>
      <FontAwesomeIcon icon={icon} style={{ width: 14, fontSize: 12 }} />
      {label}
      <Cadenas to={to} />
    </NavLink>
  );

  const lienParametres = (
    <NavLink to={ROUTES.parametres}
      className={({ isActive }) => lienClass(isActive)}
      style={({ isActive }) => lienStyle(isActive)}
      onClick={() => setOuvert(false)}>
      <FontAwesomeIcon icon={faCog} style={{ width: 18 }} />
      <span style={{ fontSize: 14 }}>Paramètres</span>
    </NavLink>
  );

  return (
    <>
      {/* Bouton mobile */}
      <button
        className="btn d-lg-none position-fixed m-3"
        style={{ background: '#00d4aa', color: '#fff', borderRadius: 10, zIndex: 1046 }}
        onClick={() => setOuvert(!ouvert)}
        aria-label={nbCommandes > 0 ? `Menu — ${nbCommandes} commande(s) fournisseur en cours` : 'Menu'}>
        <FontAwesomeIcon icon={ouvert ? faTimes : faBars} />
        {/* Commandes fournisseurs en cours : Fournisseurs n'est pas dans la barre du bas */}
        {!ouvert && nbCommandes > 0 && (
          <span className="position-absolute rounded-circle"
            style={{ top: -3, right: -3, width: 11, height: 11, background: '#f97316', border: '2px solid #fff' }} />
        )}
      </button>

      {/* Overlay mobile */}
      {ouvert && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
          onClick={() => setOuvert(false)} />
      )}

      {/* Sidebar */}
      <nav
        className={`d-flex flex-column position-fixed start-0 ${ouvert ? '' : 'd-none d-lg-flex'}`}
        style={{
          // Au-dessus des en-têtes collants des pages (z-index 2 à 10) ; sous les modales (1050+)
          zIndex: 1045,
          top: 0, width: 240, height: '100vh',
          background: 'linear-gradient(180deg, #0f2027 0%, #203a43 100%)',
          transition: 'all 0.3s', overflowY: 'auto',
        }}>

        {/* Logo */}
        <div className="d-flex align-items-center justify-content-center p-3 border-bottom border-secondary">
          <div style={{ background: '#ffffff', borderRadius: 12, padding: '8px 16px', width: '100%', textAlign: 'center' }}>
            <img src={logo} alt="GesTrack" style={{ width: '85%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Liens principaux */}
        <div className="flex-grow-1 py-3">
          {liens.filter(horsBarre).map(({ to, icon, label, badge, couleurBadge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => lienClass(isActive)}
              style={({ isActive }) => lienStyle(isActive)}
              onClick={cliquer(to)}>
              <FontAwesomeIcon icon={icon} style={{ width: 18 }} />
              <span style={{ fontSize: 14 }}>{label}</span>
              <Cadenas to={to} />
              {/* Dettes en cours / commandes fournisseurs en cours */}
              {badge > 0 && (
                <span className="badge rounded-pill ms-auto" style={{ background: couleurBadge, fontSize: 10 }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
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
          {liensApres.filter(horsBarre).map(({ to, icon, label, badge }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => lienClass(isActive)}
              style={({ isActive }) => lienStyle(isActive)}
              onClick={cliquer(to)}>
              <FontAwesomeIcon icon={icon} style={{ width: 18 }} />
              <span style={{ fontSize: 14 }}>{label}</span>
              <Cadenas to={to} />
              {badge > 0 && (
                <span className="badge rounded-pill ms-auto" style={{ background: '#ef4444', fontSize: 10 }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          ))}
          {/* Mobile : Paramètres avec les autres pages, seul le Guide reste en bas */}
          {isMobile && lienParametres}
        </div>

        {/* Bas de sidebar */}
        <div className="border-top border-secondary">
          {!isMobile && lienParametres}

          <NavLink to={ROUTES.guide}
            className={({ isActive }) => lienClass(isActive)}
            style={({ isActive }) => lienStyle(isActive)}
            onClick={() => setOuvert(false)}>
            <FontAwesomeIcon icon={faBookOpen} style={{ width: 18 }} />
            <span style={{ fontSize: 14 }}>Guide</span>
          </NavLink>

          {/* Mobile : contenu du pied de page (retiré des pages pour laisser la place au contenu) */}
          {isMobile && (
            <div className="px-4 pt-2 pb-4" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <span className="d-flex align-items-center gap-1">
                  <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#00d4aa', fontSize: 10 }} />
                  Données sécurisées
                </span>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <NavLink to={ROUTES.conditions} className="text-decoration-none d-flex align-items-center gap-1" style={{ color: 'rgba(255,255,255,0.6)' }}
                  onClick={() => setOuvert(false)}>
                  <FontAwesomeIcon icon={faFileContract} style={{ fontSize: 10 }} />
                  Conditions
                </NavLink>
                {/* Écrire à l'administrateur de GesTrack (par e-mail) */}
                <a href={mailto(EMAIL_CONTACT)} className="text-decoration-none d-flex align-items-center gap-1" style={{ color: 'rgba(255,255,255,0.6)' }}
                  title="Écrire à l'administrateur par e-mail">
                  <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: 10 }} />
                  Contact
                </a>
              </div>
              <div>
                <span className="fw-semibold text-white">GesTrack</span>{' '}
                <span style={{ color: '#00d4aa' }}>suivi et controle</span>
              </div>
              <div>© 2026 Tous droits réservés</div>
            </div>
          )}

        </div>
      </nav>
    </>
  );
};

export default Sidebar;
