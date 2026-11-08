// Barre du bas des pages publiques (mobile) : Accueil · Catégories (gros bouton central) · Contact
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faTableCellsLarge } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const VERT = '#00a881';
const GRIS = '#64748b';

const BoutonLateral = ({ icone, libelle, actif, couleurIcone, onClick }) => (
  <button type="button" onClick={onClick} aria-label={libelle}
    className="btn border-0 d-flex flex-column align-items-center justify-content-center gap-1 flex-grow-1 py-2"
    style={{ color: actif ? VERT : GRIS, fontSize: 11, fontWeight: actif ? 700 : 500, flexBasis: 0 }}>
    <FontAwesomeIcon icon={icone} style={{ fontSize: 20, color: couleurIcone || undefined }} />
    {libelle}
  </button>
);

const BarreNavigation = ({ actif, onAccueil, onCategories, onContact }) => (
  <nav className="d-md-none"
    style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1045,
      background: '#fff', boxShadow: '0 -2px 14px rgba(15,23,42,0.10)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
    <div className="d-flex align-items-end" style={{ height: 62 }}>
      <BoutonLateral icone={faHouse} libelle="Accueil" actif={actif === 'accueil'} onClick={onAccueil} />

      {/* Bouton central plus grand, légèrement relevé au-dessus de la barre */}
      <div className="d-flex flex-column align-items-center flex-grow-1" style={{ flexBasis: 0 }}>
        <button type="button" onClick={onCategories} aria-label="Catégories"
          className="btn border-0 rounded-circle d-flex align-items-center justify-content-center"
          style={{
            width: 60, height: 60, marginTop: -22,
            background: 'linear-gradient(135deg, #00d4aa, #00a881)', color: '#fff',
            boxShadow: '0 6px 16px rgba(0,168,129,0.45)', border: '4px solid #fff',
          }}>
          <FontAwesomeIcon icon={faTableCellsLarge} style={{ fontSize: 22 }} />
        </button>
        <span className="pb-2" style={{ fontSize: 11, marginTop: 2, color: actif === 'categories' ? VERT : GRIS, fontWeight: actif === 'categories' ? 700 : 500 }}>
          Catégories
        </span>
      </div>

      <BoutonLateral icone={faWhatsapp} libelle="Contact" couleurIcone="#25d366" onClick={onContact} />
    </div>
  </nav>
);

export default BarreNavigation;
