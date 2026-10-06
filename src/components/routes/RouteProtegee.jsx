// Garde des pages de l'application : renvoie à l'accueil si l'utilisateur n'est pas connecté.
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/utils/url/frontend';

const RouteProtegee = ({ children }) => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return null;
  if (!utilisateur) return <Navigate to={ROUTES.accueil} replace />;
  return children;
};

export default RouteProtegee;
