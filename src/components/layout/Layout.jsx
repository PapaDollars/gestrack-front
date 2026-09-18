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

      {/* Contenu principal — décalé à droite (sidebar) et en bas (navbar). Hauteur figée sur
          la fenêtre et overflow masqué : c'est le pied de page (dimensionné en dehors de la
          zone de contenu flexible) qui provoquait un micro-scroll de toute la page, faisant
          légèrement bouger les titres/filtres que chaque page fixe pourtant en haut. Chaque
          page reçoit maintenant une hauteur à 100% de l'espace réellement disponible (plutôt
          qu'un calc(100vh - ...) figé qui ne tenait pas compte du pied de page) et gère
          elle-même son défilement interne (liste/tableau). */}
      <main
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: isMobile ? 0 : 240,
          marginTop: 56,
          background: 'var(--bs-tertiary-bg)',
          height: 'calc(100vh - 56px)',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '2rem 2rem 0' }}>
          <Outlet context={{ setNbNotifs }} />
        </div>
        <div style={{ padding: '0 2rem', flexShrink: 0 }}>
          <Footer />
        </div>
        <BackToTop />
      </main>
    </div>
  );
};

export default Layout;
