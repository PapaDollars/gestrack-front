// Reste à payer d'une facture : il n'existe que pour une facture avec dette ou avance.
// Une facture simple est réglée entièrement — les anciennes factures simples ont pourtant
// été enregistrées avec un « reste » égal à leur total (corrigé côté serveur depuis) : on
// ne l'affiche donc pas.
export const resteAPayer = (facture) =>
  (facture?.detteId || facture?.avance > 0) ? (facture.resteADoit || 0) : 0;

// Conditions de vente imprimées en bas des factures, par défaut (modifiables dans
// Paramètres › Factures ; un texte vide n'affiche rien)
export const CONDITIONS_VENTE_DEFAUT = 'Les marchandises vendues ne sont ni reprises, ni échangées, ni remboursées.\n'
  + 'Merci de vérifier vos articles avant de quitter la boutique.';

// Mise en forme des conditions de vente : gras, italique et une police parmi trois
export const POLICES_CONDITIONS = {
  standard: { label: 'Standard',         famille: "'Segoe UI', Arial, sans-serif" },
  machine:  { label: 'Machine à écrire', famille: "'Courier New', Courier, monospace" },
  manuscrite: { label: 'Manuscrite',     famille: "'Segoe Script', 'Brush Script MT', 'Comic Sans MS', cursive" },
};
export const STYLE_CONDITIONS_DEFAUT = { gras: false, italique: false, police: 'standard' };

// Style React (aperçu, fiche à l'écran)
export const styleConditions = (style = STYLE_CONDITIONS_DEFAUT) => ({
  fontWeight: style.gras ? 700 : 400,
  fontStyle: style.italique ? 'italic' : 'normal',
  fontFamily: (POLICES_CONDITIONS[style.police] || POLICES_CONDITIONS.standard).famille,
});

// Même style en CSS en ligne (facture PDF)
export const cssConditions = (style = STYLE_CONDITIONS_DEFAUT) => {
  const s = styleConditions(style);
  return `font-weight:${s.fontWeight};font-style:${s.fontStyle};font-family:${s.fontFamily.replace(/"/g, "'")}`;
};
