// Paramètres › Rappels : délai de relance automatique des dettes et rappel d'inventaire
import React, { useEffect, useMemo, useState } from 'react';
import { useParametres } from '@/context/ParametresContext';
import FormulaireParametres from '@/pages/parametres/components/FormulaireParametres';

const Rappels = () => {
  const { parametres } = useParametres();
  // Valeurs enregistrées (référence pour activer le bouton Enregistrer)
  const initiales = useMemo(() => ({
    periodeRappelJours: parametres.periodeRappelJours ?? 30,
    frequenceInventaireJours: parametres.frequenceInventaireJours ?? 30,
  }), [parametres]);
  const [form, setForm] = useState(initiales);

  useEffect(() => { setForm(initiales); }, [initiales]);

  return (
    <FormulaireParametres valeurs={form} initiales={initiales}>
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
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Rappel d'inventaire</h6>
              <label className="form-label small fw-semibold text-muted" htmlFor="frequence-inventaire">
                Me rappeler de faire l'inventaire
              </label>
              <select id="frequence-inventaire" className="form-select"
                value={form.frequenceInventaireJours}
                onChange={(e) => setForm({ ...form, frequenceInventaireJours: parseInt(e.target.value, 10) })}>
                <option value={0}>Jamais</option>
                <option value={7}>Chaque semaine</option>
                <option value={15}>Toutes les 2 semaines</option>
                <option value={30}>Chaque mois</option>
                <option value={60}>Tous les 2 mois</option>
                <option value={90}>Tous les 3 mois</option>
                <option value={180}>Tous les 6 mois</option>
                <option value={365}>Chaque année</option>
              </select>
              <small className="text-muted">
                {form.frequenceInventaireJours
                  ? 'Une alerte apparaît au tableau de bord quand le dernier inventaire est trop ancien (versions Pro).'
                  : 'Aucune alerte d\'inventaire au tableau de bord.'}
              </small>
            </div>
          </div>
        </div>
    </FormulaireParametres>
  );
};

export default Rappels;
