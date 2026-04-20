// Page vitrine (landing page publique) GesTrack
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoiceDollar, faStore, faWarehouse, faChartLine,
  faBell, faBuilding, faChevronDown, faChevronUp, faRocket,
  faShieldAlt, faMobileAlt,
} from '@fortawesome/free-solid-svg-icons';
import logo from '@/assets/img/logo.png';

const FEATURES = [
  {
    icon: faFileInvoiceDollar, color: '#f59e0b',
    title: 'Gestion des dettes',
    desc: 'Suivez les dettes de chaque client avec l\'historique complet des paiements. Espèces, Orange Money, MTN Money.',
  },
  {
    icon: faStore, color: '#00d4aa',
    title: 'Boutique & Stock',
    desc: 'Gérez votre stock de vente avec prix détail / gros, unités personnalisées (pièce, dz, carton, ballo…).',
  },
  {
    icon: faWarehouse, color: '#3b82f6',
    title: 'Magasin & Transferts',
    desc: 'Entrepôt séparé de la boutique. Transférez des produits du magasin vers la boutique en quelques clics.',
  },
  {
    icon: faChartLine, color: '#8b5cf6',
    title: 'Finances & Rapports',
    desc: 'Tableau de bord financier complet : capital investi, chiffre d\'affaires, bénéfices, dépenses.',
  },
  {
    icon: faBell, color: '#ef4444',
    title: 'Notifications automatiques',
    desc: 'Rappels automatiques pour les dettes non réglées selon le délai que vous configurez.',
  },
  {
    icon: faBuilding, color: '#6366f1',
    title: 'Multi-entreprise',
    desc: 'Chaque compte GesTrack est isolé et sécurisé. Vos données appartiennent exclusivement à votre entreprise.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'GesTrack est-il gratuit ?',
    a: 'GesTrack propose un accès gratuit avec toutes les fonctionnalités essentielles. Des plans premium seront disponibles pour les grandes entreprises.',
  },
  {
    q: 'Comment gérer plusieurs magasins ?',
    a: 'Chaque compte GesTrack est dédié à une entreprise. Vous pouvez transférer des produits entre votre magasin et votre boutique en quelques clics.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Oui, toutes vos données sont stockées sur Firebase (Google Cloud), avec chiffrement et isolation complète entre les entreprises.',
  },
  {
    q: 'Puis-je suivre mes ventes en détail et en gros ?',
    a: 'Absolument ! GesTrack distingue les ventes détail (prix minimum garanti) et les ventes gros (prix libre pour les revendeurs).',
  },
  {
    q: 'Comment fonctionnent les notifications de rappel ?',
    a: 'GesTrack vous rappelle automatiquement les dettes non réglées selon le délai que vous configurez dans les paramètres.',
  },
  {
    q: 'Puis-je accéder à GesTrack depuis mon téléphone ?',
    a: 'Oui, GesTrack est entièrement responsive et fonctionne parfaitement sur mobile, tablette et ordinateur.',
  },
  {
    q: 'Comment sont gérées les unités (ballo, dz, crt...) ?',
    a: 'GesTrack supporte toutes les unités : pièce, douzaine, paquet, carton, sac, ballo. Chaque produit peut avoir son propre ratio de conversion.',
  },
  {
    q: 'Comment contacter le support ?',
    a: 'Envoyez-nous un message depuis la page À propos de l\'application, ou directement à gestrack.gt@gmail.com.',
  },
];

const FaqItem = ({ q, a }) => {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div
      className="card border-0 mb-2"
      style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <button
        className="btn d-flex align-items-center justify-content-between w-100 p-3 text-start fw-semibold"
        style={{ color: 'var(--bs-body-color)', fontSize: 15 }}
        onClick={() => setOuvert(!ouvert)}>
        {q}
        <FontAwesomeIcon icon={ouvert ? faChevronUp : faChevronDown} style={{ color: '#00d4aa', fontSize: 13, flexShrink: 0 }} />
      </button>
      {ouvert && (
        <div className="px-3 pb-3 text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
          {a}
        </div>
      )}
    </div>
  );
};

