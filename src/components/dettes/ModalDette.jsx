// Modal de création d'une nouvelle dette
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { dettesAPI } from '@/services/api';
import { toast } from 'react-toastify';

export const ModalDette = ({ clientId, onFermer, onSucces }) => {
  const [form, setForm] = useState({ montantInitial: '', description: '' });
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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
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

// Modal pour ajouter ou réduire une dette (transaction)
export const ModalTransaction = ({ dette, type, onFermer, onSucces }) => {
  const [form, setForm] = useState({ montant: '', description: '' });
  const [chargement, setChargement] = useState(false);

  const estPaiement = type === 'REDUCTION';

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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
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
                Montant actuel de la dette :{' '}
                <strong>{new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(dette.montantActuel)}</strong>
              </small>
            </div>
            <form onSubmit={handleSubmit} id="form-transaction">
              <div className="mb-3 mt-3">
                <label className="form-label small fw-semibold text-muted">Montant (FCFA) *</label>
                <input
                  type="number" min="1" className="form-control" required
                  value={form.montant}
                  onChange={(e) => setForm({ ...form, montant: e.target.value })}
                  placeholder="Ex: 5000"
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Note (optionnel)</label>
                <input
                  className="form-control"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={estPaiement ? 'Ex: Paiement partiel en espèces' : 'Ex: Nouvel achat'}
                />
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

export default ModalDette;
