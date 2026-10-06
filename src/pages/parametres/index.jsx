// Page Paramètres — page parente : titre, menu des onglets et affichage de l'onglet choisi.
// Chaque onglet est une sous-page dans son propre dossier (apparences, applications, rappels,
// vitrine, images, exports).
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faBars, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import useIsMobile from '@/hooks/useIsMobile';
import MenuParametres from '@/pages/parametres/components/MenuParametres';
import Apparences from '@/pages/parametres/apparences';
import Applications from '@/pages/parametres/applications';
import Rappels from '@/pages/parametres/rappels';
import SectionVitrine from '@/pages/parametres/vitrine';
import SectionImages from '@/pages/parametres/images';
import SectionExport from '@/pages/parametres/exports';

const Parametres = () => {
  const [onglet, setOnglet] = useState('apparence');
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const isMobile = useIsMobile(768);

  const choisir = (id) => { setOnglet(id); setMenuMobileOuvert(false); };
  // Contenu de chaque onglet. Les deux listes d'export rendent le même composant :
  // React le conserve en passant de l'une à l'autre (listes chargées et cases cochées gardées).
  const contenus = {
    'apparence':       <Apparences />,
    'application':     <Applications />,
    'rappels':         <Rappels />,
    'vitrine':         <SectionVitrine />,
    'images':          <SectionImages />,
    'export-clients':  <SectionExport vue="clients" />,
    'export-produits': <SectionExport vue="produits" />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faCog} style={{ color: '#00d4aa' }} />
            Paramètres
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
        <div style={{ flexShrink: 0, width: isMobile ? '100%' : 220 }}>
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
          {(!isMobile || menuMobileOuvert) && <MenuParametres onglet={onglet} onChoisir={choisir} />}
        </div>

        {/* ── Contenu de l'onglet ── */}
        <div style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
            {contenus[onglet] || contenus.apparence}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
