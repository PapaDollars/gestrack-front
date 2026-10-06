// Modal : entrée / sortie de stock boutique
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { produitsAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import { decomposerStock, calculerStockEnPieces, psParUnite } from '@/services/unites';
import { sousUnites, afficherStockDetails } from '@/services/unites';

export const ModalStock = ({ produit, type, onFermer, onSucces }) => {
  const unitesDisponibles = sousUnites(produit.unitePrincipale || produit.unite || 'ps');
  // Sortie : par défaut en pièces (vente au détail, le cas le plus fréquent) plutôt que
  // l'unité principale du produit — reste modifiable pour une vente en gros.
  // Entrée/ajustement : l'unité principale du produit reste le défaut le plus naturel.
  const uniteParDefaut = (type !== 'AJOUT' && type !== 'AJUSTEMENT') ? 'ps' : unitesDisponibles[0];
  const uniteAjustement = produit.unitePrincipale || produit.unite || 'ps';
  const isBalloAjust = uniteAjustement === 'ballo';
  const labelN2Ajust = isBalloAjust ? 'dz' : 'ps';
  // Décomposition du stock actuel par niveau (ballo/dz/ps...) — pré-remplit les champs de
  // l'ajustement, pour que le compte physique se saisisse comme au bilan plutôt qu'en
  // devant convertir soi-même en pièces.
  const stockDecompose = decomposerStock(uniteAjustement, produit, produit.stockEnPieces ?? 0);
  const [form, setForm] = useState({
    quantite: '', unite: uniteParDefaut, motif: '', typeVente: 'detail', prixVenteReel: '',
    stockNiveau1: stockDecompose.n1 ?? '',
    stockNiveau2: stockDecompose.n2 ?? '',
    stockNiveau3: stockDecompose.n3 ?? '',
  });
  const [chargement, setChargement] = useState(false);
  const estEntree = type === 'AJOUT';
  const estAjustement = type === 'AJUSTEMENT';
  const stockAjustePs = estAjustement
    ? calculerStockEnPieces(uniteAjustement, produit, form.stockNiveau1, form.stockNiveau2, form.stockNiveau3)
    : 0;

  // prixVente enregistré = prix par pièce → prix minimum par unité vendue
  const ratioUnite = psParUnite(form.unite, produit);
  const prixMinParUnite = (produit.prixVente || 0) * ratioUnite;

  // Estimation affichée pour la vue seulement — même logique de prix par défaut que le serveur
  const quantiteEstimee = parseInt(form.quantite) || 0;
  const prixEstimeParUnite = form.prixVenteReel ? parseFloat(form.prixVenteReel) || 0 : prixMinParUnite;
  const totalEstime = quantiteEstimee * prixEstimeParUnite;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (estAjustement) {
      if (form.stockNiveau1 === '') {
        toast.error('Indiquez la quantité réellement comptée (0 ou plus)');
        return;
      }
    } else if (form.quantite === '' || parseInt(form.quantite) <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }
    // Détail : prix ≥ prix enregistré. Gros : pas de minimum (prix revendeur)
    if (!estEntree && !estAjustement && form.typeVente === 'detail' && form.prixVenteReel) {
      const prix = parseFloat(form.prixVenteReel);
      if (prix < prixMinParUnite) {
        toast.error(`Prix détail trop bas — minimum ${prixMinParUnite.toLocaleString('fr-FR')} FCFA par ${form.unite}`);
        return;
      }
    }
    setChargement(true);
    try {
      const reponse = estAjustement
        ? await produitsAPI.ajusterStock(produit.id, { quantite: stockAjustePs, unite: 'ps', motif: form.motif })
        : estEntree
        ? await produitsAPI.ajouterStock(produit.id, { quantite: form.quantite, unite: form.unite, motif: form.motif })
        : await produitsAPI.reduireStock(produit.id, {
            quantite: form.quantite, unite: form.unite, motif: form.motif,
            typeVente: form.typeVente,
            prixVenteReel: form.prixVenteReel || undefined,
          });
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success(estAjustement ? 'Stock ajusté avec succès' : estEntree ? 'Stock augmenté avec succès' : 'Sortie enregistrée');
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du stock');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>
              {estAjustement ? '🔄 Ajuster le stock (inventaire)' : estEntree ? '📦 Entrée de stock' : '🛒 Sortie de stock'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
          <div className="modal-body px-4">
            <div className="alert py-2 mb-3" style={{ background: 'var(--bs-secondary-bg)', borderRadius: 10, border: 'none' }}>
              <small className="text-muted">
                Produit : <strong>{produit.nom}</strong> — Stock actuel : <strong>{afficherStockDetails(produit)}</strong>
                {produit.prixVente && <> — Prix enregistré : <strong>{produit.prixVente.toLocaleString('fr-FR')} FCFA/ps</strong></>}
              </small>
            </div>
            {estAjustement && (
              <div className="alert py-2 mb-3" style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 10, border: 'none' }}>
                <small style={{ color: '#6366f1' }}>
                  Indiquez la quantité <strong>réellement comptée</strong> (issue de votre bilan) — elle remplacera le stock actuel, ce n'est pas un ajout ni un retrait. Mettez 0 pour réinitialiser.
                </small>
              </div>
            )}
            <form onSubmit={handleSubmit} id="form-stock">
              {estAjustement ? (
                // Saisie multi-niveaux (ballo/dz/ps...) — comme au bilan physique, sans avoir
                // à tout reconvertir soi-même dans une seule unité.
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Quantité réelle comptée *</label>
                  <div className="row g-2">
                    <div className="col">
                      <div className="input-group">
                        <input type="number" min="0" className="form-control" required autoFocus
                          value={form.stockNiveau1}
                          onChange={(e) => setForm({ ...form, stockNiveau1: e.target.value })} />
                        <span className="input-group-text">{uniteAjustement}</span>
                      </div>
                    </div>
                    {unitesDisponibles.length > 1 && (
                      <div className="col">
                        <div className="input-group">
                          <input type="number" min="0" className="form-control" placeholder="0"
                            value={form.stockNiveau2}
                            onChange={(e) => setForm({ ...form, stockNiveau2: e.target.value })} />
                          <span className="input-group-text">{labelN2Ajust}</span>
                        </div>
                      </div>
                    )}
                    {isBalloAjust && (
                      <div className="col">
                        <div className="input-group">
                          <input type="number" min="0" className="form-control" placeholder="0"
                            value={form.stockNiveau3}
                            onChange={(e) => setForm({ ...form, stockNiveau3: e.target.value })} />
                          <span className="input-group-text">ps</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <small className="text-muted d-block mt-1">= {stockAjustePs.toLocaleString('fr-FR')} ps au total</small>
                </div>
              ) : (
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Quantité *</label>
                  <div className="input-group">
                    <input type="number" min="0" className="form-control" required autoFocus
                      value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
                    {unitesDisponibles.length > 1 ? (
                      <select className="input-group-text form-select" style={{ maxWidth: 90 }}
                        value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value, prixVenteReel: '' })}>
                        {unitesDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    ) : (
                      <span className="input-group-text">{unitesDisponibles[0]}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Champs spécifiques aux sorties */}
              {!estEntree && !estAjustement && (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Type de vente</label>
                    <div className="d-flex gap-2">
                      {['detail', 'gros'].map(t => (
                        <button key={t} type="button"
                          className="btn btn-sm flex-grow-1"
                          style={{
                            background: form.typeVente === t ? '#0f2027' : '#f0f4f8',
                            color: form.typeVente === t ? '#fff' : '#203a43',
                            borderRadius: 8,
                          }}
                          onClick={() => setForm({ ...form, typeVente: t })}>
                          {t === 'detail' ? 'Détail' : 'Gros'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">
                      Prix de vente réel par <strong>{form.unite}</strong>
                      {form.typeVente === 'detail'
                        ? <span className="fw-normal text-muted ms-1">(optionnel — min. {prixMinParUnite.toLocaleString('fr-FR')} FCFA)</span>
                        : <span className="fw-normal ms-1" style={{ color: '#7c3aed' }}>(optionnel — prix revendeur, sans minimum)</span>
                      }
                    </label>
                    <div className="input-group">
                      <input type="number" min={form.typeVente === 'detail' ? prixMinParUnite : 1} step="1" className="form-control"
                        placeholder={`${prixMinParUnite.toLocaleString('fr-FR')} FCFA (par défaut)`}
                        value={form.prixVenteReel}
                        onChange={(e) => setForm({ ...form, prixVenteReel: e.target.value })} />
                      <span className="input-group-text">FCFA</span>
                    </div>
                  </div>
                  {quantiteEstimee > 0 && (
                    <div className="alert py-2 mb-3 d-flex justify-content-between align-items-center"
                      style={{ background: 'rgba(22,163,74,0.1)', borderRadius: 10, border: 'none' }}>
                      <small className="text-muted">Estimation du total (indicatif)</small>
                      <strong style={{ color: '#16a34a' }}>{totalEstime.toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                  )}
                </>
              )}

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Motif (optionnel)</label>
                <input className="form-control" value={form.motif}
                  onChange={(e) => setForm({ ...form, motif: e.target.value })}
                  placeholder={estAjustement ? 'Ex: Inventaire du 26/07' : estEntree ? 'Ex: Réapprovisionnement fournisseur' : 'Ex: Vente client'} />
              </div>
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-stock" className="btn text-white"
              style={{ background: estAjustement ? '#6366f1' : estEntree ? '#16a34a' : '#ea580c' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (estAjustement ? 'Ajuster le stock' : estEntree ? 'Ajouter au stock' : 'Retirer du stock')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalStock;
