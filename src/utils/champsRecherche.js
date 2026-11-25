// Champs de recherche et de filtre : sur téléphone, la touche Entrée du clavier affichait
// « Suivant » (le navigateur passe au champ d'après et le clavier reste ouvert) — on ne voyait
// pas les résultats, qui s'affichent pourtant déjà pendant la saisie. Correction globale, pour
// toutes les pages : la touche devient « Rechercher » (loupe) et la toucher ferme le clavier
// pour laisser voir la liste.
//
// Champs concernés (hors formulaire : dans un <form>, Entrée sert à valider) : champ de type
// « search », champ dont le texte d'aide parle de recherche, ou champ précédé de l'icône loupe
// (tous les filtres des pages : Rechercher, Catégorie, Types produits, Toutes villes…).
const RECHERCHE = /recherch|chercher/i;

const aIconeLoupe = (el) => !!el.closest('.input-group')
  ?.querySelector('svg[data-icon="magnifying-glass"], svg[data-icon="search"]');

const estChampRecherche = (el) => {
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.form) return false;
  if (el.type === 'search') return true;
  if (el.type !== 'text') return false;
  return RECHERCHE.test(el.placeholder || '') || aIconeLoupe(el);
};

const preparer = (el) => {
  if (estChampRecherche(el) && !el.hasAttribute('enterkeyhint')) el.setAttribute('enterkeyhint', 'search');
};

export const activerToucheRecherche = () => {
  // Avant l'ouverture du clavier (toucher) et au focus (tabulation, clic) : le clavier lit
  // enterkeyhint au moment où il s'ouvre
  document.addEventListener('touchstart', (e) => preparer(e.target), { passive: true, capture: true });
  document.addEventListener('focusin', (e) => preparer(e.target), true);

  // Entrée : ferme le clavier. Phase de propagation normale : les composants qui gèrent déjà
  // Entrée (choix d'une suggestion…) passent d'abord.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    const champ = e.target;
    if (!estChampRecherche(champ)) return;
    e.preventDefault();
    champ.blur();
  });
};
