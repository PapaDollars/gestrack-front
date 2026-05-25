import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen, faPlayCircle, faChevronDown, faChevronUp,
  faUsers, faFileInvoiceDollar, faStore, faWarehouse,
  faChartLine, faChartBar, faBell, faCog, faReceipt,
  faTruck, faMobileAlt, faPaperPlane, faEnvelope, faUser,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

import pkg from '../../package.json';
import logo from '@/assets/img/logo.png';
const VERSION = pkg.version;

const FONCTIONNALITES = [
  { icon: faUsers,              color: '#6366f1', label: 'Clients',       desc: 'Portefeuille clients avec photos et contacts' },
  { icon: faFileInvoiceDollar,  color: '#f59e0b', label: 'Dettes',        desc: 'Suivi des dettes par client, paiements Espèces / OM / MTN' },
  { icon: faReceipt,            color: '#0ea5e9', label: 'Factures',      desc: 'Génération et gestion des factures clients' },
  { icon: faStore,              color: '#00d4aa', label: 'Boutique',       desc: 'Stock de vente avec gestion par unité (ps, dz, crt, ballo…)' },
  { icon: faWarehouse,          color: '#3b82f6', label: 'Magasin',        desc: 'Entrepôt avec transferts vers la boutique' },
  { icon: faTruck,              color: '#f97316', label: 'Fournisseurs',   desc: 'Commandes fournisseurs et suivi des livraisons' },
  { icon: faChartLine,          color: '#8b5cf6', label: 'Finances',       desc: 'Capital, chiffre d\'affaires, bénéfices et dépenses en temps réel' },
  { icon: faBookOpen,           color: '#10b981', label: 'Mon Compte',     desc: 'Journal des entrées/sorties de trésorerie personnelle' },
  { icon: faChartBar,           color: '#ec4899', label: 'Statistiques',   desc: 'Tableaux de bord et indicateurs clés de performance' },
  { icon: faBell,               color: '#ef4444', label: 'Notifications',  desc: 'Rappels automatiques pour les dettes en retard' },
  { icon: faMobileAlt,          color: '#14b8a6', label: 'Application',    desc: 'Installez GesTrack sur votre écran d\'accueil comme une app native' },
  { icon: faCog,                color: '#6b7280', label: 'Paramètres',     desc: 'Devise, thème, délai de rappel et préférences' },
];

const FAQ_ITEMS = [
  {
    q: 'GesTrack est-il gratuit ?',
    a: 'GesTrack propose un accès gratuit avec toutes les fonctionnalités essentielles. Des plans premium seront disponibles pour les grandes entreprises.',
  },
  {
    q: 'Comment fonctionne la gestion des fournisseurs ?',
    a: 'Ajoutez vos fournisseurs, créez des commandes et enregistrez les livraisons. Le stock de votre boutique ou magasin se met à jour automatiquement à chaque livraison enregistrée.',
  },
  {
    q: 'Puis-je générer des factures ?',
    a: 'Oui, GesTrack permet de créer et gérer des factures clients avec suivi des paiements, directement depuis la section Factures.',
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
    q: 'Puis-je installer GesTrack sur mon téléphone ?',
    a: 'Oui, rendez-vous dans la section "Application" du menu. Vous pouvez installer GesTrack comme une app native sur Android (Chrome) ou iPhone (Safari → Partager → Sur l\'écran d\'accueil).',
  },
  {
    q: 'Comment sont gérées les unités (ballo, dz, crt...) ?',
    a: 'GesTrack supporte toutes les unités : pièce, douzaine, paquet, carton, sac, ballo. Chaque produit peut avoir son propre ratio de conversion.',
  },
  {
    q: 'Comment contacter le support ?',
    a: 'Utilisez le formulaire "Envoyer une suggestion" en bas de cette page, ou écrivez directement à gestrack.gt@gmail.com.',
  },
];

const VIDEO_PLACEHOLDERS = [
  { titre: 'Premiers pas',        desc: 'Créer son compte et configurer l\'application' },
  { titre: 'Gestion des stocks',  desc: 'Boutique, magasin et transferts' },
  { titre: 'Finances',            desc: 'Tableau de bord financier et rapports' },
  { titre: 'Paramètres avancés',  desc: 'Devise, thème, rappels automatiques' },
];

const FaqItem = ({ q, a }) => {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="border-bottom py-3">
      <button
        className="btn d-flex align-items-center justify-content-between w-100 p-0 text-start fw-semibold"
        style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}
        onClick={() => setOuvert(!ouvert)}>
        {q}
        <FontAwesomeIcon
          icon={ouvert ? faChevronUp : faChevronDown}
          style={{ color: '#00d4aa', fontSize: 'var(--txt-base)', flexShrink: 0, marginLeft: 8 }} />
      </button>
      {ouvert && (
        <p className="text-muted mt-2 mb-0" style={{ fontSize: 'var(--txt-md)', lineHeight: 1.6 }}>{a}</p>
      )}
    </div>
  );
};

