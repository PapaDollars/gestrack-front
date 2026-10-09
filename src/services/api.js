// Service centralisé pour les appels API — avec cache mémoire pour réduire les lectures Firestore
import axios from 'axios';
import { toast } from 'react-toastify';
import { enqueue } from '@/services/syncQueue';
import { cacheManager } from '@/services/cacheManager';
import { auth } from '@/services/firebase';

import { API_URL, ENDPOINTS as EP, PREFIXES_SANS_FILE_ATTENTE } from '@/utils/url/backend';

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

// Intercepteur requête — attache une clé d'idempotence unique à chaque mutation, générée une
// seule fois puis conservée sur tous les rejeux (voir syncQueue.js). Sans ça, une requête qui
// réussit côté serveur mais dont la réponse se perd (timeout, veille Render) est vue comme
// "échouée" par le client, remise en file, et rejouée toutes les 30s — créant un doublon à
// chaque tentative puisque le serveur ne peut pas savoir que c'est la même action.
const genererCle = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

api.interceptors.request.use(async (config) => {
  // Jeton Firebase frais à chaque requête : il expire au bout d'1 h et n'était lu qu'une fois à la
  // connexion. Une fois expiré, le serveur rejetait la requête (prod) ou basculait sur le compte
  // fictif « dev_user » (local) — d'où un profil dev@gestrack.com au lieu du vrai compte.
  // getIdToken() renvoie le jeton en cache et ne le renouvelle que lorsqu'il approche l'expiration.
  const utilisateur = auth.currentUser;
  if (utilisateur) {
    try {
      const token = await utilisateur.getIdToken();
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } catch { /* hors ligne : on garde l'en-tête existant */ }
  }
  const method = config.method?.toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method) && !config.headers?.['X-Idempotency-Key']) {
    config.headers = config.headers || {};
    config.headers['X-Idempotency-Key'] = genererCle();
  }
  return config;
});

// Intercepteur réponse — met en file d'attente les mutations réseau qui échouent
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error.config;
    // Accès payant refusé (compte en attente d'approbation, essai expiré, bloqué) :
    // le Layout affiche l'écran de blocage à la place de l'application.
    const codeAcces = error.response?.status === 403 && error.response?.data?.code;
    if (typeof codeAcces === 'string' && codeAcces.startsWith('ACCES_')) {
      window.dispatchEvent(new CustomEvent('gestrack:acces-refuse', { detail: error.response.data }));
    }
    const estErreurReseau = !error.response; // pas de réponse = serveur injoignable
    const estMutation = cfg && ['post', 'put', 'patch', 'delete'].includes(cfg.method?.toLowerCase());
    const estMultipart = cfg?.headers?.['Content-Type']?.includes('multipart');
    // Le suivi de vue (catalogue public) est un simple ping statistique fire-and-forget :
    // pas de mise en file ni de toast si le visiteur (anonyme) est hors ligne ou si le
    // serveur est en veille, ça n'a aucune valeur métier à rejouer.
    const estVueTracking = cfg?.url?.includes(EP.vitrine.prefixeCatalogue) && cfg?.url?.includes(EP.vitrine.suffixeVue);
    const estExclus = estVueTracking || PREFIXES_SANS_FILE_ATTENTE.some(p => cfg?.url?.includes(p));
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
  getAll:       ()           => cGet('clients', () => api.get(EP.clients.racine)),
  getById:      (id)         => api.get(EP.clients.parId(id)),
  create:       (fd)         => api.post(EP.clients.racine, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('clients'); return r; }),
  update:       (id, fd)     => api.put(EP.clients.parId(id), fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('clients'); return r; }),
  delete:       (id)         => api.delete(EP.clients.parId(id))
                                   .then(r => { cDel('clients', 'dettes'); return r; }),
  getHistorique:(id)         => api.get(EP.clients.historique(id)),
};

