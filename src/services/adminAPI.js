import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL, timeout: 30000 });

// Injecte le token Bearer depuis l'instance principale si disponible
api.interceptors.request.use((config) => {
  const token = axios.defaults.headers.common['Authorization'];
  if (token) config.headers['Authorization'] = token;
  return config;
});

export const adminAPI = {
  getStats:               ()            => api.get('/admin/stats'),
  getUtilisateurs:        ()            => api.get('/admin/utilisateurs'),
  getUtilisateur:         (uid)         => api.get(`/admin/utilisateurs/${uid}`),
  suspendre:              (uid)         => api.post(`/admin/utilisateurs/${uid}/suspendre`),
  reactiver:              (uid)         => api.post(`/admin/utilisateurs/${uid}/reactiver`),
  supprimer:              (uid)         => api.delete(`/admin/utilisateurs/${uid}`),
  getModeration:          ()            => api.get('/admin/moderation'),
  approuver:              (id)          => api.post(`/admin/moderation/${id}/approuver`),
  rejeter:                (id)          => api.post(`/admin/moderation/${id}/rejeter`),
  scanner:                ()            => api.post('/admin/moderation/scanner'),
  diffuser:               (data)        => api.post('/admin/diffuser', data),
  getVitrines:            ()            => api.get('/admin/vitrines'),
  getJournal:             ()            => api.get('/admin/journal'),
};
