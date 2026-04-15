// Modal formulaire produit
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faImage, faLock } from '@fortawesome/free-solid-svg-icons';
import { produitsAPI } from '../../services/api';
import { toast } from 'react-toastify';

// ============================
// Modal création/modification produit
// ============================
export const ModalProduit = ({ produit, onFermer, onSucces }) => {
  const [form, setForm] = useState({
    nom: '', description: '', prixVente: '', prixAchat: '',
    quantiteStock: '', categorie: 'Général', unite: 'unité',
  });
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);

  const CATEGORIES = ['Général', 'Alimentaire', 'Électronique', 'Vêtements', 'Mobilier', 'Médicaments', 'Cosmétiques', 'Agriculture', 'Construction'];
  const UNITES = ['unité', 'kg', 'g', 'litre', 'ml', 'carton', 'sac', 'pack', 'boîte'];

  useEffect(() => {
    if (produit) {
      setForm({
        nom: produit.nom || '',
        description: produit.description || '',
        prixVente: produit.prixVente || '',
        prixAchat: '',  // Ne pas pré-remplir le prix d'achat masqué
        quantiteStock: produit.quantiteStock || '',
        categorie: produit.categorie || 'Général',
        unite: produit.unite || 'unité',
      });
      if (produit.image) setApercu(produit.image);
    }
  }, [produit]);

  const handleImage = (e) => {
    const fichier = e.target.files[0];
    if (fichier) {
      setImage(fichier);
      setApercu(URL.createObjectURL(fichier));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!produit && !form.prixAchat) {
      toast.error('Le prix d\'achat est requis');
      return;
    }
    setChargement(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
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
                  <div className="d-flex align-items-center justify-content-center rounded-3 border-2 border-dashed"
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
                  <input type="number" min="0" className="form-control"
                    required={!produit}
                    value={form.prixAchat}
                    onChange={(e) => setForm({ ...form, prixAchat: e.target.value })}
                    placeholder={produit ? 'Laisser vide pour ne pas modifier' : ''} />
                </div>
              </div>

              {/* Stock, catégorie, unité */}
              <div className="row g-3 mb-3">
                <div className="col-4">
                  <label className="form-label small fw-semibold text-muted">Stock initial</label>
                  <input type="number" min="0" className="form-control"
                    value={form.quantiteStock} onChange={(e) => setForm({ ...form, quantiteStock: e.target.value })} />
                </div>
                <div className="col-4">
                  <label className="form-label small fw-semibold text-muted">Catégorie</label>
                  <select className="form-select" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-4">
                  <label className="form-label small fw-semibold text-muted">Unité</label>
                  <select className="form-select" value={form.unite} onChange={(e) => setForm({ ...form, unite: e.target.value })}>
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
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
// Modal gestion du stock (entrée/sortie)
// ============================
export const ModalStock = ({ produit, type, onFermer, onSucces }) => {
  const [form, setForm] = useState({ quantite: '', motif: '' });
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
        await produitsAPI.ajouterStock(produit.id, form);
        toast.success('Stock augmenté avec succès');
      } else {
        await produitsAPI.reduireStock(produit.id, form);
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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
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
                Produit : <strong>{produit.nom}</strong> — Stock actuel : <strong>{produit.quantiteStock} {produit.unite}</strong>
              </small>
            </div>
            <form onSubmit={handleSubmit} id="form-stock">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Quantité *</label>
                <input type="number" min="1" className="form-control" required
                  value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
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
