import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { parametresAPI } from '@/services/api';
import { CONDITIONS_VENTE_DEFAUT, STYLE_CONDITIONS_DEFAUT } from '@/utils/factures';
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
  const [parametres, setParametresState] = useState({ periodeRappelJours: 30, devise: 'XAF', theme: 'light', conditionsVente: CONDITIONS_VENTE_DEFAUT, conditionsVenteStyle: STYLE_CONDITIONS_DEFAUT });
  // Tant que ceci est true, `parametres` ne reflète que les valeurs par défaut, pas encore les
  // vraies données du compte — les écrans qui en dépendent (ex: Paramètres > Vitrine) doivent
  // afficher un chargement plutôt qu'un formulaire vide, sans quoi un visiteur qui clique
  // "Enregistrer" trop vite écraserait nomEntreprise/catalogueActif avec des valeurs vides.
  const [chargement, setChargement] = useState(true);
  // Évite un double appel réseau en dev (React.StrictMode invoque les effets deux fois au
  // montage) : sans garde, deux requêtes /parametres partent en parallèle pour rien.
  const dernierUidCharge = useRef(null);

  // Charger seulement quand l'utilisateur est authentifié (token disponible)
  useEffect(() => {
    if (!utilisateur) return;
    if (dernierUidCharge.current === utilisateur.uid) return;
    dernierUidCharge.current = utilisateur.uid;
    setChargement(true);
    parametresAPI.get().then(({ data }) => {
      setParametresState(prev => ({ ...prev, ...data }));
    }).catch(() => {}).finally(() => setChargement(false));
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
    <ParametresContext.Provider value={{ parametres, setParametres, formatMontant, chargement }}>
      {children}
    </ParametresContext.Provider>
  );
};

export const useParametres = () => useContext(ParametresContext);
