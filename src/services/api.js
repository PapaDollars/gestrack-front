// Service centralisé pour les appels API — avec cache mémoire pour réduire les lectures Firestore
import axios from 'axios';
import { toast } from 'react-toastify';
import { enqueue } from '@/services/syncQueue';
import { cacheManager } from '@/services/cacheManager';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

// Intercepteur réponse — met en file d'attente les mutations réseau qui échouent
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error.config;
    const estErreurReseau = !error.response; // pas de réponse = serveur injoignable
    const estMutation = cfg && ['post', 'put', 'patch', 'delete'].includes(cfg.method?.toLowerCase());
    const estMultipart = cfg?.headers?.['Content-Type']?.includes('multipart');
    const estExclus = ['/health', '/auth/', '/diag'].some(p => cfg?.url?.includes(p));
    const estRejeu = cfg?.headers?.['X-Sync-Replay'] === '1'; // rejeu depuis la file → ne pas re-mettre en file

    if (estErreurReseau && estMutation && !estMultipart && !estExclus && !estRejeu) {
      enqueue(cfg);
      // Notifier le contexte (si disponible) — on dispatch un event custom
      window.dispatchEvent(new CustomEvent('gestrack:queued'));
      // Prévenir clairement l'utilisateur : ce n'est PAS encore enregistré, juste mis en attente.
      // Sans ça, les écrans appelants (qui ne vérifient pas `queued`) affichent un faux message
      // de succès alors que le serveur (souvent endormi sur un hébergement gratuit) n'a rien reçu.
      toast.warning(
        "Serveur injoignable (probablement en veille) — l'action a été mise en attente et sera synchronisée automatiquement dès que la connexion revient. Ce n'est pas encore enregistré, ne comptez pas dessus tant que vous n'avez pas vu la confirmation.",
        { toastId: 'gestrack-file-attente', autoClose: 8000 }
      );
      // Retourner une réponse factice pour ne pas faire crasher l'UI
      return Promise.resolve({ data: { queued: true, offline: true }, status: 202, queued: true });
    }

    // Pour les GET, essayer le cache localStorage en fallback
    if (!estMutation && estErreurReseau && cfg?.method?.toLowerCase() === 'get') {
      const cacheKey = cfg.url?.replace(/^\//, '').replace(/\//g, '_');
      if (cacheKey) {
        const cached = cacheManager.get(cacheKey);
        if (cached?.data) {
          // Retourner le cache avec un flag pour indiquer que c'est du cache
          return Promise.resolve({
            data: cached.data,
            status: 200,
            fromCache: true,
            cacheAge: cached.age,
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Cache mémoire — persiste tant que l'onglet est ouvert
// Les mutations invalident automatiquement les clés concernées
// ─────────────────────────────────────────────────────────────────────────────
const _cache = {};

// Cache permanent — ne se vide que sur mutation, jamais par durée
const cGet = async (key, fetcher) => {
  if (_cache[key]) return _cache[key];
  try {
    const result = await fetcher();
    // Ne jamais re-persister une réponse déjà repliée sur le cache (fromCache) comme si
    // elle était fraîche — ça prolongerait artificiellement sa durée de vie (voir cacheManager).
    if (!result.fromCache) {
      _cache[key] = result;
      cacheManager.set(key, result.data);
    }
    return result;
  } catch (error) {
    // Si erreur, essayer localStorage
    const cached = cacheManager.get(key);
    if (cached?.data) {
      console.warn(`API call failed for ${key}, using cached data`);
      return { data: cached.data, fromCache: true };
    }
    throw error;
  }
};

const cDel = (...keys) => keys.forEach(k => delete _cache[k]);

// Appel forcé (bypass cache) puis mise à jour du cache
const cRefresh = async (key, fetcher) => {
  try {
    const result = await fetcher();
    if (!result.fromCache) {
      _cache[key] = result;
      cacheManager.set(key, result.data);
    }
    return result;
  } catch (error) {
    // En fallback, retourner le cache s'il existe
    const cached = cacheManager.get(key);
    if (cached?.data) {
      console.warn(`API refresh failed for ${key}, using cached data`);
      return { data: cached.data, fromCache: true };
    }
    throw error;
  }
};

// Exposé pour forcer un rechargement depuis n'importe quelle page
export const invalidateCache = (...keys) => cDel(...keys);
export const invalidateAll   = () => Object.keys(_cache).forEach(k => delete _cache[k]);

// À vérifier après chaque mutation avant d'afficher un message de succès : si true,
// la requête n'a PAS atteint le serveur (mise en file d'attente locale en attendant la reconnexion).
export const estMisEnAttente = (response) => response?.data?.queued === true;

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────────────────────
export const clientsAPI = {
  getAll:       ()           => cGet('clients', () => api.get('/clients')),
  getById:      (id)         => api.get(`/clients/${id}`),
  create:       (fd)         => api.post('/clients', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('clients'); return r; }),
  update:       (id, fd)     => api.put(`/clients/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('clients'); return r; }),
  delete:       (id)         => api.delete(`/clients/${id}`)
                                   .then(r => { cDel('clients', 'dettes'); return r; }),
  getHistorique:(id)         => api.get(`/clients/${id}/historique`),
};

// ─────────────────────────────────────────────────────────────────────────────
// DETTES
// ─────────────────────────────────────────────────────────────────────────────
// Chaque mutation de dette recalcule aussi totalDette côté serveur (voir dettesController.js) —
// il faut donc invalider le cache 'clients' en plus de 'dettes', sinon la page /clients continue
// d'afficher l'ancien total tant qu'aucune mutation de client n'a eu lieu.
export const dettesAPI = {
  getAll:       ()           => cGet('dettes', () => api.get('/dettes')),
  getByClient:  (clientId)   => api.get(`/dettes/client/${clientId}`),
  getARelancer: ()           => cGet('dettes_relancer', () => api.get('/dettes/relancer')),
  create:       (cId, data)  => api.post(`/dettes/client/${cId}`, data)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  ajouter:      (id, data)   => api.patch(`/dettes/${id}/ajouter`, data)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  reduire:      (id, data)   => api.patch(`/dettes/${id}/reduire`, data)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  abandonner:   (id, data)   => api.patch(`/dettes/${id}/abandonner`, data)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  delete:       (id)         => api.delete(`/dettes/${id}`)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  getHistorique:(id)         => api.get(`/dettes/${id}/historique`),
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUITS (boutique)
// ─────────────────────────────────────────────────────────────────────────────
export const produitsAPI = {
  getAll:       ()           => cGet('produits', () => api.get('/produits')),
  getPrixAchat: (id)         => api.get(`/produits/${id}/prix-achat`),
  verifierMdp:  (mdp)        => api.post('/produits/verifier-mdp', { motDePasse: mdp }),
  create:       (fd)         => api.post('/produits', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('produits', 'finances'); return r; }),
  update:       (id, fd)     => api.put(`/produits/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('produits', 'finances'); return r; }),
  ajouterStock: (id, data)   => api.patch(`/produits/${id}/stock/ajouter`, data)
                                   .then(r => { cDel('produits'); return r; }),
  reduireStock: (id, data)   => api.patch(`/produits/${id}/stock/reduire`, data)
                                   .then(r => { cDel('produits', 'finances'); return r; }),
  ajusterStock: (id, data)   => api.patch(`/produits/${id}/stock/ajuster`, data)
                                   .then(r => { cDel('produits', 'finances'); return r; }),
  delete:       (id)         => api.delete(`/produits/${id}`)
                                   .then(r => { cDel('produits', 'finances'); return r; }),
  getHistorique:     (id)              => api.get(`/produits/${id}/historique`),
  annulerMouvement:  (produitId, histoId) => api.post(`/produits/${produitId}/historique/${histoId}/annuler`)
                                               .then(r => { cDel('produits', 'finances'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES DE PRODUITS
// ─────────────────────────────────────────────────────────────────────────────
export const typesProduitAPI = {
  getAll:  () =>    cGet('types_produit', () => api.get('/types-produits')),
  ajouter: (nom) => api.post('/types-produits', { nom })
                       .then(r => { cDel('types_produit'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:       ()   => cGet('notifications', () => api.get('/notifications')),
  marquerLu:    (id) => api.patch(`/notifications/${id}/lire`)
                           .then(r => { cDel('notifications'); return r; }),
  marquerToutLu:()   => api.patch('/notifications/lire-tout')
                           .then(r => { cDel('notifications'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES
// ─────────────────────────────────────────────────────────────────────────────
export const parametresAPI = {
  get:    ()     => cGet('parametres', () => api.get('/parametres')),
  update: (data) => api.put('/parametres', data)
                       .then(r => { cDel('parametres'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// MAGASIN
// ─────────────────────────────────────────────────────────────────────────────
export const magasinAPI = {
  getAll:       ()           => cGet('magasin', () => api.get('/magasin')),
  getPrixAchat: (id)         => api.get(`/magasin/${id}/prix-achat`),
  verifierMdp:  (mdp)        => api.post('/magasin/verifier-mdp', { motDePasse: mdp }),
  create:       (fd)         => api.post('/magasin', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('magasin', 'finances'); return r; }),
  update:       (id, fd)     => api.put(`/magasin/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('magasin', 'finances'); return r; }),
  ajouterStock: (id, data)   => api.patch(`/magasin/${id}/stock/ajouter`, data)
                                   .then(r => { cDel('magasin'); return r; }),
  reduireStock: (id, data)   => api.patch(`/magasin/${id}/stock/reduire`, data)
                                   .then(r => { cDel('magasin', 'finances'); return r; }),
  ajusterStock: (id, data)   => api.patch(`/magasin/${id}/stock/ajuster`, data)
                                   .then(r => { cDel('magasin', 'finances'); return r; }),
  delete:       (id)         => api.delete(`/magasin/${id}`)
                                   .then(r => { cDel('magasin', 'finances'); return r; }),
  getHistorique:     (id)              => api.get(`/magasin/${id}/historique`),
  annulerMouvement:  (produitId, histoId) => api.post(`/magasin/${produitId}/historique/${histoId}/annuler`)
                                               .then(r => { cDel('magasin', 'finances'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPTE PERSONNEL
// ─────────────────────────────────────────────────────────────────────────────
export const compteAPI = {
  getAll:  ()         => cGet('compte', () => api.get('/compte')),
  create:  (data)     => api.post('/compte', data)
                            .then(r => { cDel('compte'); return r; }),
  update:  (id, data) => api.put(`/compte/${id}`, data)
                            .then(r => { cDel('compte'); return r; }),
  delete:  (id)       => api.delete(`/compte/${id}`)
                            .then(r => { cDel('compte'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCES MÉTIER
// ─────────────────────────────────────────────────────────────────────────────
export const financesAPI = {
  get: () => cGet('finances', () => api.get('/finances')),
  refresh: () => cRefresh('finances', () => api.get('/finances')),
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFIL UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────
export const fournisseursAPI = {
  getAll:          ()                => api.get('/fournisseurs'),
  create:          (data)            => { const isfd = data instanceof FormData; return api.post('/fournisseurs', data, isfd ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}); },
  update:          (id, data)        => { const isfd = data instanceof FormData; return api.put(`/fournisseurs/${id}`, data, isfd ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}); },
  delete:          (id)              => api.delete(`/fournisseurs/${id}`),
  ajouterLivraison:(id, data)        => api.post(`/fournisseurs/${id}/livraisons`, data),
  validerLivraison:(id, lid, data={})=> api.post(`/fournisseurs/${id}/livraisons/${lid}/valider`, data),
};

export const fournisseursContactsAPI = {
  getAll: ()         => api.get('/fournisseurs-contacts'),
  create: (data)     => api.post('/fournisseurs-contacts', data),
  update: (id, data) => api.put(`/fournisseurs-contacts/${id}`, data),
  delete: (id)       => api.delete(`/fournisseurs-contacts/${id}`),
};

// Vitrine publique — pas d'authentification requise
export const vitrineAPI = {
  getCatalogue:    (slug)             => api.get(`/vitrine/catalogue/${slug}`),
  getInfosBoutique:(slug)             => api.get(`/vitrine/${slug}`),
  acceder:         (slug, motDePasse) => api.post(`/vitrine/${slug}/acces`, { motDePasse }),
};

export const facturesAPI = {
  getAll:  ()           => api.get('/factures'),
  create:  (data)       => api.post('/factures', data)
                              .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  update:  (id, data)   => api.put(`/factures/${id}`, data)
                              .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  delete:  (id)         => api.delete(`/factures/${id}`)
                              .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  getById: (id)         => api.get(`/factures/${id}`),
};

export const profilAPI = {
  get:    ()     => api.get('/auth/me'),
  update: (data) => api.put('/auth/me', data),
};

export const preferencesAPI = {
  get:    (cle)         => api.get(`/preferences/${cle}`),
  update: (cle, data)   => api.put(`/preferences/${cle}`, data),
};

export default api;