// ─────────────────────────────────────────────────────────────────────────────
// DETTES
// ─────────────────────────────────────────────────────────────────────────────
// Chaque mutation de dette recalcule aussi totalDette côté serveur (voir dettesController.js) —
// il faut donc invalider le cache 'clients' en plus de 'dettes', sinon la page /clients continue
// d'afficher l'ancien total tant qu'aucune mutation de client n'a eu lieu.
export const dettesAPI = {
  getAll:       ()           => cGet('dettes', () => api.get(EP.dettes.racine)),
  getByClient:  (clientId)   => api.get(EP.dettes.parClient(clientId)),
  getARelancer: ()           => cGet('dettes_relancer', () => api.get(EP.dettes.aRelancer)),
  create:       (cId, data)  => api.post(EP.dettes.parClient(cId), data)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  ajouter:      (id, data)   => api.patch(EP.dettes.ajouter(id), data)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  reduire:      (id, data)   => api.patch(EP.dettes.reduire(id), data)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  abandonner:   (id, data)   => api.patch(EP.dettes.abandonner(id), data)
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  delete:       (id)         => api.delete(EP.dettes.parId(id))
                                   .then(r => { cDel('dettes', 'dettes_relancer', 'clients'); return r; }),
  getHistorique:(id)         => api.get(EP.dettes.historique(id)),
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUITS (boutique)
// ─────────────────────────────────────────────────────────────────────────────
export const produitsAPI = {
  getAll:       ()           => cGet('produits', () => api.get(EP.produits.racine)),
  getPrixAchat: (id)         => api.get(EP.produits.prixAchat(id)),
  verifierMdp:  (mdp)        => api.post(EP.produits.verifierMdp, { motDePasse: mdp }),
  // 'magasin' invalidé aussi : la création/modification peut lier ou synchroniser
  // ce produit avec son équivalent magasin (nom, prix, catégorie...)
  create:       (fd)         => api.post(EP.produits.racine, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('produits', 'magasin', 'finances'); return r; }),
  update:       (id, fd)     => api.put(EP.produits.parId(id), fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('produits', 'magasin', 'finances'); return r; }),
  ajouterStock: (id, data)   => api.patch(EP.produits.ajouterStock(id), data)
                                   .then(r => { cDel('produits'); return r; }),
  reduireStock: (id, data)   => api.patch(EP.produits.reduireStock(id), data)
                                   .then(r => { cDel('produits', 'finances'); return r; }),
  ajusterStock: (id, data)   => api.patch(EP.produits.ajusterStock(id), data)
                                   .then(r => { cDel('produits', 'finances'); return r; }),
  delete:       (id)         => api.delete(EP.produits.parId(id))
                                   .then(r => { cDel('produits', 'magasin', 'finances'); return r; }),
  getHistorique:     (id)              => api.get(EP.produits.historique(id)),
  annulerMouvement:  (produitId, histoId) => api.post(EP.produits.annulerMouvement(produitId, histoId))
                                               .then(r => { cDel('produits', 'finances'); return r; }),
  definirPrixVisibleCatalogue: (produits) => api.put(EP.prixVisibleCatalogue, { produits })
                                               .then(r => { cDel('produits'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES DE PRODUITS
// ─────────────────────────────────────────────────────────────────────────────
export const typesProduitAPI = {
  getAll:  () =>    cGet('types_produit', () => api.get(EP.typesProduits.racine)),
  ajouter: (nom) => api.post(EP.typesProduits.racine, { nom })
                       .then(r => { cDel('types_produit'); return r; }),
  modifier: (id, nom) => api.put(EP.typesProduits.parId(id), { nom })
                             .then(r => { cDel('types_produit'); return r; }),
  supprimer: (id) => api.delete(EP.typesProduits.parId(id))
                         .then(r => { cDel('types_produit'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const notificationsAPI = {
  getAll:       ()   => cGet('notifications', () => api.get(EP.notifications.racine)),
  marquerLu:    (id) => api.patch(EP.notifications.lire(id))
                           .then(r => { cDel('notifications'); return r; }),
  marquerToutLu:()   => api.patch(EP.notifications.lireTout)
                           .then(r => { cDel('notifications'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES
// ─────────────────────────────────────────────────────────────────────────────
export const parametresAPI = {
  get:    ()     => cGet('parametres', () => api.get(EP.parametres.racine)),
  update: (data) => api.put(EP.parametres.racine, data)
                       .then(r => { cDel('parametres'); return r; }),
  getImages:       ()           => api.get(EP.parametres.images),
  uploaderImages:  (fichiers)   => {
    const fd = new FormData();
    fichiers.forEach(f => fd.append('images', f));
    return api.post(EP.parametres.images, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  supprimerImage:  (publicId)   => api.delete(EP.parametres.supprimerImage(publicId)),
};

// ─────────────────────────────────────────────────────────────────────────────
// MAGASIN
// ─────────────────────────────────────────────────────────────────────────────
export const magasinAPI = {
  getAll:       ()           => cGet('magasin', () => api.get(EP.magasin.racine)),
  getPrixAchat: (id)         => api.get(EP.magasin.prixAchat(id)),
  verifierMdp:  (mdp)        => api.post(EP.magasin.verifierMdp, { motDePasse: mdp }),
  // 'produits' invalidé aussi : la création/modification peut lier ou synchroniser
  // ce produit avec son équivalent boutique (nom, prix, catégorie...)
  create:       (fd)         => api.post(EP.magasin.racine, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('magasin', 'produits', 'finances'); return r; }),
  update:       (id, fd)     => api.put(EP.magasin.parId(id), fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                                   .then(r => { cDel('magasin', 'produits', 'finances'); return r; }),
  ajouterStock: (id, data)   => api.patch(EP.magasin.ajouterStock(id), data)
                                   .then(r => { cDel('magasin'); return r; }),
  // 'produits' invalidé aussi : une sortie magasin peut transférer du stock vers la boutique
  reduireStock: (id, data)   => api.patch(EP.magasin.reduireStock(id), data)
                                   .then(r => { cDel('magasin', 'produits', 'finances'); return r; }),
  ajusterStock: (id, data)   => api.patch(EP.magasin.ajusterStock(id), data)
                                   .then(r => { cDel('magasin', 'finances'); return r; }),
  delete:       (id)         => api.delete(EP.magasin.parId(id))
                                   .then(r => { cDel('magasin', 'produits', 'finances'); return r; }),
  getHistorique:     (id)              => api.get(EP.magasin.historique(id)),
  annulerMouvement:  (produitId, histoId) => api.post(EP.magasin.annulerMouvement(produitId, histoId)),
  // 'produits' invalidé aussi : chaque transfert réussi alimente son produit boutique
  transfertGroupe:   (transferts)      => api.post(EP.magasin.transfertGroupe, { transferts })
                                            .then(r => { cDel('magasin', 'produits', 'finances'); return r; })
                                               .then(r => { cDel('magasin', 'finances'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPTE PERSONNEL
// ─────────────────────────────────────────────────────────────────────────────
export const compteAPI = {
  getAll:  ()         => cGet('compte', () => api.get(EP.compte.racine)),
  create:  (data)     => api.post(EP.compte.racine, data)
                            .then(r => { cDel('compte'); return r; }),
  update:  (id, data) => api.put(EP.compte.parId(id), data)
                            .then(r => { cDel('compte'); return r; }),
  delete:  (id)       => api.delete(EP.compte.parId(id))
                            .then(r => { cDel('compte'); return r; }),
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCES MÉTIER
// ─────────────────────────────────────────────────────────────────────────────
export const financesAPI = {
  get: () => cGet('finances', () => api.get(EP.finances)),
  refresh: () => cRefresh('finances', () => api.get(EP.finances)),
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFIL UTILISATEUR
// ─────────────────────────────────────────────────────────────────────────────
export const fournisseursAPI = {
  getAll:          ()                => api.get(EP.fournisseurs.racine),
  create:          (data)            => { const isfd = data instanceof FormData; return api.post(EP.fournisseurs.racine, data, isfd ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}); },
  update:          (id, data)        => { const isfd = data instanceof FormData; return api.put(EP.fournisseurs.parId(id), data, isfd ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}); },
  delete:          (id)              => api.delete(EP.fournisseurs.parId(id)),
  ajouterLivraison:(id, data)        => api.post(EP.fournisseurs.livraisons(id), data),
  validerLivraison:(id, lid, data={})=> api.post(EP.fournisseurs.validerLivraison(id, lid), data),
};

export const fournisseursContactsAPI = {
  getAll: ()         => api.get(EP.fournisseursContacts.racine),
  create: (data)     => api.post(EP.fournisseursContacts.racine, data),
  update: (id, data) => api.put(EP.fournisseursContacts.parId(id), data),
  delete: (id)       => api.delete(EP.fournisseursContacts.parId(id)),
};

// Vitrine publique — pas d'authentification requise
export const vitrineAPI = {
  getCatalogue:    (slug)             => api.get(EP.vitrine.catalogue(slug)),
  getInfosBoutique:(slug)             => api.get(EP.vitrine.infos(slug)),
  acceder:         (slug, motDePasse) => api.post(EP.vitrine.acces(slug), { motDePasse }),
  envoyerMessage:  (slug, data)       => api.post(EP.vitrine.message(slug), data),
  enregistrerVue:  (slug, data)       => api.post(EP.vitrine.vue(slug), data),
  getPourVous:     (slug, visiteurId) => api.get(EP.vitrine.pourVous(slug), { params: { visiteurId } }),
  getHistorique:   (slug, visiteurId) => api.get(EP.vitrine.historique(slug), { params: { visiteurId } }),
};

// Messages reçus depuis le catalogue public (réservation produit / contact général)
export const messagesAPI = {
  getAll:        ()   => cGet('messages', () => api.get(EP.messages.racine)),
  // Contourne le cache — utilisé pour le sondage périodique (badge + page Messages), sinon
  // un nouveau message envoyé depuis le catalogue public (session anonyme, jamais notifiée
  // du côté boutique) resterait invisible tant que le cache mémoire n'est pas vidé.
  refresh:       ()   => cRefresh('messages', () => api.get(EP.messages.racine)),
  marquerLu:     (id) => api.patch(EP.messages.lire(id)).then(r => { cDel('messages'); return r; }),
  marquerToutLu: ()   => api.patch(EP.messages.lireTout).then(r => { cDel('messages'); return r; }),
  delete:        (id) => api.delete(EP.messages.parId(id)).then(r => { cDel('messages'); return r; }),
};

export const facturesAPI = {
  getAll:  ()           => api.get(EP.factures.racine),
  // 'finances' invalidé aussi : une facture (création, modif de lignes, remise...) change
  // le stock et/ou le bénéfice affichés dans Mes Finances.
  create:  (data)       => api.post(EP.factures.racine, data)
                              .then(r => { cDel('dettes', 'dettes_relancer', 'clients', 'finances'); return r; }),
  update:  (id, data)   => api.put(EP.factures.parId(id), data)
                              .then(r => { cDel('dettes', 'dettes_relancer', 'clients', 'finances'); return r; }),
  delete:  (id)         => api.delete(EP.factures.parId(id))
                              .then(r => { cDel('dettes', 'dettes_relancer', 'clients', 'finances'); return r; }),
  getById: (id)         => api.get(EP.factures.parId(id)),
};

// Authentification (inscription / mot de passe oublié)
export const authAPI = {
  envoyerCode:      (email)       => api.post(EP.auth.envoyerCode, { email }),
  inscrire:         (data)        => api.post(EP.auth.inscription, data),
  envoyerCodeReset: (email)       => api.post(EP.auth.envoyerCodeReset, { email }),
  reinitialiserMdp: (data)        => api.post(EP.auth.reinitialiserMdp, data),
};

// Santé du serveur (détection hors ligne)
export const santeAPI = {
  verifier: (options) => api.get(EP.sante, options),
};

export const profilAPI = {
  get:    ()     => api.get(EP.auth.moi),
  update: (data) => api.put(EP.auth.moi, data),
  // Changement de mot de passe : code envoyé à l'email du compte, puis validation
  envoyerCodeMotDePasse: ()     => api.post(EP.auth.codeMotDePasse),
  changerMotDePasse:     (data) => api.post(EP.auth.motDePasse, data),
};

export const preferencesAPI = {
  get:    (cle)         => api.get(EP.preferences(cle)),
  update: (cle, data)   => api.put(EP.preferences(cle), data),
};

export default api;
