// Page publique — catalogue produits boutique (accessible sans connexion)
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import defaultProduit from '@/assets/img/defaultProduit.png';
import { fmtPrix } from '@/pages/public/catalogue/utils';

// ── Carte produit — utilisée à la fois dans la vue groupée par catégorie et la vue à plat
// (recherche / catégorie unique sélectionnée) pour ne pas dupliquer ce balisage deux fois ──
const CarteProduit = ({ p, onOuvrir, onReserver }) => (
  <div className="col-6 col-md-4 col-lg-3">
    <div
      className="card border-0 shadow-sm h-100"
      style={{ borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => onOuvrir(p)}>
      <img src={p.image || defaultProduit} alt={p.nom}
        style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', background: '#f0f4f8' }} />
      <div className="card-body p-3">
        <div className="fw-semibold" style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.3 }}>
          {p.nom}
        </div>
        {p.prixVente !== undefined && (
          <div className="fw-bold mt-1" style={{ color: '#00a881', fontSize: 15 }}>{fmtPrix(p.prixVente)}</div>
        )}
        {!p.enStock && (
          <span className="badge mt-2" style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10 }}>
            Épuisé
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onReserver(p); }}
          className="btn btn-sm w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
          style={{ background: 'rgba(37,211,102,0.12)', color: '#16a34a', borderRadius: 8, fontSize: 12 }}>
          <FontAwesomeIcon icon={faComment} style={{ fontSize: 12 }} />
          Réserver
        </button>
      </div>
    </div>
  </div>
);

export default CarteProduit;
