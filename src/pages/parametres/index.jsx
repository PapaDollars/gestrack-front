// Page Paramètres — page parente : titre, menu des onglets et affichage de l'onglet choisi.
// Chaque onglet est une sous-page dans son propre dossier (apparences, applications, rappels,
// vitrine, images, exports).
import React, { useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faBars, faChevronDown, faChevronUp, faLock } from '@fortawesome/free-solid-svg-icons';
import { moduleExclu } from '@/utils/acces';
import { ROUTES } from '@/utils/url/frontend';
import useIsMobile from '@/hooks/useIsMobile';
import MenuParametres, { ONGLETS } from '@/pages/parametres/components/MenuParametres';
import Apparences from '@/pages/parametres/apparences';
import Applications from '@/pages/parametres/applications';
import Rappels from '@/pages/parametres/rappels';
import Profil from '@/pages/parametres/mon-compte/profil';
import Securite from '@/pages/parametres/mon-compte/securite';
import ParametresFactures from '@/pages/parametres/factures';
import SectionVitrine from '@/pages/parametres/vitrine';
import SectionImages from '@/pages/parametres/images';
import SectionExport from '@/pages/parametres/exports';

// Libellés de l'onglet affiché : [parent, sous-onglet] ou [onglet]
const cheminOnglet = (id) => {
  for (const o of ONGLETS) {
    if (o.id === id) return [o.label];
    const enfant = o.enfants?.find(e => e.id === id);
    if (enfant) return [o.label, enfant.label];
  }
  return [];
};

const Parametres = () => {
  // Onglet dans l'adresse (?onglet=compte-profil…) : lien direct depuis la barre du haut, et
  // l'onglet reste affiché après actualisation de la page
  const [params, setParams] = useSearchParams();
  const onglet = params.get('onglet') || 'apparence';
  const setOnglet = (id) => setParams({ onglet: id }, { replace: true });
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const isMobile = useIsMobile(768);
  // Catalogue non inclus (plan A.1 ou version gratuite) : onglet Vitrine verrouillé
  const { acces } = useOutletContext() || {};
  const vitrineExclue = moduleExclu(acces, 'catalogue');

  const choisir = (id) => { setOnglet(id); setMenuMobileOuvert(false); };
  // Contenu de chaque onglet. Les deux listes d'export rendent le même composant :
  // React le conserve en passant de l'une à l'autre (listes chargées et cases cochées gardées).
  const contenus = {
    'apparence':       <Apparences />,
    'compte-profil':   <Profil />,
    'compte-securite': <Securite />,
    'application':     <Applications />,
    'rappels':         <Rappels />,
    'factures':        <ParametresFactures />,
    'vitrine':         vitrineExclue ? (
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-4 text-center">
          <FontAwesomeIcon icon={faLock} size="2x" className="mb-3" style={{ color: '#d97706' }} />
          <h6 className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>Page internet de vos produits non incluse dans votre formule</h6>
          <p className="text-muted small mb-3">
            La page internet où vos clients voient vos produits (ouverte à tous ou avec un mot de passe) est disponible à partir du plan A.2.
          </p>
          <Link to={ROUTES.tarifs} className="btn text-white" style={{ background: '#00d4aa', borderRadius: 10 }}>Voir les tarifs</Link>
        </div>
      </div>
    ) : <SectionVitrine />,
    'images':          <SectionImages />,
    'export-clients':  <SectionExport vue="clients" />,
    'export-produits': <SectionExport vue="produits" />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          {/* Fil d'Ariane : Paramètres / Onglet (/ Sous-onglet), en plus petit après le titre */}
          <h4 className="fw-bold mb-1 d-flex align-items-center flex-wrap gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faCog} style={{ color: '#00d4aa' }} />
            Paramètres
            {cheminOnglet(onglet).map(label => (
              <span key={label} className="d-inline-flex align-items-center gap-2 fw-semibold"
                style={{ fontSize: 'var(--txt-lg)', color: 'var(--bs-secondary-color)' }}>
                <span style={{ color: '#00d4aa' }}>/</span>{label}
              </span>
            ))}
          </h4>
        </div>
      </div>

      {/* Rangée manuelle (pas la grille Bootstrap) : sur mobile, .row/.col-12 passent sur deux
          lignes — chaque ligne prend alors sa propre hauteur de contenu au lieu de se partager
          la hauteur disponible, donc le "height: 100%" du contenu ne pointait plus vers rien
          de fini et son scroll interne ne se déclenchait jamais. */}
      <div className="d-flex gap-3 flex-grow-1"
        style={{ flexDirection: isMobile ? 'column' : 'row', minHeight: 0, overflow: 'hidden' }}>
        {/* ── Menu vertical ── */}
        {/* Colonne bornée en hauteur : le menu défile s'il est plus haut que l'espace disponible
            (grand écran : hauteur de la page ; mobile : 55 % de l'écran, le contenu reste visible dessous) */}
        <div style={{ flexShrink: 0, width: isMobile ? '100%' : 220, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Bouton compact — mobile uniquement : évite que le menu prenne toute la
              hauteur comme sur grand écran, replié par défaut derrière "Menu" */}
          {isMobile && (
            <button type="button"
              className="btn d-flex align-items-center gap-2 w-100 mb-2"
              style={{
                background: 'linear-gradient(180deg, #0f2027 0%, #203a43 100%)',
                color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 'var(--txt-md)',
              }}
              onClick={() => setMenuMobileOuvert(v => !v)}>
              <FontAwesomeIcon icon={faBars} style={{ fontSize: 14 }} />
              <span className="fw-semibold">Menu</span>
              <FontAwesomeIcon icon={menuMobileOuvert ? faChevronUp : faChevronDown}
                className="ms-auto" style={{ fontSize: 12 }} />
            </button>
          )}
          {(!isMobile || menuMobileOuvert) && (
            <div style={{ minHeight: 0, overflowY: 'auto', overflowX: 'hidden', borderRadius: 14, maxHeight: isMobile ? '55vh' : undefined }}>
              <MenuParametres onglet={onglet} onChoisir={choisir} />
            </div>
          )}
        </div>

        {/* ── Contenu de l'onglet ── */}
        <div style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
          {/* paddingBottom : un peu d'air sous les boutons en bas de chaque onglet */}
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingBottom: '1.5rem' }}>
            {contenus[onglet] || contenus.apparence}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
