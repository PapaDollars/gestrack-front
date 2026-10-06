// Modal : remise après coup sur une facture
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPercent, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { facturesAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';

// ── Modal remise (appliquée après coup, sur une facture déjà créée) ───────────
// Ne touche jamais aux lignes/au stock — seulement le total facturé au client, le reste à
// payer/la dette éventuelle, et (côté serveur) le bénéfice global dans Finances.
const ModalRemiseFacture = ({ facture, onFermer, onSucces, formatMontant }) => {
  const sousTotal = (facture.lignes || []).reduce((s, l) => s + (l.sousTotal || 0), 0);
  const [remise, setRemise]       = useState(facture.remise > 0 ? String(facture.remise) : '');
  const [motif, setMotif]         = useState(facture.remiseMotif || '');
  const [envoi, setEnvoi]         = useState(false);

  const remiseNum    = Math.min(sousTotal, Math.max(0, parseFloat(remise) || 0));
  const nouveauTotal = Math.max(0, sousTotal - remiseNum);

  const soumettre = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const payload = {
        clientId: facture.clientId,
        clientNom: facture.clientNom,
        clientPrenom: facture.clientPrenom,
        clientTelephone: facture.clientTelephone,
        lignes: facture.lignes,
        montantTotal: nouveauTotal,
        avance: facture.avance,
        moyenPaiement: facture.moyenPaiement,
        sansDette: !facture.detteId,
        remise: remiseNum,
        remiseMotif: remiseNum > 0 ? motif : '',
      };
      const r = await facturesAPI.update(facture.id, payload);
      if (estMisEnAttente(r)) return; // pas encore enregistré côté serveur
      toast.success(remiseNum > 0 ? 'Remise appliquée' : 'Remise retirée');
      onSucces(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faPercent} className="me-2" style={{ color: '#dc2626' }} />
              Remise — {facture.numero}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <p className="text-muted small mb-3">
              Réduit ce que doit le client sur cette facture, sans changer le prix enregistré des
              produits — le manque à gagner est simplement déduit du bénéfice global.
            </p>
            <form onSubmit={soumettre} id="form-remise">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted small">Sous-total produits</span>
                <span className="fw-semibold">{formatMontant(sousTotal)}</span>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Montant de la remise</label>
                <div className="input-group">
                  <input type="number" min="0" max={sousTotal} className="form-control" placeholder="0"
                    autoFocus value={remise} onChange={e => setRemise(e.target.value)} />
                  <span className="input-group-text">FCFA</span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Motif (optionnel)</label>
                <input type="text" className="form-control" placeholder="Ex: Client fidèle, geste commercial..."
                  value={motif} onChange={e => setMotif(e.target.value)} />
              </div>
              <div className="d-flex justify-content-between align-items-center p-3 rounded-3"
                style={{ background: 'var(--bs-secondary-bg)' }}>
                <span className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>Nouveau total</span>
                <span className="fw-bold fs-5" style={{ color: '#dc2626' }}>{formatMontant(nouveauTotal)}</span>
              </div>
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button type="submit" form="form-remise" className="btn text-white d-flex align-items-center gap-2"
              style={{ background: '#00d4aa', borderRadius: 10 }} disabled={envoi}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faCheck} /> Valider</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRemiseFacture;
