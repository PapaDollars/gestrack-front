// Page des paramètres de l'application
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSpinner, faSave, faSun, faMoon, faDesktop, faPrint, faUsers, faStore } from '@fortawesome/free-solid-svg-icons';
import { parametresAPI, clientsAPI, produitsAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { imprimerListeClients, imprimerListeProduits } from '@/utils/pdfTemplates';

const appliquerThemeLocal = (theme) => {
  if (theme === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  } else {
    document.body.setAttribute('data-bs-theme', theme);
  }
};
import { toast } from 'react-toastify';

const DEVISES = [
  { value: 'XAF',  label: 'XAF — Franc CFA (ISO)' },
  { value: 'EUR',  label: 'EUR — Euro' },
  { value: 'USD',  label: 'USD — Dollar américain' },
  { value: 'CAD',  label: 'CAD — Dollar canadien' },
];

const THEMES = [
  { value: 'light',  label: 'Clair',   icon: faSun,     color: '#f59e0b' },
  { value: 'dark',   label: 'Sombre',  icon: faMoon,    color: '#6366f1' },
  { value: 'system', label: 'Système', icon: faDesktop, color: '#6b7280' },
];

// ── Section export (clients + produits) ──────────────────────────────────
const SectionExport = () => {
  const [clients, setClients]     = useState(null);
  const [produits, setProduits]   = useState(null);
  const [selClients, setSelClients]   = useState({});
  const [selProduits, setSelProduits] = useState({});
  const [chargClients, setChargClients]   = useState(false);
  const [chargProduits, setChargProduits] = useState(false);
  const [ouvertClients, setOuvertClients]   = useState(false);
  const [ouvertProduits, setOuvertProduits] = useState(false);

  const chargerClients = async () => {
    if (clients) { setOuvertClients(v => !v); return; }
    setChargClients(true);
    try {
      const { data } = await clientsAPI.getAll();
      setClients(data);
      const sel = {};
      data.forEach(c => { sel[c.id] = true; });
      setSelClients(sel);
      setOuvertClients(true);
    } catch { } finally { setChargClients(false); }
  };

  const chargerProduits = async () => {
    if (produits) { setOuvertProduits(v => !v); return; }
    setChargProduits(true);
    try {
      // Boutique + Magasin fusionnés, étiquetés par source
      const [boutiqueRes, magasinRes] = await Promise.all([
        produitsAPI.getAll(),
        import('@/services/api').then(m => m.magasinAPI.getAll()),
      ]);
      const tous = [
        ...boutiqueRes.data.map(p => ({ ...p, _source: 'Boutique' })),
        ...magasinRes.data.map(p => ({ ...p, _source: 'Magasin' })),
      ].sort((a, b) => a.nom?.localeCompare(b.nom, 'fr'));
      setProduits(tous);
      const sel = {};
      tous.forEach(p => { sel[p.id + p._source] = true; });
      setSelProduits(sel);
      setOuvertProduits(true);
    } catch { } finally { setChargProduits(false); }
  };

  const exportClients = () => {
    const selection = (clients || []).filter(c => selClients[c.id]);
    if (!selection.length) { return; }
    imprimerListeClients(selection);
  };

  const exportProduits = () => {
    const selection = (produits || []).filter(p => selProduits[p.id + p._source]);
    if (!selection.length) { return; }
    imprimerListeProduits(selection);
  };

  const tousClients  = clients  && Object.values(selClients).every(Boolean);
  const tousProduits = produits && Object.values(selProduits).every(Boolean);

  return (
    <div className="mt-4">
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
        <FontAwesomeIcon icon={faPrint} style={{ color: '#00d4aa' }} />
        Exporter et imprimer
      </h6>

      {/* ── Export clients ── */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faUsers} style={{ color: '#00d4aa' }} />
              <span className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 14 }}>Liste des clients</span>
              {clients && <span className="badge bg-secondary">{Object.values(selClients).filter(Boolean).length}/{clients.length}</span>}
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light" onClick={chargerClients} disabled={chargClients}>
                {chargClients ? <FontAwesomeIcon icon={faSpinner} spin /> : (ouvertClients ? '▲' : '▼')}
              </button>
              {ouvertClients && (
                <button className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: '#00d4aa', color: '#fff', borderRadius: 8 }}
                  onClick={exportClients}
                  disabled={!Object.values(selClients).some(Boolean)}>
                  <FontAwesomeIcon icon={faPrint} /> Imprimer
                </button>
              )}
            </div>
          </div>

          {ouvertClients && clients && (
            <div>
              <label className="d-flex align-items-center gap-2 mb-2 small fw-semibold" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={tousClients}
                  onChange={e => { const s = {}; clients.forEach(c => { s[c.id] = e.target.checked; }); setSelClients(s); }} />
                Sélectionner tout
              </label>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {clients.map(c => (
                  <label key={c.id} className="d-flex align-items-center gap-2 py-1 px-1 rounded" style={{ cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={!!selClients[c.id]}
                      onChange={e => setSelClients(prev => ({ ...prev, [c.id]: e.target.checked }))} />
                    <span className="flex-grow-1">{c.prenom} {c.nom}</span>
                    <span className="text-muted small">{c.profession}</span>
                    {c.totalDette > 0 && (
                      <span style={{ color: '#dc2626', fontSize: 11, fontWeight: 600 }}>
                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(c.totalDette)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Export produits ── */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faStore} style={{ color: '#6366f1' }} />
              <span className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 14 }}>Liste des produits (boutique)</span>
              {produits && <span className="badge bg-secondary">{Object.values(selProduits).filter(Boolean).length}/{produits.length}</span>}
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light" onClick={chargerProduits} disabled={chargProduits}>
                {chargProduits ? <FontAwesomeIcon icon={faSpinner} spin /> : (ouvertProduits ? '▲' : '▼')}
              </button>
              {ouvertProduits && (
                <button className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: '#6366f1', color: '#fff', borderRadius: 8 }}
                  onClick={exportProduits}
                  disabled={!Object.values(selProduits).some(Boolean)}>
                  <FontAwesomeIcon icon={faPrint} /> Imprimer
                </button>
              )}
            </div>
          </div>

          {ouvertProduits && produits && (
            <div>
              <label className="d-flex align-items-center gap-2 mb-2 small fw-semibold" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={tousProduits}
                  onChange={e => { const s = {}; produits.forEach(p => { s[p.id + p._source] = e.target.checked; }); setSelProduits(s); }} />
                Sélectionner tout
              </label>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {produits.map(p => (
                  <label key={p.id + p._source} className="d-flex align-items-center gap-2 py-1 px-1 rounded" style={{ cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={!!selProduits[p.id + p._source]}
                      onChange={e => setSelProduits(prev => ({ ...prev, [p.id + p._source]: e.target.checked }))} />
                    <span className="flex-grow-1">{p.nom}</span>
                    <span className="badge" style={{ background: p._source === 'Magasin' ? '#dbeafe' : '#dcfce7', color: p._source === 'Magasin' ? '#1e40af' : '#166534', fontSize: 10 }}>{p._source}</span>
                    <span className="text-muted small">{p.categorie}</span>
                    <span style={{ color: '#00a881', fontSize: 11, fontWeight: 600 }}>
                      {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(p.prixVente)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Parametres = () => {
  const { parametres, setParametres } = useParametres();
  const [form, setForm] = useState({ periodeRappelJours: 30, devise: 'XAF', theme: 'light' });
  const [chargement, setChargement] = useState(false);
  const [onglet, setOnglet] = useState('apparence');

  useEffect(() => {
    setForm({
      periodeRappelJours: parametres.periodeRappelJours ?? 30,
      devise: parametres.devise ?? 'XAF',
      theme: parametres.theme ?? 'light',
    });
  }, [parametres]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      const { data } = await parametresAPI.update(form);
      setParametres(data);
      toast.success('Paramètres enregistrés');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faCog} style={{ color: '#00d4aa' }} />
            Paramètres
          </h4>
        </div>
        {/* ── Onglets ── */}
        <div className="d-flex gap-1 mb-1 flex-wrap">
          {[
            { id: 'apparence', label: 'Apparence' },
            { id: 'rappels',   label: 'Rappels' },
            { id: 'export',    label: 'Export' },
          ].map(({ id, label }) => (
            <button key={id}
              className="btn btn-sm"
              style={{
                borderRadius: '8px 8px 0 0',
                background: onglet === id ? '#00d4aa' : 'var(--bs-secondary-bg)',
                color: onglet === id ? '#fff' : 'var(--bs-secondary-color)',
                fontWeight: onglet === id ? 600 : 400,
                border: 'none',
              }}
              onClick={() => setOnglet(id)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ height: 2, background: '#00d4aa', borderRadius: 2, marginBottom: '1rem' }} />
        <div style={{ display: 'none' }}>{/* placeholder pour aligner le padding avec la section scrollable */}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
      {onglet === 'export' ? <SectionExport /> : (
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Rappel des dettes — onglet Rappels */}
          {onglet === 'rappels' && <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Rappel des dettes</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">
                    Délai de rappel automatique (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    className="form-control"
                    value={form.periodeRappelJours}
                    onChange={(e) => setForm({ ...form, periodeRappelJours: parseInt(e.target.value) || 30 })}
                  />
                  <small className="text-muted">
                    Les dettes sans activité depuis {form.periodeRappelJours} jours seront marquées à relancer.
                  </small>
                </div>
              </div>
            </div>
          </div>

          }
          {/* Devise — onglet Apparence */}
          {onglet === 'apparence' && <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Devise</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">
                    Devise utilisée pour les montants
                  </label>
                  <select
                    className="form-select"
                    value={form.devise}
                    onChange={(e) => setForm({ ...form, devise: e.target.value })}
                  >
                    {DEVISES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Cette devise sera utilisée dans toute l'application pour l'affichage des prix.
                  </small>
                </div>
              </div>
            </div>
          </div>

          }
          {/* Thème — onglet Apparence */}
          {onglet === 'apparence' && <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Thème de l'interface</h6>
                <div className="d-flex flex-wrap gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className="btn d-flex align-items-center gap-2 px-4 py-2"
                      style={{
                        borderRadius: 10,
                        border: form.theme === t.value ? `2px solid ${t.color}` : '2px solid #e5e7eb',
                        background: form.theme === t.value ? `${t.color}12` : '#f9fafb',
                        color: form.theme === t.value ? t.color : '#6b7280',
                        fontWeight: form.theme === t.value ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => { setForm({ ...form, theme: t.value }); appliquerThemeLocal(t.value); }}
                    >
                      <FontAwesomeIcon icon={t.icon} />
                      {t.label}
                    </button>
                  ))}
                </div>
                <small className="text-muted mt-2 d-block">
                  {form.theme === 'system'
                    ? 'Le thème s\'adapte automatiquement aux préférences de votre système d\'exploitation.'
                    : form.theme === 'dark'
                    ? 'Interface sombre — idéale en environnement peu éclairé.'
                    : 'Interface claire — par défaut.'}
                </small>
              </div>
            </div>
          }
        </div>

        {/* Bouton enregistrer */}
        <div className="mt-4">
          <button
            type="submit"
            className="btn text-white d-flex align-items-center gap-2"
            style={{ background: '#00d4aa', borderRadius: 10 }}
            disabled={chargement}
          >
            {chargement
              ? <FontAwesomeIcon icon={faSpinner} spin />
              : <FontAwesomeIcon icon={faSave} />
            }
            Enregistrer les paramètres
          </button>
        </div>
      </form>
      )}
      </div>{/* fin scrollable */}
    </div>
  );
};

export default Parametres;
