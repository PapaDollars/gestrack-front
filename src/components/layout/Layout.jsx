// Layout principal qui enveloppe toutes les pages protégées
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import BarreMobile, { HAUTEUR_BARRE_MOBILE } from './BarreMobile';
import { notificationsAPI, messagesAPI, profilAPI, dettesAPI, fournisseursAPI } from '@/services/api';
import { EcranAccesBloque, BandeauEssai, BandeauLimite } from './AccesPayant';
import ModalPasserPro from './ModalPasserPro';
import { estModeLimite, pageAutoriseeGratuit, pageExcluePlan, EVT_PASSER_PRO } from '@/utils/acces';
import useIsMobile from '@/hooks/useIsMobile';
import { ROUTES } from '@/utils/url/frontend';
import BackToTop, { BOTTOM_AU_DESSUS_BARRE } from '@/components/common/BackToTop';
import EcranChargement from '@/components/common/EcranChargement';
import { prechargerPagesApplication } from '@/utils/pagesDifferees';

// Délai avant de précharger les autres pages : laisser d'abord la page ouverte s'afficher
const DELAI_PRECHARGEMENT = 3000;

const Layout = () => {
  const isMobile = useIsMobile();
  const [nbNotifs, setNbNotifs] = useState(0);
  const [nbMessages, setNbMessages] = useState(0);
  // Badges du menu : dettes en cours (en cours + en retard) et commandes fournisseurs en cours
  const [nbDettes, setNbDettes] = useState(0);
  const [nbCommandes, setNbCommandes] = useState(0);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pageQuittee = useRef(null);
  // Accès payant : { statutAcces, mode, limites, usage, autorise, code } — null tant que non connu
  const [acces, setAcces] = useState(null);
  const modeLimite = estModeLimite(acces);
  // Fenêtre « Passer à la version Pro » (detail : réponse du serveur), null = fermée
  const [passerPro, setPasserPro] = useState(null);

  useEffect(() => {
    const minuteur = setTimeout(prechargerPagesApplication, DELAI_PRECHARGEMENT);
    return () => clearTimeout(minuteur);
  }, []);
  useEffect(() => {
    if (!acces) return; // attendre l'état d'accès : rien à charger pour un compte refusé / limité
    if (acces.autorise === false) return;
    const precedente = pageQuittee.current;
    pageQuittee.current = pathname;
    // Recompte au chargement, puis seulement en quittant une page qui a pu changer les nombres
    // (lectures Firestore facturées : pas de rechargement à chaque navigation)
    const premier = precedente === null;
    const depuis = (...prefixes) => prefixes.some(p => precedente?.startsWith(p));
    if (premier || depuis(ROUTES.dettes, ROUTES.clients, ROUTES.factures)) {
      dettesAPI.getAll()
        .then(({ data }) => setNbDettes(data.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD').length))
        .catch(() => {});
    }
    // Fournisseurs : module de la version Pro (pas de badge en version gratuite)
    if (!modeLimite && (premier || depuis(ROUTES.fournisseurs))) {
      fournisseursAPI.getAll()
        .then(({ data }) => setNbCommandes(data.filter(c => c.statut === 'EN_ATTENTE' || c.statut === 'EN_COURS').length))
        .catch(() => {});
    }
  }, [pathname, acces]); // eslint-disable-line

  // Version gratuite limitée : une page réservée au Pro (lien direct, favori…) → retour aux
  // Clients et fenêtre « Passer à la version Pro »
  useEffect(() => {
    if (modeLimite && !pageAutoriseeGratuit(pathname)) {
      // Page d'arrivée après la connexion (tableau de bord) : simple redirection, sans fenêtre
      if (pathname === ROUTES.dashboard) { navigate(ROUTES.clients, { replace: true }); return; }
      setPasserPro({ code: 'ACCES_LIMITE', aboExpire: acces?.aboExpire,
        message: 'La version gratuite donne accès uniquement aux Clients, aux Dettes et à la Boutique. Passez à la version Pro pour utiliser cette page.' });
      navigate(ROUTES.clients, { replace: true });
    }
    // Plan Pro sans ce module (ex. A.1 : Magasin) → retour à la Boutique
    if (!modeLimite && pageExcluePlan(acces, pathname)) {
      setPasserPro({ code: 'MODULE_PLAN', plan: acces?.planEffectif,
        message: `Le Magasin n'est pas inclus dans votre plan ${acces?.planEffectif}. Passez au plan A.2 ou A.3 pour l'utiliser.` });
      navigate(ROUTES.boutique, { replace: true });
    }
  }, [modeLimite, pathname, acces]); // eslint-disable-line

  useEffect(() => {
    const ouvrir = (e) => setPasserPro(e.detail || {});
    window.addEventListener(EVT_PASSER_PRO, ouvrir);
    return () => window.removeEventListener(EVT_PASSER_PRO, ouvrir);
  }, []);

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
    // Messages (catalogue public) : module de la version Pro
    if (!acces || acces.autorise === false || modeLimite) return undefined;
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
  }, [acces, modeLimite]);

  // Mêmes règles pour le menu ☰ et la barre du bas : page non incluse → fenêtre « version Pro »
  const pageVerrouillee = (to) => (modeLimite ? !pageAutoriseeGratuit(to) : pageExcluePlan(acces, to));
  const surPageVerrouillee = () => setPasserPro(modeLimite
    ? { code: 'ACCES_LIMITE', aboExpire: acces?.aboExpire,
      message: 'Cette page fait partie de la version Pro. La version gratuite donne accès aux Clients, aux Dettes et à la Boutique.' }
    : { code: 'MODULE_PLAN', plan: acces?.planEffectif,
      message: `Cette page n'est pas incluse dans votre plan ${acces?.planEffectif}. Passez au plan A.2 ou A.3 pour l'utiliser.` });

  return (
    <div className="d-flex">
      <Navbar nbNotifs={nbNotifs} />
      <Sidebar nbMessages={nbMessages} nbDettes={nbDettes} nbCommandes={nbCommandes}
        pageVerrouillee={pageVerrouillee} onPageVerrouillee={surPageVerrouillee} />

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
          // Mobile : place réservée en bas pour la barre de navigation
          height: isMobile
            ? `calc(100vh - 56px - ${HAUTEUR_BARRE_MOBILE}px - env(safe-area-inset-bottom))`
            : 'calc(100vh - 56px)',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: isMobile ? '1rem 2rem 1rem' : '2rem 2rem 0', display: 'flex', flexDirection: 'column' }}>
          {accesRefuse ? (
            <EcranAccesBloque acces={acces} />
          ) : (
            <>
              <BandeauEssai acces={acces} />
              <BandeauLimite acces={acces} />
              <div style={{ flex: 1, minHeight: 0 }}>
                <Suspense fallback={<EcranChargement enPage />}>
                  <Outlet context={{ setNbNotifs, setNbMessages, acces }} />
                </Suspense>
              </div>
            </>
          )}
        </div>
        {/* Mobile : pas de pied de page fixe — ses liens sont en bas du menu ☰ */}
        {!isMobile && (
          <div style={{ padding: '0 2rem', flexShrink: 0 }}>
            <Footer />
          </div>
        )}
        <BackToTop bottom={isMobile ? BOTTOM_AU_DESSUS_BARRE : 28} />
      </main>
      {!accesRefuse && (
        <BarreMobile nbDettes={nbDettes}
          pageVerrouillee={pageVerrouillee} onPageVerrouillee={surPageVerrouillee} />
      )}
      {passerPro && <ModalPasserPro detail={passerPro} onFermer={() => setPasserPro(null)} />}
    </div>
  );
};

export default Layout;
