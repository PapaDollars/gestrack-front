// Modal formulaire produit
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faLock } from '@fortawesome/free-solid-svg-icons';
import { produitsAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import FormNouveauProduit from '@/components/produits/FormNouveauProduit';
import { decomposerStock, calculerStockEnPieces, psParUnite } from '@/services/unites';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

// ============================
// Modal création/modification produit
// ============================
export const ModalProduit = ({ produit, api = null, onFermer, onSucces }) => {
  const [form, setForm] = useState({
    nom: '', description: '', prixVente: '', prixAchat: '', prixUnite: 'dz',
    categorie: '',
    unitePrincipale: 'dz', uniteCustom: '',
    dzParBallo: '', psParCrt: '', psParSac: '',
    stockNiveau1: '', stockNiveau2: '', stockNiveau3: '',
  });
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);

  const unite   = form.uniteCustom || form.unitePrincipale;
  const isBallo = unite === 'ballo';

  useEffect(() => {
    if (produit) {
      const uniteP = produit.unitePrincipale || produit.unite || 'dz';
      const stockActuel = produit.stockEnPieces ?? 0;
      const { n1, n2, n3 } = decomposerStock(uniteP, produit, stockActuel);
      // Le prix est enregistré par pièce en base — affiché ici converti dans l'unité
      // principale du produit, pour correspondre à ce que le vendeur a en tête.
      const ratioP = psParUnite(uniteP, produit);
      setForm(prev => ({
        ...prev,
        nom: produit.nom || '',
        description: produit.description || '',
        prixVente: produit.prixVente ? produit.prixVente * ratioP : '',
        prixAchat: '',
        prixUnite: uniteP,
        categorie: produit.categorie || '',
        unitePrincipale: UNITES_STD.includes(uniteP) ? uniteP : '__custom__',
        uniteCustom: UNITES_STD.includes(uniteP) ? '' : uniteP,
        dzParBallo: produit.dzParBallo || '',
        psParCrt: produit.psParCrt || '',
        psParSac: produit.psParSac || '',
        // Pré-rempli avec le stock actuel décomposé, pour pouvoir le corriger si besoin
        stockNiveau1: n1, stockNiveau2: n2, stockNiveau3: n3,
      }));
      if (produit.image) setApercu(produit.image);
    }
  }, [produit]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!produit && !form.prixAchat) { toast.error('Le prix d\'achat est requis'); return; }
    if (!produit && !form.stockNiveau1) { toast.error('Le stock initial (niveau 1) est requis'); return; }
    if (isBallo && !form.dzParBallo) { toast.error('Indiquez le nombre de dz par ballo'); return; }

    const uniteFinale     = form.unitePrincipale === '__custom__' ? form.uniteCustom : form.unitePrincipale;
    // L'utilisateur saisit le prix dans l'unité de son choix (ps, dz, ballo...), pas
    // forcément l'unité principale — converti ici en prix par pièce, seule unité que le
    // reste du système (finances, etc.) comprend.
    const ratioFinal = psParUnite(form.prixUnite || uniteFinale, form);
    const prixVenteParPs = (parseFloat(form.prixVente) || 0) / ratioFinal;
    const prixAchatParPs = form.prixAchat ? parseFloat(form.prixAchat) / ratioFinal : '';

    setChargement(true);
    try {
      const formData = new FormData();
      formData.append('nom', form.nom);
      formData.append('description', form.description);
      formData.append('prixVente', prixVenteParPs);
      if (prixAchatParPs) formData.append('prixAchat', prixAchatParPs);
      formData.append('categorie', form.categorie || '');
      formData.append('unitePrincipale', uniteFinale);
      if (form.dzParBallo) formData.append('dzParBallo', form.dzParBallo);
      if (form.psParCrt)   formData.append('psParCrt',   form.psParCrt);
      if (form.psParSac)   formData.append('psParSac',   form.psParSac);
      if (!produit) {
        formData.append('stockNiveau1', form.stockNiveau1 || 0);
        formData.append('stockNiveau2', form.stockNiveau2 || 0);
        formData.append('stockNiveau3', form.stockNiveau3 || 0);
      }
      if (image) formData.append('image', image);

      const apiToUse = api || produitsAPI;
      if (produit) {
        await apiToUse.update(produit.id, formData);

        // Le stock a pu être corrigé depuis ce formulaire (niveaux pré-remplis puis modifiés) —
        // on l'applique via l'ajustement d'inventaire, journalisé, plutôt qu'en silence.
        const nouveauStockEnPieces = calculerStockEnPieces(uniteFinale, form, form.stockNiveau1, form.stockNiveau2, form.stockNiveau3);
        if (nouveauStockEnPieces !== (produit.stockEnPieces ?? 0)) {
          const reponseAjust = await apiToUse.ajusterStock(produit.id, {
            quantite: nouveauStockEnPieces, unite: 'ps', motif: 'Ajustement via modification du produit',
          });
          if (estMisEnAttente(reponseAjust)) { onSucces(); return; }
        }
        toast.success('Produit mis à jour');
      } else {
        await apiToUse.create(formData);
        toast.success('Produit créé');
      }
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{produit ? 'Modifier le produit' : 'Nouveau produit'}</h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={handleSubmit} id="form-produit">
              <FormNouveauProduit
                form={form} setForm={setForm}
                image={image} setImage={setImage}
                apercu={apercu} setApercu={setApercu}
                avecPrixAchat={true}
                avecStockInitial={true}
                estModification={!!produit}
              />
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-produit" className="btn text-white" style={{ background: '#00d4aa' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (produit ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================
// Modal gestion du stock (entrée/sortie) avec sélecteur d'unité
// ============================
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
                        <input type="number" min="0" className="form-control" required
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
                    <input type="number" min="0" className="form-control" required
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

// ============================
// Modal mot de passe pour voir le prix d'achat
// ============================
export const ModalMotDePasse = ({ produit, onValide, onFermer }) => {
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    try {
      const { data } = await produitsAPI.verifierMdp(motDePasse);
      if (data.autorise) {
        onValide();
      }
    } catch {
      setErreur('Mot de passe incorrect');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faLock} style={{ color: '#6366f1' }} />
              Prix d'achat — {produit?.nom}
            </h6>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
          <div className="modal-body px-4">
            <p className="text-muted small mb-3">Entrez votre mot de passe de connexion pour voir le prix d'achat.</p>
            {erreur && <div className="alert alert-danger py-1 small">{erreur}</div>}
            <form onSubmit={handleSubmit} id="form-mdp">
              <input
                type="password" className="form-control" required
                placeholder="Mot de passe"
                value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
              />
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light btn-sm" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-mdp" className="btn btn-sm text-white"
              style={{ background: '#6366f1' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================
// Modal stock magasin — avec option de transfert vers la boutique
// ============================
import { magasinAPI, estMisEnAttente as estMisEnAttenteMagasin } from '@/services/api';

export const ModalStockMagasin = ({ produit, type, produitsBoutique = [], onFermer, onSucces }) => {
  const unitesDisponibles = sousUnites(produit.unitePrincipale || produit.unite || 'ps');
  // Priorité au lien persistant (produitLieId) — il reste valable même si le produit a été
  // renommé depuis ; à défaut (produit pas encore lié), on retombe sur la correspondance par nom.
  const matchBoutique = (produit.produitLieId && produitsBoutique.find(p => p.id === produit.produitLieId))
    || produitsBoutique.find(p => p.nom?.toLowerCase().trim() === produit.nom?.toLowerCase().trim());
  // Sortie : par défaut en pièces (vente au détail, le cas le plus fréquent) plutôt que
  // l'unité principale du produit — reste modifiable pour une vente en gros ou un transfert.
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
  const [verseBoutique, setVerseBoutique] = useState(!!matchBoutique);
  const [creerBoutique, setCreerBoutique] = useState(false);
  const produitBoutiqueId = matchBoutique?.id || '';
  const [chargement, setChargement] = useState(false);
  const estEntree = type === 'AJOUT';
  const estAjustement = type === 'AJUSTEMENT';
  const estTransfert = verseBoutique || creerBoutique;
  const stockAjustePs = estAjustement
    ? calculerStockEnPieces(uniteAjustement, produit, form.stockNiveau1, form.stockNiveau2, form.stockNiveau3)
    : 0;

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
    // Détail : prix ≥ prix enregistré. Gros : pas de minimum.
    if (!estEntree && !estAjustement && !estTransfert && form.typeVente === 'detail' && form.prixVenteReel) {
      const prix = parseFloat(form.prixVenteReel);
      if (prix < prixMinParUnite) {
        toast.error(`Prix détail trop bas — minimum ${prixMinParUnite.toLocaleString('fr-FR')} FCFA par ${form.unite}`);
        return;
      }
    }
    setChargement(true);
    try {
      const reponse = estAjustement
        ? await magasinAPI.ajusterStock(produit.id, { quantite: stockAjustePs, unite: 'ps', motif: form.motif })
        : estEntree
        ? await magasinAPI.ajouterStock(produit.id, { quantite: form.quantite, unite: form.unite, motif: form.motif })
        : await magasinAPI.reduireStock(produit.id, {
            quantite: form.quantite, unite: form.unite, motif: form.motif,
            verseBoutique: estTransfert,
            produitBoutiqueId: verseBoutique ? produitBoutiqueId : undefined,
            creerBoutique: creerBoutique || undefined,
            // Prix de vente uniquement pour les sorties directes (pas les transferts)
            ...(!estTransfert && {
              typeVente: form.typeVente,
              prixVenteReel: form.prixVenteReel || undefined,
            }),
          });
      if (estMisEnAttenteMagasin(reponse)) return; // pas encore enregistré côté serveur
      toast.success(estAjustement ? 'Stock magasin ajusté' : estEntree ? 'Stock magasin augmenté' : (creerBoutique ? 'Produit créé et transféré vers la boutique' : verseBoutique ? 'Transféré vers la boutique' : 'Sortie enregistrée'));
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
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
              {estAjustement ? '🔄 Ajuster le stock magasin (inventaire)' : estEntree ? '📦 Entrée magasin' : '🚚 Sortie magasin'}
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
            <form onSubmit={handleSubmit} id="form-stock-magasin">
              {estAjustement ? (
                // Saisie multi-niveaux (ballo/dz/ps...) — comme au bilan physique, sans avoir
                // à tout reconvertir soi-même dans une seule unité.
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Quantité réelle comptée *</label>
                  <div className="row g-2">
                    <div className="col">
                      <div className="input-group">
                        <input type="number" min="0" className="form-control" required
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
                    <input type="number" min="0" className="form-control" required
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

              {/* Prix de vente — uniquement pour les sorties non-transfert */}
              {!estEntree && !estAjustement && !estTransfert && (
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
                          onClick={() => setForm({ ...form, typeVente: t, prixVenteReel: '' })}>
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
                  placeholder={estAjustement ? 'Ex: Inventaire du 26/07' : estEntree ? 'Ex: Réapprovisionnement fournisseur' : (estTransfert ? 'Ex: Transfert boutique' : 'Ex: Vente client')} />
              </div>

              {/* Transfert boutique — uniquement pour les sorties (pas les ajustements) */}
              {!estEntree && !estAjustement && (
                <div className="mb-3">
                  {matchBoutique ? (
                    <div className="form-check">
                      <input
                        className="form-check-input" type="checkbox" id="verse-boutique"
                        checked={verseBoutique}
                        onChange={(e) => setVerseBoutique(e.target.checked)}
                      />
                      <label className="form-check-label small fw-semibold" htmlFor="verse-boutique">
                        Transférer vers la boutique
                        <span className="fw-normal text-muted ms-1">→ <strong style={{ color: '#16a34a' }}>{matchBoutique.nom}</strong></span>
                      </label>
                    </div>
                  ) : (
                    <div className="form-check">
                      <input
                        className="form-check-input" type="checkbox" id="creer-boutique"
                        checked={creerBoutique}
                        onChange={(e) => setCreerBoutique(e.target.checked)}
                      />
                      <label className="form-check-label small fw-semibold" htmlFor="creer-boutique">
                        Créer le produit et transférer vers la boutique
                        <span className="fw-normal text-muted ms-1" style={{ fontSize: 11 }}>
                          (aucun produit correspondant en boutique — il sera créé avec la quantité retirée)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-stock-magasin" className="btn text-white"
              style={{ background: estAjustement ? '#6366f1' : estEntree ? '#16a34a' : '#ea580c' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (estAjustement ? 'Ajuster le stock' : estEntree ? 'Ajouter au stock' : 'Retirer du stock')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalProduit;
