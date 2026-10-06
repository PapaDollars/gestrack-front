// Modal formulaire fournisseur contact — création / modification
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { fournisseursContactsAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import SelecteurTypesProduits from '@/components/common/SelecteurTypesProduits';

const ModalFournisseurForm = ({ contact = null, onFermer, onSucces }) => {
  const [envoi, setEnvoi]                 = useState(false);
  const [form, setForm] = useState({
    nom:               contact?.nom               || '',
    telephone:         contact?.telephone          || '',
    telephoneWhatsapp: contact?.telephoneWhatsapp  || '',
    ville:             contact?.ville              || '',
    autresInfos:       contact?.autresInfos         || '',
    typesProduits:     contact?.typesProduits      || [],
  });

  const soumettre = async (e) => {
    e.preventDefault();
    if (!form.nom) { toast.error('Le nom est requis'); return; }
    setEnvoi(true);
    try {
      const data = { ...form, typesProduits: JSON.stringify(form.typesProduits) };
      const reponse = contact
        ? await fournisseursContactsAPI.update(contact.id, data)
        : await fournisseursContactsAPI.create(data);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success(contact ? 'Fournisseur modifié' : 'Fournisseur ajouté');
      onSucces();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setEnvoi(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              {contact ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={soumettre} id="form-fournisseur">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Nom complet *</label>
                <input className="form-control" required autoFocus value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Téléphone</label>
                  <input className="form-control" type="tel" value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">WhatsApp (optionnel)</label>
                  <input className="form-control" type="tel" value={form.telephoneWhatsapp}
                    onChange={e => setForm(f => ({ ...f, telephoneWhatsapp: e.target.value }))} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Ville</label>
                <input className="form-control" value={form.ville}
                  onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Autres informations</label>
                <textarea className="form-control" rows={2} value={form.autresInfos}
                  onChange={e => setForm(f => ({ ...f, autresInfos: e.target.value }))} />
              </div>
              <SelecteurTypesProduits
                multiple
                value={form.typesProduits}
                onChange={typesProduits => setForm(f => ({ ...f, typesProduits }))}
              />
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button type="submit" form="form-fournisseur" className="btn text-white"
              style={{ background: '#00d4aa', borderRadius: 10 }} disabled={envoi}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : (contact ? 'Enregistrer' : 'Ajouter')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalFournisseurForm;
