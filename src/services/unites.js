// Utilitaire de conversion d'unités — miroir du backend utils/unites.js
const RATIOS_FIXES = { ps: 1, dz: 12, paq: 10 };

export const psParUnite = (unite, produit = {}) => {
  if (RATIOS_FIXES[unite] !== undefined) return RATIOS_FIXES[unite];
  if (unite === 'ballo') return (parseInt(produit.dzParBallo) || 1) * 12;
  if (unite === 'crt')   return parseInt(produit.psParCrt) || 1;
  if (unite === 'sac')   return parseInt(produit.psParSac) || 1;
  return 1;
};

// Calcule stockEnPieces depuis les 3 niveaux saisis dans le formulaire
export const calculerStockEnPieces = (unitePrincipale, produit, n1, n2, n3) => {
  const ratio = psParUnite(unitePrincipale, produit);
  let total = (parseInt(n1) || 0) * ratio;
  if (unitePrincipale === 'ballo') {
    total += (parseInt(n2) || 0) * 12;
    total += (parseInt(n3) || 0) * 1;
  } else if (['dz', 'paq', 'crt', 'sac'].includes(unitePrincipale)) {
    total += (parseInt(n2) || 0) * 1;
  }
  return total;
};

// Décompose un stock en pièces vers les 3 niveaux du formulaire (inverse de calculerStockEnPieces)
// — utilisé pour pré-remplir les niveaux lors de la modification d'un produit.
export const decomposerStock = (unitePrincipale, produit, stockEnPieces) => {
  const ratio = psParUnite(unitePrincipale, produit);
  if (unitePrincipale === 'ballo') {
    const n1 = Math.floor(stockEnPieces / ratio);
    const reste = stockEnPieces % ratio;
    return { n1, n2: Math.floor(reste / 12), n3: reste % 12 };
  }
  if (['dz', 'paq', 'crt', 'sac'].includes(unitePrincipale)) {
    return { n1: Math.floor(stockEnPieces / ratio), n2: stockEnPieces % ratio, n3: 0 };
  }
  return { n1: stockEnPieces, n2: 0, n3: 0 };
};

// Affichage sur la carte — toujours en unité principale sans les ps résiduels
export const afficherStockCarte = (produit) => {
  const unite = normaliserUnite(produit.unitePrincipale || produit.unite);
  const stockEnPieces = produit.stockEnPieces ?? ((produit.quantiteStock || 0) * psParUnite(unite, produit));

  if (unite === 'ps') return `${stockEnPieces} ps`;

  if (unite === 'crt') {
    const ratio = psParUnite('crt', produit);
    return `${Math.floor(stockEnPieces / ratio)} crt`;
  }

  if (unite === 'ballo') {
    const ratio = psParUnite('ballo', produit);
    const ballos = Math.floor(stockEnPieces / ratio);
    const reste = stockEnPieces % ratio;
    const dz = Math.floor(reste / 12);
    if (ballos === 0) return `${dz} dz`;
    return dz > 0 ? `${ballos} ballo ${dz} dz` : `${ballos} ballo`;
  }

  // dz, paq, sac
  const ratio = psParUnite(unite, produit);
  return `${Math.floor(stockEnPieces / ratio)} ${unite}`;
};

// Affichage complet dans les détails (avec ps résiduels)
export const afficherStockDetails = (produit) => {
  const unite = normaliserUnite(produit.unitePrincipale || produit.unite);
  const stockEnPieces = produit.stockEnPieces ?? ((produit.quantiteStock || 0) * psParUnite(unite, produit));

  if (unite === 'ps') return `${stockEnPieces} ps`;

  if (unite === 'crt') {
    const ratio = psParUnite('crt', produit);
    const crts = Math.floor(stockEnPieces / ratio);
    const ps = stockEnPieces % ratio;
    return ps > 0 ? `${crts} crt ${ps} ps` : `${crts} crt`;
  }

  if (unite === 'ballo') {
    const ratio = psParUnite('ballo', produit);
    const ballos = Math.floor(stockEnPieces / ratio);
    const resteBallos = stockEnPieces % ratio;
    const dz = Math.floor(resteBallos / 12);
    const ps = resteBallos % 12;
    let txt = ballos > 0 ? `${ballos} ballo ` : '';
    if (dz > 0) txt += `${dz} dz `;
    if (ps > 0) txt += `${ps} ps`;
    return txt.trim() || '0';
  }

  const ratio = psParUnite(unite, produit);
  const principale = Math.floor(stockEnPieces / ratio);
  const ps = stockEnPieces % ratio;
  return ps > 0 ? `${principale} ${unite} ${ps} ps` : `${principale} ${unite}`;
};

const UNITES_VALIDES = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

// Normalise une unité — retourne 'ps' si la valeur est absente ou non reconnue
const normaliserUnite = (u) => (u && UNITES_VALIDES.includes(u) ? u : 'ps');

export const stockEnPs = (produit) =>
  produit.stockEnPieces ?? ((produit.quantiteStock || 0) * psParUnite(produit.unitePrincipale || produit.unite || 'ps', produit));

export const STATUT_STOCK = {
  RUPTURE: 'rupture',
  FAIBLE: 'faible',
  OK: 'ok',
};

export const statutStock = (produit) => {
  const ps = stockEnPs(produit);
  if (ps === 0) return STATUT_STOCK.RUPTURE;
  if (ps <= 9) return STATUT_STOCK.FAIBLE;
  return STATUT_STOCK.OK;
};

export const passeFiltreStock = (produit, filtre) => {
  if (!filtre) return true;
  const ps = stockEnPs(produit);
  if (filtre === 'rupture') return ps === 0;
  if (filtre === 'faible') return ps >= 1 && ps <= 9;
  if (filtre === 'stock') return ps >= 10;
  return true;
};

export const trierRuptureEnFond = (items) => {
  const enStock = items.filter(i => stockEnPs(i) > 0);
  const rupture = items.filter(i => stockEnPs(i) === 0);
  return [...enStock, ...rupture];
};

export const classeBadgeStock = (statut) => {
  if (statut === STATUT_STOCK.RUPTURE) return 'bg-danger';
  if (statut === STATUT_STOCK.FAIBLE) return 'bg-warning';
  return 'bg-success';
};

// Sous-unités disponibles pour une unité principale donnée (pour ModalStock)
export const sousUnites = (unitePrincipale) => {
  const u = normaliserUnite(unitePrincipale);
  if (u === 'ballo') return ['ballo', 'dz', 'ps'];
  if (['dz', 'paq'].includes(u)) return [u, 'ps'];
  if (u === 'crt') return ['crt', 'ps'];
  if (u === 'sac') return ['sac', 'ps'];
  return ['ps'];
};
