// Modal de création d'une nouvelle dette — et de modification d'une dette créée directement
// (prop `dette`) : montant initial, date et description
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { dettesAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';

export const ModalDette = ({ clientId, dette = null, onFermer, onSucces }) => {
  const enModification = !!dette;
  const [form, setForm] = useState(() => enModification
    ? { montantInitial: String(dette.montantInitial ?? ''), description: dette.description || '', dateReelle: (dette.createdAt || '').slice(0, 10) }
    : { montantInitial: '', description: '', dateReelle: '' });
  // Déjà payé : le nouveau montant ne peut pas descendre en dessous
  const dejaPaye = enModification ? Math.max(0, (dette.montantInitial || 0) - (dette.montantActuel || 0)) : 0;
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.montantInitial || parseFloat(form.montantInitial) <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    if (enModification && parseFloat(form.montantInitial) < dejaPaye) {
      toast.error(`Le client a déjà payé ${dejaPaye} FCFA : le montant ne peut pas être inférieur.`);
      return;
    }
    setChargement(true);
    try {
      const reponse = enModification
        ? await dettesAPI.modifier(dette.id, form)
        : await dettesAPI.create(clientId, form);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré, ne pas fermer/fêter un faux succès
      toast.success(enModification ? 'Dette modifiée' : 'Dette créée avec succès');
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || (enModification ? 'Erreur lors de la modification' : 'Erreur lors de la création'));
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{enModification ? 'Modifier la dette' : 'Nouvelle dette'}</h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={handleSubmit} id="form-dette">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Montant initial (FCFA) *</label>
                <input
                  type="number" min="1" className="form-control" required autoFocus
                  value={form.montantInitial}
                  onChange={(e) => setForm({ ...form, montantInitial: e.target.value })}
                  placeholder="Ex: 25000"
                />
                {enModification && (
                  <div className="form-text" style={{ fontSize: 11 }}>
                    Reste actuel : {dette.montantActuel} FCFA{dejaPaye > 0 ? ` · déjà payé : ${dejaPaye} FCFA (montant minimum)` : ''}.
                    Le reste à payer suit la différence de montant.
                  </div>
                )}
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
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : enModification ? 'Enregistrer' : 'Créer la dette'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDette;
