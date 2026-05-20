import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { parametresAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const ParametresContext = createContext();

const DEVISES_CFG = {
  XAF:  { currency: 'XAF', locale: 'fr-CM' },
  FCFA: { currency: 'XAF', locale: 'fr-CM' },
  CFA:  { currency: 'XAF', locale: 'fr-CM' },
  EUR:  { currency: 'EUR', locale: 'fr-FR' },
  USD:  { currency: 'USD', locale: 'en-US' },
  CAD:  { currency: 'CAD', locale: 'fr-CA' },
};

const appliquerTheme = (theme) => {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.body.setAttribute('data-bs-theme', theme || 'light');
  }
};

export const ParametresProvider = ({ children }) => {
  const { utilisateur } = useAuth();
  const [parametres, setParametresState] = useState({ periodeRappelJours: 30, devise: 'XAF', theme: 'light' });

  // Charger seulement quand l'utilisateur est authentifié (token disponible)
  useEffect(() => {
    if (!utilisateur) return;
    parametresAPI.get().then(({ data }) => {
      setParametresState(prev => ({ ...prev, ...data }));
    }).catch(() => {});
  }, [utilisateur?.uid]);

  // Appliquer le thème chaque fois qu'il change
  useEffect(() => {
    appliquerTheme(parametres.theme);

    // Pour le mode 'system', écouter les changements de préférence OS
    if (parametres.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        document.body.setAttribute('data-bs-theme', e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [parametres.theme]);

  const setParametres = (data) => {
    setParametresState(prev => ({ ...prev, ...data }));
  };

  const formatMontant = useCallback((m) => {
    const cfg = DEVISES_CFG[parametres.devise] || DEVISES_CFG.XAF;
    try {
      return new Intl.NumberFormat(cfg.locale, {
        style: 'currency', currency: cfg.currency, maximumFractionDigits: 0,
      }).format(m || 0);
    } catch {
      return `${m || 0} ${parametres.devise}`;
    }
  }, [parametres.devise]);

  return (
    <ParametresContext.Provider value={{ parametres, setParametres, formatMontant }}>
      {children}
    </ParametresContext.Provider>
  );
};

export const useParametres = () => useContext(ParametresContext);
