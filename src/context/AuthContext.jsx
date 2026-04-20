// Contexte global d'authentification Firebase
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/services/firebase';
import api from '@/services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUtilisateur(user || null);
      if (user) {
        // Inject token in all future requests
        const token = await user.getIdToken();
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
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
