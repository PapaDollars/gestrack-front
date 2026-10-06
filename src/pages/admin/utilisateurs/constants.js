// Statuts d'accès payant et filtres de la liste des utilisateurs
import { faBan, faHourglassHalf, faCrown } from '@fortawesome/free-solid-svg-icons';

// Statut d'accès payant (voir backend services/accesService.js)
export const STATUTS_ACCES = {
  en_attente: { label: 'En attente',  bg: '#fef3c7', color: '#b45309', icon: faHourglassHalf },
  essai:      { label: 'Essai',       bg: '#e0f2fe', color: '#0369a1', icon: faHourglassHalf },
  actif:      { label: 'Pro',         bg: '#dcfce7', color: '#16a34a', icon: faCrown },
  bloque:     { label: 'Bloqué',      bg: '#fee2e2', color: '#dc2626', icon: faBan },
  admin:      { label: 'Admin',       bg: '#dcfce7', color: '#16a34a', icon: faCrown },
  null:       { label: 'Sans statut', bg: '#f3f4f6', color: '#6b7280', icon: faHourglassHalf },
};

export const FILTRES_ACCES = [
  { val: '',           label: 'Tous' },
  { val: 'en_attente', label: 'En attente' },
  { val: 'essai',      label: 'Essai' },
  { val: 'actif',      label: 'Pro' },
  { val: 'bloque',     label: 'Bloqués' },
];

export const joursRestants = (iso) => iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000) : null;
