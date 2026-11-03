// Fichier principal de l'application avec toutes les routes.
// Les chemins viennent de utils/url/frontend ; chaque domaine a une page parente (index.jsx)
// qui regroupe ses sous-pages.
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/context/AuthContext';
import { ParametresProvider } from '@/context/ParametresContext';
import { ConnexionProvider } from '@/context/ConnexionContext';
import EcranChargement from '@/components/common/EcranChargement';
import RouteProtegee from '@/components/routes/RouteProtegee';
import RouteAdmin from '@/components/routes/RouteAdmin';
import RouteRacine from '@/components/routes/RouteRacine';
import { API_URL, ENDPOINTS } from '@/utils/url/backend';
import { ROUTES, MOTIFS } from '@/utils/url/frontend';
import { pageDifferee, pageApplication } from '@/utils/pagesDifferees';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const Layout = pageDifferee(() => import('@/components/layout/Layout'));

// Pages publiques
const PagesPubliques = pageDifferee(() => import('@/pages/public'));
const Vitrine = pageDifferee(() => import('@/pages/public/accueil'));
const CataloguePublic = pageDifferee(() => import('@/pages/public/catalogue'));
const BoutiquePublique = pageDifferee(() => import('@/pages/public/boutique'));
const PolitiqueConfidentialite = pageDifferee(() => import('@/pages/public/confidentialite'));
const ConditionsUtilisation = pageDifferee(() => import('@/pages/public/conditions'));
const MentionsLegales = pageDifferee(() => import('@/pages/public/mentions-legales'));
const Tarifs = pageDifferee(() => import('@/pages/public/tarifs'));

// Authentification
const Auth = pageDifferee(() => import('@/pages/auth'));
const Login = pageDifferee(() => import('@/pages/auth/connexion'));
const Register = pageDifferee(() => import('@/pages/auth/inscription'));
const ForgotPassword = pageDifferee(() => import('@/pages/auth/mot-de-passe-oublie'));

// Pages protégées
const Dashboard = pageApplication(() => import('@/pages/dashboard'));
const Clients = pageApplication(() => import('@/pages/clients'));
const Dettes = pageApplication(() => import('@/pages/dettes'));
const ListeDettes = pageApplication(() => import('@/pages/dettes/liste'));
const DettesClient = pageApplication(() => import('@/pages/dettes/client'));
const Factures = pageApplication(() => import('@/pages/factures'));
const Produits = pageApplication(() => import('@/pages/boutique'));
const Magasin = pageApplication(() => import('@/pages/magasin'));
const Fournisseurs = pageApplication(() => import('@/pages/fournisseurs'));
const ListeFournisseurs = pageApplication(() => import('@/pages/fournisseurs/liste'));
const DetailFournisseur = pageApplication(() => import('@/pages/fournisseurs/detail'));
const Finances = pageApplication(() => import('@/pages/finances'));
const MesFinances = pageApplication(() => import('@/pages/finances/mes-finances'));
const MonCompte = pageApplication(() => import('@/pages/finances/mon-compte'));
const Parametres = pageApplication(() => import('@/pages/parametres'));
const Statistiques = pageApplication(() => import('@/pages/statistiques'));
const Notifications = pageApplication(() => import('@/pages/notifications'));
const Messages = pageApplication(() => import('@/pages/messages'));
const Guide = pageApplication(() => import('@/pages/guides'));

// Administration
const AdminLayout = pageDifferee(() => import('@/pages/admin'));
const AdminDashboard = pageDifferee(() => import('@/pages/admin/tableau-de-bord'));
const AdminUtilisateurs = pageDifferee(() => import('@/pages/admin/utilisateurs'));
const AdminModeration = pageDifferee(() => import('@/pages/admin/moderation'));
const AdminVitrines = pageDifferee(() => import('@/pages/admin/vitrines'));
const AdminJournal = pageDifferee(() => import('@/pages/admin/journal'));

