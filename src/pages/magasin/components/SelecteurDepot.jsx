// Choix du dépôt affiché dans la page Magasin (plusieurs dépôts : plan A.3)
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faLayerGroup, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from '@/utils/url/frontend';

// options : [{ cle: 'principal' | id, nom, nb }] ; valeur : cle choisie ou 'tous'
const SelecteurDepot = ({ options, valeur, onChoisir, total, peutAjouter }) => {
  const pastille = (cle, libelle, nb, icone) => {
    const actif = valeur === cle;
    return (
      <button type="button" key={cle} onClick={() => onChoisir(cle)} aria-pressed={actif}
        className="btn btn-sm rounded-pill flex-shrink-0 d-flex align-items-center gap-2 fw-semibold"
        style={actif
          ? { background: '#0f2027', color: '#fff', minHeight: 38 }
          : { background: 'var(--bs-body-bg)', color: 'var(--bs-body-color)', border: '1px solid var(--bs-border-color)', minHeight: 38 }}>
        <FontAwesomeIcon icon={icone} style={{ color: actif ? '#00d4aa' : '#0891b2' }} />
        {libelle}
        <span className="badge rounded-pill" style={{ background: actif ? 'rgba(255,255,255,0.18)' : 'var(--bs-secondary-bg)', color: 'inherit' }}>{nb}</span>
      </button>
    );
  };
  return (
    <div className="d-flex gap-2 overflow-auto pb-2 mb-2 flex-shrink-0" style={{ scrollbarWidth: 'none' }} role="group" aria-label="Dépôt affiché">
      {options.map(o => pastille(o.cle, o.nom, o.nb, faWarehouse))}
      {options.length > 1 && pastille('tous', 'Tous les dépôts', total, faLayerGroup)}
      {peutAjouter && (
        <Link to={ROUTES.parametresOnglet('depots')} className="btn btn-sm rounded-pill flex-shrink-0 d-flex align-items-center gap-1"
          style={{ minHeight: 38, color: '#0891b2', border: '1px dashed #0891b2' }}>
          <FontAwesomeIcon icon={faPlus} /> Dépôt
        </Link>
      )}
    </div>
  );
};

export default SelecteurDepot;
