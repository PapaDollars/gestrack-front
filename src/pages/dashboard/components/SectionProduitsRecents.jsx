// Carte « Produits récents » (boutique ou magasin) — en grille de 5 cases si la carte est assez
// large, sinon 4 (voir .dash-produits dans index.css) : la dernière case est la tuile « Voir plus ».
// Sur mobile : liste, puis la tuile « Voir plus » sur une ligne.
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import CarteProduit from '@/pages/dashboard/components/CarteProduit';
import TuileVoirPlus from '@/pages/dashboard/components/TuileVoirPlus';

const SectionProduitsRecents = ({ titre, icone, couleur, produits, total, chargement, mobile, vide, lien }) => (
  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
    <div className="card-header bg-transparent border-0 pt-3 px-3">
      <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
        <FontAwesomeIcon icon={icone} style={{ color: couleur }} />
        {titre}
      </h6>
    </div>
    <div className="card-body px-3 pb-3 pt-2 dash-produits">
      {chargement ? (
        <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: couleur }} /></div>
      ) : produits.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <FontAwesomeIcon icon={icone} size="2x" className="mb-2 d-block mx-auto" />{vide}
        </div>
      ) : mobile ? (
        <div>
          {produits.slice(0, 4).map(p => <CarteProduit key={p.id} produit={p} mobile />)}
          <div className="mt-2">
            <TuileVoirPlus to={lien} couleur={couleur} ligne detail={total ? `${total} produits` : null} />
          </div>
        </div>
      ) : (
        <div className="dash-produits__grille pb-2">
          {/* 4e produit : seulement quand la grille a 5 cases */}
          {produits.slice(0, 4).map((p, i) => (
            <div key={p.id} className={i === 3 ? 'dash-produits__si-large' : undefined}><CarteProduit produit={p} fluide /></div>
          ))}
          <TuileVoirPlus to={lien} couleur={couleur} detail={total ? `${total} produits` : null} />
        </div>
      )}
    </div>
  </div>
);

export default SectionProduitsRecents;
