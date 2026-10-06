// Menu vertical de la page Paramètres (onglets + sous-menu Export repliable)
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore, faImages, faPalette, faBell, faFileExport, faChevronDown,
  faChevronUp, faMobileAlt, faUsers,
} from '@fortawesome/free-solid-svg-icons';

export const ONGLETS = [
  { id: 'apparence',   label: 'Apparence',   icon: faPalette },
  { id: 'application', label: 'Application', icon: faMobileAlt },
  { id: 'rappels',     label: 'Rappels',     icon: faBell },
  { id: 'vitrine',     label: 'Vitrine',     icon: faStore },
  { id: 'images',      label: 'Images',      icon: faImages },
  { id: 'export',      label: 'Export',      icon: faFileExport, enfants: [
    { id: 'export-clients',  label: 'Liste clients',  icon: faUsers },
    { id: 'export-produits', label: 'Liste produits', icon: faStore },
  ] },
];

// onChoisir(id) est appelé quand un onglet (ou un sous-onglet) est sélectionné
const MenuParametres = ({ onglet, onChoisir }) => {
  // Sous-menus repliables (ex. Export) — ouverts/fermés manuellement, comme Finances dans la sidebar
  const [sousMenusOuverts, setSousMenusOuverts] = useState({});

  return (
    <div className="shadow-sm" style={{
      borderRadius: 14, overflow: 'hidden',
      background: 'linear-gradient(180deg, #0f2027 0%, #203a43 100%)',
    }}>
      {ONGLETS.map(({ id, label, icon, enfants }) => {
        // Un onglet parent (Export) est actif quand l'un de ses sous-onglets l'est
        const actif = enfants ? enfants.some(e => e.id === onglet) : onglet === id;
        const ouvert = !!sousMenusOuverts[id];
        return (
        <React.Fragment key={id}>
        <button
          className="btn d-flex align-items-center gap-2 w-100 text-start"
          style={{
            borderRadius: 0,
            borderLeft: actif ? '3px solid #00d4aa' : '3px solid transparent',
            background: actif ? 'rgba(0,212,170,0.15)' : 'transparent',
            color: actif ? '#fff' : 'rgba(255,255,255,0.55)',
            fontWeight: actif ? 600 : 400,
            padding: '20px 16px',
            fontSize: 'var(--txt-md)',
            transition: 'all 0.2s',
          }}
          onClick={() => {
            // Parent : ouvre / referme simplement son sous-menu (le menu mobile reste ouvert)
            if (enfants) { setSousMenusOuverts(prev => ({ ...prev, [id]: !prev[id] })); return; }
            onChoisir(id);
          }}>
          <FontAwesomeIcon icon={icon} style={{ width: 16, flexShrink: 0 }} />
          {label}
          {enfants && (
            <FontAwesomeIcon icon={ouvert ? faChevronUp : faChevronDown} className="ms-auto" style={{ fontSize: 11 }} />
          )}
        </button>
        {/* Sous-menu — même style que Finances dans la barre latérale */}
        {enfants && ouvert && (
          <div style={{ marginLeft: 26, borderLeft: '1px solid rgba(255,255,255,0.15)', paddingBottom: 6 }}>
            {enfants.map(e => (
              <button key={e.id}
                className="btn d-flex align-items-center gap-2 w-100 text-start"
                style={{
                  borderRadius: '0 8px 8px 0',
                  background: onglet === e.id ? 'rgba(0,212,170,0.15)' : 'transparent',
                  color: onglet === e.id ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontWeight: onglet === e.id ? 600 : 400,
                  padding: '10px 14px',
                  fontSize: 'var(--txt-base)',
                }}
                onClick={() => { onChoisir(e.id); }}>
                <FontAwesomeIcon icon={e.icon} style={{ width: 14, flexShrink: 0 }} />
                {e.label}
              </button>
            ))}
          </div>
        )}
        </React.Fragment>
        );
      })}
    </div>
  );
};

export default MenuParametres;
