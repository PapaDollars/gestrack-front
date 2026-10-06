// Route racine « / » : page d'accueil publique si non connecté, tableau de bord sinon.
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Vitrine from '@/pages/public/accueil';
import { ROUTES } from '@/utils/url/frontend';

const RouteRacine = () => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return null;
  return utilisateur ? <Navigate to={ROUTES.dashboard} replace /> : <Vitrine />;
};

export default RouteRacine;
