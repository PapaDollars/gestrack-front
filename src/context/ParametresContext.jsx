import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { parametresAPI } from '@/services/api';

const ParametresContext = createContext();

const DEVISES_CFG = {
  XAF:  { currency: 'XAF', locale: 'fr-CM' },
  FCFA: { currency: 'XAF', locale: 'fr-CM' },
  CFA:  { currency: 'XAF', locale: 'fr-CM' },
  EUR:  { currency: 'EUR', locale: 'fr-FR' },
  USD:  { currency: 'USD', locale: 'en-US' },
  CAD:  { currency: 'CAD', locale: 'fr-CA' },
};

export const ParametresProvider = ({ children }) => {
  const [parametres, setParametres] = useState({ periodeRappelJours: 30, devise: 'XAF' });

  useEffect(() => {
    parametresAPI.get().then(({ data }) => setParametres(data)).catch(() => {});
  }, []);

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
