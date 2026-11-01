// Réponses WhatsApp préremplies aux messages reçus depuis le catalogue public. Chaque compte
// peut modifier ses textes dans Paramètres › Vitrine ; vide = texte par défaut ci-dessous.
// Variables remplacées dans le texte : {client}, {produit}, {lien}, {adresse}, {boutique}.
import { ROUTES, urlAbsolue } from '@/utils/url/frontend';

export const MODELE_PRODUIT_DEFAUT = `Bonjour {client},

Nous avons bien reçu votre demande de réservation pour le produit « {produit} » : {lien}

Merci de nous confirmer cette réservation. Nous ne pouvons garder un produit que si une avance a été versée.

Deux possibilités s'offrent à vous :
1. Verser une avance : nous gardons votre produit jusqu'à votre passage.
2. Passer au magasin dès que possible pour en prendre possession.

Quelle option préférez-vous ?

📍 {adresse}

Cordialement,
{boutique}`;

export const MODELE_GENERAL_DEFAUT = `Bonjour {client},

Nous vous remercions pour votre message, il a bien été reçu.
Nous reviendrons vers vous si besoin. N'hésitez pas à nous donner plus de précisions sur vos besoins ici.

Cordialement,
{boutique}`;

export const VARIABLES_MODELE = [
  { cle: '{client}', role: 'nom du client' },
  { cle: '{produit}', role: 'nom du produit' },
  { cle: '{lien}', role: 'lien du produit' },
  { cle: '{adresse}', role: 'adresse de la boutique' },
  { cle: '{boutique}', role: 'nom de la boutique' },
];

// Lien public du produit (ouvre sa fiche sur le catalogue), si le catalogue est actif
const lienProduit = (msg, parametres) => (
  msg.produitId && parametres.slug && parametres.catalogueActif
    ? urlAbsolue(`${ROUTES.catalogue(parametres.slug)}?produit=${encodeURIComponent(msg.produitId)}`)
    : ''
);

// Texte final. Une valeur absente ne laisse pas de trou : la ligne de l'adresse disparaît,
// « : {lien} » aussi, et « Bonjour {client}, » devient « Bonjour, ».
export const construireReponse = (msg, parametres = {}) => {
  const modele = msg.produitNom
    ? (parametres.modeleReponseProduit || MODELE_PRODUIT_DEFAUT)
    : (parametres.modeleReponseGeneral || MODELE_GENERAL_DEFAUT);
  const lien = lienProduit(msg, parametres);
  const adresse = parametres.adresseBoutique || '';
  let texte = modele;
  if (!adresse) texte = texte.replace(/^.*\{adresse\}.*(\r?\n)?/gm, '');
  if (!lien) texte = texte.replace(/\s*:?\s*\{lien\}/g, '');
  return texte
    .replace(/\s*\{client\}/g, msg.nomClient ? ` ${msg.nomClient}` : '')
    .replace(/\{produit\}/g, msg.produitNom || '')
    .replace(/\{lien\}/g, lien)
    .replace(/\{adresse\}/g, adresse)
    .replace(/\{boutique\}/g, parametres.nomEntreprise || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
