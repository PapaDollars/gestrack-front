// Contexte global d'authentification Firebase
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext();

// Email unique autorisé
const EMAIL_AUTORISE = 'iyadaniel@gestrack.com';

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  // Observer les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === EMAIL_AUTORISE) {
        setUtilisateur(user);
      } else {
        setUtilisateur(null);
        if (user) signOut(auth); // Déconnecter tout utilisateur non autorisé
      }
      setChargement(false);
    });
    return unsubscribe;
  }, []);

  // Connexion
  const connexion = async (email, motDePasse) => {
    setErreur('');
    if (email !== EMAIL_AUTORISE) {
      setErreur('Identifiant non autorisé.');
      return false;
    }
    try {
      await signInWithEmailAndPassword(auth, email, motDePasse);
      return true;
    } catch (err) {
      setErreur('Identifiant ou mot de passe incorrect.');
      return false;
    }
  };

  // Déconnexion
  const deconnexion = async () => {
    await signOut(auth);
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, erreur, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