const Guide = () => {
  const [form, setForm] = useState({ nom: '', email: '', objet: '', message: '' });

  const handleSuggestion = (e) => {
    e.preventDefault();
    window.location.href = `mailto:gestrack.gt@gmail.com?subject=${encodeURIComponent(form.objet)}&body=${encodeURIComponent(`De: ${form.nom} (${form.email})\n\n${form.message}`)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faBookOpen} style={{ color: '#00d4aa' }} />
            Guide
          </h4>
          <p className="text-muted small mb-0">Tutoriels, fonctionnalités et questions fréquentes</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>

        {/* Bannière app */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="p-5 text-center text-white"
            style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 60%, #00d4aa 100%)' }}>
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: 80, height: 80, background: '#fff', boxShadow: '0 4px 20px rgba(0,212,170,0.3)', overflow: 'hidden', padding: 8 }}>
              <img src={logo} alt="GesTrack" style={{ width: '100%', objectFit: 'contain' }} />
            </div>
            <h3 className="fw-bold mb-1">GesTrack</h3>
            <p className="mb-2 opacity-75">Gestion intelligente de votre activité commerciale</p>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
              Version {VERSION}
            </span>
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Fonctionnalités</h6>
            <div className="row g-3">
              {FONCTIONNALITES.map(f => (
                <div key={f.label} className="col-12 col-md-6">
                  <div className="d-flex align-items-start gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                      style={{ width: 36, height: 36, background: `${f.color}18` }}>
                      <FontAwesomeIcon icon={f.icon} style={{ color: f.color, fontSize: 15 }} />
                    </div>
                    <div>
                      <div className="fw-semibold small" style={{ color: 'var(--bs-body-color)' }}>{f.label}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{f.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vidéos tutoriels */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>Vidéos tutoriels</h6>
            <p className="text-muted small mb-3">Des guides vidéo arrivent bientôt pour vous aider à démarrer</p>
            <div className="row g-3">
              {VIDEO_PLACEHOLDERS.map((v) => (
                <div key={v.titre} className="col-12 col-sm-6 col-lg-3">
                  <div className="rounded-3 d-flex flex-column align-items-center justify-content-center p-4 text-center"
                    style={{ background: 'var(--bs-secondary-bg)', minHeight: 140, border: '2px dashed var(--bs-border-color)', cursor: 'default' }}>
                    <FontAwesomeIcon icon={faPlayCircle} style={{ fontSize: 'var(--txt-icon-xl)', color: '#94a3b8', marginBottom: 10 }} />
                    <div className="fw-semibold small" style={{ color: 'var(--bs-body-color)' }}>{v.titre}</div>
                    <div className="text-muted mt-1" style={{ fontSize: 'var(--txt-sm)' }}>{v.desc}</div>
                    <span className="badge bg-secondary mt-2" style={{ fontSize: 'var(--txt-xs)' }}>Vidéo à venir</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Questions fréquentes</h6>
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        {/* Suggestion */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faPaperPlane} style={{ color: '#00d4aa' }} />
              Envoyer une suggestion
            </h6>
            <p className="text-muted small mb-4">
              Une idée d'amélioration ? Contactez-nous à{' '}
              <a href="mailto:gestrack.gt@gmail.com" style={{ color: '#00d4aa' }}>gestrack.gt@gmail.com</a>
            </p>
            <form onSubmit={handleSuggestion}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted small fw-semibold">Nom</label>
                  <div className="input-group">
                    <span className="input-group-text bg-body-secondary border-end-0">
                      <FontAwesomeIcon icon={faUser} className="text-muted" style={{ fontSize: 12 }} />
                    </span>
                    <input type="text" className="form-control border-start-0" placeholder="Votre nom"
                      value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted small fw-semibold">Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-body-secondary border-end-0">
                      <FontAwesomeIcon icon={faEnvelope} className="text-muted" style={{ fontSize: 12 }} />
                    </span>
                    <input type="email" className="form-control border-start-0" placeholder="votre@email.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small fw-semibold">Objet</label>
                  <input type="text" className="form-control" placeholder="Sujet de votre message"
                    value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} required />
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small fw-semibold">Message</label>
                  <textarea className="form-control" rows={4} placeholder="Décrivez votre suggestion ou remarque..."
                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                </div>
              </div>
              <div className="mt-3">
                <button type="submit" className="btn text-white d-flex align-items-center gap-2"
                  style={{ background: '#00d4aa', borderRadius: 10 }}>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Envoyer la suggestion
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Guide;
