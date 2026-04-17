// Modal de création d'une nouvelle dette
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { dettesAPI } from '@/services/api';
import { toast } from 'react-toastify';

export const ModalDette = ({ clientId, onFermer, onSucces }) => {
  const [form, setForm] = useState({ montantInitial: '', description: '', dateReelle: '' });
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.montantInitial || parseFloat(form.montantInitial) <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    setChargement(true);
    try {
      await dettesAPI.create(clientId, form);
      toast.success('Dette créée avec succès');
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog">
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: '#203a43' }}>Nouvelle dette</h5>
            <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={handleSubmit} id="form-dette">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Montant initial (FCFA) *</label>
                <input
                  type="number" min="1" className="form-control" required
                  value={form.montantInitial}
                  onChange={(e) => setForm({ ...form, montantInitial: e.target.value })}
                  placeholder="Ex: 25000"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Date de la dette</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.dateReelle}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, dateReelle: e.target.value })}
                />
                <div className="form-text text-muted" style={{ fontSize: 11 }}>
                  Laisser vide pour utiliser la date d'aujourd'hui
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Description</label>
                <textarea
                  rows={3} className="form-control"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Achat de marchandises, crédit alimentaire..."
                />
              </div>
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-dette" className="btn text-white" style={{ background: '#00d4aa' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Créer la dette'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MOYENS_PAIEMENT = [
  { value: 'especes', label: 'Espèces',          color: '#16a34a' },
  { value: 'om',      label: 'Orange Money',      color: '#ea580c' },
  { value: 'mtn',     label: 'MTN Mobile Money',  color: '#eab308' },
];

// Modal pour ajouter ou réduire une dette (transaction)
export const ModalTransaction = ({ dette, type, onFermer, onSucces }) => {
  const [form, setForm] = useState({ montant: '', description: '', moyenPaiement: 'especes' });
  const [chargement, setChargement] = useState(false);
  const estPaiement = type === 'REDUCTION';
  const fmt = (m) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.montant || parseFloat(form.montant) <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    setChargement(true);
    try {
      if (estPaiement) {
        await dettesAPI.reduire(dette.id, form);
        toast.success('Paiement enregistré avec succès');
      } else {
        await dettesAPI.ajouter(dette.id, form);
        toast.success('Montant ajouté avec succès');
      }
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la transaction');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog">
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: '#203a43' }}>
              {estPaiement ? 'Enregistrer un paiement' : 'Ajouter un montant'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}>
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
                <input type="number" min="1" className="form-control" required
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
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
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

// Modal confirmation de solde avec choix du moyen de paiement
export const ModalSolder = ({ dette, onConfirmer, onFermer }) => {
  const [moyenPaiement, setMoyenPaiement] = useState('especes');
  const fmt = (m) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold" style={{ color: '#203a43' }}>Solder la dette</h6>
            <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <p className="text-muted small mb-3">
              Solder intégralement <strong>{fmt(dette.montantActuel)}</strong> ? Choisissez le moyen de paiement :
            </p>
            <div className="d-flex flex-column gap-2">
              {MOYENS_PAIEMENT.map(m => (
                <label key={m.value} className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                  style={{ border: `2px solid ${moyenPaiement === m.value ? m.color : '#e2e8f0'}`,
                           background: moyenPaiement === m.value ? `${m.color}15` : '#fff',
                           cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="moyenSolder" value={m.value}
                    checked={moyenPaiement === m.value}
                    onChange={() => setMoyenPaiement(m.value)}
                    className="form-check-input m-0" />
                  <span style={{ color: moyenPaiement === m.value ? m.color : '#374151', fontWeight: 500 }}>{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light btn-sm" onClick={onFermer}>Annuler</button>
            <button className="btn btn-sm text-white" style={{ background: '#16a34a' }}
              onClick={() => onConfirmer(moyenPaiement)}>
              Confirmer le solde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDette;
