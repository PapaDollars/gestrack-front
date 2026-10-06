// Modal : nouvelle entrée / modification d'une entrée du compte
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { compteAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import { TYPES, PERIODES } from '@/pages/finances/mon-compte/constants';

// ── Modal Ajout/Modification ────────────────────────────────────────────────
const ModalForm = ({ initial, onFermer, onSucces }) => {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: today, montant: '', type: 'especes', periode: 'jour', note: '',
    ...initial,
  });
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.montant || parseFloat(form.montant) <= 0) { toast.error('Montant invalide'); return; }
    setChargement(true);
    try {
      const reponse = initial?.id
        ? await compteAPI.update(initial.id, form)
        : await compteAPI.create(form);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success(initial?.id ? 'Transaction modifiée' : 'Transaction ajoutée');
      onSucces();
    } catch { toast.error('Erreur lors de l\'enregistrement'); }
    finally { setChargement(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
     >
      <div className="modal-dialog modal-fullscreen-sm-down modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>
              {initial?.id ? 'Modifier la transaction' : 'Nouvelle transaction'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={handleSubmit} id="form-compte">

              {/* Date */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Date *</label>
                <input type="date" className="form-control" required autoFocus
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>

              {/* Montant */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Montant *</label>
                <div className="input-group">
                  <input type="number" min="1" className="form-control" required
                    placeholder="0" value={form.montant}
                    onChange={e => setForm({ ...form, montant: e.target.value })} />
                  <span className="input-group-text bg-body-secondary">FCFA</span>
                </div>
              </div>

              {/* Type */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Type de paiement *</label>
                <div className="d-flex gap-2 flex-wrap">
                  {TYPES.map(t => (
                    <button key={t.val} type="button"
                      className="btn d-flex align-items-center gap-2"
                      style={{
                        background: form.type === t.val ? t.bg : '#f8fafc',
                        color: form.type === t.val ? t.color : '#64748b',
                        border: `2px solid ${form.type === t.val ? t.color : '#e2e8f0'}`,
                        borderRadius: 10, fontSize: 'var(--txt-md)',
                      }}
                      onClick={() => setForm({ ...form, type: t.val })}>
                      <FontAwesomeIcon icon={t.icon} />
                      {t.label}
                      {form.type === t.val && <FontAwesomeIcon icon={faCheck} style={{ fontSize: 'var(--txt-xs)' }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Période */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Période</label>
                <div className="d-flex gap-2">
                  {PERIODES.map(p => (
                    <button key={p.val} type="button"
                      className="btn flex-grow-1"
                      style={{
                        background: form.periode === p.val ? '#eff6ff' : '#f8fafc',
                        color: form.periode === p.val ? '#1d4ed8' : '#64748b',
                        border: `2px solid ${form.periode === p.val ? '#1d4ed8' : '#e2e8f0'}`,
                        borderRadius: 10, fontSize: 'var(--txt-md)',
                      }}
                      onClick={() => setForm({ ...form, periode: p.val })}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="mb-1">
                <label className="form-label small fw-semibold text-muted">Note (optionnel)</label>
                <input className="form-control" placeholder="Ex: Marché du matin, Transfert client..."
                  value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-compte" className="btn text-white"
              style={{ background: '#00d4aa', borderRadius: 10 }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (initial?.id ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalForm;
