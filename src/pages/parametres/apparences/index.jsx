// Paramètres › Apparence : devise et thème de l'interface
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParametres } from '@/context/ParametresContext';
import FormulaireParametres from '@/pages/parametres/components/FormulaireParametres';
import { appliquerThemeLocal, DEVISES, THEMES } from '@/pages/parametres/apparences/constants';

const Apparences = () => {
  const { parametres } = useParametres();
  const [form, setForm] = useState({ devise: 'XAF', theme: 'light' });

  useEffect(() => {
    setForm({ devise: parametres.devise ?? 'XAF', theme: parametres.theme ?? 'light' });
  }, [parametres]);

  return (
    <FormulaireParametres valeurs={form}>
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
        {/* Thème — onglet Apparence */}
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
    </FormulaireParametres>
  );
};

export default Apparences;
