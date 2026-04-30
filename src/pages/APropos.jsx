// Page À propos — informations sur l'application GesTrack
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfoCircle, faUsers, faFileInvoiceDollar,
  faStore, faWarehouse, faChartBar, faBell, faCog,
  faChartLine, faPaperPlane, faEnvelope, faUser, faBookOpen,
} from '@fortawesome/free-solid-svg-icons';

const VERSION = '1.2.0';

const FONCTIONNALITES = [
  { icon: faUsers,              color: '#6366f1', label: 'Clients',          desc: 'Gérez votre portefeuille clients avec photos et contacts' },
  { icon: faFileInvoiceDollar, color: '#f59e0b', label: 'Dettes',            desc: 'Suivi des dettes par client, paiements Espèces / OM / MTN' },
  { icon: faStore,              color: '#00d4aa', label: 'Boutique',          desc: 'Stock de vente avec gestion par unité (ps, dz, crt, ballo…)' },
  { icon: faWarehouse,          color: '#3b82f6', label: 'Magasin',           desc: 'Entrepôt avec transferts vers la boutique' },
  { icon: faChartLine,          color: '#8b5cf6', label: 'Finances',          desc: 'Capital, chiffre d\'affaires, bénéfices et dépenses en temps réel' },
  { icon: faBookOpen,           color: '#10b981', label: 'Mon Compte',        desc: 'Journal des entrées/sorties de trésorerie personnelle' },
  { icon: faChartBar,           color: '#ec4899', label: 'Statistiques',      desc: 'Tableaux de bord et indicateurs clés de performance' },
  { icon: faBell,               color: '#ef4444', label: 'Notifications',     desc: 'Rappels automatiques pour les dettes en retard' },
  { icon: faCog,                color: '#6b7280', label: 'Paramètres',        desc: 'Devise, thème, délai de rappel et préférences' },
];

const APropos = () => {
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
            <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#00d4aa' }} />
            À propos
          </h4>
          <p className="text-muted small mb-0">Informations sur l'application</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
      {/* Carte principale */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div className="p-5 text-center text-white"
          style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 60%, #00d4aa 100%)' }}>
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 fw-bold"
            style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', fontSize: 32, color: '#fff' }}>
            G
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

      {/* Formulaire suggestion */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
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
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Votre nom"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label text-muted small fw-semibold">Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary border-end-0">
                    <FontAwesomeIcon icon={faEnvelope} className="text-muted" style={{ fontSize: 12 }} />
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0"
                    placeholder="votre@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="col-12">
                <label className="form-label text-muted small fw-semibold">Objet</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Sujet de votre message"
                  value={form.objet}
                  onChange={(e) => setForm({ ...form, objet: e.target.value })}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label text-muted small fw-semibold">Message</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Décrivez votre suggestion ou remarque..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="mt-3">
              <button
                type="submit"
                className="btn text-white d-flex align-items-center gap-2"
                style={{ background: '#00d4aa', borderRadius: 10 }}>
                <FontAwesomeIcon icon={faPaperPlane} />
                Envoyer la suggestion
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>{/* fin scrollable */}
    </div>
  );
};

export default APropos;
