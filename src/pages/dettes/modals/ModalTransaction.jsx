// Modal : paiement ou ajout sur une dette
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { MOYENS_PAIEMENT } from '@/pages/dettes/constants';

// Modal pour ajouter ou réduire une dette (transaction)
// La soumission réelle (appel API + anti-doublon) est déléguée au parent via onSoumettre,
// pour centraliser la protection contre les doubles clics au même endroit que Solder/Abandonner.
export const ModalTransaction = ({ dette, type, onFermer, onSoumettre }) => {
  const [form, setForm] = useState({ montant: '', description: '', moyenPaiement: 'especes' });
  const [chargement, setChargement] = useState(false);
  const estPaiement = type === 'REDUCTION';
  const fmt = (m) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (chargement) return; // évite le double-submit si le clic arrive avant le re-render du disabled
    if (!form.montant || parseFloat(form.montant) <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    setChargement(true);
    try {
      await onSoumettre(form);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>
              {estPaiement ? 'Enregistrer un paiement' : 'Ajouter un montant'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer} disabled={chargement}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <div className="alert py-2" style={{ background: estPaiement ? '#f0fdf4' : '#fff7ed', borderRadius: 10, border: 'none' }}>
              <small className={estPaiement ? 'text-success' : 'text-warning'}>
                Montant actuel : <strong>{fmt(dette.montantActuel)}</strong>
              </small>
            </div>
            <form onSubmit={handleSubmit} id="form-transaction">
              <div className="mb-3 mt-3">
                <label className="form-label small fw-semibold text-muted">Montant (FCFA) *</label>
                <input type="number" min="1" className="form-control" required autoFocus
                  value={form.montant} onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, montant: v })); }}
                  placeholder="Ex: 5000" />
              </div>
              {/* Moyen de paiement (uniquement pour un paiement) */}
              {estPaiement && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Moyen de paiement</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {MOYENS_PAIEMENT.map(m => (
                      <label key={m.value} className="d-flex align-items-center gap-2 px-3 py-2 rounded cursor-pointer"
                        style={{ border: `2px solid ${form.moyenPaiement === m.value ? m.color : '#e2e8f0'}`,
                                 background: form.moyenPaiement === m.value ? `${m.color}15` : '#fff',
                                 cursor: 'pointer', fontSize: 13 }}>
                        <input type="radio" name="moyenPaiement" value={m.value}
                          checked={form.moyenPaiement === m.value}
                          onChange={() => setForm(prev => ({ ...prev, moyenPaiement: m.value }))}
                          className="form-check-input m-0" />
                        <span style={{ color: form.moyenPaiement === m.value ? m.color : '#374151', fontWeight: 500 }}>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Note (optionnel)</label>
                <input className="form-control" value={form.description}
                  onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, description: v })); }}
                  placeholder={estPaiement ? 'Ex: Paiement partiel' : 'Ex: Nouvel achat'} />
              </div>
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={chargement}>Annuler</button>
            <button type="submit" form="form-transaction" className="btn text-white"
              style={{ background: estPaiement ? '#16a34a' : '#ea580c' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (estPaiement ? 'Enregistrer paiement' : 'Ajouter')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTransaction;
