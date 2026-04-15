// Layout principal qui enveloppe toutes les pages protégées
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { notificationsAPI } from '../../services/api';

const Layout = () => {
  const [nbNotifs, setNbNotifs] = useState(0);

  // Compter les notifications non lues
  useEffect(() => {
    const chargerNotifs = async () => {
      try {
        const { data } = await notificationsAPI.getAll();
        const nonLues = data.filter(n => !n.lu).length;
        setNbNotifs(nonLues);
      } catch {
        // Ignorer les erreurs silencieusement
      }
    };

    chargerNotifs();
    // Actualiser toutes les 5 minutes
    const interval = setInterval(chargerNotifs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="d-flex">
      <Sidebar nbNotifs={nbNotifs} />

      {/* Contenu principal décalé à droite à cause du sidebar */}
      <main
        className="flex-grow-1 min-vh-100"
        style={{
          marginLeft: 240,
          background: '#f0f4f8',
          padding: '2rem',
        }}
      >
        <Outlet context={{ setNbNotifs }} />
      </main>
    </div>
  );
};

export default Layout;
