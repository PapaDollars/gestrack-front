// Champs de formulaire produit — réutilisable dans ModalProduit et ModalCommande fournisseur
import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faLock } from '@fortawesome/free-solid-svg-icons';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

const FormNouveauProduit = ({
  form, setForm,
  image, setImage, apercu, setApercu,
  categories = [],
  avecPrixAchat = true,
  avecStockInitial = true,
}) => {
  const fileRef = useRef(null);
  const unite   = form.uniteCustom || form.unitePrincipale;
  const isBallo = unite === 'ballo';
  const labelN2 = isBallo ? 'dz' : 'ps';

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (f) { setImage(f); setApercu(URL.createObjectURL(f)); }
  };

  return (
    <>
      {/* Image circulaire */}
      <div className="text-center mb-4">
        <div className="d-flex align-items-center justify-content-center mx-auto"
          style={{ cursor: 'pointer', width: 120, height: 120, background: 'var(--bs-secondary-bg)', border: '2px dashed var(--bs-border-color)', borderRadius: '50%', overflow: 'hidden' }}
          onClick={() => fileRef.current?.click()}>
          {apercu ? (
            <img src={apercu} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="text-center text-muted">
              <FontAwesomeIcon icon={faImage} size="xl" className="d-block mx-auto mb-1" />
              <small style={{ fontSize: 10 }}>Photo</small>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="d-none" />
      </div>

      {/* Nom */}
      <div className="mb-3">
        <label className="form-label small fw-semibold text-muted">Nom du produit *</label>
        <input className="form-control" required value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="form-label small fw-semibold text-muted">Description</label>
        <textarea className="form-control" rows={2} value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>

      {/* Prix */}
      <div className="row g-3 mb-3">
        <div className={avecPrixAchat ? 'col-6' : 'col-12'}>
          <label className="form-label small fw-semibold text-muted">Prix de vente (FCFA) *</label>
          <input type="number" min="0" className="form-control" required
            value={form.prixVente} onChange={e => setForm(f => ({ ...f, prixVente: e.target.value }))} />
        </div>
        {avecPrixAchat && (
          <div className="col-6">
            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
              <FontAwesomeIcon icon={faLock} style={{ fontSize: 11, color: '#6366f1' }} />
              Prix d'achat (FCFA)
            </label>
            <input type="number" min="0" className="form-control"
              value={form.prixAchat} onChange={e => setForm(f => ({ ...f, prixAchat: e.target.value }))} />
          </div>
        )}
      </div>

      {/* Catégorie */}
      <div className="mb-3">
        <label className="form-label small fw-semibold text-muted">Catégorie</label>
        {categories.length > 0 && (
          <select className="form-select mb-2" value={form.categorie}
            onChange={e => setForm(f => ({ ...f, categorie: e.target.value, categorieCustom: '' }))}>
            <option value="">— Choisir une catégorie —</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="__custom__">— Nouvelle catégorie —</option>
          </select>
        )}
        {(form.categorie === '__custom__' || categories.length === 0) && (
          <input className="form-control" placeholder="Ex: Maillot, Valise, Jogging..."
            value={form.categorieCustom}
            onChange={e => setForm(f => ({ ...f, categorieCustom: e.target.value }))} />
        )}
      </div>

      {/* Unité principale */}
      <div className="mb-3">
        <div className="row g-2 align-items-end">
          {avecStockInitial && (
            <div className="col">
              <label className="form-label small fw-semibold text-muted">Stock initial *</label>
              <div className="input-group">
                <input type="number" min="0" className="form-control" placeholder="0" required
                  value={form.stockNiveau1}
                  onChange={e => setForm(f => ({ ...f, stockNiveau1: e.target.value }))} />
                <span className="input-group-text bg-body-secondary" style={{ fontSize: 12 }}>{unite}</span>
              </div>
            </div>
          )}
          <div className="col">
            <label className="form-label small fw-semibold text-muted">Unité principale</label>
            <select className="form-select" value={form.unitePrincipale}
              onChange={e => setForm(f => ({ ...f, unitePrincipale: e.target.value, uniteCustom: '', dzParBallo: '', psParCrt: '', psParSac: '' }))}>
              {UNITES_STD.map(u => <option key={u} value={u}>{u}</option>)}
              <option value="__custom__">— Autre (saisir) —</option>
            </select>
            {form.unitePrincipale === '__custom__' && (
              <input className="form-control mt-2" placeholder="Ex: rouleau, boîte..."
                value={form.uniteCustom}
                onChange={e => setForm(f => ({ ...f, uniteCustom: e.target.value }))} />
            )}
          </div>
        </div>

        {(isBallo || unite === 'crt' || unite === 'sac') && (
          <>
            <div className="row g-2 mt-2">
              <div className="col-6">
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary small">
                    {isBallo ? 'dz / ballo' : unite === 'crt' ? 'ps / crt' : 'ps / sac'}
                  </span>
                  <input type="number" min="1" className="form-control"
                    placeholder={isBallo ? 'Ex: 10' : unite === 'crt' ? 'Ex: 144' : 'Ex: 60'}
                    value={isBallo ? form.dzParBallo : unite === 'crt' ? form.psParCrt : form.psParSac}
                    onChange={e => setForm(f => ({
                      ...f,
                      ...(isBallo ? { dzParBallo: e.target.value } : unite === 'crt' ? { psParCrt: e.target.value } : { psParSac: e.target.value })
                    }))} />
                </div>
              </div>
              {avecStockInitial && (
                <>
                  <div className="col">
                    <div className="input-group">
                      <input type="number" min="0" className="form-control" placeholder="0"
                        value={form.stockNiveau2}
                        onChange={e => setForm(f => ({ ...f, stockNiveau2: e.target.value }))} />
                      <span className="input-group-text bg-body-secondary" style={{ fontSize: 12 }}>{labelN2}</span>
                    </div>
                  </div>
                  {isBallo && (
                    <div className="col">
                      <div className="input-group">
                        <input type="number" min="0" className="form-control" placeholder="0"
                          value={form.stockNiveau3}
                          onChange={e => setForm(f => ({ ...f, stockNiveau3: e.target.value }))} />
                        <span className="input-group-text bg-body-secondary" style={{ fontSize: 12 }}>ps</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
    </>
  );
};

export default FormNouveauProduit;
