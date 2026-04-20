// Page des paramètres de l'application
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSpinner, faSave, faSun, faMoon, faDesktop } from '@fortawesome/free-solid-svg-icons';
import { parametresAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';

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

const Parametres = () => {
  const { parametres, setParametres } = useParametres();
  const [form, setForm] = useState({ periodeRappelJours: 30, devise: 'XAF', theme: 'light' });
  const [chargement, setChargement] = useState(false);

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
    <div>
      {/* En-tête */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
          <FontAwesomeIcon icon={faCog} style={{ color: '#00d4aa' }} />
          Paramètres
        </h4>
        <p className="text-muted small mb-0">Configurez les préférences de l'application</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Rappel des dettes */}
          <div className="col-12 col-md-6">
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

          {/* Devise */}
          <div className="col-12 col-md-6">
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

          {/* Thème */}
          <div className="col-12">
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
          </div>
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
    </div>
  );
};

export default Parametres;
