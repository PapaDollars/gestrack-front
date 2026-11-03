// Carte « Stock faible » (boutique ou magasin) : les produits les plus bas en premier, avec
// leur image (déjà chargée avec la liste : aucune lecture en plus), limités à MAX_AFFICHES —
// la dernière case est la tuile « Voir plus » (page complète)
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { afficherStockCarte } from '@/services/unites';
import TuileVoirPlus from '@/pages/dashboard/components/TuileVoirPlus';
import { imageOptimisee } from '@/utils/images';
import defaultProduit from '@/assets/img/defaultProduit.png';

const MAX_AFFICHES = 15; // + la tuile « Voir plus » = 15 cases
const stockDe = (p) => p.stockEnPieces ?? p.quantiteStock ?? 0;

const SectionStockFaible = ({ titre, icone, produits, lien }) => (
  <div className="card border-0 shadow-sm h-100 d-flex flex-column" style={{ borderRadius: 14, borderLeft: '4px solid #ef4444' }}>
    <div className="card-header bg-transparent border-0 pt-3 px-3 pb-0">
      <h6 className="fw-semibold mb-0 text-danger d-flex align-items-center gap-2" style={{ fontSize: 'var(--txt-lg)' }}>
        <FontAwesomeIcon icon={icone} />
        {titre} ({produits.length})
      </h6>
    </div>
    <div className="card-body px-3 pb-3 flex-grow-1">
      {produits.length === 0 ? (
        <p className="text-muted small text-center py-3 mb-0">Aucun produit en stock faible.</p>
      ) : (
        <div className="row g-2">
          {[...produits].sort((a, b) => stockDe(a) - stockDe(b)).slice(0, MAX_AFFICHES).map(p => (
            <div key={p.id} className="col-12 col-sm-6">
              <div className="d-flex align-items-center gap-2 p-2 rounded"
                style={{ background: 'rgba(239,68,68,0.1)', fontSize: 'var(--txt-base)' }}>
                <img src={imageOptimisee(p.image, 80) || defaultProduit} alt="" loading="lazy"
                  className="flex-shrink-0 rounded-2" style={{ width: 34, height: 34, objectFit: 'cover', background: 'var(--bs-secondary-bg)' }}
                  onError={e => { e.target.src = defaultProduit; }} />
                <span className="fw-semibold text-truncate me-auto" style={{ color: '#991b1b' }}>{p.nom}</span>
                <span className="badge bg-danger ms-1 flex-shrink-0">{afficherStockCarte(p)}</span>
              </div>
            </div>
          ))}
          <div className="col-12 col-sm-6">
            <TuileVoirPlus to={lien} couleur="#ef4444" ligne
              detail={produits.length > MAX_AFFICHES ? `${produits.length - MAX_AFFICHES} autres` : null} />
          </div>
        </div>
      )}
    </div>
  </div>
);

export default SectionStockFaible;
