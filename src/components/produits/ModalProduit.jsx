// Modal formulaire produit
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faImage, faLock } from '@fortawesome/free-solid-svg-icons';
import { produitsAPI } from '@/services/api';
import { toast } from 'react-toastify';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

// ============================
// Modal création/modification produit
// ============================
export const ModalProduit = ({ produit, categories = [], onFermer, onSucces }) => {
  const [form, setForm] = useState({
    nom: '', description: '', prixVente: '', prixAchat: '',
    categorie: '', categorieCustom: '',
    unitePrincipale: 'dz', uniteCustom: '',
    dzParBallo: '', psParCrt: '', psParSac: '',
    stockNiveau1: '', stockNiveau2: '', stockNiveau3: '',
  });
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);

  const unite = form.uniteCustom || form.unitePrincipale;
  const isBallo = unite === 'ballo';


  // Libellés des niveaux de stock selon l'unité
  const labelN1 = unite;
  const labelN2 = isBallo ? 'dz' : 'ps';
  const labelN3 = 'ps'; // seulement pour ballo

  useEffect(() => {
    if (produit) {
      const uniteP = produit.unitePrincipale || produit.unite || 'dz';
      setForm(prev => ({
        ...prev,
        nom: produit.nom || '',
        description: produit.description || '',
        prixVente: produit.prixVente || '',
        prixAchat: '',
        categorie: categories.includes(produit.categorie) ? produit.categorie : '__custom__',
        categorieCustom: categories.includes(produit.categorie) ? '' : (produit.categorie || ''),
        unitePrincipale: UNITES_STD.includes(uniteP) ? uniteP : '__custom__',
        uniteCustom: UNITES_STD.includes(uniteP) ? '' : uniteP,
        dzParBallo: produit.dzParBallo || '',
        psParCrt: produit.psParCrt || '',
        psParSac: produit.psParSac || '',
      }));
      if (produit.image) setApercu(produit.image);
    }
  }, [produit]); // eslint-disable-line

  const handleImage = (e) => {
    const fichier = e.target.files[0];
    if (fichier) { setImage(fichier); setApercu(URL.createObjectURL(fichier)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!produit && !form.prixAchat) { toast.error('Le prix d\'achat est requis'); return; }
    if (!produit && !form.stockNiveau1) { toast.error('Le stock initial (niveau 1) est requis'); return; }
    if (isBallo && !form.dzParBallo) { toast.error('Indiquez le nombre de dz par ballo'); return; }

    const categorieFinale = form.categorie === '__custom__' ? form.categorieCustom : form.categorie;
    const uniteFinale = form.unitePrincipale === '__custom__' ? form.uniteCustom : form.unitePrincipale;

    setChargement(true);
    try {
      const formData = new FormData();
      formData.append('nom', form.nom);
      formData.append('description', form.description);
      formData.append('prixVente', form.prixVente);
      if (form.prixAchat) formData.append('prixAchat', form.prixAchat);
      formData.append('categorie', categorieFinale || 'Général');
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

      if (produit) {
        await produitsAPI.update(produit.id, formData);
        toast.success('Produit mis à jour');
      } else {
        await produitsAPI.create(formData);
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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: '#203a43' }}>{produit ? 'Modifier le produit' : 'Nouveau produit'}</h5>
            <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={handleSubmit} id="form-produit">

              {/* Image */}
              <div className="text-center mb-4">
                <label htmlFor="img-upload" style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center justify-content-center"
                    style={{ width: '100%', height: 140, background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 12 }}>
                    {apercu ? (
                      <img src={apercu} alt="Aperçu" style={{ maxHeight: 130, maxWidth: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div className="text-center text-muted">
                        <FontAwesomeIcon icon={faImage} size="2x" className="d-block mx-auto mb-2" />
                        <small>Image produit (optionnel)</small>
                      </div>
                    )}
                  </div>
                </label>
                <input type="file" id="img-upload" accept="image/*" onChange={handleImage} className="d-none" />
              </div>

              {/* Nom */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Nom du produit *</label>
                <input className="form-control" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Description</label>
                <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Prix */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Prix de vente (FCFA) *</label>
                  <input type="number" min="0" className="form-control" required
                    value={form.prixVente} onChange={(e) => setForm({ ...form, prixVente: e.target.value })} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                    <FontAwesomeIcon icon={faLock} style={{ fontSize: 11, color: '#6366f1' }} />
                    Prix d'achat (FCFA) {!produit && '*'}
                  </label>
                  <input type="number" min="0" className="form-control" required={!produit}
                    value={form.prixAchat} onChange={(e) => setForm({ ...form, prixAchat: e.target.value })}
                    placeholder={produit ? 'Laisser vide pour ne pas modifier' : ''} />
                </div>
              </div>

              {/* Catégorie */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Catégorie</label>
                {categories.length > 0 && (
                  <select className="form-select mb-2"
                    value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value, categorieCustom: '' })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__custom__">— Nouvelle catégorie —</option>
                  </select>
                )}
                {(form.categorie === '__custom__' || categories.length === 0) && (
                  <input className="form-control" placeholder="Ex: Maillot, Valise, Jogging..."
                    value={form.categorieCustom}
                    onChange={(e) => setForm({ ...form, categorieCustom: e.target.value })} />
                )}
              </div>

              {/* Unité principale + Stock initial */}
              <div className="mb-3">
                <div className="row g-2 align-items-end">
                  {/* Stock N1 (création seulement) */}
                  {!produit && (
                    <div className="col">
                      <label className="form-label small fw-semibold text-muted">Stock initial *</label>
                      <div className="input-group">
                        <input type="number" min="0" className="form-control" placeholder="0" required
                          value={form.stockNiveau1}
                          onChange={(e) => setForm({ ...form, stockNiveau1: e.target.value })} />
                        <span className="input-group-text bg-light" style={{ fontSize: 12 }}>{labelN1}</span>
                      </div>
                    </div>
                  )}

                  {/* Unité principale */}
                  <div className="col">
                    <label className="form-label small fw-semibold text-muted">Unité principale</label>
                    <select className="form-select"
                      value={form.unitePrincipale}
                      onChange={(e) => setForm({ ...form, unitePrincipale: e.target.value, uniteCustom: '', dzParBallo: '', psParCrt: '', psParSac: '' })}>
                      {UNITES_STD.map(u => <option key={u} value={u}>{u}</option>)}
                      <option value="__custom__">— Autre (saisir) —</option>
                    </select>
                    {form.unitePrincipale === '__custom__' && (
                      <input className="form-control mt-2" placeholder="Ex: rouleau, boîte..."
                        value={form.uniteCustom}
                        onChange={(e) => setForm({ ...form, uniteCustom: e.target.value })} />
                    )}
                  </div>
                </div>

                {/* Ratio + niveaux supplémentaires sur la même ligne */}
                {(isBallo || unite === 'crt' || unite === 'sac') && (
                  <>
                  <div className="row g-2 mt-2">
                    {/* Ratio col-6 */}
                    <div className="col-6">
                      <div className="input-group">
                        <span className="input-group-text bg-light small">
                          {isBallo ? 'dz / ballo' : unite === 'crt' ? 'ps / crt' : 'ps / sac'}
                        </span>
                        <input type="number" min="1" className="form-control"
                          placeholder={isBallo ? 'Ex: 10' : unite === 'crt' ? 'Ex: 144' : 'Ex: 60'}
                          value={isBallo ? form.dzParBallo : unite === 'crt' ? form.psParCrt : form.psParSac}
                          onChange={(e) => setForm({
                            ...form,
                            ...(isBallo ? { dzParBallo: e.target.value } : unite === 'crt' ? { psParCrt: e.target.value } : { psParSac: e.target.value })
                          })} />
                      </div>
                    </div>

                    {/* N2 et N3 (création seulement) */}
                    {!produit && (
                      <>
                        <div className="col">
                          <div className="input-group">
                            <input type="number" min="0" className="form-control" placeholder="0"
                              value={form.stockNiveau2}
                              onChange={(e) => setForm({ ...form, stockNiveau2: e.target.value })} />
                            <span className="input-group-text bg-light" style={{ fontSize: 12 }}>{labelN2}</span>
                          </div>
                        </div>
                        {isBallo && (
                          <div className="col">
                            <div className="input-group">
                              <input type="number" min="0" className="form-control" placeholder="0"
                                value={form.stockNiveau3}
                                onChange={(e) => setForm({ ...form, stockNiveau3: e.target.value })} />
                              <span className="input-group-text bg-light" style={{ fontSize: 12 }}>{labelN3}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {/* Description ratio — hors du row pour ne pas décaler les champs */}
                  <small className="text-muted d-block mt-1" style={{ fontSize: 11 }}>
                    {isBallo
                      ? (form.dzParBallo ? `1 ballo = ${form.dzParBallo} dz = ${parseInt(form.dzParBallo) * 12} ps` : 'dz par ballo')
                      : unite === 'crt'
                        ? (form.psParCrt ? `1 crt = ${form.psParCrt} ps` : 'pièces par carton')
                        : (form.psParSac ? `1 sac = ${form.psParSac} ps` : 'pièces par sac')}
                  </small>
                  </>
                )}
              </div>

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
  const [form, setForm] = useState({ quantite: '', unite: unitesDisponibles[0], motif: '' });
  const [chargement, setChargement] = useState(false);
  const estEntree = type === 'AJOUT';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantite || parseInt(form.quantite) <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }
    setChargement(true);
    try {
      if (estEntree) {
        await produitsAPI.ajouterStock(produit.id, { quantite: form.quantite, unite: form.unite, motif: form.motif });
        toast.success('Stock augmenté avec succès');
      } else {
        await produitsAPI.reduireStock(produit.id, { quantite: form.quantite, unite: form.unite, motif: form.motif });
        toast.success('Stock réduit avec succès');
      }
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour du stock');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog">
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: '#203a43' }}>
              {estEntree ? '📦 Entrée de stock' : '🛒 Sortie de stock'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
          <div className="modal-body px-4">
            <div className="alert py-2 mb-3" style={{ background: '#f0f4f8', borderRadius: 10, border: 'none' }}>
              <small className="text-muted">
                Produit : <strong>{produit.nom}</strong> — Stock actuel : <strong>{afficherStockDetails(produit)}</strong>
              </small>
            </div>
            <form onSubmit={handleSubmit} id="form-stock">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Quantité *</label>
                <div className="input-group">
                  <input type="number" min="1" className="form-control" required
                    value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
                  {unitesDisponibles.length > 1 ? (
                    <select className="input-group-text form-select" style={{ maxWidth: 90 }}
                      value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })}>
                      {unitesDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  ) : (
                    <span className="input-group-text">{unitesDisponibles[0]}</span>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Motif (optionnel)</label>
                <input className="form-control" value={form.motif}
                  onChange={(e) => setForm({ ...form, motif: e.target.value })}
                  placeholder={estEntree ? 'Ex: Réapprovisionnement fournisseur' : 'Ex: Vente client'} />
              </div>
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-stock" className="btn text-white"
              style={{ background: estEntree ? '#16a34a' : '#ea580c' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (estEntree ? 'Ajouter au stock' : 'Retirer du stock')}
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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-sm">
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold d-flex align-items-center gap-2" style={{ color: '#203a43' }}>
              <FontAwesomeIcon icon={faLock} style={{ color: '#6366f1' }} />
              Prix d'achat — {produit?.nom}
            </h6>
            <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}><FontAwesomeIcon icon={faTimes} /></button>
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

export default ModalProduit;
