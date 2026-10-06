import axios from 'axios';
import { auth } from '@/services/firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL, timeout: 30000 });

// Jeton Firebase de l'utilisateur connecté, demandé à chaque requête (renouvelé automatiquement
// avant expiration). Auparavant lu dans axios.defaults — jamais renseigné, car la connexion le
// pose sur l'instance principale `api` : aucune requête admin n'était authentifiée (401 partout).
api.interceptors.request.use(async (config) => {
  const utilisateur = auth.currentUser;
  if (utilisateur) {
    const token = await utilisateur.getIdToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAPI = {
  getStats:               ()            => api.get('/admin/stats'),
  getUtilisateurs:        ()            => api.get('/admin/utilisateurs'),
  getUtilisateur:         (uid)         => api.get(`/admin/utilisateurs/${uid}`),
  suspendre:              (uid)         => api.post(`/admin/utilisateurs/${uid}/suspendre`),
  reactiver:              (uid)         => api.post(`/admin/utilisateurs/${uid}/reactiver`),
  // Accès payant : action = 'approuver' | 'bloquer' | 'prolonger' (+ jours)
  changerAcces:           (uid, action, jours) => api.post(`/admin/utilisateurs/${uid}/acces`, { action, jours }),
  demarrerEssais:         ()            => api.post('/admin/acces/demarrer-essais'),
  supprimer:              (uid)         => api.delete(`/admin/utilisateurs/${uid}`),
  getModeration:          ()            => api.get('/admin/moderation'),
  approuver:              (id)          => api.post(`/admin/moderation/${id}/approuver`),
  rejeter:                (id)          => api.post(`/admin/moderation/${id}/rejeter`),
  scanner:                ()            => api.post('/admin/moderation/scanner'),
  diffuser:               (data)        => api.post('/admin/diffuser', data),
  getVitrines:            ()            => api.get('/admin/vitrines'),
  getJournal:             ()            => api.get('/admin/journal'),
};
