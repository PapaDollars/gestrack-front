import axios from 'axios';
import { auth } from '@/services/firebase';

import { API_URL, ENDPOINTS } from '@/utils/url/backend';

const EP = ENDPOINTS.admin;
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
  getStats:               ()            => api.get(EP.stats),
  getUtilisateurs:        ()            => api.get(EP.utilisateurs),
  getUtilisateur:         (uid)         => api.get(EP.utilisateur(uid)),
  suspendre:              (uid)         => api.post(EP.suspendre(uid)),
  reactiver:              (uid)         => api.post(EP.reactiver(uid)),
  // Accès payant : action = 'approuver' | 'bloquer' | 'prolonger' (+ jours)
  changerAcces:           (uid, action, jours) => api.post(EP.acces(uid), { action, jours }),
  demarrerEssais:         ()            => api.post(EP.demarrerEssais),
  supprimer:              (uid)         => api.delete(EP.utilisateur(uid)),
  getModeration:          ()            => api.get(EP.moderation),
  approuver:              (id)          => api.post(EP.approuver(id)),
  rejeter:                (id)          => api.post(EP.rejeter(id)),
  scanner:                ()            => api.post(EP.scanner),
  diffuser:               (data)        => api.post(EP.diffuser, data),
  getVitrines:            ()            => api.get(EP.vitrines),
  getJournal:             ()            => api.get(EP.journal),
};
