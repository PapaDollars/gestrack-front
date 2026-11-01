// Correction d'une ligne de l'historique d'une dette (paiement ou ajout), protégée par le
// code de l'application :
//   mode 'annuler'  : la ligne reste visible, barrée, et les totaux sont recalculés ;
//   mode 'modifier' : moyen de paiement et description seulement (jamais le montant).
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faRotateLeft, faEdit } from '@fortawesome/free-solid-svg-icons';
import { dettesAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import { MOYENS_PAIEMENT } from '@/pages/dettes/constants';

const ModalCorrigerLigne = ({ dette, ligne, mode, formatMontant, onFermer, onSucces }) => {
  const annulation = mode === 'annuler';
  const paiement = ligne.action === 'REDUCTION';
  const [moyen, setMoyen] = useState(ligne.moyenPaiement || 'especes');
  const [details, setDetails] = useState(ligne.details || '');
  const [code, setCode] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const valider = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!code) return setErreur('Saisissez le code de l\'application');
    setEnvoi(true);
    try {
      const reponse = annulation
        ? await dettesAPI.annulerLigne(dette.id, ligne.id, code)
        : await dettesAPI.modifierLigne(dette.id, ligne.id, {
            codeApp: code, details, ...(paiement && { moyenPaiement: moyen }),
          });
      if (estMisEnAttente(reponse)) return;
      toast.success(annulation ? 'Ligne annulée, totaux recalculés' : 'Ligne modifiée');
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la correction');
    } finally { setEnvoi(false); }
  };

  const couleur = annulation ? '#dc2626' : '#6366f1';
  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
      onClick={(e) => e.target === e.currentTarget && !envoi && onFermer()}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 440 }}>
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={annulation ? faRotateLeft : faEdit} style={{ color: couleur }} />
              {annulation ? 'Annuler' : 'Modifier'} {paiement ? 'ce paiement' : 'cet ajout'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer} disabled={envoi}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <form className="modal-body px-4 pb-4" onSubmit={valider}>
            <div className="p-2 rounded-3 mb-3 fw-semibold" style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)' }}>
              {paiement ? 'Paiement de' : 'Ajout de'} {formatMontant(ligne.montantConcerne)}
            </div>

            {annulation ? (
              <p className="small text-muted mb-3">
                {paiement
                  ? 'Ce montant sera remis sur la dette. '
                  : 'Ce montant sera retiré de la dette. '}
                Le reste à payer, le total du client et les encaissements sont recalculés. La ligne reste
                visible dans l'historique, barrée.
              </p>
            ) : (
              <>
                <p className="small text-muted mb-3">
                  Le montant ne se modifie pas : pour le corriger, annulez cette ligne puis saisissez la bonne.
                </p>
                {paiement && (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted mb-1">Moyen de paiement</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {MOYENS_PAIEMENT.map(m => (
                        <button key={m.value} type="button" className="btn btn-sm flex-grow-1"
                          style={{
                            border: `2px solid ${moyen === m.value ? m.color : 'var(--bs-border-color)'}`,
                            background: moyen === m.value ? `${m.color}15` : 'transparent',
                            color: moyen === m.value ? m.color : 'var(--bs-body-color)', borderRadius: 8,
                          }}
                          onClick={() => setMoyen(m.value)}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted mb-1">Description</label>
                  <input className="form-control" value={details} onChange={(e) => setDetails(e.target.value)} />
                </div>
              </>
            )}

            <label className="form-label small fw-semibold text-muted mb-1">Code de l'application</label>
            <input type="password" className="form-control mb-3" autoComplete="one-time-code" name="code-application"
              autoFocus={annulation} value={code} onChange={(e) => setCode(e.target.value)} />

            {erreur && <div className="alert alert-danger py-2 small">{erreur}</div>}

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-light" onClick={onFermer} disabled={envoi}>Fermer</button>
              <button type="submit" className="btn text-white d-flex align-items-center gap-2" style={{ background: couleur }} disabled={envoi}>
                {envoi && <FontAwesomeIcon icon={faSpinner} spin />}
                {annulation ? 'Annuler la ligne' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalCorrigerLigne;
