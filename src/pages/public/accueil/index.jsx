// Page vitrine (landing page publique) GesTrack
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faShieldAlt, faMobileAlt } from '@fortawesome/free-solid-svg-icons';
import logo from '@/assets/img/logo.png';
import { FEATURES, FAQ_ITEMS } from '@/pages/public/accueil/constants';
import FaqItem from '@/pages/public/accueil/components/FaqItem';
import { ROUTES, EMAIL_CONTACT } from '@/utils/url/frontend';

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
        <Link to={ROUTES.connexion} className="btn btn-outline-light btn-sm" style={{ borderRadius: 8 }}>
          Se connecter
        </Link>
        <Link to={ROUTES.inscription} className="btn btn-sm fw-semibold text-white" style={{ background: '#00d4aa', border: 'none', borderRadius: 8 }}>
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
            to={ROUTES.inscription}
            className="btn fw-semibold text-white px-4 py-2"
            style={{ background: '#00d4aa', border: 'none', borderRadius: 10, fontSize: 16 }}>
            Créer mon compte
          </Link>
          <Link
            to={ROUTES.connexion}
            className="btn btn-outline-light px-4 py-2"
            style={{ borderRadius: 10, fontSize: 16 }}>
            Se connecter
          </Link>
        </div>
        <div className="d-flex flex-wrap justify-content-center gap-4 mt-5 text-white-50" style={{ fontSize: 13 }}>
          <span><FontAwesomeIcon icon={faShieldAlt} className="me-1" style={{ color: '#00d4aa' }} />Données sécurisées</span>
          <span><FontAwesomeIcon icon={faMobileAlt} className="me-1" style={{ color: '#00d4aa' }} />100% responsive</span>
          <span><FontAwesomeIcon icon={faRocket} className="me-1" style={{ color: '#00d4aa' }} />Version Pro</span>
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
        <p className="text-white-50 mb-4">Créez votre compte, faites-le activer par l'administrateur et gérez votre entreprise dès aujourd'hui.</p>
        <Link
          to={ROUTES.inscription}
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
      <div>© {new Date().getFullYear()} GesTrack. Tous droits réservés. Contact : {EMAIL_CONTACT}</div>
    </footer>
  </div>
);

export default Vitrine;
