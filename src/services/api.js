// Service centralisé pour les appels API — avec cache mémoire pour réduire les lectures Firestore
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

// Intercepteur réponse (auth désactivée — placeholder)
api.interceptors.response.use(
  (response) => response,
  async (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// Cache mémoire — persiste tant que l'onglet est ouvert
// Les mutations invalident automatiquement les clés concernées
// ─────────────────────────────────────────────────────────────────────────────
const _cache = {};

// Cache permanent — ne se vide que sur mutation, jamais par durée
const cGet = async (key, fetcher) => {
  if (_cache[key]) return _cache[key];
  const result = await fetcher();
  _cache[key] = result;
  return result;
};

const cDel = (...keys) => keys.forEach(k => delete _cache[k]);

// Appel forcé (bypass cache) puis mise à jour du cache
const cRefresh = async (key, fetcher) => {
  const result = await fetcher();
  _cache[key] = result;
  return result;
};

// Exposé pour forcer un rechargement depuis n'importe quelle page
export const invalidateCache = (...keys) => cDel(...keys);
export const invalidateAll   = () => Object.keys(_cache).forEach(k => delete _cache[k]);

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
export const dettesAPI = {
  getAll:       ()           => cGet('dettes', () => api.get('/dettes')),
  getByClient:  (clientId)   => api.get(`/dettes/client/${clientId}`),
  getARelancer: ()           => cGet('dettes_relancer', () => api.get('/dettes/relancer')),
  create:       (cId, data)  => api.post(`/dettes/client/${cId}`, data)
                                   .then(r => { cDel('dettes', 'dettes_relancer'); return r; }),
  ajouter:      (id, data)   => api.patch(`/dettes/${id}/ajouter`, data)
                                   .then(r => { cDel('dettes', 'dettes_relancer'); return r; }),
  reduire:      (id, data)   => api.patch(`/dettes/${id}/reduire`, data)
                                   .then(r => { cDel('dettes', 'dettes_relancer'); return r; }),
  abandonner:   (id, data)   => api.patch(`/dettes/${id}/abandonner`, data)
                                   .then(r => { cDel('dettes', 'dettes_relancer'); return r; }),
  delete:       (id)         => api.delete(`/dettes/${id}`)
                                   .then(r => { cDel('dettes', 'dettes_relancer'); return r; }),
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
  delete:       (id)         => api.delete(`/produits/${id}`)
                                   .then(r => { cDel('produits', 'finances'); return r; }),
  getHistorique:(id)         => api.get(`/produits/${id}/historique`),
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
  delete:       (id)         => api.delete(`/magasin/${id}`)
                                   .then(r => { cDel('magasin', 'finances'); return r; }),
  getHistorique:(id)         => api.get(`/magasin/${id}/historique`),
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
export const profilAPI = {
  get:    ()     => api.get('/auth/me'),
  update: (data) => api.put('/auth/me', data),
};

export default api;
