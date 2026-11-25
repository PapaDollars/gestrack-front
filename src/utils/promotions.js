// Badges et prix barré d'un produit : Nouveau (créé il y a moins de 60 jours), Soldes,
// Vente Flash. Prix barré : celui saisi pour la promotion active (Vente Flash en priorité).
export const JOURS_NOUVEAU = 60;

export const estNouveau = (produit) => {
  if (!produit?.createdAt) return false;
  const age = Date.now() - new Date(produit.createdAt).getTime();
  return age >= 0 && age < JOURS_NOUVEAU * 24 * 3600 * 1000;
};

// Prix d'avant à barrer (par pièce), ou 0. Pages publiques : champ `prixAvant` déjà résolu par
// le serveur. Il n'a de sens que s'il est supérieur au prix affiché.
export const prixBarre = (produit, prixAffiche = produit?.prixVente) => {
  const avant = produit?.prixAvant
    ?? (produit?.venteFlash && produit?.prixAvantFlash > 0 ? produit.prixAvantFlash
      : produit?.enSolde && produit?.prixAvantSolde > 0 ? produit.prixAvantSolde : 0);
  return avant > (prixAffiche || 0) ? avant : 0;
};

// Réduction en % entre le prix d'avant (barré) et le prix affiché, arrondie à l'unité.
// 0 quand il n'y a pas de prix barré (prix d'avant absent ou pas plus grand que le prix affiché).
export const pourcentageReduction = (produit, prixAffiche = produit?.prixVente) => {
  const avant = prixBarre(produit, prixAffiche);
  if (!avant || !(prixAffiche > 0)) return 0;
  return Math.max(0, Math.round(((avant - prixAffiche) / avant) * 100));
};
