// Transférer un produit vers un autre dépôt (plusieurs dépôts : plan A.3). Le produit est
// créé dans le dépôt de destination s'il n'y est pas encore (même nom, prix et photo).
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faSpinner, faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { magasinAPI } from '@/services/api';
import { afficherStockDetails, sousUnites, psParUnite } from '@/services/unites';

// destinations : [{ cle: 'principal' | id, nom }] — dépôts autres que celui du produit
const ModalTransfertDepot = ({ produit, depotSourceNom, destinations, onFermer, onSucces }) => {
  const unites = sousUnites(produit.unitePrincipale || produit.unite);
  const [destination, setDestination] = useState(destinations[0]?.cle || '');
  const [unite, setUnite] = useState(unites[0]);
  const [quantite, setQuantite] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const stockPs = produit.stockEnPieces ?? 0;
  const max = Math.floor(stockPs / psParUnite(unite, produit));
  const q = parseInt(quantite, 10) || 0;
  const nomDest = destinations.find(d => d.cle === destination)?.nom || '';

  const transferer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const { data } = await magasinAPI.transfertDepot({
        depotId: destination === 'principal' ? null : destination,
        transferts: [{ produitId: produit.id, quantite: q, unite }],
      });
      const r = data.resultats?.[0];
      if (r?.success) {
        toast.success(`${q} ${unite} transféré(s) vers ${nomDest}`);
        onSucces();
      } else {
        toast.error(r?.message || 'Transfert impossible');
        setEnvoi(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du transfert');
      setEnvoi(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }} onSubmit={transferer}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <div className="min-w-0">
              <h5 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faWarehouse} className="me-2" style={{ color: '#00d4aa' }} />
                Vers un autre dépôt
              </h5>
              <div className="small text-muted text-truncate">{produit.nom} · {depotSourceNom} : {afficherStockDetails(produit)}</div>
            </div>
            <button type="button" className="btn btn-light btn-sm rounded-circle ms-auto align-self-start" aria-label="Fermer" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 d-flex flex-column gap-3">
            <label className="d-flex flex-column gap-1 small fw-semibold text-muted">Dépôt de destination
              <select className="form-select" value={destination} onChange={(e) => setDestination(e.target.value)} required>
                {destinations.map(d => <option key={d.cle} value={d.cle}>{d.nom}</option>)}
              </select>
            </label>
            <div className="d-flex gap-2 align-items-end">
              <label className="d-flex flex-column gap-1 small fw-semibold text-muted flex-grow-1">Quantité
                <input type="number" min="1" max={max} className="form-control" required placeholder="0"
                  value={quantite} onChange={(e) => setQuantite(e.target.value)} />
              </label>
              <label className="d-flex flex-column gap-1 small fw-semibold text-muted" style={{ width: 110 }}>Unité
                <select className="form-select" value={unite} onChange={(e) => setUnite(e.target.value)}>
                  {unites.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>
            <div className="small text-muted">Disponible : {max} {unite}</div>
            {q > max && <div className="small" style={{ color: '#dc2626' }}>Quantité supérieure au stock disponible</div>}
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button type="button" className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" className="btn text-white fw-semibold d-flex align-items-center gap-2" style={{ background: '#00a881' }}
              disabled={envoi || q <= 0 || q > max || !destination}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : <>Transférer <FontAwesomeIcon icon={faArrowRight} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalTransfertDepot;
