// Filtres des listes à exporter

// ── Section export (clients + produits) ──────────────────────────────────
export const FILTRES_CLIENTS  = [
  { val: 'tous',       label: 'Tous les clients' },
  { val: 'avec_dette', label: 'Avec dette' },
  { val: 'sans_dette', label: 'Sans dette' },
];

export const FILTRES_PRODUITS = [
  { val: 'tous',     label: 'Tous les produits' },
  { val: 'boutique', label: 'Boutique' },
  { val: 'magasin',  label: 'Magasin' },
];

// Filtre stock — s'applique à l'intérieur de la source choisie (Tous / Boutique / Magasin)
export const FILTRES_STOCK = [
  { val: '',        label: 'Tous stocks' },
  { val: 'stock',   label: 'En stock' },
  { val: 'faible',  label: 'Stock faible' },
  { val: 'rupture', label: 'Rupture' },
];
