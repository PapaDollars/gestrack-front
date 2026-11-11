// Barre de navigation du bas (mobile / tablette, < 992 px) — raccourcis vers les pages les plus
// utilisées au quotidien. Le menu ☰ (Sidebar) reste en haut et donne accès à tout le reste.
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faReceipt, faStore, faFileInvoiceDollar, faUsers, faLock } from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from '@/utils/url/frontend';

export const HAUTEUR_BARRE_MOBILE = 60;

const VERT = '#00a881';
const GRIS = 'var(--bs-secondary-color)';

const Badge = ({ nombre, couleur }) => (nombre > 0 ? (
  <span className="badge rounded-pill position-absolute"
    style={{ top: -6, right: -12, background: couleur, fontSize: 9, padding: '3px 5px' }}>
    {nombre > 99 ? '99+' : nombre}
  </span>
) : null);

// pageVerrouillee(to) / onPageVerrouillee : mêmes règles que le menu (version gratuite, plan)
const BarreMobile = ({ nbDettes = 0, pageVerrouillee, onPageVerrouillee }) => {
  const verrouille = (to) => !!pageVerrouillee?.(to);
  const cliquer = (to) => (e) => {
    if (verrouille(to)) { e.preventDefault(); onPageVerrouillee?.(); }
  };

  const Lien = ({ to, icone, libelle, badge, couleurBadge }) => (
    <NavLink to={to} onClick={cliquer(to)} aria-label={libelle}
      className="d-flex flex-column align-items-center justify-content-center gap-1 flex-grow-1 text-decoration-none"
      style={({ isActive }) => ({ flexBasis: 0, height: '100%', fontSize: 11, color: isActive ? VERT : GRIS, fontWeight: isActive ? 700 : 500 })}>
      <span className="position-relative">
        <FontAwesomeIcon icon={icone} style={{ fontSize: 19 }} />
        {verrouille(to)
          ? <FontAwesomeIcon icon={faLock} className="position-absolute" style={{ top: -4, right: -10, fontSize: 9, color: '#f59e0b' }} />
          : <Badge nombre={badge} couleur={couleurBadge} />}
      </span>
      {libelle}
    </NavLink>
  );

  return (
    <nav className="d-lg-none"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        zIndex: 1035, // sous le menu ☰ ouvert (1040-1046) et les fenêtres (1050+)
        background: 'var(--bs-body-bg)', boxShadow: '0 -2px 14px rgba(15,23,42,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div className="d-flex align-items-stretch" style={{ height: HAUTEUR_BARRE_MOBILE }}>
        <Lien to={ROUTES.dashboard} icone={faHome} libelle="Accueil" />
        <Lien to={ROUTES.clients} icone={faUsers} libelle="Clients" />

        {/* Factures : gros bouton central, relevé au-dessus de la barre */}
        <NavLink to={ROUTES.factures} onClick={cliquer(ROUTES.factures)} aria-label="Factures"
          className="d-flex flex-column align-items-center flex-grow-1 text-decoration-none"
          style={({ isActive }) => ({ flexBasis: 0, fontSize: 11, color: isActive ? VERT : GRIS, fontWeight: isActive ? 700 : 500 })}>
          {({ isActive }) => (
            <>
              <span className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 58, height: 58, marginTop: -20,
                  background: 'linear-gradient(135deg, #00d4aa, #00a881)', color: '#fff',
                  border: '4px solid var(--bs-body-bg)',
                  boxShadow: isActive ? '0 6px 18px rgba(0,168,129,0.6)' : '0 4px 12px rgba(0,168,129,0.4)',
                }}>
                <FontAwesomeIcon icon={faReceipt} style={{ fontSize: 21 }} />
              </span>
              <span style={{ marginTop: 1 }}>Factures</span>
            </>
          )}
        </NavLink>

        <Lien to={ROUTES.boutique} icone={faStore} libelle="Boutique" />
        <Lien to={ROUTES.dettes} icone={faFileInvoiceDollar} libelle="Dettes" badge={nbDettes} couleurBadge="#f59e0b" />
      </div>
    </nav>
  );
};

export default BarreMobile;
