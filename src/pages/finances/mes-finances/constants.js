// Périodes et regroupements de Mes Finances
import { faFilter, faCalendarDay, faCalendarWeek, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

export const PERIODES = [
  { val: 'aujourd_hui', label: "Aujourd'hui", icon: faCalendarDay },
  { val: 'semaine',     label: 'Cette semaine', icon: faCalendarWeek },
  { val: 'mois',        label: 'Ce mois', icon: faCalendarAlt },
  { val: '3mois',       label: '3 derniers mois', icon: faCalendarAlt },
  { val: 'annee',       label: 'Cette année', icon: faCalendarAlt },
  { val: 'perso',       label: 'Personnalisé', icon: faFilter },
];

export const GROUPEMENTS = [
  { val: 'jour', label: 'Par jour' },
  { val: 'semaine', label: 'Par semaine' },
  { val: 'mois', label: 'Par mois' },
];
