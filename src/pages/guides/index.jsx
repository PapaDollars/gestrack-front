import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faPaperPlane, faEnvelope, faUser, faSearch, faRocket } from '@fortawesome/free-solid-svg-icons';
import pkg from '../../../package.json';
import logo from '@/assets/img/logo.png';
import { PREMIERS_PAS, RUBRIQUES, MOTS, FAQ_ITEMS } from '@/pages/guides/constants';
import FaqItem from '@/pages/guides/components/FaqItem';
import RubriqueGuide from '@/pages/guides/components/RubriqueGuide';
import { EMAIL_CONTACT, mailto } from '@/utils/url/frontend';

const VERSION = pkg.version;

// Recherche sans tenir compte des accents ni des majuscules (« facture » trouve « Facturé »)
const normaliser = (texte) => String(texte).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const contient = (terme, ...textes) => textes.flat().some(t => normaliser(t).includes(terme));

const Guide = () => {
  const [form, setForm] = useState({ nom: '', email: '', objet: '', message: '' });
  const [recherche, setRecherche] = useState('');
  const terme = normaliser(recherche.trim());

  // Contenu filtré par la recherche (tout s'affiche quand elle est vide)
  const { rubriques, mots, faq } = useMemo(() => ({
    rubriques: terme ? RUBRIQUES.filter(r => contient(terme, r.titre, r.a_quoi_ca_sert, r.etapes, r.astuces || [])) : RUBRIQUES,
    mots: terme ? MOTS.filter(m => contient(terme, m.mot, m.def)) : MOTS,
    faq: terme ? FAQ_ITEMS.filter(f => contient(terme, f.q, f.a)) : FAQ_ITEMS,
  }), [terme]);

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
          <p className="text-muted small mb-0">Tout pour bien démarrer et utiliser GesTrack au quotidien</p>
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

        {/* Recherche dans tout le guide */}
        <div className="input-group mb-4">
          <span className="input-group-text bg-body border-end-0"><FontAwesomeIcon icon={faSearch} className="text-muted" /></span>
          <input type="search" className="form-control border-start-0" placeholder="Chercher dans le guide : facture, dette, transfert, code…"
            value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </div>

        {/* Premiers pas — masqué pendant une recherche */}
        {!terme && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faRocket} style={{ color: '#00d4aa' }} />
                Premiers pas
              </h6>
              <p className="text-muted small mb-3">Nouveau sur GesTrack ? Suivez ces étapes dans l'ordre.</p>
              <div className="row g-3">
                {PREMIERS_PAS.map((etape, i) => (
                  <div key={etape.titre} className="col-12 col-md-6 col-xl-4">
                    <div className="d-flex gap-3 h-100 p-3 rounded-3" style={{ background: 'var(--bs-secondary-bg)' }}>
                      <span className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0"
                        style={{ width: 30, height: 30, background: '#00d4aa' }}>{i + 1}</span>
                      <div>
                        <div className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>{etape.titre}</div>
                        <div className="text-muted small" style={{ lineHeight: 1.55 }}>{etape.texte}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Guide par rubrique — dépliées automatiquement pendant une recherche */}
        {rubriques.length > 0 && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>Guide par rubrique</h6>
              <p className="text-muted small mb-3">Une rubrique par page du menu. Cliquez pour voir comment l'utiliser.</p>
              {rubriques.map(r => <RubriqueGuide key={r.id} rubrique={r} ouvert={terme ? true : undefined} />)}
            </div>
          </div>
        )}

        {/* Mots à connaître */}
        {mots.length > 0 && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Mots à connaître</h6>
              <div className="row g-2">
                {mots.map(m => (
                  <div key={m.mot} className="col-12 col-lg-6">
                    <div className="h-100 p-3 rounded-3" style={{ background: 'var(--bs-secondary-bg)' }}>
                      <div className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>{m.mot}</div>
                      <div className="text-muted small" style={{ lineHeight: 1.55 }}>{m.def}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Questions fréquentes</h6>
              {faq.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} ouvert={terme ? true : undefined} />
              ))}
            </div>
          </div>
        )}

        {terme && rubriques.length === 0 && mots.length === 0 && faq.length === 0 && (
          <p className="text-muted text-center py-4">
            Rien trouvé pour « {recherche} ». Essayez un autre mot, ou posez votre question avec le formulaire ci-dessous.
          </p>
        )}

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
