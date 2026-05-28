// Layout principal qui enveloppe toutes les pages protégées
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { notificationsAPI } from '@/services/api';
import useIsMobile from '@/hooks/useIsMobile';
import BackToTop from '@/components/common/BackToTop';

const Layout = () => {
  const isMobile = useIsMobile();
  const [nbNotifs, setNbNotifs] = useState(0);

  useEffect(() => {
    const chargerNotifs = async () => {
      try {
        const { data } = await notificationsAPI.getAll();
        const nonLues = data.filter(n => !n.lu).length;
        setNbNotifs(nonLues);
      } catch {
        // silencieux
      }
    };
    chargerNotifs();
    const interval = setInterval(chargerNotifs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="d-flex">
      <Navbar nbNotifs={nbNotifs} />
      <Sidebar />

      {/* Contenu principal — décalé à droite (sidebar) et en bas (navbar) */}
      <main
        className="flex-grow-1"
        style={{
          marginLeft: isMobile ? 0 : 240,
          marginTop: 56,
          background: 'var(--bs-tertiary-bg)',
          padding: '2rem',
        }}
      >
        <Outlet context={{ setNbNotifs }} />
        <Footer />
        <BackToTop />
      </main>
    </div>
  );
};

export default Layout;
