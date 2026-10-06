// Paramètres › Rappels : délai de relance automatique des dettes
import React, { useEffect, useState } from 'react';
import { useParametres } from '@/context/ParametresContext';
import FormulaireParametres from '@/pages/parametres/components/FormulaireParametres';

const Rappels = () => {
  const { parametres } = useParametres();
  const [form, setForm] = useState({ periodeRappelJours: 30 });

  useEffect(() => {
    setForm({ periodeRappelJours: parametres.periodeRappelJours ?? 30 });
  }, [parametres]);

  return (
    <FormulaireParametres valeurs={form}>
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
                  autoFocus
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
    </FormulaireParametres>
  );
};

export default Rappels;