function App() {

    // réveille le back à chaque ouverture
    useEffect(() => {
    let tentatives = 0;
    const MAX = 3; 

    const reveillerBackend = async () => {
      if (tentatives >= MAX) return; 
      tentatives++;

      try {
        await fetch(`${API_URL}${ENDPOINTS.sante}`);
        console.log('Backend réveillé ✅');
      } catch (e) {
        console.log(`Tentative ${tentatives}/${MAX} échouée...`);
        if (tentatives < MAX) {
          setTimeout(reveillerBackend, 5000);
        }
      }
    };

    reveillerBackend();
  }, []);

  return (
    <AuthProvider>
      <ConnexionProvider>
      <ParametresProvider>
        <BrowserRouter>
          <Suspense fallback={<EcranChargement />}>
          <Routes>
            {/* Route racine — accueil public ou tableau de bord */}
            <Route path={ROUTES.accueil} element={<RouteRacine />} />

            {/* Pages publiques */}
            <Route element={<PagesPubliques />}>
              <Route path={ROUTES.vitrine} element={<Vitrine />} />
              <Route path={MOTIFS.catalogue} element={<CataloguePublic />} />
              <Route path={ROUTES.confidentialite} element={<PolitiqueConfidentialite />} />
              <Route path={ROUTES.conditions} element={<ConditionsUtilisation />} />
              <Route path={ROUTES.mentionsLegales} element={<MentionsLegales />} />
              <Route path={ROUTES.tarifs} element={<Tarifs />} />
              {/* Boutique publique par slug — motif le moins prioritaire des routes nommées */}
              <Route path={MOTIFS.boutiquePublique} element={<BoutiquePublique />} />
            </Route>

            {/* Authentification */}
            <Route element={<Auth />}>
              <Route path={ROUTES.connexion} element={<Login />} />
              <Route path={ROUTES.inscription} element={<Register />} />
              <Route path={ROUTES.motDePasseOublie} element={<ForgotPassword />} />
            </Route>

            {/* Routes protégées avec layout */}
            <Route
              path={ROUTES.accueil}
              element={
                <RouteProtegee>
                  <Layout />
                </RouteProtegee>
              }
            >
              <Route path={ROUTES.dashboard} element={<Dashboard />} />
              <Route path={ROUTES.clients} element={<Clients />} />
              <Route element={<Dettes />}>
                <Route path={ROUTES.dettes} element={<ListeDettes />} />
                <Route path={MOTIFS.dettesClient} element={<DettesClient />} />
              </Route>
              <Route path={ROUTES.factures} element={<Factures />} />
              <Route path={ROUTES.fournisseurs} element={<Fournisseurs />}>
                <Route index element={<ListeFournisseurs />} />
                <Route path={MOTIFS.fournisseur} element={<DetailFournisseur />} />
              </Route>
              <Route path={ROUTES.boutique} element={<Produits />} />
              <Route path={ROUTES.magasin} element={<Magasin />} />
              <Route path={ROUTES.finances} element={<Finances />}>
                <Route path={ROUTES.mesFinances} element={<MesFinances />} />
                <Route path={ROUTES.monCompte} element={<MonCompte />} />
              </Route>
              <Route path={ROUTES.parametres} element={<Parametres />} />
              <Route path={ROUTES.statistiques} element={<Statistiques />} />
              <Route path={ROUTES.notifications} element={<Notifications />} />
              <Route path={ROUTES.messages} element={<Messages />} />
              <Route path={ROUTES.guide} element={<Guide />} />
              <Route path={ROUTES.profil} element={<Navigate to={ROUTES.parametresOnglet('compte-profil')} replace />} />
            </Route>

            {/* Panel admin */}
            <Route path={ROUTES.admin} element={<RouteAdmin><AdminLayout /></RouteAdmin>}>
              <Route index element={<AdminDashboard />} />
              <Route path={ROUTES.adminUtilisateurs} element={<AdminUtilisateurs />} />
              <Route path={ROUTES.adminModeration} element={<AdminModeration />} />
              <Route path={ROUTES.adminVitrines} element={<AdminVitrines />} />
              <Route path={ROUTES.adminJournal} element={<AdminJournal />} />
            </Route>

            {/* Redirection des routes inconnues */}
            <Route path={MOTIFS.inconnue} element={<Navigate to={ROUTES.accueil} replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>

        {/* Toast notifications globales */}
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss={false}
          pauseOnHover
          theme="light"
          toastStyle={{ borderRadius: 12 }}
        />
      </ParametresProvider>
      </ConnexionProvider>
    </AuthProvider>
  );
}

export default App;
