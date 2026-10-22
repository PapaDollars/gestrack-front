// Plan du site (sitemap.xml) pour Google : pages publiques fixes + un lien par catalogue
// public activé (liste fournie par l'API : /vitrine/catalogues-actifs).
// URL de l'API : variable d'environnement Vercel REACT_APP_API_URL. Servi via vercel.json.

const PAGES_FIXES = ['/vitrine', '/tarifs', '/conditions-utilisation', '/confidentialite', '/mentions-legales'];

const echapper = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = async (req, res) => {
  const origine = `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
  let catalogues = [];
  try {
    const api = (process.env.REACT_APP_API_URL || process.env.API_URL || '').replace(/\/$/, '');
    if (api) {
      const r = await fetch(`${api}/vitrine/catalogues-actifs`, { signal: AbortSignal.timeout(6000) });
      if (r.ok) catalogues = await r.json();
    }
  } catch { /* API injoignable : pages fixes seulement */ }

  const urls = [
    ...PAGES_FIXES.map(p => `  <url><loc>${echapper(origine + p)}</loc></url>`),
    ...catalogues.map(c => `  <url><loc>${echapper(`${origine}/catalogue/${c.slug}`)}</loc>${
      c.majLe ? `<lastmod>${echapper(String(c.majLe).slice(0, 10))}</lastmod>` : ''}<changefreq>daily</changefreq></url>`),
  ];

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`);
};
