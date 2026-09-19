// Champs de formulaire produit — réutilisable dans ModalProduit et ModalCommande fournisseur
import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faLock, faUpload, faImages } from '@fortawesome/free-solid-svg-icons';
import { sousUnites, psParUnite } from '@/services/unites';
import SelecteurTypesProduits from '@/components/shared/SelecteurTypesProduits';
import ModalRecadrageImage from '@/components/shared/ModalRecadrageImage';
import ModalGalerieImages from '@/components/shared/ModalGalerieImages';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

const FormNouveauProduit = ({
  form, setForm,
  image, setImage, apercu, setApercu,
  imageGalerie, setImageGalerie,
  avecPrixAchat = true,
  avecStockInitial = true,
  estModification = false,
  labelQuantite = null, // override du libellé du champ quantité (ex: "Quantité commandée" pour une commande fournisseur)
}) => {
  const fileRef = useRef(null);
  const choixRef = useRef(null);
  const [fichierACadrer, setFichierACadrer] = useState(null);
  const [galerieOuverte, setGalerieOuverte] = useState(false);
  const [choixOuvert, setChoixOuvert] = useState(false);

  useEffect(() => {
    const h = (e) => { if (choixRef.current && !choixRef.current.contains(e.target)) setChoixOuvert(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

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
    if (f) setFichierACadrer(f);
    e.target.value = ''; // permet de resélectionner le même fichier après annulation
  };

  return (
    <>
      {/* Image circulaire — clic = choix entre importer un fichier ou piocher dans la galerie */}
      <div className="text-center mb-4">
        <div ref={choixRef} className="position-relative d-inline-block">
          <div className="d-flex align-items-center justify-content-center mx-auto"
            style={{ cursor: 'pointer', width: 120, height: 120, background: 'var(--bs-secondary-bg)', border: '2px dashed var(--bs-border-color)', borderRadius: '50%', overflow: 'hidden' }}
            onClick={() => setChoixOuvert(v => !v)}>
            {apercu ? (
              <img src={apercu} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div className="text-center text-muted">
                <FontAwesomeIcon icon={faImage} size="xl" className="d-block mx-auto mb-1" />
                <small style={{ fontSize: 10 }}>Photo</small>
              </div>
            )}
          </div>

          {choixOuvert && (
            <div className="position-absolute shadow-lg rounded-3 overflow-hidden text-start"
              style={{
                top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8, zIndex: 20,
                background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)', minWidth: 210,
              }}>
              <button type="button" className="btn d-flex align-items-center gap-2 w-100 rounded-0"
                style={{ padding: '10px 14px', fontSize: 'var(--txt-sm)' }}
                onClick={() => { fileRef.current?.click(); setChoixOuvert(false); }}>
                <FontAwesomeIcon icon={faUpload} style={{ width: 16, color: '#00d4aa' }} /> Importer un fichier
              </button>
              <button type="button" className="btn d-flex align-items-center gap-2 w-100 rounded-0 border-top"
                style={{ padding: '10px 14px', fontSize: 'var(--txt-sm)' }}
                onClick={() => { setGalerieOuverte(true); setChoixOuvert(false); }}>
                <FontAwesomeIcon icon={faImages} style={{ width: 16, color: '#00d4aa' }} /> Galerie GesTrack
              </button>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="d-none" />
      </div>

      {fichierACadrer && (
        <ModalRecadrageImage
          fichier={fichierACadrer}
          onAnnuler={() => setFichierACadrer(null)}
          onValider={(fichierRecadre, url) => {
            setImage(fichierRecadre);
            setApercu(url);
            setImageGalerie?.(null);
            setFichierACadrer(null);
          }}
        />
      )}

      {galerieOuverte && (
        <ModalGalerieImages
          onFermer={() => setGalerieOuverte(false)}
          onChoisir={({ url, publicId }) => {
            setImage(null);
            setApercu(url);
            setImageGalerie?.({ url, publicId });
            setGalerieOuverte(false);
          }}
        />
      )}

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
      <SelecteurTypesProduits
        label="Type de produit"
        value={form.categorie}
        onChange={categorie => setForm(f => ({ ...f, categorie }))}
      />

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
                    {isBallo ? 'dz / ballo' : unite === 'crt' ? 'ps / crt' : 'ps / sac (optionnel)'}
                  </span>
                  <input type="number" min="1" className="form-control"
                    placeholder={isBallo ? 'Ex: 10' : unite === 'crt' ? 'Ex: 144' : 'Si connu, ex: 60'}
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
                  : (form.psParSac ? `1 sac = ${form.psParSac} ps` : 'Laissez vide si inconnu (ex: sac de riz vendu au poids) — sinon indiquez le nombre de pièces par sac (ex: sac de sachets de 5kg)')}
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