const Vitrine = () => (
  <div style={{ fontFamily: 'sans-serif' }}>
    {/* ─── HEADER ─── */}
    <header
      className="d-flex align-items-center justify-content-between px-4 py-3 sticky-top"
      style={{ background: 'rgba(15,32,39,0.97)', backdropFilter: 'blur(8px)', zIndex: 100 }}>
      <div className="d-flex align-items-center gap-2">
        <div style={{ background: '#e8f0ef', borderRadius: 10, padding: '4px 12px' }}>
          <img src={logo} alt="GesTrack" style={{ height: 34, objectFit: 'contain' }} />
        </div>
      </div>
      <div className="d-flex gap-2">
        <Link to="/login" className="btn btn-outline-light btn-sm" style={{ borderRadius: 8 }}>
          Se connecter
        </Link>
        <Link to="/register" className="btn btn-sm fw-semibold text-white" style={{ background: '#00d4aa', border: 'none', borderRadius: 8 }}>
          Créer un compte
        </Link>
      </div>
    </header>

    {/* ─── HERO ─── */}
    <section
      className="d-flex flex-column align-items-center justify-content-center text-center text-white py-5"
      style={{
        background: 'linear-gradient(135deg, #0f2027 0%, #203a43 60%, #2c5364 100%)',
        minHeight: '88vh',
        padding: '60px 24px',
      }}>
      <div style={{ maxWidth: 720 }}>
        <span
          className="badge mb-4 px-3 py-2"
          style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 20, fontSize: 13 }}>
          <FontAwesomeIcon icon={faRocket} className="me-2" />Nouvelle version disponible
        </span>
        <h1 className="fw-bold mb-4" style={{ fontSize: 'clamp(28px, 6vw, 52px)', lineHeight: 1.2 }}>
          Gérez votre entreprise<br />
          <span style={{ color: '#00d4aa' }}>intelligemment</span> avec GesTrack
        </h1>
        <p className="text-white-50 mb-5" style={{ fontSize: 18, maxWidth: 560, margin: '0 auto 40px' }}>
          Dettes, stock boutique, magasin, finances — tout au même endroit. Simple, rapide, sécurisé.
        </p>
        <div className="d-flex flex-wrap gap-3 justify-content-center">
          <Link
            to="/register"
            className="btn fw-semibold text-white px-4 py-2"
            style={{ background: '#00d4aa', border: 'none', borderRadius: 10, fontSize: 16 }}>
            Commencer gratuitement
          </Link>
          <Link
            to="/login"
            className="btn btn-outline-light px-4 py-2"
            style={{ borderRadius: 10, fontSize: 16 }}>
            Se connecter
          </Link>
        </div>
        <div className="d-flex flex-wrap justify-content-center gap-4 mt-5 text-white-50" style={{ fontSize: 13 }}>
          <span><FontAwesomeIcon icon={faShieldAlt} className="me-1" style={{ color: '#00d4aa' }} />Données sécurisées</span>
          <span><FontAwesomeIcon icon={faMobileAlt} className="me-1" style={{ color: '#00d4aa' }} />100% responsive</span>
          <span><FontAwesomeIcon icon={faRocket} className="me-1" style={{ color: '#00d4aa' }} />Toujours gratuit</span>
        </div>
      </div>
    </section>

    {/* ─── FEATURES ─── */}
    <section className="py-5" style={{ background: '#f8fafc' }}>
      <div className="container py-3" style={{ maxWidth: 1100 }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-2" style={{ color: 'var(--bs-body-color)' }}>Tout ce dont vous avez besoin</h2>
          <p className="text-muted">Une suite complète pour piloter votre activité commerciale</p>
        </div>
        <div className="row g-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="col-12 col-md-6 col-lg-4">
              <div
                className="card border-0 h-100 p-4"
                style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div
                  className="d-flex align-items-center justify-content-center mb-3"
                  style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}18` }}>
                  <FontAwesomeIcon icon={f.icon} style={{ color: f.color, fontSize: 22 }} />
                </div>
                <h6 className="fw-bold mb-2" style={{ color: 'var(--bs-body-color)' }}>{f.title}</h6>
                <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── FAQ ─── */}
    <section className="py-5" style={{ background: '#fff' }}>
      <div className="container py-3" style={{ maxWidth: 760 }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-2" style={{ color: 'var(--bs-body-color)' }}>Questions fréquentes</h2>
          <p className="text-muted">Tout ce que vous devez savoir sur GesTrack</p>
        </div>
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>

    {/* ─── CTA FINAL ─── */}
    <section
      className="text-center text-white py-5"
      style={{ background: 'linear-gradient(135deg, #0f2027, #203a43)' }}>
      <div className="container py-3" style={{ maxWidth: 600 }}>
        <h2 className="fw-bold mb-3">Prêt à démarrer ?</h2>
        <p className="text-white-50 mb-4">Créez votre compte gratuitement et commencez à gérer votre entreprise dès aujourd'hui.</p>
        <Link
          to="/register"
          className="btn fw-semibold text-white px-5 py-2"
          style={{ background: '#00d4aa', border: 'none', borderRadius: 10, fontSize: 16 }}>
          Créer mon compte
        </Link>
      </div>
    </section>

    {/* ─── FOOTER ─── */}
    <footer className="text-center text-white-50 py-4" style={{ background: '#0f2027', fontSize: 13 }}>
      <div className="mb-1">
        <span className="fw-semibold text-white">GesTrack</span> — Suivi et contrôle de votre activité commerciale
      </div>
      <div>© {new Date().getFullYear()} GesTrack. Tous droits réservés. Contact : gestrack.gt@gmail.com</div>
    </footer>
  </div>
);

export default Vitrine;
