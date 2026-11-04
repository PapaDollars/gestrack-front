// Page publique — catalogue produits boutique (accessible sans connexion)
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import defaultProduit from '@/assets/img/defaultProduit.png';
import { fmtPrix } from '@/pages/public/catalogue/utils';
import { imageOptimisee } from '@/utils/images';
import BadgesProduit from '@/components/produits/BadgesProduit';
import { prixBarre } from '@/utils/promotions';

// ── Carte produit — utilisée à la fois dans la vue groupée par catégorie et la vue à plat
// (recherche / catégorie unique sélectionnée) pour ne pas dupliquer ce balisage deux fois ──
// enRangee : la carte est dans une rangée qui glisse (largeur gérée par la rangée), sinon grille
const CarteProduit = ({ p, onOuvrir, onReserver, enRangee = false }) => (
  <div className={enRangee ? '' : 'col-6 col-md-4 col-lg-3'}>
    <div
      className="card border-0 shadow-sm h-100"
      style={{ borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => onOuvrir(p)}>
      <img src={imageOptimisee(p.image, 500) || defaultProduit} alt={p.nom} loading="lazy" decoding="async"
        style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', background: '#f0f4f8' }} />
      {/* Cartes uniformes : nom sur une seule ligne (coupé avec « … »), ligne des badges
          à hauteur fixe, et bouton Réserver / « Épuisé » toujours collé en bas de la carte */}
      <div className="card-body p-2 px-md-3 d-flex flex-column">
        <div className="fw-semibold text-truncate" title={p.nom}
          style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.3 }}>
          {p.nom}
        </div>
        <div className="d-flex flex-wrap gap-1 mt-1" style={{ minHeight: 18 }}><BadgesProduit produit={p} taille={10} /></div>
        {p.prixVente !== undefined && (
          <div className="mt-1 mb-2">
            {prixBarre(p) > 0 && <s className="text-muted me-2" style={{ fontSize: 12 }}>{fmtPrix(prixBarre(p))}</s>}
            <span className="fw-bold" style={{ color: '#00a881', fontSize: 15 }}>{fmtPrix(p.prixVente)}</span>
          </div>
        )}
        {!p.enStock && (
          <span className="badge mt-auto align-self-start" style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10 }}>
            Épuisé
          </span>
        )}
        {/* Produit épuisé : pas de réservation possible */}
        {p.enStock && <button
          onClick={e => { e.stopPropagation(); onReserver(p); }}
          className="btn btn-sm w-100 mt-auto d-flex align-items-center justify-content-center gap-2"
          style={{ background: 'rgba(37,211,102,0.12)', color: '#16a34a', borderRadius: 8, fontSize: 12 }}>
          <FontAwesomeIcon icon={faComment} style={{ fontSize: 12 }} />
          Réserver
        </button>}
      </div>
    </div>
  </div>
);

export default CarteProduit;
