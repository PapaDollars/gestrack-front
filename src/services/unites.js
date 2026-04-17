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

// Affichage sur la carte — toujours en unité principale sans les ps résiduels
export const afficherStockCarte = (produit) => {
  const stockEnPieces = produit.stockEnPieces ?? ((produit.quantiteStock || 0) * psParUnite(produit.unitePrincipale || produit.unite || 'ps', produit));
  const unite = produit.unitePrincipale || produit.unite || 'ps';

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
  const stockEnPieces = produit.stockEnPieces ?? ((produit.quantiteStock || 0) * psParUnite(produit.unitePrincipale || produit.unite || 'ps', produit));
  const unite = produit.unitePrincipale || produit.unite || 'ps';

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

// Sous-unités disponibles pour une unité principale donnée (pour ModalStock)
export const sousUnites = (unitePrincipale) => {
  if (unitePrincipale === 'ballo') return ['ballo', 'dz', 'ps'];
  if (['dz', 'paq'].includes(unitePrincipale)) return [unitePrincipale, 'ps'];
  if (unitePrincipale === 'crt') return ['crt', 'ps'];
  if (unitePrincipale === 'sac') return ['sac', 'ps'];
  return [unitePrincipale || 'ps'];
};
