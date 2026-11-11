// Images Cloudinary allégées pour l'affichage : format moderne choisi par le navigateur
// (WebP/AVIF), qualité automatique et largeur adaptée — une vignette de catalogue n'a pas
// besoin de l'image originale. Une URL non Cloudinary (image par défaut…) est rendue telle quelle.
export const imageOptimisee = (url, largeur = 500) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${largeur}/`);
};

// Réduit une photo avant l'envoi (côté le plus long ≤ maxCote px, JPEG) : une photo de téléphone
// de 5 à 10 Mo passe à quelques centaines de Ko, sous la limite de 5 Mo du serveur.
// En cas d'échec (format non lisible par le navigateur), le fichier d'origine est renvoyé.
export const reduireImage = (fichier, maxCote = 1600, qualite = 0.85) => new Promise((resolve) => {
  if (!fichier || !fichier.type?.startsWith('image/') || fichier.type === 'image/gif') return resolve(fichier);
  const url = URL.createObjectURL(fichier);
  const img = new Image();
  img.onload = () => {
    const ratio = Math.min(1, maxCote / Math.max(img.width, img.height));
    // Déjà petite et légère : rien à faire
    if (ratio === 1 && fichier.size <= 1024 * 1024) { URL.revokeObjectURL(url); return resolve(fichier); }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // fond blanc pour les PNG transparents passés en JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return resolve(fichier);
      const nom = fichier.name.replace(/\.[^.]+$/, '') + '.jpg';
      resolve(new File([blob], nom, { type: 'image/jpeg' }));
    }, 'image/jpeg', qualite);
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(fichier); };
  img.src = url;
});
