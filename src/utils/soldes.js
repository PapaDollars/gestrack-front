// Catégories « Soldes » et « Vente Flash » : ce ne sont pas des types de produits enregistrés
// mais des catégories virtuelles regroupant les produits en promotion (champs enSolde et
// venteFlash), en plus de leur vraie catégorie. Un produit est dans l'une OU l'autre : s'il
// porte encore les deux statuts, la Vente Flash l'emporte.
import { faBolt, faTag } from '@fortawesome/free-solid-svg-icons';

export const CATEGORIE_SOLDES = 'Soldes';
export const CATEGORIE_FLASH = 'Vente Flash';

export const estFlash = (p) => !!p.venteFlash;
export const estSoldes = (p) => !!p.enSolde && !p.venteFlash;

// Liste des catégories, « Vente Flash » puis « Soldes » en tête dès qu'un produit y figure
export const categoriesAvecSoldes = (categories, produits = []) => {
  const virtuelles = [
    ...(produits.some(estFlash) ? [CATEGORIE_FLASH] : []),
    ...(produits.some(estSoldes) ? [CATEGORIE_SOLDES] : []),
  ];
  return [...virtuelles, ...categories.filter(c => !virtuelles.includes(c))];
};

// Dans le filtre : icône et texte colorés, sans fond ni cadre
const STYLES_CATEGORIES = {
  [CATEGORIE_FLASH]:  { color: '#dc2626', fontWeight: 600 },
  [CATEGORIE_SOLDES]: { color: '#d97706', fontWeight: 600 },
};
const ICONES_CATEGORIES = { [CATEGORIE_FLASH]: faBolt, [CATEGORIE_SOLDES]: faTag };
export const styleCategorie = (categorie) => STYLES_CATEGORIES[categorie];
export const iconeCategorie = (categorie) => ICONES_CATEGORIES[categorie];

export const dansCategorie = (produit, categorie) => {
  if (categorie === CATEGORIE_FLASH) return estFlash(produit);
  if (categorie === CATEGORIE_SOLDES) return estSoldes(produit);
  return produit.categorie === categorie;
};
