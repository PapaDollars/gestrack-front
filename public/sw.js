// Service worker GesTrack — un seul rôle : afficher notre page « Pas de connexion »
// (public/hors-ligne.html) au lieu de la page d'erreur du navigateur quand on ouvre ou recharge
// l'appli ou une page vitrine sans réseau.
//
// Volontairement minimal : il ne garde PAS l'appli en cache. En ligne, chaque ouverture va
// toujours chercher la dernière version sur le serveur (pas de risque de rester bloqué sur une
// ancienne version après un déploiement). Les appels à l'API ne passent jamais par lui.
//
// Pour mettre à jour la page hors ligne chez tout le monde : changer VERSION.
const VERSION = 'v1';
const CACHE = `gestrack-hors-ligne-${VERSION}`;
const PAGE_HORS_LIGNE = '/hors-ligne.html';
const FICHIERS = [PAGE_HORS_LIGNE, '/logo192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles
        .filter((c) => c.startsWith('gestrack-hors-ligne-') && c !== CACHE)
        .map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Ouverture d'une page : le réseau d'abord, notre page hors ligne s'il ne répond pas
  if (req.mode === 'navigate') {
    if (url.pathname.startsWith('/api/')) return; // aperçus de partage (robots) : jamais touchés
    event.respondWith(
      fetch(req).catch(() => caches.match(PAGE_HORS_LIGNE)
        .then((page) => page || Response.error()))
    );
    return;
  }

  // Logo de la page hors ligne : depuis le cache s'il n'y a pas de réseau
  if (FICHIERS.includes(url.pathname) && url.pathname !== PAGE_HORS_LIGNE) {
    event.respondWith(fetch(req).catch(() => caches.match(url.pathname)));
  }
});
