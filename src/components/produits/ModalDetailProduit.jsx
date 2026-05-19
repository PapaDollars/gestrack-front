// Modal de détail d'un produit avec historique de stock
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faBox, faEye, faEyeSlash, faSpinner,
  faArrowUp, faArrowDown, faPlusCircle, faMinusCircle, faRotateLeft,
  faEdit, faTrash, faHistory, faChevronDown, faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { produitsAPI } from '@/services/api';
import { fmtDH } from '@/utils/pdf';
import { afficherStockDetails } from '@/services/unites';
import { toast } from 'react-toastify';
import defaultProduit from '@/assets/img/defaultProduit.png';
import ModalConfirmation from '@/components/shared/ModalConfirmation';

const ModalDetailProduit = ({ produit, api = produitsAPI, onFermer, onActualiser, onModifier, onSupprimer }) => {
  const [historique, setHistorique]       = useState([]);
  const [chargHisto, setChargHisto]       = useState(true);
  const [histoVisible, setHistoVisible]   = useState(false);
  const [prixVisible, setPrixVisible]     = useState(false);
  const [prixAchat, setPrixAchat]         = useState(null);
  const [motDePasse, setMotDePasse]       = useState('');
  const [showMdpInput, setShowMdpInput]   = useState(false);
  const [erreurMdp, setErreurMdp]         = useState('');
  const [chargMdp, setChargMdp]           = useState(false);
  const [confirmAnnul, setConfirmAnnul]   = useState(null); // historique entry à annuler
  const [annulCharg, setAnnulCharg]       = useState(false);

  const formatMontant = (m) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  const chargerHistorique = async () => {
    try {
      const { data } = await api.getHistorique(produit.id);
      setHistorique(data);
    } catch {
      toast.error('Impossible de charger l\'historique');
    } finally {
      setChargHisto(false);
    }
  };

  useEffect(() => { chargerHistorique(); }, [produit.id]); // eslint-disable-line

  // Annuler un mouvement de stock
  const annuler = async () => {
    if (!confirmAnnul) return;
    setAnnulCharg(true);
    try {
      await api.annulerMouvement(produit.id, confirmAnnul.id);
      toast.success('Mouvement annulé');
      setConfirmAnnul(null);
      setChargHisto(true);
      await chargerHistorique();
      onActualiser?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setAnnulCharg(false);
    }
  };

  // Vérifier le mot de passe pour afficher le prix d'achat
  const validerMotDePasse = async (e) => {
    e.preventDefault();
    setErreurMdp('');
    setChargMdp(true);
    try {
      await api.verifierMdp(motDePasse);
      const { data } = await api.getPrixAchat(produit.id);
      setPrixAchat(data.prixAchat);
      setPrixVisible(true);
      setShowMdpInput(false);
      setMotDePasse('');
    } catch {
      setErreurMdp('Mot de passe incorrect');
    } finally {
      setChargMdp(false);
    }
  };

  const stockEnPs = produit.stockEnPieces ?? produit.quantiteStock ?? 0;
  const stockFaible = stockEnPs <= 5;

  const labelAction = (action) => {
    const cfg = {
      AJOUT:           { icon: faArrowUp,     color: '#16a34a', label: 'Entrée' },
      REDUCTION:       { icon: faArrowDown,   color: '#ea580c', label: 'Sortie' },
      REDUCTION_STOCK: { icon: faArrowDown,   color: '#ea580c', label: 'Sortie' },
      CREATION:        { icon: faPlusCircle,  color: '#6366f1', label: 'Création' },
      SUPPRESSION:     { icon: faMinusCircle, color: '#ef4444', label: 'Suppression' },
      ANNULATION:      { icon: faRotateLeft,  color: '#9ca3af', label: 'Annulé' },
    };
    return cfg[action] || { icon: faBox, color: '#6b7280', label: action };
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>

          {/* En-tête */}
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>Détails du produit</h5>
            <div className="d-flex align-items-center gap-2 ms-auto">
              {onModifier && (
                <button className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', borderRadius: 8 }}
                  onClick={() => { onFermer(); onModifier(produit); }}>
                  <FontAwesomeIcon icon={faEdit} style={{ fontSize: 12 }} /> Modifier
                </button>
              )}
              {onSupprimer && (
                <button className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 8 }}
                  onClick={() => { onFermer(); onSupprimer(produit); }}>
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: 12 }} /> Supprimer
                </button>
              )}
              <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="modal-body px-4 pb-4">
            {/* Photo + infos principales */}
            <div className="d-flex gap-4 mb-4 flex-wrap flex-sm-nowrap">
              {produit.image ? (
                <img src={produit.image} alt={produit.nom} className="rounded object-fit-cover flex-shrink-0"
                  style={{ width: 120, height: 120 }} />
              ) : (
                <img src={defaultProduit} alt="produit" className="rounded object-fit-cover flex-shrink-0"
                  style={{ width: 120, height: 120 }} />
              )}
              <div className="flex-grow-1">
                <h5 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</h5>
                <span className="badge mb-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 12 }}>
                  {produit.categorie}
                </span>
                {produit.description && (
                  <p className="text-muted small mb-0">{produit.description}</p>
                )}
              </div>
            </div>

            {/* Cartes infos */}
            <div className="row g-3 mb-4">
              {/* Stock */}
              <div className="col-6 col-md-3">
                <div className="card border-0 h-100" style={{ background: stockFaible ? '#fef2f2' : '#f0fdf4', borderRadius: 10 }}>
                  <div className="card-body p-3 text-center">
                    <div className="small mb-1" style={{ color: stockFaible ? '#991b1b' : '#166534' }}>Stock</div>
                    <div className="fw-bold fs-5" style={{ color: stockFaible ? '#dc2626' : '#16a34a' }}>
                      {afficherStockDetails(produit)}
                    </div>
                    {stockFaible && <div className="small mt-1" style={{ color: '#dc2626' }}>⚠ Faible</div>}
                  </div>
                </div>
              </div>

              {/* Prix de vente */}
              <div className="col-6 col-md-3">
                <div className="card border-0 h-100" style={{ background: 'rgba(22,163,74,0.15)', borderRadius: 10 }}>
                  <div className="card-body p-3 text-center">
                    <div className="small mb-1" style={{ color: '#166534' }}>Prix vente</div>
                    <div className="fw-bold" style={{ color: '#00a881', fontSize: 14 }}>{formatMontant(produit.prixVente)}</div>
                  </div>
                </div>
              </div>

              {/* Prix d'achat */}
              <div className="col-12 col-md-6">
                <div className="card border-0 h-100" style={{ background: '#f5f3ff', borderRadius: 10 }}>
                  <div className="card-body p-3">
                    <div className="small mb-2" style={{ color: '#4338ca' }}>Prix d'achat</div>
                    {prixVisible ? (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fw-bold" style={{ color: '#6366f1', fontSize: 16 }}>
                          {formatMontant(prixAchat)}
                        </span>
                        <button className="btn btn-sm btn-link p-0" onClick={() => { setPrixVisible(false); setPrixAchat(null); }}>
                          <FontAwesomeIcon icon={faEyeSlash} className="text-muted" />
                        </button>
                      </div>
                    ) : showMdpInput ? (
                      <form onSubmit={validerMotDePasse} className="d-flex gap-2 align-items-start flex-wrap">
                        <div className="flex-grow-1">
                          <input type="password" className={`form-control form-control-sm ${erreurMdp ? 'is-invalid' : ''}`}
                            placeholder="Mot de passe..."
                            value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoFocus />
                          {erreurMdp && <div className="invalid-feedback d-block" style={{ fontSize: 11 }}>{erreurMdp}</div>}
                        </div>
                        <button type="submit" className="btn btn-sm text-white" style={{ background: '#6366f1' }} disabled={chargMdp}>
                          {chargMdp ? <FontAwesomeIcon icon={faSpinner} spin /> : 'OK'}
                        </button>
                        <button type="button" className="btn btn-sm btn-light" onClick={() => { setShowMdpInput(false); setErreurMdp(''); }}>
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </form>
                    ) : (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-muted" style={{ letterSpacing: 3 }}>••••••</span>
                        <button className="btn btn-sm text-white" style={{ background: '#6366f1', fontSize: 11 }}
                          onClick={() => setShowMdpInput(true)}>
                          <FontAwesomeIcon icon={faEye} className="me-1" />Voir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Historique des mouvements de stock */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="fw-semibold small" style={{ color: 'var(--bs-body-color)' }}>Historique des mouvements de stock</div>
                <button className="btn btn-sm btn-light d-flex align-items-center gap-1"
                  onClick={() => setHistoVisible(v => !v)}>
                  <FontAwesomeIcon icon={faHistory} style={{ fontSize: 11 }} />
                  {histoVisible ? 'Masquer' : 'Voir'}
                  <FontAwesomeIcon icon={histoVisible ? faChevronUp : faChevronDown} style={{ fontSize: 10 }} />
                </button>
              </div>
              {histoVisible && chargHisto ? (
                <div className="text-center py-3">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-muted" />
                </div>
              ) : histoVisible && historique.length === 0 ? (
                <div className="text-muted small text-center py-3">Aucun mouvement enregistré</div>
              ) : histoVisible ? (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {historique.map((h) => {
                    const { icon, color, label } = labelAction(h.action);
                    return (
                      <div key={h.id} className="d-flex align-items-center justify-content-between p-2 rounded"
                        style={{ background: h.annule ? 'rgba(156,163,175,0.08)' : 'var(--bs-secondary-bg)', fontSize: 12, opacity: h.annule ? 0.6 : 1 }}>
                        <div className="d-flex align-items-center gap-2 flex-wrap min-w-0">
                          <FontAwesomeIcon icon={icon} style={{ color, width: 14, flexShrink: 0 }} />
                          <span className="fw-semibold" style={{ color }}>{label}</span>
                          {h.annule && <span className="badge" style={{ background: '#f3f4f6', color: '#9ca3af', fontSize: 10 }}>annulé</span>}
                          {h.quantite && (
                            <span className="text-muted">· {h.quantite > 0 ? '+' : ''}{h.quantite} {produit.unite}</span>
                          )}
                          {h.details && <span className="text-muted text-truncate" style={{ maxWidth: 160 }}>· {h.details}</span>}
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                          <div className="d-flex flex-column align-items-end gap-1">
                            {h.stockApres !== undefined && (
                              <span className="text-muted">Stock : {h.stockApres} {produit.unite}</span>
                            )}
                            <span className="text-muted">{fmtDH(h.timestamp)}</span>
                          </div>
                          {['AJOUT', 'REDUCTION', 'REDUCTION_STOCK'].includes(h.action) && !h.annule && (
                            <button className="btn btn-sm flex-shrink-0"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 6, padding: '2px 8px' }}
                              title="Annuler ce mouvement"
                              onClick={() => setConfirmAnnul(h)}>
                              <FontAwesomeIcon icon={faRotateLeft} style={{ fontSize: 11 }} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {confirmAnnul && (
        <ModalConfirmation
          message={`Annuler cette ${confirmAnnul.action === 'AJOUT' ? 'entrée' : 'sortie'} de stock ? Le stock sera recalculé en conséquence.`}
          onConfirmer={annuler}
          chargement={annulCharg}
          onAnnuler={() => setConfirmAnnul(null)}
        />
      )}
    </div>
  );
};

export default ModalDetailProduit;
