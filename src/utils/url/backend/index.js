// Adresses du serveur (backend) — source unique de l'URL de l'API et de tous ses endpoints.
// Pour changer une route côté serveur, la modifier ici uniquement.

// Adresse de l'API (variable d'environnement en production, serveur local sinon)
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Origine du serveur, sans le suffixe /api
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

// Requêtes jamais mises en file d'attente hors ligne (santé, authentification, diagnostic)
export const PREFIXES_SANS_FILE_ATTENTE = ['/health', '/auth/', '/diag'];

export const ENDPOINTS = {
  sante: '/health',

  auth: {
    envoyerCode:      '/auth/send-code',
    inscription:      '/auth/register',
    envoyerCodeReset: '/auth/reset-send-code',
    reinitialiserMdp: '/auth/reset-password',
    moi:              '/auth/me',
  },

  clients: {
    racine:     '/clients',
    parId:      (id) => `/clients/${id}`,
    historique: (id) => `/clients/${id}/historique`,
  },

  dettes: {
    racine:     '/dettes',
    aRelancer:  '/dettes/relancer',
    parClient:  (clientId) => `/dettes/client/${clientId}`,
    parId:      (id) => `/dettes/${id}`,
    ajouter:    (id) => `/dettes/${id}/ajouter`,
    reduire:    (id) => `/dettes/${id}/reduire`,
    abandonner: (id) => `/dettes/${id}/abandonner`,
    historique: (id) => `/dettes/${id}/historique`,
  },

  // Boutique (/produits) et magasin (/magasin) partagent la même forme d'API
  produits: stock('/produits'),
  magasin: {
    ...stock('/magasin'),
    transfertGroupe: '/magasin/transfert-groupe',
  },
  prixVisibleCatalogue: '/produits/catalogue/prix-visible',

  typesProduits: {
    racine: '/types-produits',
    parId:  (id) => `/types-produits/${id}`,
  },

  notifications: {
    racine:  '/notifications',
    lire:    (id) => `/notifications/${id}/lire`,
    lireTout: '/notifications/lire-tout',
  },

  parametres: {
    racine:         '/parametres',
    images:         '/parametres/images',
    supprimerImage: (publicId) => `/parametres/images?publicId=${encodeURIComponent(publicId)}`,
  },

  compte: {
    racine: '/compte',
    parId:  (id) => `/compte/${id}`,
  },

  finances: '/finances',

  fournisseurs: {
    racine:           '/fournisseurs',
    parId:            (id) => `/fournisseurs/${id}`,
    livraisons:       (id) => `/fournisseurs/${id}/livraisons`,
    validerLivraison: (id, livraisonId) => `/fournisseurs/${id}/livraisons/${livraisonId}/valider`,
  },

  fournisseursContacts: {
    racine: '/fournisseurs-contacts',
    parId:  (id) => `/fournisseurs-contacts/${id}`,
  },

  // Vitrine publique (sans authentification)
  vitrine: {
    prefixeCatalogue: '/vitrine/catalogue/',
    suffixeVue:       '/vue',
    catalogue:   (slug) => `/vitrine/catalogue/${slug}`,
    infos:       (slug) => `/vitrine/${slug}`,
    acces:       (slug) => `/vitrine/${slug}/acces`,
    message:     (slug) => `/vitrine/catalogue/${slug}/message`,
    vue:         (slug) => `/vitrine/catalogue/${slug}/vue`,
    pourVous:    (slug) => `/vitrine/catalogue/${slug}/pour-vous`,
    historique:  (slug) => `/vitrine/catalogue/${slug}/historique`,
  },

  messages: {
    racine:   '/messages',
    parId:    (id) => `/messages/${id}`,
    lire:     (id) => `/messages/${id}/lire`,
    lireTout: '/messages/lire-tout',
  },

  factures: {
    racine: '/factures',
    parId:  (id) => `/factures/${id}`,
  },

  preferences: (cle) => `/preferences/${cle}`,

  admin: {
    stats:            '/admin/stats',
    utilisateurs:     '/admin/utilisateurs',
    utilisateur:      (uid) => `/admin/utilisateurs/${uid}`,
    suspendre:        (uid) => `/admin/utilisateurs/${uid}/suspendre`,
    reactiver:        (uid) => `/admin/utilisateurs/${uid}/reactiver`,
    acces:            (uid) => `/admin/utilisateurs/${uid}/acces`,
    demarrerEssais:   '/admin/acces/demarrer-essais',
    moderation:       '/admin/moderation',
    approuver:        (id) => `/admin/moderation/${id}/approuver`,
    rejeter:          (id) => `/admin/moderation/${id}/rejeter`,
    scanner:          '/admin/moderation/scanner',
    diffuser:         '/admin/diffuser',
    vitrines:         '/admin/vitrines',
    journal:          '/admin/journal',
  },
};

// Endpoints communs à la boutique et au magasin
function stock(base) {
  return {
    racine:           base,
    parId:            (id) => `${base}/${id}`,
    prixAchat:        (id) => `${base}/${id}/prix-achat`,
    verifierMdp:      `${base}/verifier-mdp`,
    ajouterStock:     (id) => `${base}/${id}/stock/ajouter`,
    reduireStock:     (id) => `${base}/${id}/stock/reduire`,
    ajusterStock:     (id) => `${base}/${id}/stock/ajuster`,
    historique:       (id) => `${base}/${id}/historique`,
    annulerMouvement: (id, histoId) => `${base}/${id}/historique/${histoId}/annuler`,
  };
}
