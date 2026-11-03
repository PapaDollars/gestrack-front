// Marque de l'écran de chargement des pages vitrine (catalogue /catalogue/<slug> et boutique
// protégée /<slug>) : nom et logo de l'entreprise si forfait payant. Partout ailleurs, et sans
// forfait payant, l'écran reste celui de GesTrack.
// Gardée sur l'appareil pour que public/index.html l'affiche dès l'ouverture, avant même le
// téléchargement du JavaScript. Mêmes clés et même logique que le script de public/index.html :
// modifier les deux ensemble.
import { imageOptimisee } from '@/utils/images';

const cleBoutique = (slug) => `gestrack_marque_boutique_${slug}`;

// Forme du logo choisie au recadrage : 'cercle' (par défaut) ou 'carre' aux coins arrondis.
// ARRONDI_CARRE : arrondi des coins, en fraction du côté — même valeur que .ed-logo--carre
// dans public/index.html
export const ARRONDI_CARRE = 0.22;
export const rayonLogo = (forme) => (forme === 'carre' ? `${ARRONDI_CARRE * 100}%` : '50%');

const lire = (cle) => {
  try {
    const m = JSON.parse(localStorage.getItem(cle) || 'null');
    return m?.nom ? m : null;
  } catch { return null; }
};

// marque : { nom, logo } envoyée par le serveur, ou null (pas de forfait payant / pas de nom)
export const memoriserMarqueBoutique = (slug, marque) => {
  if (!slug) return;
  try {
    if (marque?.nom) {
      localStorage.setItem(cleBoutique(slug), JSON.stringify({
        nom: marque.nom, logo: marque.logo ? imageOptimisee(marque.logo, 200) : null,
        forme: marque.forme === 'carre' ? 'carre' : 'cercle',
      }));
    } else {
      localStorage.removeItem(cleBoutique(slug));
    }
  } catch { /* stockage indisponible : écran GesTrack */ }
};

export const lireMarqueBoutique = (slug) => (slug ? lire(cleBoutique(slug)) : null);

// Marque à montrer sur l'écran de chargement pour l'adresse en cours : { nom, logo } sur une
// page vitrine d'une boutique au forfait payant, sinon null (écran GesTrack)
export const marqueEcranChargement = () => {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments[0] === 'catalogue' && segments[1]) return lire(cleBoutique(segments[1]));
  return segments.length === 1 ? lire(cleBoutique(segments[0])) : null;
};
