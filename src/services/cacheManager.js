// Gestionnaire de cache local pour l'accès offline aux données
// Stocke les réponses des endpoints importants dans localStorage

const CACHE_PREFIX = 'gestrack_cache_';
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure (au lieu de 30 min)

export const cacheManager = {
  // Sauvegarder une réponse en cache
  set: (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  },

  // Récupérer du cache si valide
  get: (key) => {
    try {
      const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);
      const age = Date.now() - timestamp;

      // Retourner le cache s'il n'est pas expiré
      if (age < CACHE_DURATION) {
        return { data, fromCache: true, age };
      }

      // Cache expiré, mais le retourner quand même en offline
      return { data, fromCache: true, expired: true, age };
    } catch (e) {
      console.warn('Cache read failed:', e);
      return null;
    }
  },

  // Effacer un cache
  clear: (key) => {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (e) {
      console.warn('Cache clear failed:', e);
    }
  },

  // Effacer tous les caches
  clearAll: () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Cache clear all failed:', e);
    }
  },
};
