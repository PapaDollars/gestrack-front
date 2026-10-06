// Contenu de la page d'accueil : fonctionnalités et FAQ
import {
  faFileInvoiceDollar, faStore, faWarehouse, faChartLine, faBell, faBuilding,
  faTruck, faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { EMAIL_CONTACT } from '@/utils/url/frontend';

export const FEATURES = [
  {
    icon: faFileInvoiceDollar, color: '#f59e0b',
    title: 'Gestion des dettes',
    desc: 'Suivez les dettes de chaque client avec l\'historique complet des paiements. Espèces, Orange Money, MTN Money.',
  },
  {
    icon: faReceipt, color: '#0ea5e9',
    title: 'Factures',
    desc: 'Générez et gérez vos factures clients directement depuis l\'application, avec suivi des paiements.',
  },
  {
    icon: faStore, color: '#00d4aa',
    title: 'Boutique & Stock',
    desc: 'Gérez votre stock de vente avec prix détail / gros, unités personnalisées (pièce, dz, carton, ballo…).',
  },
  {
    icon: faWarehouse, color: '#3b82f6',
    title: 'Magasin & Transferts',
    desc: 'Entrepôt séparé de la boutique. Transférez des produits du magasin vers la boutique en quelques clics.',
  },
  {
    icon: faTruck, color: '#f97316',
    title: 'Fournisseurs',
    desc: 'Gérez vos commandes fournisseurs, enregistrez les livraisons et synchronisez automatiquement votre stock.',
  },
  {
    icon: faChartLine, color: '#8b5cf6',
    title: 'Finances & Rapports',
    desc: 'Tableau de bord financier complet : capital investi, chiffre d\'affaires, bénéfices, dépenses.',
  },
  {
    icon: faBell, color: '#ef4444',
    title: 'Notifications automatiques',
    desc: 'Rappels automatiques pour les dettes non réglées selon le délai que vous configurez.',
  },
  {
    icon: faBuilding, color: '#6366f1',
    title: 'Multi-entreprise',
    desc: 'Chaque compte GesTrack est isolé et sécurisé. Vos données appartiennent exclusivement à votre entreprise.',
  },
];

export const FAQ_ITEMS = [
  {
    q: 'GesTrack est-il gratuit ?',
    a: 'GesTrack propose un accès gratuit avec toutes les fonctionnalités essentielles. Des plans premium seront disponibles pour les grandes entreprises.',
  },
  {
    q: 'Quelles fonctionnalités sont disponibles ?',
    a: 'GesTrack couvre : gestion des clients et dettes, factures, boutique et magasin avec stock, fournisseurs et commandes, tableau de bord financier, notifications automatiques, et bien plus.',
  },
  {
    q: 'Comment fonctionne la gestion des fournisseurs ?',
    a: 'Ajoutez vos fournisseurs, créez des commandes et enregistrez les livraisons. Le stock de votre boutique ou magasin se met à jour automatiquement à chaque livraison.',
  },
  {
    q: 'Puis-je générer des factures ?',
    a: 'Oui, GesTrack permet de créer et gérer des factures clients avec suivi des paiements, directement depuis la section Factures.',
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
    a: 'Oui, GesTrack peut s\'installer comme une application native sur Android et iPhone. Une fois connecté, rendez-vous dans la section "Application" pour l\'installer sur votre écran d\'accueil.',
  },
  {
    q: 'Comment sont gérées les unités (ballo, dz, crt...) ?',
    a: 'GesTrack supporte toutes les unités : pièce, douzaine, paquet, carton, sac, ballo. Chaque produit peut avoir son propre ratio de conversion.',
  },
  {
    q: 'Comment contacter le support ?',
    a: `Envoyez-nous un message directement à ${EMAIL_CONTACT}, ou depuis la section Suggestion dans le Guide de l'application.`,
  },
];
