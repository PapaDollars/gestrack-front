// Fichier principal de l'application avec toutes les routes
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/context/AuthContext';
import { ParametresProvider } from '@/context/ParametresContext';
import RouteProtegee from '@/components/shared/RouteProtegee';
import Layout from '@/components/layout/Layout';

// Pages
import Login from '@/components/auth/Login';
import Dashboard from '@/pages/Dashboard';
import Clients from '@/pages/Clients';
import DettesClient from '@/pages/DettesClient';
import Dettes from '@/pages/Dettes';
import Produits from '@/pages/Produits';
import Magasin from '@/pages/Magasin';
import Parametres from '@/pages/Parametres';
import Notifications from '@/pages/Notifications';
import Statistiques from '@/pages/Statistiques';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ParametresProvider>
        <BrowserRouter>
          <Routes>
            {/* Route publique */}
            <Route path="/login" element={<Login />} />

            {/* Routes protégées avec layout */}
            <Route
              path="/"
              element={
                <RouteProtegee>
                  <Layout />
                </RouteProtegee>
              }
            >
              {/* Redirection vers dashboard par défaut */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:clientId/dettes" element={<DettesClient />} />
              <Route path="dettes" element={<Dettes />} />
              <Route path="produits" element={<Produits />} />
              <Route path="magasin" element={<Magasin />} />
              <Route path="parametres" element={<Parametres />} />
              <Route path="statistiques" element={<Statistiques />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* Redirection des routes inconnues */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
    </AuthProvider>
  );
}

export default App;
