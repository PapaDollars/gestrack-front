// Informations sur l'éditeur de la plateforme, affichées dans les pages légales (mentions
// légales, conditions d'utilisation, confidentialité). Une valeur vide n'est pas affichée :
// compléter ici (raison sociale, adresse, immatriculation…) dès qu'elles sont connues.
import { EMAIL_CONTACT } from '@/utils/url/frontend';

export const EDITEUR = {
  nom:             'GesTrack',
  site:            'gestrack.business',
  pays:            'Cameroun',
  email:           EMAIL_CONTACT,
  responsable:     '', // directeur de la publication (nom et prénom)
  adresse:         '', // adresse postale / siège
  immatriculation: '', // RCCM / NIU, si l'activité est immatriculée
  telephone:       '',
};

// Prestataires techniques qui hébergent ou traitent des données pour le compte de GesTrack
export const PRESTATAIRES = [
  { nom: 'Google Firebase (Google Cloud)', role: 'base de données et comptes utilisateurs' },
  { nom: 'Render',                         role: 'serveur de l\'application (API)' },
  { nom: 'Vercel',                         role: 'hébergement du site web' },
  { nom: 'Cloudinary',                     role: 'stockage des images des produits' },
  { nom: 'Brevo',                          role: 'envoi des e-mails (codes de vérification)' },
];

export const DERNIERE_MAJ_LEGALE = 'octobre 2026';
