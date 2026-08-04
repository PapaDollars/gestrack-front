// Modal détail commande fournisseur — enregistrement et validation des livraisons
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faTimes, faSpinner, faLink, faCheck } from '@fortawesome/free-solid-svg-icons';
import { fournisseursAPI, invalidateCache, estMisEnAttente } from '@/services/api';
import { psParUnite } from '@/services/unites';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';

export const STATUTS = {
  EN_ATTENTE: { label: 'En attente',   bg: '#fff3cd', color: '#856404' },
  EN_COURS:   { label: 'En cours',     bg: '#e0f2fe', color: '#0369a1' },
  LIVREE:     { label: 'Tout livré ✓', bg: '#d1e7dd', color: '#0f5132' },
};

const ModalDetailCommande = ({ commande, produit = null, onFermer, onActualiser, onModifier, onSupprimer }) => {
  const { formatMontant } = useParametres();
  const [quantite, setQuantite] = useState('');
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [envoi, setEnvoi]       = useState(false);
  const [validation, setValidation]             = useState(null);
  const [sourceNouveauProduit, setSourceNouveauProduit] = useState('magasin');

  const estNouveauProduit = !commande.produitId;
  // prixUnitaire est toujours un prix par pièce — un ballo/carton/sac contient plusieurs
  // pièces, donc le total ne se calcule pas en multipliant directement par la quantité
  // commandée (en ballo) mais par le nombre réel de pièces que ça représente. Le ratio
  // (dz/ballo...) appartient au produit lié — c'est lui qui fait foi, pas la commande.
  const ratioCommande = psParUnite(commande.unite || 'ps', produit || commande);
  const restant = commande.quantiteCommandee - (commande.quantiteLivree || 0);
  const pct     = Math.min(100, Math.round(((commande.quantiteLivree || 0) / commande.quantiteCommandee) * 100));
  const cfg     = STATUTS[commande.statut] || STATUTS.EN_ATTENTE;

  const enregistrerLivraison = async () => {
    if (!quantite || parseFloat(quantite) <= 0) { toast.error('Quantité invalide'); return; }
    setEnvoi(true);
    try {
      const reponse = await fournisseursAPI.ajouterLivraison(commande.id, { quantite: parseFloat(quantite), date });
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Livraison enregistrée');
      setQuantite('');
      invalidateCache('produits', 'magasin');
      window.dispatchEvent(new CustomEvent('gestrack:stock-updated'));
      onActualiser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setEnvoi(false); }
  };

  const validerLivraison = async (livraisonId) => {
    setValidation(livraisonId);
    try {
      const data = estNouveauProduit ? { produitSource: sourceNouveauProduit } : {};
      const reponse = await fournisseursAPI.validerLivraison(commande.id, livraisonId, data);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Stock mis à jour avec succès');
      invalidateCache('produits', 'magasin');
      window.dispatchEvent(new CustomEvent('gestrack:stock-updated'));
      onActualiser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation');
    } finally { setValidation(null); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <div className="flex-grow-1 min-w-0">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{commande.produitNom}</h5>
              {commande.nomFournisseur && <div className="text-muted small">{commande.nomFournisseur}</div>}
            </div>
            <div className="d-flex align-items-center gap-2 ms-3">
              <button className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 8 }}
                onClick={onModifier}>
                <FontAwesomeIcon icon={faEdit} /> Modifier
              </button>
              <button className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 8 }}
                onClick={onSupprimer}>
                <FontAwesomeIcon icon={faTrash} /> Supprimer
              </button>
              <button className="btn btn-light btn-sm rounded-circle ms-4" onClick={onFermer}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          <div className="modal-body px-4 pb-4">

            {/* Enregistrer une livraison */}
            {commande.statut !== 'LIVREE' && (
              <div className="mb-4">
                <div className="row g-2">
                  <div className="col">
                    <label className="form-label small fw-bold text-muted mb-1">Quantité reçue ({commande.unite})</label>
                    <input type="number" min="0.1" step="any" className="form-control"
                      placeholder={`0 ${commande.unite}`}
                      value={quantite} onChange={e => setQuantite(e.target.value)} />
                  </div>
                  <div className="col">
                    <label className="form-label small fw-bold text-muted mb-1">Date de réception</label>
                    <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Stocker dans — uniquement pour nouveaux produits non encore liés */}
            {estNouveauProduit && commande.statut !== 'LIVREE' && (
              <div className="mb-4 p-3 rounded-2"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="fw-semibold small mb-2" style={{ color: '#3b82f6' }}>
                  Où stocker ce produit à la livraison ?
                </div>
                <div className="d-flex gap-2">
                  {[{ val: 'boutique', label: 'Boutique' }, { val: 'magasin', label: 'Magasin' }].map(s => (
                    <button key={s.val} type="button" className="btn btn-sm flex-grow-1"
                      style={{
                        background: sourceNouveauProduit === s.val ? '#16a34a' : 'var(--bs-secondary-bg)',
                        color:      sourceNouveauProduit === s.val ? '#fff'    : 'var(--bs-secondary-color)',
                        borderRadius: 8,
                      }}
                      onClick={() => setSourceNouveauProduit(s.val)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Résumé */}
            <div className="p-3 rounded-3 mb-4" style={{ background: 'var(--bs-secondary-bg)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small">Progression</span>
                <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              </div>
              <div className="progress mb-2" style={{ height: 8 }}>
                <div className="progress-bar"
                  style={{ width: `${pct}%`, background: commande.statut === 'LIVREE' ? '#16a34a' : '#00d4aa' }} />
              </div>
              <div className="d-flex justify-content-between" style={{ fontSize: 'var(--txt-md)' }}>
                <span className="text-muted">Commandé : <strong>{commande.quantiteCommandee} {commande.unite}</strong></span>
                <span className="text-muted">Livré : <strong>{commande.quantiteLivree || 0} {commande.unite}</strong></span>
                <span style={{ color: restant > 0 ? '#dc2626' : '#16a34a' }}>Restant : <strong>{restant} {commande.unite}</strong></span>
              </div>
              {commande.prixUnitaire > 0 && (
                <div className="mt-2 small text-muted">
                  <div>Prix par pièce : {formatMontant(commande.prixUnitaire)} — Total estimé : {formatMontant(commande.quantiteCommandee * ratioCommande * commande.prixUnitaire)}</div>
                  {(commande.prixAchatBrut > 0 || commande.prixTransport > 0) && (
                    <div>Brut : {formatMontant(commande.prixAchatBrut || 0)} + transport : {formatMontant(commande.prixTransport || 0)}</div>
                  )}
                </div>
              )}
              {commande.produitId && (
                <div className="mt-2 small d-flex align-items-center gap-1" style={{ color: '#00a881' }}>
                  <FontAwesomeIcon icon={faLink} style={{ fontSize: 'var(--txt-xs)' }} />
                  Lié au produit dans {commande.produitSource === 'magasin' ? 'le Magasin' : 'la Boutique'}
                </div>
              )}
            </div>

            {/* Liste des livraisons — scroll après 3 */}
            <div>
              <div className="fw-semibold small text-muted text-uppercase mb-2" style={{ letterSpacing: 1 }}>
                Livraisons ({(commande.livraisons || []).length})
              </div>
              {(commande.livraisons || []).length === 0 ? (
                <p className="text-muted small text-center py-3">Aucune livraison enregistrée</p>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
                  {[...(commande.livraisons || [])].reverse().map(l => (
                    <div key={l.id} className="d-flex align-items-center gap-3 p-3 rounded-2"
                      style={{ background: l.valide ? 'rgba(22,163,74,0.06)' : 'var(--bs-secondary-bg)', border: `1px solid ${l.valide ? '#bbf7d0' : 'var(--bs-border-color)'}` }}>
                      <div className="flex-grow-1">
                        <div className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                          {l.quantite} {commande.unite}
                        </div>
                        <div className="text-muted small">{new Date(l.date).toLocaleDateString('fr-FR')}</div>
                        {l.valide && l.valideLe && (
                          <div className="small" style={{ color: '#16a34a' }}>
                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                            Ajouté au stock le {new Date(l.valideLe).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      {l.valide ? (
                        <span className="badge" style={{ background: '#d1e7dd', color: '#0f5132' }}>
                          <FontAwesomeIcon icon={faCheck} className="me-1" />Stock ajouté
                        </span>
                      ) : (
                        <button className="btn btn-sm text-white"
                          style={{ background: '#00d4aa', borderRadius: 8, fontSize: 'var(--txt-base)' }}
                          disabled={validation === l.id}
                          onClick={() => validerLivraison(l.id)}>
                          {validation === l.id
                            ? <FontAwesomeIcon icon={faSpinner} spin />
                            : <><FontAwesomeIcon icon={faCheck} className="me-1" />Cliquer ici pour valider → Stock</>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {commande.notes && (
              <div className="mt-3 p-2 rounded-2 small text-muted" style={{ background: 'var(--bs-secondary-bg)' }}>
                {commande.notes}
              </div>
            )}
          </div>
          {commande.statut !== 'LIVREE' && (
            <div className="modal-footer border-0 px-4 pb-4">
              <button className="btn text-white d-flex align-items-center gap-2"
                style={{ background: '#00d4aa', borderRadius: 10, minWidth: 160 }}
                disabled={envoi} onClick={enregistrerLivraison}>
                {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : <>+ Enregistrer la livraison</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDetailCommande;
