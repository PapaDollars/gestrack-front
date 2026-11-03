// Route racine « / » : page d'accueil publique si non connecté, tableau de bord sinon.
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import EcranChargement from '@/components/common/EcranChargement';
import { ROUTES } from '@/utils/url/frontend';
import { pageDifferee } from '@/utils/pagesDifferees';

const Vitrine = pageDifferee(() => import('@/pages/public/accueil'));

const RouteRacine = () => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return <EcranChargement />;
  return utilisateur ? <Navigate to={ROUTES.dashboard} replace /> : <Vitrine />;
};

export default RouteRacine;
