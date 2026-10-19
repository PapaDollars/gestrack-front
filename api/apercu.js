// Aperçu de lien (WhatsApp, Facebook, Telegram, X, Google…) d'un catalogue ou d'un produit.
//
// Ces robots ne lancent pas l'application React : ils lisent seulement les balises <meta> du
// HTML reçu. Sans cette fonction, tout lien partagé affichait « GesTrack Business ». vercel.json
// redirige UNIQUEMENT les robots d'aperçu (par leur user-agent) vers cette fonction ; les
// visiteurs humains reçoivent l'application normale.
//
// Données : API publique du catalogue (mêmes informations que la page publique — jamais de
// prix d'achat ni de stock). URL de l'API : variable d'environnement Vercel REACT_APP_API_URL.

const echapper = (t) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const fmtPrix = (n) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n || 0)} FCFA`;

// Image Cloudinary recadrée au format d'aperçu (1200×630) — sinon laissée telle quelle
const imageApercu = (url) => (url && url.includes('/upload/')
  ? url.replace('/upload/', '/upload/c_pad,b_white,w_1200,h_630,f_jpg,q_auto/')
  : url);

const page = ({ titre, description, image, url, liste = [] }) => `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="utf-8" />
<title>${echapper(titre)}</title>
<meta name="description" content="${echapper(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="GesTrack Business" />
<meta property="og:locale" content="fr_FR" />
<meta property="og:title" content="${echapper(titre)}" />
<meta property="og:description" content="${echapper(description)}" />
<meta property="og:url" content="${echapper(url)}" />
${image ? `<meta property="og:image" content="${echapper(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
<meta name="twitter:title" content="${echapper(titre)}" />
<meta name="twitter:description" content="${echapper(description)}" />
${image ? `<meta name="twitter:image" content="${echapper(image)}" />` : ''}
<link rel="canonical" href="${echapper(url)}" />
</head><body>
<h1>${echapper(titre)}</h1>
<p>${echapper(description)}</p>
${liste.length ? `<ul>
${liste.map(p => `<li>${echapper(p.nom)}${p.categorie ? ` — ${echapper(p.categorie)}` : ''}${p.prixVente !== undefined ? ` — ${echapper(fmtPrix(p.prixVente))}` : ''}</li>`).join('\n')}
</ul>` : ''}
<p><a href="${echapper(url)}">Voir le catalogue</a></p>
</body></html>`;

module.exports = async (req, res) => {
  const origine = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  const slug = String(req.query.slug || '').replace(/[^A-Za-z0-9_-]/g, '');
  const produitId = String(req.query.produit || '').replace(/[^A-Za-z0-9_-]/g, '');
  const url = `${origine}/catalogue/${slug}${produitId ? `?produit=${produitId}` : ''}`;

  let infos = {
    titre: 'GesTrack Business',
    description: 'Catalogue en ligne — découvrez les produits et contactez la boutique.',
    image: `${origine}/logo512.png`,
    url,
  };

  try {
    const api = (process.env.REACT_APP_API_URL || process.env.API_URL || '').replace(/\/$/, '');
    if (api && slug) {
      const r = await fetch(`${api}/vitrine/catalogue/${slug}`, { signal: AbortSignal.timeout(6000) });
      if (r.ok) {
        const { produits = [], nomEntreprise = '' } = await r.json();
        const boutique = nomEntreprise || 'Catalogue';
        const produit = produitId && produits.find(p => p.id === produitId);
        if (produit) {
          const prix = produit.prixVente !== undefined ? ` — ${fmtPrix(produit.prixVente)}` : '';
          infos = {
            titre: `${produit.nom}${prix}`,
            description: (produit.description || `${produit.categorie ? `${produit.categorie} · ` : ''}Disponible chez ${boutique}`).slice(0, 200)
              + (produit.enStock === false ? ' (épuisé pour le moment)' : ''),
            image: imageApercu(produit.image) || infos.image,
            url,
          };
        } else {
          const avecImage = produits.find(p => p.image);
          const categories = [...new Set(produits.map(p => p.categorie).filter(Boolean))].slice(0, 4);
          infos = {
            titre: `${boutique} — Catalogue`,
            description: `${produits.length} produit(s)${categories.length ? ` : ${categories.join(', ')}…` : ''} Consultez le catalogue et contactez la boutique.`,
            image: imageApercu(avecImage?.image) || infos.image,
            url,
            // Liste des produits dans la page (lue par Google, pas par WhatsApp)
            liste: produits.slice(0, 300),
          };
        }
      }
    }
  } catch { /* API injoignable : aperçu générique */ }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Mis en cache 10 min par le CDN (les robots repassent souvent sur un même lien)
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(page(infos));
};
