import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faPlayCircle, faPaperPlane, faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import pkg from '../../../package.json';
import logo from '@/assets/img/logo.png';
import { FONCTIONNALITES, FAQ_ITEMS, VIDEO_PLACEHOLDERS } from '@/pages/guides/constants';
import FaqItem from '@/pages/guides/components/FaqItem';
import { EMAIL_CONTACT, mailto } from '@/utils/url/frontend';

const VERSION = pkg.version;

const Guide = () => {
  const [form, setForm] = useState({ nom: '', email: '', objet: '', message: '' });

  const handleSuggestion = (e) => {
    e.preventDefault();
    window.location.href = mailto(EMAIL_CONTACT, { sujet: form.objet, corps: `De: ${form.nom} (${form.email})\n\n${form.message}` });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
              <a href={mailto(EMAIL_CONTACT)} style={{ color: '#00d4aa' }}>{EMAIL_CONTACT}</a>
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
