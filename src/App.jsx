// Fichier principal de l'application avec toutes les routes.
// Les chemins viennent de utils/url/frontend ; chaque domaine a une page parente (index.jsx)
// qui regroupe ses sous-pages.
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/context/AuthContext';
import { ParametresProvider } from '@/context/ParametresContext';
import { ConnexionProvider } from '@/context/ConnexionContext';
import Layout from '@/components/layout/Layout';
import RouteProtegee from '@/components/routes/RouteProtegee';
import RouteAdmin from '@/components/routes/RouteAdmin';
import RouteRacine from '@/components/routes/RouteRacine';
import { API_URL, ENDPOINTS } from '@/utils/url/backend';
import { ROUTES, MOTIFS } from '@/utils/url/frontend';

// Pages publiques
import PagesPubliques from '@/pages/public';
import Vitrine from '@/pages/public/accueil';
import CataloguePublic from '@/pages/public/catalogue';
import BoutiquePublique from '@/pages/public/boutique';
import PolitiqueConfidentialite from '@/pages/public/confidentialite';

// Authentification
import Auth from '@/pages/auth';
import Login from '@/pages/auth/connexion';
import Register from '@/pages/auth/inscription';
import ForgotPassword from '@/pages/auth/mot-de-passe-oublie';

// Pages protégées
import Dashboard from '@/pages/dashboard';
import Clients from '@/pages/clients';
import Dettes from '@/pages/dettes';
import ListeDettes from '@/pages/dettes/liste';
import DettesClient from '@/pages/dettes/client';
import Factures from '@/pages/factures';
import Produits from '@/pages/boutique';
import Magasin from '@/pages/magasin';
import Fournisseurs from '@/pages/fournisseurs';
import ListeFournisseurs from '@/pages/fournisseurs/liste';
import DetailFournisseur from '@/pages/fournisseurs/detail';
import Finances from '@/pages/finances';
import MesFinances from '@/pages/finances/mes-finances';
import MonCompte from '@/pages/finances/mon-compte';
import Parametres from '@/pages/parametres';
import Statistiques from '@/pages/statistiques';
import Notifications from '@/pages/notifications';
import Messages from '@/pages/messages';
import Guide from '@/pages/guides';
import MonProfil from '@/pages/profil';

// Administration
import AdminLayout from '@/pages/admin';
import AdminDashboard from '@/pages/admin/tableau-de-bord';
import AdminUtilisateurs from '@/pages/admin/utilisateurs';
import AdminModeration from '@/pages/admin/moderation';
import AdminVitrines from '@/pages/admin/vitrines';
import AdminJournal from '@/pages/admin/journal';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

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
          <Routes>
            {/* Route racine — accueil public ou tableau de bord */}
            <Route path={ROUTES.accueil} element={<RouteRacine />} />

            {/* Pages publiques */}
            <Route element={<PagesPubliques />}>
              <Route path={ROUTES.vitrine} element={<Vitrine />} />
              <Route path={MOTIFS.catalogue} element={<CataloguePublic />} />
              <Route path={ROUTES.confidentialite} element={<PolitiqueConfidentialite />} />
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
              <Route path={ROUTES.profil} element={<MonProfil />} />
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
