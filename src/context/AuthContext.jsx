// Contexte global d'authentification Firebase
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/services/firebase';
import api from '@/services/api';

const AuthContext = createContext();
const INACTIVITE_MAX = 72 * 60 * 60 * 1000; // 72 heures en ms
const CLE_ACTIVITE = 'gestrack_derniere_activite';

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  // Mettre à jour le timestamp d'activité à chaque interaction
  useEffect(() => {
    const majActivite = () => localStorage.setItem(CLE_ACTIVITE, Date.now().toString());
    const evenements = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    evenements.forEach(e => window.addEventListener(e, majActivite, { passive: true }));
    return () => evenements.forEach(e => window.removeEventListener(e, majActivite));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Vérifier l'inactivité de 72h
        const derniere = parseInt(localStorage.getItem(CLE_ACTIVITE) || '0');
        if (derniere && Date.now() - derniere > INACTIVITE_MAX) {
          await signOut(auth);
          localStorage.removeItem(CLE_ACTIVITE);
          setUtilisateur(null);
          delete api.defaults.headers.common['Authorization'];
          setChargement(false);
          return;
        }
        const token = await user.getIdToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem(CLE_ACTIVITE, Date.now().toString());
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
      setUtilisateur(user || null);
      setChargement(false);
    });
    return unsubscribe;
  }, []);

  const connexion = async (email, motDePasse) => {
    setErreur('');
    try {
      await signInWithEmailAndPassword(auth, email, motDePasse);
      return true;
    } catch {
      setErreur('Email ou mot de passe incorrect.');
      return false;
    }
  };

  const connexionAvecToken = async (customToken) => {
    await signInWithCustomToken(auth, customToken);
  };

  const deconnexion = async () => {
    await signOut(auth);
    setUtilisateur(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, erreur, connexion, connexionAvecToken, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
