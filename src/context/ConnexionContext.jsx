import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { processerQueue, nbEnAttente as getNbEnAttente } from '@/services/syncQueue';
import api, { invalidateAll, santeAPI } from '@/services/api';

const ConnexionContext = createContext();

// Statuts possibles : 'connecte' | 'horsLigne' | 'synchronisation'
export const ConnexionProvider = ({ children }) => {
  const [statut, setStatut]             = useState('connecte');
  const [nbEnAttente, setNbEnAttente]   = useState(getNbEnAttente());
  const estHorsLigneRef                  = useRef(false);
  const syncEnCoursRef                   = useRef(false);
  const timerRef                         = useRef(null);

  const verifierSante = useCallback(async () => {
    try {
      await santeAPI.verifier({ timeout: 5000 });
      // Si le serveur répond, on considère qu'on est connecté
      // (pas besoin que firestore soit OK, le serveur gère les erreurs)

      // Synchroniser dès qu'il y a des opérations en attente
      const enAttente = getNbEnAttente();
      if (enAttente > 0 && !syncEnCoursRef.current) {
        syncEnCoursRef.current = true;
        setStatut('synchronisation');
        try {
          const { synced } = await processerQueue(api);
          if (synced > 0) {
            invalidateAll();
            setTimeout(() => window.location.reload(), 600);
            return;
          }
        } finally {
          syncEnCoursRef.current = false;
        }
      }

      estHorsLigneRef.current = false;
      setNbEnAttente(getNbEnAttente());
      setStatut('connecte');
    } catch {
      estHorsLigneRef.current = true;
      setStatut('horsLigne');
    }
  }, []);

  useEffect(() => {
    verifierSante();
    timerRef.current = setInterval(verifierSante, 30000);

    const goOnline  = () => verifierSante();
    const goOffline = () => { estHorsLigneRef.current = true; setStatut('horsLigne'); };

    const onQueued = () => { setNbEnAttente(getNbEnAttente()); setStatut('horsLigne'); estHorsLigneRef.current = true; };

    window.addEventListener('online',          goOnline);
    window.addEventListener('offline',         goOffline);
    window.addEventListener('gestrack:queued', onQueued);

    return () => {
      clearInterval(timerRef.current);
      window.removeEventListener('online',          goOnline);
      window.removeEventListener('offline',         goOffline);
      window.removeEventListener('gestrack:queued', onQueued);
    };
  }, [verifierSante]);

  // Appelé par api.js quand une opération est mise en file d'attente
  const signalerMiseEnAttente = useCallback(() => {
    setNbEnAttente(getNbEnAttente());
  }, []);

  return (
    <ConnexionContext.Provider value={{ statut, nbEnAttente, signalerMiseEnAttente }}>
      {children}
    </ConnexionContext.Provider>
  );
};

export const useConnexion = () => useContext(ConnexionContext);
