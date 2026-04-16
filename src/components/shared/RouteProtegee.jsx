// Composant pour protéger les routes non authentifiées
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const RouteProtegee = ({ children }) => {
  const { utilisateur, chargement } = useAuth();

  // Afficher un spinner pendant la vérification de l'authentification
  if (chargement) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: '#f0f4f8' }}>
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
          <p className="mt-3 text-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers login si non connecté
  if (!utilisateur) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RouteProtegee;
