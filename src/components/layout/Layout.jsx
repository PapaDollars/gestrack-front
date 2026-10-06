// Layout principal qui enveloppe toutes les pages protégées
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { notificationsAPI, messagesAPI, profilAPI } from '@/services/api';
import { EcranAccesBloque, BandeauEssai } from './AccesPayant';
import useIsMobile from '@/hooks/useIsMobile';
import BackToTop from '@/components/common/BackToTop';

const Layout = () => {
  const isMobile = useIsMobile();
  const [nbNotifs, setNbNotifs] = useState(0);
  const [nbMessages, setNbMessages] = useState(0);
  // Accès payant : { statutAcces, dateLimiteAcces, autorise, code } — null tant que non connu
  const [acces, setAcces] = useState(null);

  useEffect(() => {
    profilAPI.get().then(({ data }) => setAcces(data?.acces || null)).catch(() => {});
    // Le serveur refuse une requête (compte en attente / expiré / bloqué) → écran de blocage
    const surRefus = (e) => setAcces(prev => ({ ...(prev || {}), ...e.detail, autorise: false }));
    window.addEventListener('gestrack:acces-refuse', surRefus);
    return () => window.removeEventListener('gestrack:acces-refuse', surRefus);
  }, []);
  const accesRefuse = acces && acces.autorise === false;

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

  useEffect(() => {
    // Sondage périodique (contourne le cache) — un message envoyé depuis le catalogue public
    // vient d'une session anonyme qui ne peut jamais invalider le cache côté boutique, donc
    // seul un rafraîchissement périodique permet de le voir arriver sans recharger la page.
    // Intervalle volontairement large (360 min = 6h) : ce sondage tourne en fond sur TOUTE
    // page de l'app tant que l'onglet reste ouvert, un intervalle court fait exploser les
    // lectures Firestore facturées (voir quota dépassé du 26/09/2026).
    const chargerMessages = async () => {
      try {
        const { data } = await messagesAPI.refresh();
        setNbMessages(data.filter(m => !m.lu).length);
      } catch {
        // silencieux
      }
    };
    chargerMessages();
    const interval = setInterval(chargerMessages, 360 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="d-flex">
      <Navbar nbNotifs={nbNotifs} />
      <Sidebar nbMessages={nbMessages} />

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
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '2rem 2rem 0', display: 'flex', flexDirection: 'column' }}>
          {accesRefuse ? (
            <EcranAccesBloque acces={acces} />
          ) : (
            <>
              <BandeauEssai acces={acces} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Outlet context={{ setNbNotifs, setNbMessages }} />
              </div>
            </>
          )}
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
