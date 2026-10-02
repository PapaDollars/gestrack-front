// Fichier principal de l'application avec toutes les routes
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ParametresProvider } from '@/context/ParametresContext';
import { ConnexionProvider } from '@/context/ConnexionContext';
import RouteProtegee from '@/components/shared/RouteProtegee';
import Layout from '@/components/layout/Layout';

// Pages publiques
import Vitrine from '@/pages/Vitrine';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import ForgotPassword from '@/components/auth/ForgotPassword';

// Pages protégées
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import DettesClient from '@/pages/DettesClient';
import Dettes from '@/pages/Dettes';
import Produits from '@/pages/Produits';
import Magasin from '@/pages/Magasin';
import Parametres from '@/pages/Parametres';
import Notifications from '@/pages/Notifications';
import Messages from '@/pages/Messages';
import Statistiques from '@/pages/Statistiques';
import Guide from '@/pages/Guide';
import MonCompte from '@/pages/MonCompte';
import MesFinances from '@/pages/MesFinances';
import MonProfil from '@/pages/MonProfil';
import Factures from '@/pages/Factures';
import Fournisseurs from '@/pages/Fournisseurs';
import DetailFournisseur from '@/pages/DetailFournisseur';
import CataloguePublic from '@/pages/CataloguePublic';
import BoutiquePublique from '@/pages/BoutiquePublique';
import PolitiqueConfidentialite from '@/pages/PolitiqueConfidentialite';

// Admin
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUtilisateurs from '@/pages/admin/AdminUtilisateurs';
import AdminModeration from '@/pages/admin/AdminModeration';
import AdminVitrines from '@/pages/admin/AdminVitrines';
import AdminJournal from '@/pages/admin/AdminJournal';

const ADMIN_EMAIL = 'gestrack.gt@gmail.com';

// Guard : redirige si pas admin
const RouteAdmin = ({ children }) => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return null;
  if (!utilisateur || utilisateur.email !== ADMIN_EMAIL) return <Navigate to="/login" replace />;
  return children;
};

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Route racine : Vitrine si non connecté, Dashboard si connecté
const RootRoute = () => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return null;
  return utilisateur ? <Navigate to="/dashboard" replace /> : <Vitrine />;
};

function App() {

    // réveille le back à chaque ouverture
    useEffect(() => {
    let tentatives = 0;
    const MAX = 3; 

    const reveillerBackend = async () => {
      if (tentatives >= MAX) return; 
      tentatives++;

      try {
        const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
        await fetch(`${apiBase}/api/health`);
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
            {/* Route racine — Vitrine ou Dashboard */}
            <Route path="/" element={<RootRoute />} />

            {/* Routes publiques */}
            <Route path="/vitrine" element={<Vitrine />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/catalogue/:slug" element={<CataloguePublic />} />
            <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />

            {/* Routes protégées avec layout */}
            <Route
              path="/"
              element={
                <RouteProtegee>
                  <Layout />
                </RouteProtegee>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:clientId/dettes" element={<DettesClient />} />
              <Route path="dettes" element={<Dettes />} />
              <Route path="factures"     element={<Factures />} />
              <Route path="fournisseurs" element={<Fournisseurs />} />
              <Route path="fournisseurs/:fournisseurId" element={<DetailFournisseur />} />
              <Route path="produits" element={<Produits />} />
              <Route path="magasin" element={<Magasin />} />
              <Route path="parametres" element={<Parametres />} />
              <Route path="statistiques" element={<Statistiques />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="messages" element={<Messages />} />

              <Route path="guide" element={<Guide />} />
              <Route path="finances/compte" element={<MonCompte />} />
              <Route path="finances/mes-finances" element={<MesFinances />} />
              <Route path="profil" element={<MonProfil />} />
            </Route>

            {/* Panel admin — avant le catch-all /:slug */}
            <Route path="/admin" element={<RouteAdmin><AdminLayout /></RouteAdmin>}>
              <Route index element={<AdminDashboard />} />
              <Route path="utilisateurs" element={<AdminUtilisateurs />} />
              <Route path="moderation" element={<AdminModeration />} />
              <Route path="vitrines" element={<AdminVitrines />} />
              <Route path="journal" element={<AdminJournal />} />
            </Route>

            {/* Boutique publique par slug — doit être avant le catch-all */}
            <Route path="/:slug" element={<BoutiquePublique />} />

            {/* Redirection des routes inconnues */}
            <Route path="*" element={<Navigate to="/" replace />} />
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
