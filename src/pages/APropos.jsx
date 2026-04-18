// Page À propos — informations sur l'application GesTrack
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfoCircle, faUsers, faFileInvoiceDollar,
  faStore, faWarehouse, faChartBar, faBell, faCog,
} from '@fortawesome/free-solid-svg-icons';

const VERSION = '1.0.0';

const FONCTIONNALITES = [
  { icon: faUsers,              color: '#6366f1', label: 'Clients',        desc: 'Gérez votre portefeuille clients' },
  { icon: faFileInvoiceDollar, color: '#f59e0b', label: 'Dettes',         desc: 'Suivi des dettes par client, paiements Espèces / OM / MTN' },
  { icon: faStore,              color: '#00d4aa', label: 'Boutique',       desc: 'Stock de vente avec gestion par unité (ps, dz, crt, ballo…)' },
  { icon: faWarehouse,          color: '#3b82f6', label: 'Magasin',        desc: 'Entrepôt avec transferts vers la boutique' },
  { icon: faChartBar,           color: '#8b5cf6', label: 'Statistiques',   desc: 'Tableaux de bord et indicateurs clés' },
  { icon: faBell,               color: '#ef4444', label: 'Notifications',  desc: 'Rappels automatiques pour les dettes en retard' },
  { icon: faCog,                color: '#6b7280', label: 'Paramètres',     desc: 'Devise, délai de rappel et préférences' },
];

const APropos = () => (
  <div>
    <div className="mb-4">
      <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: '#203a43' }}>
        <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#00d4aa' }} />
        À propos
      </h4>
      <p className="text-muted small mb-0">Informations sur l'application</p>
    </div>

    {/* Carte principale */}
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div className="p-5 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 60%, #00d4aa 100%)' }}>
        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 fw-bold"
          style={{ width: 72, height: 72, background: '#00d4aa', fontSize: 32, color: '#fff' }}>
          G
        </div>
        <h3 className="fw-bold mb-1">GesTrack</h3>
        <p className="mb-2 opacity-75">Gestion des dettes &amp; clients</p>
        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          Version {VERSION}
        </span>
      </div>
    </div>

    {/* Fonctionnalités */}
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
      <div className="card-body p-4">
        <h6 className="fw-semibold mb-3" style={{ color: '#203a43' }}>Fonctionnalités</h6>
        <div className="row g-3">
          {FONCTIONNALITES.map(f => (
            <div key={f.label} className="col-12 col-md-6">
              <div className="d-flex align-items-start gap-3">
                <div className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                  style={{ width: 36, height: 36, background: `${f.color}18` }}>
                  <FontAwesomeIcon icon={f.icon} style={{ color: f.color, fontSize: 15 }} />
                </div>
                <div>
                  <div className="fw-semibold small" style={{ color: '#203a43' }}>{f.label}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{f.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Infos techniques */}
    <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
      <div className="card-body p-4">
        <h6 className="fw-semibold mb-3" style={{ color: '#203a43' }}>Informations techniques</h6>
        <div className="row g-2">
          {[
            ['Version',    VERSION],
            ['Frontend',   'React 18 + Bootstrap 5'],
            ['Backend',    'Node.js + Express'],
            ['Base de données', 'Firebase Firestore'],
          ].map(([label, val]) => (
            <div key={label} className="col-12 col-md-6">
              <div className="d-flex justify-content-between p-2 rounded"
                style={{ background: '#f8fafc' }}>
                <span className="text-muted small">{label}</span>
                <span className="fw-semibold small" style={{ color: '#203a43' }}>{val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default APropos;
