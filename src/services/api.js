// Service centralisé pour les appels API
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Créer une instance axios avec l'URL de base
const api = axios.create({
  baseURL: API_URL,
});

// Intercepteur réponse (auth désactivée — pas de retry token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    {
      // placeholder — auth sera réactivée plus tard
    }
    return Promise.reject(error);
  }
);

// ===== CLIENTS =====
export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (formData) => api.post('/clients', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/clients/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/clients/${id}`),
  getHistorique: (id) => api.get(`/clients/${id}/historique`),
};

// ===== DETTES =====
export const dettesAPI = {
  getAll: () => api.get('/dettes'),
  getByClient: (clientId) => api.get(`/dettes/client/${clientId}`),
  getARelancer: () => api.get('/dettes/relancer'),
  create: (clientId, data) => api.post(`/dettes/client/${clientId}`, data),
  ajouter: (id, data) => api.patch(`/dettes/${id}/ajouter`, data),
  reduire: (id, data) => api.patch(`/dettes/${id}/reduire`, data),
  abandonner: (id, data) => api.patch(`/dettes/${id}/abandonner`, data),
  delete: (id) => api.delete(`/dettes/${id}`),
  getHistorique: (id) => api.get(`/dettes/${id}/historique`),
};

// ===== PRODUITS =====
export const produitsAPI = {
  getAll: () => api.get('/produits'),
  getPrixAchat: (id) => api.get(`/produits/${id}/prix-achat`),
  verifierMdp: (motDePasse) => api.post('/produits/verifier-mdp', { motDePasse }),
  create: (formData) => api.post('/produits', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/produits/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  ajouterStock: (id, data) => api.patch(`/produits/${id}/stock/ajouter`, data),
  reduireStock: (id, data) => api.patch(`/produits/${id}/stock/reduire`, data),
  delete: (id) => api.delete(`/produits/${id}`),
  getHistorique: (id) => api.get(`/produits/${id}/historique`),
};

// ===== TYPES DE PRODUITS =====
export const typesProduitAPI = {
  getAll: () => api.get('/types-produits'),
  ajouter: (nom) => api.post('/types-produits', { nom }),
};

// ===== NOTIFICATIONS =====
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  marquerLu: (id) => api.patch(`/notifications/${id}/lire`),
  marquerToutLu: () => api.patch('/notifications/lire-tout'),
};

// ===== PARAMÈTRES =====
export const parametresAPI = {
  get: () => api.get('/parametres'),
  update: (data) => api.put('/parametres', data),
};

// ===== MAGASIN =====
export const magasinAPI = {
  getAll: () => api.get('/magasin'),
  getPrixAchat: (id) => api.get(`/magasin/${id}/prix-achat`),
  verifierMdp: (motDePasse) => api.post('/magasin/verifier-mdp', { motDePasse }),
  create: (formData) => api.post('/magasin', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/magasin/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  ajouterStock: (id, data) => api.patch(`/magasin/${id}/stock/ajouter`, data),
  reduireStock: (id, data) => api.patch(`/magasin/${id}/stock/reduire`, data),
  delete: (id) => api.delete(`/magasin/${id}`),
  getHistorique: (id) => api.get(`/magasin/${id}/historique`),
};

// ===== COMPTE PERSONNEL =====
export const compteAPI = {
  getAll: () => api.get('/compte'),
  create: (data) => api.post('/compte', data),
  update: (id, data) => api.put(`/compte/${id}`, data),
  delete: (id) => api.delete(`/compte/${id}`),
};

// ===== FINANCES MÉTIER =====
export const financesAPI = {
  get: () => api.get('/finances'),
};

export default api;
