// Types, périodes et regroupements de Mon Compte
import { faWallet, faMobile, faMoneyBillWave, faCalendarDay, faCalendarWeek, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

export const TYPES = [
  { val: 'especes',      label: 'Espèces',      color: '#16a34a', bg: '#dcfce7', icon: faMoneyBillWave },
  { val: 'orange_money', label: 'Orange Money',  color: '#ea580c', bg: '#fff7ed', icon: faMobile },
  { val: 'mobile_money', label: 'Mobile Money',  color: '#7c3aed', bg: '#f3e8ff', icon: faWallet },
];

export const PERIODES = [
  { val: 'jour',    label: 'Par jour' },
  { val: 'semaine', label: 'Par semaine' },
];

export const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export const PERIODES_DATE = [
  { val: 'aujourd_hui', label: "Aujourd'hui",  icon: faCalendarDay },
  { val: 'semaine',     label: 'Cette semaine', icon: faCalendarWeek },
  { val: 'mois',        label: 'Ce mois',       icon: faCalendarAlt },
];

export const GROUPEMENTS = [
  { val: 'jour',    label: 'Par jour' },
  { val: 'semaine', label: 'Par semaine' },
  { val: 'mois',    label: 'Par mois' },
];
