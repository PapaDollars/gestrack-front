// Contenu du guide : premiers pas, guide par rubrique, mots à connaître et questions fréquentes.
// Les noms des boutons et des menus doivent rester ceux de l'application : à mettre à jour
// ici quand un libellé change.
import {
  faHome, faUsers, faFileInvoiceDollar, faStore, faWarehouse, faChartLine,
  faBell, faCog, faReceipt, faTruck, faCommentDots, faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { EMAIL_CONTACT } from '@/utils/url/frontend';

// ── Premiers pas : l'ordre conseillé pour bien démarrer ──────────────────────
export const PREMIERS_PAS = [
  {
    titre: 'Réglez votre compte',
    texte: 'Ouvrez Paramètres (en bas du menu). Dans « Mon compte › Profils », vérifiez votre nom. Dans « Apparences », choisissez la devise et le thème. Dans « Mon compte › Sécurités », créez votre code : il cache vos prix d\'achat et vos bénéfices aux personnes qui utilisent votre téléphone.',
  },
  {
    titre: 'Ajoutez vos produits',
    texte: 'Dans Boutique (les produits que vous vendez au comptoir), cliquez sur « Nouveau produit ». Donnez le nom, la photo, l\'unité (pièce, douzaine, carton, ballo…), le prix de vente, le prix d\'achat et le stock de départ. Si vous avez un dépôt, faites la même chose dans Magasin.',
  },
  {
    titre: 'Ajoutez vos clients',
    texte: 'Dans Clients, cliquez sur « Nouveau client » : nom, téléphone, WhatsApp, profession. Un client enregistré peut recevoir des factures et avoir des dettes.',
  },
  {
    titre: 'Faites votre première vente',
    texte: 'Dans Factures, cliquez sur « Nouvelle facture ». Choisissez le client, ajoutez les produits, indiquez ce que le client paie maintenant. Le stock baisse tout seul et, si le client n\'a pas tout payé, le reste devient une dette.',
  },
  {
    titre: 'Suivez l\'argent qu\'on vous doit',
    texte: 'Dans Dettes, vous voyez qui vous doit combien. Quand un client paie une partie, ouvrez sa dette et faites « Actions › Paiement ». GesTrack vous rappelle les dettes qui traînent.',
  },
  {
    titre: 'Regardez vos résultats',
    texte: 'Le Tableau de bord montre l\'essentiel du jour. Finances › Mes Finances montre ce que vous avez vendu et votre bénéfice, par jour, semaine ou mois.',
  },
];

// ── Guide par rubrique (une entrée par page du menu) ─────────────────────────
// a_quoi_ca_sert : une phrase ; etapes : comment faire ; astuces : bon à savoir
export const RUBRIQUES = [
  {
    id: 'tableau-de-bord', icon: faHome, color: '#00d4aa', titre: 'Tableau de bord',
    a_quoi_ca_sert: 'La page d\'accueil : un résumé de toute votre activité en un coup d\'œil.',
    etapes: [
      'En haut, les chiffres clés : nombre de clients, dettes en cours, produits, factures, commandes fournisseurs. Cliquez sur un chiffre pour ouvrir la page correspondante.',
      'Le bloc « Alertes » signale ce qui demande votre attention : dettes en retard, produits presque épuisés, commandes fournisseurs en attente.',
      'Plus bas : la répartition des dettes, les livraisons fournisseurs, les dernières factures, vos plus gros débiteurs, les produits récents et le stock faible.',
    ],
    astuces: [
      'Vous pouvez changer l\'ordre de ces blocs dans Paramètres › Apparences › « Ordre du tableau de bord ».',
      'Un produit est en « stock faible » quand il en reste 5 pièces ou moins.',
    ],
  },
  {
    id: 'clients', icon: faUsers, color: '#6366f1', titre: 'Clients',
    a_quoi_ca_sert: 'Votre carnet de clients, avec leurs contacts et ce qu\'ils vous doivent.',
    etapes: [
      'Cliquez sur « Nouveau client » et remplissez le nom, le téléphone, le numéro WhatsApp et la profession (ex. « Commerçant Garoua »).',
      'Sur la carte d\'un client : « Dettes » ouvre toutes ses dettes, « Infos » montre sa fiche (avec Modifier et Supprimer).',
      'Cliquez sur le numéro WhatsApp pour lui écrire directement.',
      'Utilisez la recherche et les filtres (profession, produits achetés) pour retrouver un client.',
    ],
    astuces: [
      'L\'épingle en haut à droite d\'une carte la garde en tête de liste. Vous pouvez aussi déplacer les cartes en les faisant glisser.',
      'La profession sert à regrouper vos clients : le Tableau de bord affiche combien de clients vous avez par profession.',
    ],
  },
  {
    id: 'factures', icon: faReceipt, color: '#0ea5e9', titre: 'Factures',
    a_quoi_ca_sert: 'Enregistrer une vente à un client, avec une facture que vous pouvez imprimer ou envoyer.',
    etapes: [
      'Cliquez sur « Nouvelle facture » et choisissez le client.',
      'Cherchez un produit et ajoutez-le. Réglez la quantité, l\'unité et le prix. Chaque nouveau produit s\'ajoute en bas, juste au-dessus du total.',
      'Ajoutez une remise si besoin, puis indiquez l\'avance (ce que le client paie maintenant) et le moyen de paiement : Espèces, Orange Money ou MTN Money (vous pouvez répartir entre les trois).',
      'Validez. Ouvrez ensuite la facture et cliquez sur « Télécharger / Partager » pour l\'imprimer ou l\'envoyer par WhatsApp.',
    ],
    astuces: [
      'Le stock des produits vendus baisse automatiquement. Si vous supprimez la facture, le stock revient.',
      'Si l\'avance est plus petite que le total, le reste devient une dette du client, liée à la facture.',
      'Le texte imprimé en bas des factures (conditions de vente) se règle dans Paramètres › Factures.',
    ],
  },
  {
    id: 'dettes', icon: faFileInvoiceDollar, color: '#f59e0b', titre: 'Dettes',
    a_quoi_ca_sert: 'Savoir qui vous doit de l\'argent, combien, et suivre chaque remboursement.',
    etapes: [
      'La page Dettes liste les dettes de tous les clients. Cliquez sur un client pour voir le détail de ses dettes.',
      'Sur une dette, le menu « Actions » propose : Paiement (le client rembourse une partie), Ajouter (il prend encore à crédit), Solder (il a tout payé), Abandonner (vous renoncez à cet argent), Imprimer.',
      '« Historique » sous chaque dette montre tous les paiements, avec la date et le moyen de paiement.',
      'Pour une dette sans facture (argent prêté, ancienne dette), cliquez sur « Nouvelle dette ».',
    ],
    astuces: [
      'Une dette passe « En retard » quand elle dépasse le délai choisi dans Paramètres › Rappels. Vous recevez alors une notification.',
      'Une dette créée avec « Nouvelle dette » ne touche ni le stock ni les finances : pour une vente à crédit, passez plutôt par une facture.',
      '« Imprimer les dettes » prépare un relevé à remettre au client.',
      'L\'icône ⓘ à côté du nom du client ouvre sa fiche sans quitter la page.',
    ],
  },
  {
    id: 'boutique', icon: faStore, color: '#00d4aa', titre: 'Boutique',
    a_quoi_ca_sert: 'Le stock que vous vendez au comptoir, produit par produit.',
    etapes: [
      'Cliquez sur « Nouveau produit » : photo, nom, catégorie, unité, prix de vente, prix d\'achat, stock de départ.',
      'Cliquez sur une carte produit pour ouvrir ses détails : Vendre (sortie de stock sans facture), Ajuster (corriger le stock après un comptage), Modifier, Supprimer, et l\'historique de tous les mouvements.',
      '« Promotions » met plusieurs produits en Soldes ou en Vente Flash en une fois, avec l\'ancien prix barré.',
      '« Importer produit » reprend un produit qui existe déjà dans le Magasin.',
    ],
    astuces: [
      'Vendre en « Détail » impose au moins le prix enregistré ; en « Gros », le prix est libre (pour les revendeurs).',
      'Le prix d\'achat est caché derrière votre code : cliquez sur l\'œil et tapez le code pour le voir.',
      'Les ventes d\'un produit en Soldes comptent dans le chiffre d\'affaires mais pas dans les bénéfices.',
      'Une erreur dans l\'historique ? Une entrée ou une sortie peut être annulée : le stock est recalculé.',
    ],
  },
  {
    id: 'magasin', icon: faWarehouse, color: '#3b82f6', titre: 'Magasin',
    a_quoi_ca_sert: 'Votre dépôt ou entrepôt : le stock en gros, gardé à part de la boutique.',
    etapes: [
      'Ajoutez vos produits avec « Nouveau produit », comme en boutique.',
      '« Transférer » envoie des produits du magasin vers la boutique : le stock baisse ici et monte en boutique. Si le produit n\'existe pas encore en boutique, il est créé.',
      'Dans les détails d\'un produit, « Transférer » fait la même chose pour un seul produit, et « Ajuster » corrige le stock.',
    ],
    astuces: [
      'Les promotions se gèrent uniquement depuis la Boutique. Le magasin affiche les badges Soldes et Vente Flash du même produit en boutique.',
      'Un produit du magasin et son équivalent en boutique partagent le nom, les prix, la catégorie et l\'unité. Chacun garde son propre stock.',
    ],
  },
  {
    id: 'fournisseurs', icon: faTruck, color: '#f97316', titre: 'Fournisseurs',
    a_quoi_ca_sert: 'Suivre ce que vous commandez à vos fournisseurs et ce qui est déjà arrivé.',
    etapes: [
      'Cliquez sur « Nouveau fournisseur » : nom, téléphone, ville.',
      'Ouvrez le fournisseur et cliquez sur « Nouvelle commande » : choisissez les produits (ou créez-en un nouveau), la quantité, le prix d\'achat et la destination (Boutique ou Magasin).',
      'Quand la marchandise arrive, ouvrez la commande et cliquez sur « + Enregistrer la livraison » avec la quantité reçue. Une commande peut arriver en plusieurs fois.',
      'Validez la livraison (« Cliquer ici pour valider → Stock ») : le stock du produit augmente à ce moment-là.',
    ],
    astuces: [
      'La barre de progression montre combien a été livré sur ce qui a été commandé.',
      'Si le prix d\'achat change d\'une commande à l\'autre, GesTrack calcule un prix d\'achat moyen (voir « CUMP » dans les mots à connaître).',
      'Le chiffre orange à côté de « Fournisseurs » dans le menu compte les commandes encore en cours.',
    ],
  },
  {
    id: 'finances', icon: faChartLine, color: '#8b5cf6', titre: 'Finances',
    a_quoi_ca_sert: 'Voir ce que vous gagnez (Mes Finances) et noter l\'argent qui entre et sort de votre caisse (Mon Compte).',
    etapes: [
      'Mes Finances : choisissez la période (cette semaine, ce mois, personnalisé…) et l\'onglet Boutique, Magasin ou Global. Vous voyez le chiffre d\'affaires, le coût d\'achat et le bénéfice, produit par produit.',
      'Les encaissements sont séparés : avances sur factures, factures réglées, remboursements de dettes, ventes directes, et par moyen de paiement (Espèces, Orange Money, MTN Money).',
      'Mon Compte : cliquez sur « Nouvelle entrée » pour noter de l\'argent de votre caisse personnelle, avec le montant, la date et le type de paiement (Espèces, Orange Money, Mobile Money).',
      '« Imprimer » prépare un rapport de la période affichée.',
    ],
    astuces: [
      'Une vente à crédit est comptée en entier le jour de la facture, même si le client n\'a pas encore tout payé.',
      'Les bénéfices sont cachés derrière votre code, comme les prix d\'achat.',
    ],
  },
  {
    id: 'messages', icon: faCommentDots, color: '#ec4899', titre: 'Messages',
    a_quoi_ca_sert: 'Recevoir les demandes des visiteurs de votre site vitrine (réservation d\'un produit ou simple question).',
    etapes: [
      'Un visiteur de votre catalogue clique sur un produit et vous envoie un message avec son nom et son numéro.',
      'Le message arrive dans Messages, avec le produit concerné. Le chiffre à côté de « Messages » dans le menu compte les nouveaux messages.',
      'Répondez en un clic par WhatsApp (message déjà rédigé) ou appelez la personne.',
    ],
    astuces: [
      'Le texte des réponses WhatsApp se règle dans Paramètres › Sites vitrine.',
    ],
  },
  {
    id: 'vitrine', icon: faGlobe, color: '#14b8a6', titre: 'Site vitrine (catalogue en ligne)',
    a_quoi_ca_sert: 'Montrer vos produits sur internet avec un lien à partager, sans donner accès à votre compte.',
    etapes: [
      'Dans Paramètres › Sites vitrine, donnez le nom de votre entreprise : il crée l\'adresse de vos pages.',
      'Page ouverte à tous : vos clients voient les produits de la boutique (photo, nom, catégorie, et le prix si vous le choisissez). Les stocks ne sont pas visibles.',
      'Page avec mot de passe : choisissez un mot de passe. Les personnes qui l\'ont voient le stock boutique, le stock magasin et les prix (pratique pour vos revendeurs).',
      'Copiez « Votre lien » et partagez-le sur WhatsApp, Facebook ou en statut.',
    ],
    astuces: [
      'Avec un forfait payant, le nom et le logo de votre entreprise s\'affichent sur l\'écran de chargement et en haut de vos pages.',
      'Les produits en Soldes et en Vente Flash apparaissent dans des rubriques à part, avec l\'ancien prix barré.',
    ],
  },
  {
    id: 'notifications', icon: faBell, color: '#ef4444', titre: 'Notifications',
    a_quoi_ca_sert: 'Les rappels et annonces : dettes en retard, informations sur votre compte.',
    etapes: [
      'La cloche en haut de l\'écran affiche le nombre de notifications non lues. Cliquez dessus pour les voir.',
      'Cliquez sur un rappel de dette pour ouvrir la dette concernée. Marquez les notifications comme lues une par une ou toutes d\'un coup.',
    ],
    astuces: [
      'Le délai avant le rappel d\'une dette se règle dans Paramètres › Rappels (30 jours par défaut).',
    ],
  },
  {
    id: 'parametres', icon: faCog, color: '#6b7280', titre: 'Paramètres',
    a_quoi_ca_sert: 'Régler l\'application selon vos besoins.',
    etapes: [
      'Apparences : thème clair ou sombre, devise des montants, ordre des blocs du tableau de bord.',
      'Mon compte : Profils (vos informations) et Sécurités (mot de passe de connexion et code qui protège les prix d\'achat).',
      'Applications : installer GesTrack sur votre téléphone ou ordinateur, comme une vraie application.',
      'Rappels : au bout de combien de jours une dette est considérée en retard.',
      'Factures : le texte imprimé en bas de vos factures.',
      'Sites vitrine : votre catalogue en ligne, votre logo et les réponses WhatsApp.',
      'Galeries : les images que vous avez importées ; celles qui ne servent plus peuvent être supprimées.',
      'Exports : télécharger la liste de vos clients ou de vos produits.',
    ],
    astuces: [
      'Le bouton « Enregistrer » reste gris tant que rien n\'a changé, et devient vert dès qu\'une modification est faite.',
    ],
  },
];

// ── Mots à connaître ─────────────────────────────────────────────────────────
export const MOTS = [
  { mot: 'ps, dz, crt, sac, ballo', def: 'Les unités : pièce, douzaine (12 pièces), carton, sac, ballo. Pour un carton, un sac ou un ballo, vous indiquez combien de pièces ou de douzaines il contient ; GesTrack fait les conversions.' },
  { mot: 'Avance', def: 'La partie de la facture payée tout de suite. Le reste devient une dette.' },
  { mot: 'Solder une dette', def: 'Indiquer que le client a tout remboursé.' },
  { mot: 'Abandonner une dette', def: 'Renoncer à cet argent. La dette sort des dettes en cours mais reste visible à part.' },
  { mot: 'Détail / Gros', def: 'En détail, le prix ne peut pas descendre sous le prix enregistré. En gros, le prix est libre, pour les revendeurs.' },
  { mot: 'Soldes', def: 'Produit vendu pour s\'en débarrasser : ses ventes comptent dans le chiffre d\'affaires, pas dans les bénéfices.' },
  { mot: 'Vente Flash', def: 'Promotion courte, mise en avant sur votre catalogue avec l\'ancien prix barré.' },
  { mot: 'Ajuster', def: 'Corriger le stock enregistré pour qu\'il corresponde à ce que vous avez compté.' },
  { mot: 'Transférer', def: 'Faire passer de la marchandise du Magasin vers la Boutique.' },
  { mot: 'CUMP', def: 'Coût Unitaire Moyen Pondéré : quand vous rachetez un produit à un autre prix, le prix d\'achat devient la moyenne des deux, selon les quantités.' },
  { mot: 'Code des prix', def: 'Un code, différent du mot de passe de connexion, qui cache les prix d\'achat et les bénéfices.' },
];

// ── Questions fréquentes ─────────────────────────────────────────────────────
export const FAQ_ITEMS = [
  {
    q: 'GesTrack est-il gratuit ?',
    a: `Non. Après l'inscription, votre compte doit être approuvé avant de pouvoir utiliser l'application ; un écran vous invite alors à contacter l'administrateur (${EMAIL_CONTACT}). Les forfaits sont présentés sur la page Tarifs. Si votre accès expire, vos données sont conservées et réapparaissent dès que le compte est de nouveau actif.`,
  },
  {
    q: 'Le stock baisse-t-il tout seul quand je fais une facture ?',
    a: 'Oui. Le stock du produit vendu baisse dès que la facture est créée (en boutique ou en magasin, selon où vous avez choisi le produit). Si vous modifiez les quantités, le stock est corrigé ; si vous supprimez la facture, le stock revient.',
  },
  {
    q: 'Quelle différence entre « Vendre » sur un produit et faire une facture ?',
    a: '« Vendre » (dans les détails d\'un produit) enregistre une sortie de stock rapide, sans client ni facture : pratique au comptoir. La facture est liée à un client, peut laisser une dette et s\'imprime. Les deux comptent dans Mes Finances.',
  },
  {
    q: 'Une dette créée avec « Nouvelle dette » compte-t-elle dans mes finances ?',
    a: 'Non. C\'est un simple montant dû : elle ne touche ni le stock ni Mes Finances, même si vous y écrivez des produits. Pour vendre à crédit, faites une facture avec une avance partielle : le reste devient une dette et la vente est bien comptée.',
  },
  {
    q: 'Une vente à crédit est-elle comptée le jour de la facture ou quand la dette est payée ?',
    a: 'Le jour de la facture, en entier. Les paiements qui suivent ne changent pas le chiffre d\'affaires : Mes Finances montre ce qui a été vendu. Les encaissements (avances, remboursements) sont détaillés à part.',
  },
  {
    q: 'Un produit du Magasin et le même en Boutique sont-ils liés ?',
    a: 'Oui pour les informations : nom, prix de vente, prix d\'achat, catégorie et unité se mettent à jour des deux côtés. Non pour le stock : chacun a le sien. Le lien se crée quand les deux ont le même nom ou dès qu\'un transfert a lieu.',
  },
  {
    q: 'Pourquoi je ne peux pas mettre un produit en promotion depuis le Magasin ?',
    a: 'Les promotions servent à vendre, et la vente se fait en boutique. Elles se gèrent donc depuis la Boutique (bouton « Promotions » ou fiche du produit). Le magasin affiche quand même les badges du même produit.',
  },
  {
    q: 'Si je rachète un produit plus cher, que devient le prix d\'achat ?',
    a: 'GesTrack fait la moyenne entre l\'ancien et le nouveau prix, selon les quantités de chaque livraison (CUMP). Le produit garde un seul prix d\'achat, qui sert à calculer le bénéfice.',
  },
  {
    q: 'J\'ai oublié mon code des prix, que faire ?',
    a: 'Dans Paramètres › Mon compte › Sécurités, changez le code et choisissez « code oublié » : votre mot de passe de connexion remplace l\'ancien code.',
  },
  {
    q: 'Puis-je utiliser GesTrack sans internet ?',
    a: 'En partie. Les pages déjà ouvertes restent visibles, et une action faite sans connexion est mise en attente : elle s\'enregistre dès que la connexion revient. Tant que vous n\'avez pas vu la confirmation, elle n\'est pas encore enregistrée. Le voyant en haut de l\'écran indique « Connecté », « Hors ligne » ou « Synchronisation… ».',
  },
  {
    q: 'Puis-je installer GesTrack sur mon téléphone ?',
    a: 'Oui : Paramètres › Applications. Sur Android ou ordinateur (Chrome), appuyez sur « Installer ». Sur iPhone (Safari), touchez Partager puis « Sur l\'écran d\'accueil ».',
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: 'Oui. Vos données sont stockées sur Firebase (Google Cloud). Chaque compte ne voit que ses propres données, et vos prix d\'achat sont en plus cachés derrière votre code.',
  },
  {
    q: 'Comment supprimer les images que je n\'utilise plus ?',
    a: 'Paramètres › Galeries, puis « Afficher les images de la galerie ». Les images encore utilisées par un produit sont protégées (badge « Utilisée ») ; les autres se suppriment avec la corbeille.',
  },
  {
    q: 'Comment contacter le support ?',
    a: `Avec le formulaire « Envoyer une suggestion » en bas de cette page, ou par email à ${EMAIL_CONTACT}.`,
  },
];
