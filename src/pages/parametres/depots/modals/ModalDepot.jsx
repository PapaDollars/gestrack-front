// Créer ou modifier un dépôt : nom, adresse, responsable.
// principal : le Dépôt principal (le Magasin d'origine) — ses infos sont gardées dans les paramètres du compte
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { depotsAPI, parametresAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';

const ModalDepot = ({ depot = null, principal = false, onFermer, onSucces }) => {
  const { setParametres } = useParametres();
  const [form, setForm] = useState({ nom: depot?.nom || '', adresse: depot?.adresse || '', responsable: depot?.responsable || '' });
  const [envoi, setEnvoi] = useState(false);
  const champ = (cle) => (e) => setForm(f => ({ ...f, [cle]: e.target.value }));

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      if (principal) {
        await parametresAPI.update({ depotPrincipal: form });
        setParametres({ depotPrincipal: { nom: form.nom.trim(), adresse: form.adresse.trim(), responsable: form.responsable.trim() } });
      } else if (depot) await depotsAPI.update(depot.id, form);
      else await depotsAPI.create(form);
      toast.success(depot ? 'Dépôt modifié' : 'Dépôt créé');
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’enregistrement');
      setEnvoi(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }} onSubmit={enregistrer}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faWarehouse} className="me-2" style={{ color: '#00d4aa' }} />
              {principal ? 'Modifier le dépôt principal' : depot ? 'Modifier le dépôt' : 'Nouveau dépôt'}
            </h5>
            <button type="button" className="btn btn-light btn-sm rounded-circle ms-auto" aria-label="Fermer" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 d-flex flex-column gap-3">
            {principal && (
              <div className="small text-muted">
                Votre Magasin d'origine. Donnez-lui un nom : il remplace « Dépôt principal » partout dans l'appli.
              </div>
            )}
            <label className="d-flex flex-column gap-1 small fw-semibold text-muted">{principal ? 'Nom' : 'Nom *'}
              <input className="form-control" required={!principal} maxLength={60} autoFocus placeholder={principal ? 'Ex. Magasin Bonabéri (vide = Dépôt principal)' : 'Ex. Dépôt Akwa'}
                value={form.nom} onChange={champ('nom')} />
            </label>
            <label className="d-flex flex-column gap-1 small fw-semibold text-muted">Adresse (optionnel)
              <input className="form-control" maxLength={200} placeholder="Quartier, rue, repère"
                value={form.adresse} onChange={champ('adresse')} />
            </label>
            <label className="d-flex flex-column gap-1 small fw-semibold text-muted">Responsable (optionnel)
              <input className="form-control" maxLength={80} placeholder="Nom de la personne en charge"
                value={form.responsable} onChange={champ('responsable')} />
            </label>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button type="button" className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" className="btn text-white fw-semibold" style={{ background: '#00a881' }} disabled={envoi || (!principal && !form.nom.trim())}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalDepot;
