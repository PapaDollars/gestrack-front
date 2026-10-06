// Chemins (URL) de l'application front — source unique pour les <Route>, <Link>, navigate()
// et les liens absolus partagés (catalogue, boutique publique, emails).
// Pour changer une URL, la modifier ici uniquement.

// ── Pages ────────────────────────────────────────────────────────────────────
export const ROUTES = {
  // Public
  accueil:          '/',
  vitrine:          '/vitrine',
  confidentialite:  '/confidentialite',
  catalogue:        (slug) => `/catalogue/${slug}`,
  boutiquePublique: (slug) => `/${slug}`,

  // Authentification
  connexion:        '/login',
  inscription:      '/register',
  motDePasseOublie: '/forgot-password',

  // Application (connecté)
  dashboard:        '/dashboard',
  clients:          '/clients',
  dettes:           '/dettes',
  dettesClient:     (clientId) => `/clients/${clientId}/dettes`,
  factures:         '/factures',
  facture:          (id) => `/factures?id=${id}`,
  boutique:         '/produits',
  produitBoutique:  (id) => `/produits?produit=${id}`,
  magasin:          '/magasin',
  fournisseurs:     '/fournisseurs',
  fournisseur:      (id) => `/fournisseurs/${id}`,
  finances:         '/finances',
  mesFinances:      '/finances/mes-finances',
  monCompte:        '/finances/compte',
  parametres:       '/parametres',
  statistiques:     '/statistiques',
  notifications:    '/notifications',
  messages:         '/messages',
  guide:            '/guide',
  profil:           '/profil',

  // Administration
  admin:             '/admin',
  adminUtilisateurs: '/admin/utilisateurs',
  adminModeration:   '/admin/moderation',
  adminVitrines:     '/admin/vitrines',
  adminJournal:      '/admin/journal',
};

// ── Motifs de routes (paramètres React Router) — utilisés seulement dans App.jsx ──
export const MOTIFS = {
  catalogue:        '/catalogue/:slug',
  boutiquePublique: '/:slug',
  dettesClient:     '/clients/:clientId/dettes',
  fournisseur:      '/fournisseurs/:fournisseurId',
  inconnue:         '*',
};

// ── Liens absolus (à partager hors de l'application) ─────────────────────────
export const urlAbsolue = (chemin = '/') => `${window.location.origin}${chemin}`;

// ── Contact ──────────────────────────────────────────────────────────────────
export const EMAIL_CONTACT = 'gestrack.gt@gmail.com';
// Compte administrateur (accès au panneau /admin) — même adresse que le contact
export const EMAIL_ADMIN = EMAIL_CONTACT;

// Lien mailto avec sujet / corps optionnels
export const mailto = (email = EMAIL_CONTACT, { sujet, corps } = {}) => {
  const params = [];
  if (sujet) params.push(`subject=${encodeURIComponent(sujet)}`);
  if (corps) params.push(`body=${encodeURIComponent(corps)}`);
  return `mailto:${email}${params.length ? `?${params.join('&')}` : ''}`;
};
