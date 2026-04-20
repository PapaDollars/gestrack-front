// Page Guide — vidéos tutoriels et FAQ
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen, faPlayCircle, faChevronDown, faChevronUp,
} from '@fortawesome/free-solid-svg-icons';

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
    a: 'Envoyez-nous un message depuis la page À propos, ou directement à gestrack.gt@gmail.com.',
  },
];

const VIDEO_PLACEHOLDERS = [
  { titre: 'Premiers pas', desc: 'Créer son compte et configurer l\'application' },
  { titre: 'Gestion des stocks', desc: 'Boutique, magasin et transferts' },
  { titre: 'Finances', desc: 'Tableau de bord financier et rapports' },
  { titre: 'Paramètres avancés', desc: 'Devise, thème, rappels automatiques' },
];

const FaqItem = ({ q, a }) => {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="border-bottom py-3">
      <button
        className="btn d-flex align-items-center justify-content-between w-100 p-0 text-start fw-semibold"
        style={{ color: 'var(--bs-body-color)', fontSize: 14 }}
        onClick={() => setOuvert(!ouvert)}>
        {q}
        <FontAwesomeIcon
          icon={ouvert ? faChevronUp : faChevronDown}
          style={{ color: '#00d4aa', fontSize: 12, flexShrink: 0, marginLeft: 8 }} />
      </button>
      {ouvert && (
        <p className="text-muted mt-2 mb-0" style={{ fontSize: 13, lineHeight: 1.6 }}>{a}</p>
      )}
    </div>
  );
};

const Guide = () => (
  <div>
    <div className="mb-4">
      <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
        <FontAwesomeIcon icon={faBookOpen} style={{ color: '#00d4aa' }} />
        Guide
      </h4>
      <p className="text-muted small mb-0">Tutoriels et questions fréquentes</p>
    </div>

    {/* Vidéos tutoriels (placeholders) */}
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
      <div className="card-body p-4">
        <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>Vidéos tutoriels</h6>
        <p className="text-muted small mb-3">Des guides vidéo arrivent bientôt pour vous aider à démarrer</p>
        <div className="row g-3">
          {VIDEO_PLACEHOLDERS.map((v) => (
            <div key={v.titre} className="col-12 col-sm-6 col-lg-3">
              <div className="rounded-3 d-flex flex-column align-items-center justify-content-center p-4 text-center"
                style={{ background: 'var(--bs-secondary-bg)', minHeight: 140, border: '2px dashed var(--bs-border-color)', cursor: 'default' }}>
                <FontAwesomeIcon icon={faPlayCircle} style={{ fontSize: 36, color: '#94a3b8', marginBottom: 10 }} />
                <div className="fw-semibold small" style={{ color: 'var(--bs-body-color)' }}>{v.titre}</div>
                <div className="text-muted mt-1" style={{ fontSize: 11 }}>{v.desc}</div>
                <span className="badge bg-secondary mt-2" style={{ fontSize: 10 }}>
                  Vidéo à venir
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* FAQ */}
    <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
      <div className="card-body p-4">
        <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Questions fréquentes</h6>
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </div>
  </div>
);

export default Guide;
