// Garde du panneau admin : seul le compte administrateur y accède, les autres sont renvoyés
// vers la connexion.
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, EMAIL_ADMIN } from '@/utils/url/frontend';

const RouteAdmin = ({ children }) => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return null;
  if (!utilisateur || utilisateur.email !== EMAIL_ADMIN) return <Navigate to={ROUTES.connexion} replace />;
  return children;
};

export default RouteAdmin;
