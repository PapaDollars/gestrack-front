// Images Cloudinary allégées pour l'affichage : format moderne choisi par le navigateur
// (WebP/AVIF), qualité automatique et largeur adaptée — une vignette de catalogue n'a pas
// besoin de l'image originale. Une URL non Cloudinary (image par défaut…) est rendue telle quelle.
export const imageOptimisee = (url, largeur = 500) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${largeur}/`);
};
