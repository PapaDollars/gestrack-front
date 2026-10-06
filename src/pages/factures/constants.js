// Moyens de paiement d'une facture
import { faMoneyBillWave, faMobile, faWallet } from '@fortawesome/free-solid-svg-icons';

export const MOYENS = [
  { val: 'especes', label: 'Espèces',      icon: faMoneyBillWave, color: '#16a34a', bg: '#dcfce7' },
  { val: 'om',      label: 'Orange Money', icon: faMobile,        color: '#ea580c', bg: '#fff7ed' },
  { val: 'mtn',     label: 'MTN Money',    icon: faWallet,        color: '#ca8a04', bg: '#fefce8' },
];
