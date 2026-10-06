// Page publique — boutique protégée par mot de passe (accessible via /[slug])
import React from 'react';
import defaultProduit from '@/assets/img/defaultProduit.png';

const fmtPrix = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

// ── Carte produit — utilisée à la fois dans la vue groupée par catégorie et la vue à plat
// (recherche / catégorie unique sélectionnée) pour ne pas dupliquer ce balisage deux fois ──
const CarteProduit = ({ p }) => (
  <div className="col-6 col-md-4 col-lg-3">
    <div className="card border-0 shadow-sm h-100 d-flex flex-column" style={{ borderRadius: 14, overflow: 'hidden' }}>
      <img src={p.image || defaultProduit} alt={p.nom}
        style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', background: '#f0f4f8' }} />
      <div className="card-body p-3 d-flex flex-column" style={{ gap: 8 }}>
        <div className="fw-semibold" style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.3 }}>{p.nom}</div>
        <div className="d-flex gap-2 mt-auto">
          {p.stockBoutique !== null && (
            <div className="flex-grow-1 text-center rounded p-2"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="fw-bold" style={{ color: '#16a34a', fontSize: 13 }}>
                {p.stockBoutique} <span style={{ fontSize: 10, fontWeight: 400 }}>{p.uniteBoutique}</span>
              </div>
              <div style={{ fontSize: 10, color: '#16a34a' }}>Boutique</div>
            </div>
          )}
          {p.stockMagasin !== null && (
            <div className="flex-grow-1 text-center rounded p-2"
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div className="fw-bold" style={{ color: '#1e40af', fontSize: 13 }}>
                {p.stockMagasin} <span style={{ fontSize: 10, fontWeight: 400 }}>{p.uniteMagasin}</span>
              </div>
              <div style={{ fontSize: 10, color: '#1e40af' }}>Magasin</div>
            </div>
          )}
        </div>
        {p.prixVente > 0 && (
          <div className="fw-bold" style={{ color: '#00a881', fontSize: 15 }}>
            {fmtPrix(p.prixVente)}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default CarteProduit;
