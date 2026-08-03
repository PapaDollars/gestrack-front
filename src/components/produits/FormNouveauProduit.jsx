// Champs de formulaire produit — réutilisable dans ModalProduit et ModalCommande fournisseur
import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faLock, faPlus, faCheck, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { sousUnites, psParUnite } from '@/services/unites';
import { typesProduitAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

const FormNouveauProduit = ({
  form, setForm,
  image, setImage, apercu, setApercu,
  avecPrixAchat = true,
  avecStockInitial = true,
  estModification = false,
  labelQuantite = null, // override du libellé du champ quantité (ex: "Quantité commandée" pour une commande fournisseur)
}) => {
  const fileRef = useRef(null);
  const inputTypeRef = useRef(null);
  const [typesProduits, setTypesProduits] = useState([]);
  const [ajoutEnCours, setAjoutEnCours]   = useState(false);
  const [nouveauType, setNouveauType]     = useState('');
  const [ajoutCharg, setAjoutCharg]       = useState(false);

  useEffect(() => {
    typesProduitAPI.getAll()
      .then(({ data }) => setTypesProduits(data.map(t => t.nom)))
      .catch(() => {});
  }, []);

  useEffect(() => { if (ajoutEnCours) inputTypeRef.current?.focus(); }, [ajoutEnCours]);

  const selectionnerType = (t) => setForm(f => ({ ...f, categorie: f.categorie === t ? '' : t }));

  const confirmerNouveauType = async () => {
    const nom = nouveauType.trim();
    if (!nom) return;
    if (typesProduits.map(t => t.toLowerCase()).includes(nom.toLowerCase())) {
      toast.warning('Ce type existe déjà'); return;
    }
    setAjoutCharg(true);
    try {
      const reponse = await typesProduitAPI.ajouter(nom);
      if (estMisEnAttente(reponse)) return;
      setTypesProduits(prev => [...prev, nom].sort((a, b) => a.localeCompare(b, 'fr')));
      setForm(f => ({ ...f, categorie: nom }));
      setNouveauType(''); setAjoutEnCours(false);
    } catch { toast.error("Erreur lors de l'ajout"); }
    finally { setAjoutCharg(false); }
  };

  const unite   = form.uniteCustom || form.unitePrincipale;
  const isBallo = unite === 'ballo';
  const labelN2 = isBallo ? 'dz' : 'ps';
  const prixUnite = form.prixUnite || unite;
  // L'unité du prix est un choix indépendant de l'unité principale (stock) — on garde
  // toujours l'option actuellement choisie dans la liste, même si l'unité principale change.
  const unitesPrix = [...new Set([...sousUnites(unite), prixUnite])];

  // Changer l'unité du prix reconvertit les montants déjà saisis pour garder la même
  // valeur réelle (ex: 9000/ballo devient 10/ps si on bascule sur "ps").
  const changerUniteDuPrix = (nouvelleUnite) => {
    const ancienRatio = psParUnite(prixUnite, form);
    const nouveauRatio = psParUnite(nouvelleUnite, form);
    setForm(f => ({
      ...f,
      prixUnite: nouvelleUnite,
      prixVente: f.prixVente !== '' ? +(parseFloat(f.prixVente) / ancienRatio * nouveauRatio).toFixed(2) : f.prixVente,
      prixAchat: f.prixAchat !== '' ? +(parseFloat(f.prixAchat) / ancienRatio * nouveauRatio).toFixed(2) : f.prixAchat,
    }));
  };

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

      {/* Prix — l'unité de référence (ps, dz, ballo...) est choisie librement,
          indépendamment de l'unité principale utilisée pour le stock */}
      <div className="row g-3 mb-3">
        <div className={avecPrixAchat ? 'col-6' : 'col-12'}>
          <label className="form-label small fw-semibold text-muted">Prix de vente (FCFA) *</label>
          <div className="input-group">
            <input type="number" min="0" className="form-control" required
              value={form.prixVente} onChange={e => setForm(f => ({ ...f, prixVente: e.target.value }))} />
            <span className="input-group-text bg-body-secondary px-2" style={{ fontSize: 12 }}>par</span>
            {unitesPrix.length > 1 ? (
              <select className="form-select" style={{ maxWidth: 90 }}
                value={prixUnite} onChange={e => changerUniteDuPrix(e.target.value)}>
                {unitesPrix.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <span className="input-group-text bg-body-secondary">{unitesPrix[0]}</span>
            )}
          </div>
        </div>
        {avecPrixAchat && (
          <div className="col-6">
            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
              <FontAwesomeIcon icon={faLock} style={{ fontSize: 11, color: '#6366f1' }} />
              Prix d'achat (FCFA)
            </label>
            <div className="input-group">
              <input type="number" min="0" className="form-control"
                value={form.prixAchat} onChange={e => setForm(f => ({ ...f, prixAchat: e.target.value }))} />
              <span className="input-group-text bg-body-secondary px-2" style={{ fontSize: 12 }}>par</span>
              {unitesPrix.length > 1 ? (
                <select className="form-select" style={{ maxWidth: 90 }}
                  value={prixUnite} onChange={e => changerUniteDuPrix(e.target.value)}>
                  {unitesPrix.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              ) : (
                <span className="input-group-text bg-body-secondary">{unitesPrix[0]}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Type de produit — même sélecteur que sur la fiche fournisseur, ici en choix unique */}
      <div className="mb-3">
        <label className="form-label small fw-semibold text-muted">Type de produit</label>
        <div className="d-flex flex-wrap gap-2 mb-2"
          style={typesProduits.length > 20 ? { maxHeight: 110, overflowY: 'auto', padding: '4px 2px' } : {}}>
          {typesProduits.map(t => (
            <button key={t} type="button" className="btn btn-sm"
              style={{ borderRadius: 20, fontSize: 'var(--txt-base)', background: form.categorie === t ? '#00d4aa' : '#f0f4f8', color: form.categorie === t ? '#fff' : '#203a43' }}
              onClick={() => selectionnerType(t)}>{t}</button>
          ))}
        </div>
        {ajoutEnCours ? (
          <div className="d-flex align-items-center gap-1">
            <input ref={inputTypeRef} type="text" className="form-control form-control-sm"
              style={{ width: 130, borderRadius: 20, fontSize: 'var(--txt-base)' }}
              placeholder="Nouveau type..."
              value={nouveauType} onChange={e => setNouveauType(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); confirmerNouveauType(); }
                if (e.key === 'Escape') { setAjoutEnCours(false); setNouveauType(''); }
              }} />
            <button type="button" className="btn btn-sm text-white"
              style={{ background: '#00d4aa', borderRadius: 20 }}
              disabled={ajoutCharg} onClick={confirmerNouveauType}>
              {ajoutCharg ? <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 'var(--txt-sm)' }} /> : <FontAwesomeIcon icon={faCheck} style={{ fontSize: 'var(--txt-sm)' }} />}
            </button>
            <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 20 }}
              onClick={() => { setAjoutEnCours(false); setNouveauType(''); }}>
              <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-sm"
            style={{ borderRadius: 20, background: '#f0f4f8', color: '#203a43', fontSize: 'var(--txt-base)' }}
            onClick={() => setAjoutEnCours(true)}>
            <FontAwesomeIcon icon={faPlus} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />Nouveau type
          </button>
        )}
      </div>

      {/* Unité principale */}
      <div className="mb-3">
        <div className="row g-2 align-items-end">
          {avecStockInitial && (
            <div className="col">
              <label className="form-label small fw-semibold text-muted">{labelQuantite || (estModification ? 'Stock actuel *' : 'Stock initial *')}</label>
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

        {/* dz/paq : pas de ratio à saisir (fixe), juste le reliquat en ps */}
        {avecStockInitial && ['dz', 'paq'].includes(unite) && (
          <div className="row g-2 mt-2">
            <div className="col-6">
              <div className="input-group">
                <input type="number" min="0" className="form-control" placeholder="0"
                  value={form.stockNiveau2}
                  onChange={e => setForm(f => ({ ...f, stockNiveau2: e.target.value }))} />
                <span className="input-group-text bg-body-secondary" style={{ fontSize: 12 }}>ps</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FormNouveauProduit;
