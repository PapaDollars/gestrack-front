// Carte produit (produits récents boutique / magasin)
import React from 'react';
import { afficherStockDetails } from '@/services/unites';
import defaultProduit from '@/assets/img/defaultProduit.png';

// ── Carte produit ─────────────────────────────────────────────────────────────
const CarteProduit = ({ produit, mobile }) => {
  const stockPs = produit.stockEnPieces ?? produit.quantiteStock ?? 0;
  const stockFaible = stockPs <= 0;

  if (mobile) {
    return (
      <div className="d-flex align-items-center gap-3 py-2 px-1"
        style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
        <div style={{ width: 54, height: 54, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--bs-secondary-bg)' }}>
          <img src={produit.image || defaultProduit} alt={produit.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = defaultProduit; }} />
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-semibold text-truncate small" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
          <div className="fw-bold" style={{ color: '#00d4aa', fontSize: 'var(--txt-md)' }}>
            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(produit.prixVente || 0)}
          </div>
        </div>
        <span className="badge flex-shrink-0" style={{ fontSize: 'var(--txt-xs)', background: stockFaible ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: stockFaible ? '#ef4444' : '#10b981' }}>
          {afficherStockDetails(produit)}
        </span>
      </div>
    );
  }

  return (
    <div className="card flex-shrink-0 shadow"
      style={{ width: 145, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--bs-border-color)', background: 'var(--bs-tertiary-bg)' }}>
      <div style={{ height: 90, overflow: 'hidden', background: 'var(--bs-secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={produit.image || defaultProduit} alt={produit.nom}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = defaultProduit; }} />
      </div>
      <div className="p-2">
        <div className="fw-semibold text-truncate small" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
        <div className="fw-bold" style={{ color: '#00d4aa', fontSize: 'var(--txt-md)' }}>
          {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(produit.prixVente || 0)}
        </div>
        <span className="badge mt-1" style={{ fontSize: 'var(--txt-xs)', background: stockFaible ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: stockFaible ? '#ef4444' : '#10b981' }}>
          {afficherStockDetails(produit)}
        </span>
      </div>
    </div>
  );
};

export default CarteProduit;
