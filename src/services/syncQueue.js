// File d'attente pour les opérations hors ligne — stockées dans localStorage.
// Chaque opération garde l'uid du compte qui l'a créée : elle n'est rejouée que lorsque ce
// même compte est connecté (sinon, sur un appareil partagé, les actions d'un compte seraient
// enregistrées dans celui qui se connecte ensuite).
import { auth } from '@/services/firebase';

const CLE = 'gestrack_sync_queue';
const EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export const getQueue = () => {
  try {
    const q = JSON.parse(localStorage.getItem(CLE) || '[]');
    const maintenant = Date.now();
    const valides = q.filter(op => (maintenant - new Date(op.timestamp).getTime()) < EXPIRATION_MS);
    // Nettoyer le localStorage si des items ont expiré
    if (valides.length !== q.length) localStorage.setItem(CLE, JSON.stringify(valides));
    return valides;
  } catch { return []; }
};

const sauvegarder = (q) => localStorage.setItem(CLE, JSON.stringify(q));

export const enqueue = (config) => {
  const q = getQueue();
  // Sauvegarder le Content-Type pour que le rejeu soit fidèle à la requête originale
  const contentType = config.headers?.['Content-Type']
    || config.headers?.post?.['Content-Type']
    || 'application/json';
  q.push({
    id: Date.now() + Math.random(),
    method: config.method,
    url: config.url,
    data: config.data,
    contentType,
    idempotencyKey: config.headers?.['X-Idempotency-Key'] || null,
    uid: auth.currentUser?.uid || null,
    timestamp: new Date().toISOString(),
  });
  sauvegarder(q);
};

// Opération appartenant au compte connecté
const estDuCompte = (op) => op.uid === (auth.currentUser?.uid || null);

// Refus définitif du serveur (4xx) : rejouer ne changera rien — sauf session expirée (401),
// accès payant suspendu (403), délai dépassé (408) ou trop de requêtes (429).
const REESSAYABLES = [401, 403, 408, 429];

export const processerQueue = async (axiosInstance) => {
  const q = getQueue();
  const aRejouer = q.filter(estDuCompte);
  if (aRejouer.length === 0) return { synced: 0, failed: 0, abandons: [] };
  const abandons = []; // messages des opérations retirées de la file (refus définitif)

  // Les opérations d'autres comptes restent en file, intactes
  const echecs = q.filter(op => !estDuCompte(op));
  let synced = 0;

  for (const op of aRejouer) {
    try {
      // X-Sync-Replay empêche l'intercepteur de re-mettre l'item en file si ça échoue encore
      await axiosInstance({
        method: op.method,
        url: op.url,
        data: op.data,
        headers: {
          'Content-Type': op.contentType || 'application/json',
          'X-Sync-Replay': '1',
          ...(op.idempotencyKey && { 'X-Idempotency-Key': op.idempotencyKey }),
        },
      });
      synced++;
    } catch (e) {
      const status = e.response?.status;
      const corps = e.response?.data || {};
      if (corps.dejaValidee || corps.dejaEnregistree) {
        synced++; // déjà fait lors d'une tentative précédente (réponse perdue) : rien à refaire
      } else if (status >= 400 && status < 500 && !REESSAYABLES.includes(status)) {
        abandons.push(corps.message || `Action refusée par le serveur (${status})`);
      } else {
        echecs.push(op); // serveur injoignable ou en erreur : garder pour la prochaine tentative
      }
    }
  }

  sauvegarder(echecs);
  return { synced, failed: echecs.filter(estDuCompte).length, abandons };
};

export const nbEnAttente = () => getQueue().filter(estDuCompte).length;
export const viderQueue  = () => localStorage.removeItem(CLE);
