// Bouton « Enregistrer » des paramètres : gris tant que rien n'a changé, vert dès qu'il y a une
// modification. L'opacité réduite de Bootstrap sur un bouton désactivé est annulée : le gris suffit.
export const COULEUR_ENREGISTRER = '#00d4aa';
export const COULEUR_INACTIF = '#9ca3af';

export const styleBoutonEnregistrer = (actif) => ({
  background: actif ? COULEUR_ENREGISTRER : COULEUR_INACTIF,
  borderColor: 'transparent',
  borderRadius: 10,
  opacity: 1,
});
