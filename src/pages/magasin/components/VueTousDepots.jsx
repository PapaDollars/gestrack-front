// Magasin › « Tous les dépôts » : chaque produit avec son stock dans chaque dépôt et le total.
// Les copies d'un même produit (une par dépôt) sont regroupées sur une ligne (familleId).
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { afficherStockDetails } from '@/services/unites';
import { imageOptimisee } from '@/utils/images';

const cleDepot = (p) => p.depotId || 'principal';

// colonnes : [{ cle: 'principal' | id, nom }]
const VueTousDepots = ({ produits, colonnes, onChoisirDepot }) => {
  const lignes = useMemo(() => {
    const groupes = new Map();
    produits.forEach((p) => {
      const cle = p.familleId || p.id;
      if (!groupes.has(cle)) groupes.set(cle, { cle, produit: p, parDepot: {}, total: 0 });
      const g = groupes.get(cle);
      // L'original (Dépôt principal) sert de modèle à la ligne quand il existe
      if (!p.depotId) g.produit = p;
      g.parDepot[cleDepot(p)] = p;
      g.total += p.stockEnPieces ?? 0;
    });
    return [...groupes.values()].sort((a, b) => (a.produit.nom || '').localeCompare(b.produit.nom || '', 'fr', { sensitivity: 'base' }));
  }, [produits]);

  if (lignes.length === 0) {
    return <div className="text-center py-5 text-muted">Aucun produit</div>;
  }

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="table table-hover align-middle mb-0" style={{ minWidth: 360 + colonnes.length * 120 }}>
          <thead>
            <tr>
              <th className="small text-muted fw-semibold" style={{ position: 'sticky', left: 0, background: 'var(--bs-body-bg)', zIndex: 1 }}>Produit</th>
              {colonnes.map(c => (
                <th key={c.cle} className="small fw-semibold text-end">
                  <button type="button" className="btn btn-link p-0 small fw-semibold text-decoration-none" style={{ color: '#00806a' }}
                    title={`Ouvrir ${c.nom}`} onClick={() => onChoisirDepot(c.cle)}>
                    {c.nom}
                  </button>
                </th>
              ))}
              <th className="small fw-bold text-end" style={{ color: 'var(--bs-body-color)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({ cle, produit, parDepot, total }) => (
              <tr key={cle}>
                <td style={{ position: 'sticky', left: 0, background: 'var(--bs-body-bg)', zIndex: 1, maxWidth: 240 }}>
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    {produit.image
                      ? <img src={imageOptimisee(produit.image, 100)} alt="" loading="lazy" className="rounded-2 flex-shrink-0" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                      : <span className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 36, height: 36, background: 'var(--bs-secondary-bg)' }}>
                          <FontAwesomeIcon icon={faBoxOpen} className="text-muted" />
                        </span>}
                    <div className="min-w-0">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
                      {produit.categorie && <div className="small text-muted text-truncate">{produit.categorie}</div>}
                    </div>
                  </div>
                </td>
                {colonnes.map(c => {
                  const p = parDepot[c.cle];
                  const ps = p ? (p.stockEnPieces ?? 0) : null;
                  return (
                    <td key={c.cle} className="text-end small text-nowrap"
                      style={{ color: ps === null ? 'var(--bs-secondary-color)' : ps === 0 ? '#dc2626' : 'var(--bs-body-color)' }}>
                      {ps === null ? '—' : afficherStockDetails(p)}
                    </td>
                  );
                })}
                <td className="text-end fw-bold text-nowrap" style={{ color: '#00806a' }}>
                  {afficherStockDetails({ ...produit, stockEnPieces: total })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VueTousDepots;
