// Une ligne produit de l'écran de comptage : statut en couleur, bouton « Conforme » rapide,
// et saisie dépliée au toucher
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import defaultProduit from '@/assets/img/defaultProduit.png';
import { imageOptimisee } from '@/utils/images';
import SaisieComptage from '@/pages/inventaire/components/SaisieComptage';
import { STATUTS, stockEnPs, formatPs, formatEcart, dateHeure } from '@/pages/inventaire/utils';

const LigneInventaire = ({
  produit, statut, comptage, ouvert, enCours, onBasculer, onConforme, onEnregistrer, onIgnorer, onRetirer,
}) => {
  const s = STATUTS[statut];
  const aCompter = statut === 'a_compter';
  const ecart = comptage?.statut === 'compte' ? comptage.compte - comptage.theorique : 0;

  let sousTitre;
  if (aCompter) sousTitre = `À compter · stock ${formatPs(produit, stockEnPs(produit))}`;
  else if (statut === 'ignore') sousTitre = 'Ignoré · stock gardé tel quel';
  else if (statut === 'conforme') sousTitre = `Conforme · ${formatPs(produit, comptage.compte)}`;
  else sousTitre = `${s.libelle} ${formatEcart(produit, ecart)} · compté ${formatPs(produit, comptage.compte)}`;

  return (
    <div id={`inv-${produit.id}`} className="card border-0 shadow-sm"
      style={{
        borderRadius: 14,
        border: ouvert ? '2px solid #00d4aa' : '2px solid transparent',
        opacity: aCompter && !ouvert ? 0.72 : 1,
        transition: 'opacity .2s, border-color .2s',
      }}>
      <div className="card-body p-2 px-3">
        <div className="d-flex align-items-center gap-3">
          <button type="button" className="btn p-0 border-0 d-flex align-items-center gap-3 text-start flex-grow-1 min-w-0"
            aria-expanded={ouvert} onClick={onBasculer}>
            <span className="position-relative flex-shrink-0">
              <img src={imageOptimisee(produit.image, 120) || defaultProduit} alt="" loading="lazy"
                style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', filter: aCompter && !ouvert ? 'grayscale(0.7)' : 'none' }} />
              {!aCompter && (
                <span className="position-absolute d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 20, height: 20, right: -6, bottom: -6, background: s.fond, color: s.texte, fontSize: 10, border: '2px solid var(--bs-body-bg)' }}>
                  {statut === 'conforme' ? <FontAwesomeIcon icon={faCheck} /> : statut === 'ignore' ? '–' : '!'}
                </span>
              )}
            </span>
            <span className="d-flex flex-column min-w-0">
              <span className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</span>
              <span className="small text-truncate" style={{ color: aCompter ? 'var(--bs-secondary-color)' : s.fonce }}>{sousTitre}</span>
              {comptage?.at && (
                <span className="text-muted" style={{ fontSize: 'var(--txt-xs)' }}>
                  {dateHeure(comptage.at)}{comptage.par ? ` · par ${comptage.par}` : ''}
                </span>
              )}
            </span>
            <FontAwesomeIcon icon={ouvert ? faChevronUp : faChevronDown} className="ms-auto text-muted flex-shrink-0" />
          </button>
          {aCompter && !ouvert && (
            <button type="button" className="btn btn-sm fw-semibold flex-shrink-0 d-flex align-items-center gap-1"
              style={{ minHeight: 44, background: '#dcfce7', color: '#166534', borderRadius: 12 }}
              disabled={enCours} onClick={onConforme} aria-label={`${produit.nom} : stock conforme`}>
              {enCours ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
              Conforme
            </button>
          )}
        </div>
        {ouvert && (
          <SaisieComptage produit={produit} comptage={comptage} enCours={enCours}
            onEnregistrer={onEnregistrer} onIgnorer={onIgnorer} onRetirer={onRetirer} />
        )}
      </div>
    </div>
  );
};

export default LigneInventaire;
