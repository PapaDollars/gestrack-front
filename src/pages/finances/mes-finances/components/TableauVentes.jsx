// Tableau des ventes regroupées (jour / semaine / mois)
import React, { useMemo } from 'react';
import { fmtDH } from '@/utils/pdf';
import { cleGroupe, labelGroupe } from '@/pages/finances/mes-finances/utils';

// ── Composant tableau groupé ──────────────────────────────────────────────
const TableauVentes = ({ ventes, groupement, formatMontant, couleur, offsetSticky = 0 }) => {
  const groupes = useMemo(() => {
    const map = {};
    ventes.forEach(v => {
      const cle = cleGroupe(v.timestamp, groupement);
      if (!map[cle]) map[cle] = { cle, entrees: [], total: 0, nbTx: 0 };
      map[cle].entrees.push(v);
      map[cle].total += v.montant;
      map[cle].nbTx++;
    });
    return Object.values(map).sort((a, b) => b.cle > a.cle ? 1 : -1);
  }, [ventes, groupement]);

  if (ventes.length === 0) {
    return <p className="text-muted text-center py-4 small">Aucune vente sur cette période</p>;
  }

  return (
    <div>
      {groupes.map(g => (
        <div key={g.cle} className="mb-3">
          {/* En-tête groupe — collant sous l'en-tête de la carte ; borné à son groupe,
              il est poussé vers le haut et remplacé par celui du groupe suivant. */}
          <div className="d-flex align-items-center justify-content-between px-3 py-2 rounded-top"
            style={{ background: 'var(--bs-secondary-bg)', borderBottom: `3px solid ${couleur}`,
              position: 'sticky', top: offsetSticky, zIndex: 2 }}>
            <span className="fw-semibold small" style={{ color: 'var(--bs-body-color)' }}>{labelGroupe(g.cle, groupement)}</span>
            <span className="fw-bold" style={{ color: couleur }}>{formatMontant(g.total)}</span>
          </div>
          {/* Détail */}
          <div className="border rounded-bottom" style={{ borderTop: 'none', borderColor: 'var(--bs-border-color)' }}>
            {g.entrees.map((v, i) => (
              <div key={v.id} className="d-flex align-items-center gap-3 px-3 py-2"
                style={{ borderBottom: i < g.entrees.length - 1 ? '1px solid #f8fafc' : 'none', fontSize: 'var(--txt-md)' }}>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <span className="fw-semibold text-truncate" style={{ color: v.type === 'remise' ? '#dc2626' : 'var(--bs-body-color)' }}>
                      {v.produitNom}
                    </span>
                    {/* Produit supprimé depuis la vente : la vente reste comptée */}
                    {v.produitSupprime && (
                      <span className="badge rounded-pill flex-shrink-0" title="Ce produit a été supprimé, ses ventes restent comptées"
                        style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 'var(--txt-xs)' }}>
                        supprimé
                      </span>
                    )}
                    {/* Ancienne vente sans prix d'achat enregistré : non comptée dans le bénéfice */}
                    {v.prixAchatInconnu && (
                      <span className="badge rounded-pill flex-shrink-0" title="Prix d'achat inconnu : cette vente compte dans le chiffre d'affaires mais pas dans le bénéfice"
                        style={{ background: '#fef3c7', color: '#b45309', fontSize: 'var(--txt-xs)' }}>
                        prix d'achat inconnu
                      </span>
                    )}
                  </div>
                  <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>
                    {v.categorie ? `${v.categorie} · ` : ''}{v.details || 'Sortie'}
                  </div>
                </div>
                <div className="text-end flex-shrink-0">
                  <div className="fw-bold" style={{ color: v.type === 'remise' ? '#dc2626' : couleur }}>{formatMontant(v.montant)}</div>
                  <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>
                    {fmtDH(v.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {/* Pied */}
            <div className="px-3 py-1 d-flex justify-content-between"
              style={{ background: 'var(--bs-secondary-bg)', borderTop: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-base)' }}>
              <span className="text-muted">{g.nbTx} transaction(s)</span>
              <span className="fw-semibold" style={{ color: couleur }}>{formatMontant(g.total)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableauVentes;
