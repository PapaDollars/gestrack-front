// Devises, thèmes et application immédiate du thème
import { faSun, faMoon, faDesktop } from '@fortawesome/free-solid-svg-icons';

export const appliquerThemeLocal = (theme) => {
  if (theme === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  } else {
    document.body.setAttribute('data-bs-theme', theme);
  }
};

export const DEVISES = [
  { value: 'XAF',  label: 'XAF — Franc CFA (ISO)' },
  { value: 'EUR',  label: 'EUR — Euro' },
  { value: 'USD',  label: 'USD — Dollar américain' },
  { value: 'CAD',  label: 'CAD — Dollar canadien' },
];

export const THEMES = [
  { value: 'light',  label: 'Clair',   icon: faSun,     color: '#f59e0b' },
  { value: 'dark',   label: 'Sombre',  icon: faMoon,    color: '#6366f1' },
  { value: 'system', label: 'Système', icon: faDesktop, color: '#6b7280' },
];
