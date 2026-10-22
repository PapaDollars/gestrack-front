// Version gratuite limitée (statut d'accès « limite », ou abonnement Pro expiré) : pages
// utilisables. Les autres ouvrent la fenêtre « Passer à la version Pro ». Le serveur applique
// la même règle sur ses routes (backend services/plans.js → ROUTES_GRATUIT).
import { ROUTES } from '@/utils/url/frontend';

const PAGES_GRATUIT = [
  ROUTES.clients, ROUTES.dettes, ROUTES.boutique,
  // pages sans action métier : réglages du compte, notifications, aide, tarifs
  ROUTES.parametres, ROUTES.notifications, ROUTES.guide, ROUTES.profil, ROUTES.tarifs,
];

export const pageAutoriseeGratuit = (chemin = '') =>
  PAGES_GRATUIT.some(p => chemin === p || chemin.startsWith(`${p}/`) || chemin.startsWith(`${p}?`));

export const estModeLimite = (acces) => acces?.autorise !== false && acces?.mode === 'limite';

// Événement global : ouvrir la fenêtre « Passer à la version Pro » (detail : réponse serveur)
export const EVT_PASSER_PRO = 'gestrack:passer-pro';
export const demanderPassagePro = (detail = {}) => window.dispatchEvent(new CustomEvent(EVT_PASSER_PRO, { detail }));
