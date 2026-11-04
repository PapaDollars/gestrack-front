// Rangée qu'on fait glisser sur le côté (cartes collections, produits d'une catégorie) :
// 2 cartes + ~20 % de la 3e sur mobile (4 + un bout de la 5e sur grand écran) pour montrer
// qu'on peut faire glisser. flex-grow 1 : s'il y a peu de cartes, elles s'élargissent pour
// remplir la ligne au lieu de laisser un vide à droite.
import React from 'react';

const STYLE_RANGEE = `
.gt-rangee { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory;
  scrollbar-width: none; padding: 4px 2px 8px; -webkit-overflow-scrolling: touch; }
.gt-rangee::-webkit-scrollbar { display: none; }
.gt-rangee > :not(style) { flex: 1 0 calc((100% - 24px) / var(--gt-visibles, 2.2)); min-width: 0; scroll-snap-align: start; }
@media (min-width: 768px) {
  .gt-rangee > :not(style) { flex-basis: calc((100% - 48px) / var(--gt-visibles-large, 4.2)); }
}
`;

// onFin(estAuBout) (facultatif) : prévient quand on arrive (ou plus) au bout du défilement
// apercu : part visible de la carte suivante (0.2 = 20 %), sur mobile comme sur grand écran
const RangeeDefilante = ({ children, className = '', onFin, apercu = 0.2 }) => {
  const surDefilement = onFin && ((e) => {
    const el = e.currentTarget;
    onFin(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  });
  return (
    <div className={`gt-rangee ${className}`} onScroll={surDefilement}
      style={{ '--gt-visibles': 2 + apercu, '--gt-visibles-large': 4 + apercu }}>
      <style>{STYLE_RANGEE}</style>
      {children}
    </div>
  );
};

export default RangeeDefilante;
