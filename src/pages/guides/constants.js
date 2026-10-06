// Contenu du guide : fonctionnalités, FAQ, vidéos
import {
  faBookOpen, faUsers, faFileInvoiceDollar, faStore, faWarehouse, faChartLine,
  faChartBar, faBell, faCog, faReceipt, faTruck,
} from '@fortawesome/free-solid-svg-icons';
import { EMAIL_CONTACT } from '@/utils/url/frontend';

export const FONCTIONNALITES = [
  { icon: faUsers,              color: '#6366f1', label: 'Clients',       desc: 'Portefeuille clients avec photos et contacts' },
  { icon: faFileInvoiceDollar,  color: '#f59e0b', label: 'Dettes',        desc: 'Suivi des dettes par client, paiements Espèces / OM / MTN' },
  { icon: faReceipt,            color: '#0ea5e9', label: 'Factures',      desc: 'Génération et gestion des factures clients' },
  { icon: faStore,              color: '#00d4aa', label: 'Boutique',       desc: 'Stock de vente avec gestion par unité (ps, dz, crt, ballo…)' },
  { icon: faWarehouse,          color: '#3b82f6', label: 'Magasin',        desc: 'Entrepôt avec transferts vers la boutique' },
  { icon: faTruck,              color: '#f97316', label: 'Fournisseurs',   desc: 'Commandes fournisseurs et suivi des livraisons' },
  { icon: faChartLine,          color: '#8b5cf6', label: 'Finances',       desc: 'Capital, chiffre d\'affaires, bénéfices et dépenses en temps réel' },
  { icon: faBookOpen,           color: '#10b981', label: 'Mon Compte',     desc: 'Journal des entrées/sorties de trésorerie personnelle' },
  { icon: faChartBar,           color: '#ec4899', label: 'Statistiques',   desc: 'Tableaux de bord et indicateurs clés de performance' },
  { icon: faBell,               color: '#ef4444', label: 'Notifications',  desc: 'Rappels automatiques pour les dettes en retard' },
  { icon: faCog,                color: '#6b7280', label: 'Paramètres',     desc: 'Apparence, installation de l\'app, rappels, vitrine, galerie d\'images et export' },
];

export const FAQ_ITEMS = [
  {
    q: 'GesTrack est-il gratuit ?',
    a: 'GesTrack propose un accès gratuit avec toutes les fonctionnalités essentielles. Des plans premium seront disponibles pour les grandes entreprises.',
  },
  {
    q: 'Comment fonctionne la gestion des fournisseurs ?',
    a: 'Ajoutez vos fournisseurs, créez des commandes et enregistrez les livraisons. Le stock de votre boutique ou magasin se met à jour automatiquement à chaque livraison enregistrée.',
  },
  {
    q: 'Puis-je générer des factures ?',
    a: 'Oui, GesTrack permet de créer et gérer des factures clients avec suivi des paiements, directement depuis la section Factures.',
  },
  {
    q: 'Comment gérer plusieurs magasins ?',
    a: 'Chaque compte GesTrack est dédié à une entreprise. Vous pouvez transférer des produits entre votre magasin et votre boutique en quelques clics.',
  },
  {
    q: 'Un produit du Magasin et son équivalent en Boutique sont-ils liés ?',
    a: 'Le stock reste toujours indépendant (chacun garde son propre historique d\'entrées/sorties). En revanche, les informations du produit — nom, prix de vente, prix d\'achat, catégorie, unité — se synchronisent automatiquement entre les deux dès que les fiches sont liées : modifier l\'une met à jour l\'autre. Le lien se crée automatiquement quand vous créez un produit du même nom des deux côtés, ou dès qu\'un transfert a lieu entre eux (y compris via "Créer le produit et transférer" quand il n\'existe pas encore en boutique).',
  },
  {
    q: 'Le stock est-il mis à jour automatiquement quand je crée une facture ?',
    a: 'Oui, dès qu\'une facture est créée, le stock du produit vendu est réduit automatiquement (dans la Boutique ou le Magasin selon l\'endroit où il a été sélectionné). Si vous modifiez les quantités d\'une facture, le stock est ajusté en conséquence, et si vous supprimez la facture, le stock est restauré.',
  },
  {
    q: 'Si je commande le même produit à un prix d\'achat différent, que devient le prix enregistré ?',
    a: 'GesTrack calcule un Coût Unitaire Moyen Pondéré (CUMP) : le nouveau prix d\'achat est une moyenne entre l\'ancien prix et le nouveau, pondérée par les quantités de chaque livraison. Le produit garde donc un seul prix d\'achat représentatif, sans distinguer les lots séparément.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui, toutes vos données sont stockées sur Firebase (Google Cloud), avec chiffrement et isolation complète entre les entreprises.',
  },
  {
    q: 'Puis-je suivre mes ventes en détail et en gros ?',
    a: 'Absolument ! GesTrack distingue les ventes détail (prix minimum garanti) et les ventes gros (prix libre pour les revendeurs).',
  },
  {
    q: 'Comment fonctionnent les notifications de rappel ?',
    a: 'GesTrack vous rappelle automatiquement les dettes non réglées selon le délai que vous configurez dans les paramètres.',
  },
  {
    q: 'Puis-je installer GesTrack sur mon téléphone ?',
    a: 'Oui, rendez-vous dans Paramètres → onglet "Application". Vous pouvez installer GesTrack comme une app native sur Android (Chrome) ou iPhone (Safari → Partager → Sur l\'écran d\'accueil).',
  },
  {
    q: 'Comment sont gérées les unités (ballo, dz, crt...) ?',
    a: 'GesTrack supporte toutes les unités : pièce, douzaine, paquet, carton, sac, ballo. Chaque produit peut avoir son propre ratio de conversion.',
  },
  {
    q: 'Comment nettoyer les images de produits que je n\'utilise plus ?',
    a: 'Dans Paramètres → onglet "Images", une galerie liste vos photos importées. Celles encore utilisées sur un produit sont protégées (badge "Utilisée") ; les autres peuvent être supprimées définitivement en un clic. Seules les images importées après l\'ajout de cette galerie y apparaissent.',
  },
  {
    q: 'Comment contacter le support ?',
    a: `Utilisez le formulaire "Envoyer une suggestion" en bas de cette page, ou écrivez directement à ${EMAIL_CONTACT}.`,
  },
];

export const VIDEO_PLACEHOLDERS = [
  { titre: 'Premiers pas',        desc: 'Créer son compte et configurer l\'application' },
  { titre: 'Gestion des stocks',  desc: 'Boutique, magasin et transferts' },
  { titre: 'Finances',            desc: 'Tableau de bord financier et rapports' },
  { titre: 'Paramètres avancés',  desc: 'Devise, thème, rappels automatiques' },
];
