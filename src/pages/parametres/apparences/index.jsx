// Paramètres › Apparence : thème de l'interface, devise et ordre des sections du tableau de bord
import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { useParametres } from '@/context/ParametresContext';
import FormulaireParametres from '@/pages/parametres/components/FormulaireParametres';
import { appliquerThemeLocal, DEVISES, THEMES } from '@/pages/parametres/apparences/constants';
import { SECTIONS_TABLEAU_BORD, ordreSections } from '@/utils/tableauDeBord';

const Apparences = () => {
  const { parametres } = useParametres();
  // Valeurs enregistrées (référence pour activer le bouton Enregistrer)
  const initiales = useMemo(() => ({
    devise: parametres.devise ?? 'XAF', theme: parametres.theme ?? 'light',
    ordreTableauBord: ordreSections(parametres.ordreTableauBord),
  }), [parametres]);
  const [form, setForm] = useState(initiales);

  // Monte (-1) ou descend (+1) une section du tableau de bord
  const deplacer = (index, sens) => setForm(f => {
    const ordre = [...f.ordreTableauBord];
    [ordre[index], ordre[index + sens]] = [ordre[index + sens], ordre[index]];
    return { ...f, ordreTableauBord: ordre };
  });

  useEffect(() => { setForm(initiales); }, [initiales]);

  return (
    <FormulaireParametres valeurs={form} initiales={initiales}>
        {/* Thème — en premier */}
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

        {/* Ordre des sections du tableau de bord (zone qui défile, sous les chiffres clés) */}
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>Ordre du tableau de bord</h6>
              <small className="text-muted d-block mb-3">
                Classez les sections affichées sous les chiffres clés, de haut en bas.
              </small>
              <div className="d-flex flex-column gap-2">
                {form.ordreTableauBord.map((id, i) => {
                  const section = SECTIONS_TABLEAU_BORD.find(s => s.id === id);
                  const dernier = i === form.ordreTableauBord.length - 1;
                  return (
                    <div key={id} className="d-flex align-items-center gap-2 px-2 py-1 rounded-3"
                      style={{ background: 'var(--bs-secondary-bg)' }}>
                      <span className="fw-bold text-muted text-center flex-shrink-0" style={{ width: 18, fontSize: 'var(--txt-sm)' }}>{i + 1}</span>
                      <FontAwesomeIcon icon={section.icone} className="flex-shrink-0" style={{ color: '#00a881', width: 16 }} />
                      <span className="small fw-semibold me-auto" style={{ color: 'var(--bs-body-color)', minWidth: 0 }}>{section.label}</span>
                      <button type="button" className="btn btn-sm flex-shrink-0" disabled={i === 0}
                        title="Monter" aria-label={`Monter ${section.label}`} onClick={() => deplacer(i, -1)}
                        style={{ width: 30, height: 30, padding: 0, color: '#00a881' }}>
                        <FontAwesomeIcon icon={faArrowUp} />
                      </button>
                      <button type="button" className="btn btn-sm flex-shrink-0" disabled={dernier}
                        title="Descendre" aria-label={`Descendre ${section.label}`} onClick={() => deplacer(i, 1)}
                        style={{ width: 30, height: 30, padding: 0, color: '#00a881' }}>
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
    </FormulaireParametres>
  );
};

export default Apparences;
