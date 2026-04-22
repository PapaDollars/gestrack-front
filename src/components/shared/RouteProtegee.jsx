import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const RouteProtegee = ({ children }) => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return null;
  if (!utilisateur) return <Navigate to="/" replace />;
  return children;
};

export default RouteProtegee;
