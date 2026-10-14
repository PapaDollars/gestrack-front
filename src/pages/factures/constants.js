// Moyens de paiement d'une facture
import { faMoneyBillWave, faMobile, faWallet } from '@fortawesome/free-solid-svg-icons';

export const MOYENS = [
  { val: 'especes', label: 'Espèces',      icon: faMoneyBillWave, color: '#16a34a', bg: '#dcfce7' },
  { val: 'om',      label: 'Orange Money', icon: faMobile,        color: '#ea580c', bg: '#fff7ed' },
  { val: 'mtn',     label: 'MTN Money',    icon: faWallet,        color: '#ca8a04', bg: '#fefce8' },
];

// Libellé d'une facture payée par un ou plusieurs moyens (ex. « Espèces + Orange Money »)
export const libelleMoyens = (moyens = []) => MOYENS
  .filter(m => moyens.includes(m.val))
  .map(m => m.label)
  .join(' + ');

// Libellé court pour la liste des factures : « Payée en espèces », « Payée par OM »,
// « Payée par MTN », ou une combinaison (« Payée en espèces + OM »). Sans moyen enregistré
// (anciennes factures) : « Payée ».
const COURTS = { especes: 'espèces', om: 'OM', mtn: 'MTN' };
export const libellePayee = (moyens = []) => {
  const choisis = MOYENS.map(m => m.val).filter(v => moyens.includes(v));
  if (choisis.length === 0) return 'Payée';
  const texte = choisis.map(v => COURTS[v]).join(' + ');
  return choisis[0] === 'especes' ? `Payée en ${texte}` : `Payée par ${texte}`;
};

// Détail d'une facture réglée : « Espèces 5 000 FCFA · OM 3 000 FCFA » (montants enregistrés),
// à défaut la liste des moyens (factures plus anciennes)
export const detailPaiement = (facture, formatMontant) => {
  const p = facture?.paiements;
  if (p) {
    return MOYENS.filter(m => p[m.val] > 0).map(m => `${m.label} ${formatMontant(p[m.val])}`).join(' · ');
  }
  return libelleMoyens(facture?.moyensPaiement || []);
};
