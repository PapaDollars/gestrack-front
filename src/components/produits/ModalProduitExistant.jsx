// Modal pour importer des produits déjà existants dans l'autre collection (Boutique ↔ Magasin)
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faSearch, faCheck } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import defaultProduit from '@/assets/img/defaultProduit.png';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

// produits        : liste des produits de l'autre collection
// produitsActuels : produits déjà présents dans la collection cible (déduplication par nom)
// api             : API cible (produitsAPI ou magasinAPI)
const ModalProduitExistant = ({ produits, produitsActuels, api, onFermer, onSucces }) => {
  const [etape, setEtape] = useState(1); // 1 = sélection, 2 = stock + confirmation
  const [recherche, setRecherche] = useState('');
  const [selectionnes, setSelectionnes] = useState([]);
  // stocks[id] = { unite, uniteCustom, n1, n2, n3, ratio }
  const [stocks, setStocks] = useState({});
  const [chargement, setChargement] = useState(false);

  const nomsExistants = new Set((produitsActuels || []).map(p => p.nom?.toLowerCase().trim()));
  const disponibles = produits.filter(p => !nomsExistants.has(p.nom?.toLowerCase().trim()));
  const filtres = disponibles.filter(p =>
    !recherche || p.nom?.toLowerCase().includes(recherche.toLowerCase())
  );

  const toggleSelection = (produit) => {
    setSelectionnes(prev =>
      prev.find(p => p.id === produit.id)
        ? prev.filter(p => p.id !== produit.id)
        : [...prev, produit]
    );
  };

  const allerEtape2 = () => {
    if (selectionnes.length === 0) { toast.error('Sélectionnez au moins un produit'); return; }
    const init = {};
    selectionnes.forEach(p => {
      const src = p.unitePrincipale || p.unite || 'dz';
      const unitePrincipale = UNITES_STD.includes(src) ? src : '__custom__';
      const uniteCustom     = UNITES_STD.includes(src) ? '' : src;
      const unite = uniteCustom || unitePrincipale;
      init[p.id] = {
        unitePrincipale,
        uniteCustom,
        n1: '', n2: '', n3: '',
        ratio: unite === 'ballo' ? (p.dzParBallo || '')
             : unite === 'crt'   ? (p.psParCrt  || '')
             : unite === 'sac'   ? (p.psParSac  || '')
             : '',
      };
    });
    setStocks(init);
    setEtape(2);
  };

  const setS = (id, champ, val) =>
    setStocks(prev => ({ ...prev, [id]: { ...prev[id], [champ]: val } }));

  // Quand l'unité change, réinitialiser ratio/niveaux
  const changerUnite = (id, val) => {
    setStocks(prev => ({
      ...prev,
      [id]: { ...prev[id], unitePrincipale: val, uniteCustom: '', n1: '', n2: '', n3: '', ratio: '' },
    }));
  };

  const handleSubmit = async () => {
    // Validation : ratio obligatoire pour ballo, crt, sac
    for (const p of selectionnes) {
      const s = stocks[p.id] || {};
      const unite = s.uniteCustom || s.unitePrincipale || 'dz';
      if (['ballo', 'crt', 'sac'].includes(unite) && !s.ratio) {
        toast.error(`"${p.nom}" — renseignez le ratio (${unite === 'ballo' ? 'dz / ballo' : unite === 'crt' ? 'ps / crt' : 'ps / sac'})`);
        return;
      }
    }
    setChargement(true);
    let nb = 0;
    try {
      for (const p of selectionnes) {
        const s = stocks[p.id] || {};
        const unite = s.uniteCustom || s.unitePrincipale || 'dz';
        const formData = new FormData();
        formData.append('nom', p.nom);
        formData.append('categorie', p.categorie || '');
        formData.append('prixVente', p.prixVente || 0);
        formData.append('prixAchat', p.prixAchat || 0);
        formData.append('unitePrincipale', unite);
        if (unite === 'ballo' && s.ratio) formData.append('dzParBallo', s.ratio);
        if (unite === 'crt'   && s.ratio) formData.append('psParCrt',   s.ratio);
        if (unite === 'sac'   && s.ratio) formData.append('psParSac',   s.ratio);
        formData.append('stockNiveau1', parseFloat(s.n1) || 0);
        formData.append('stockNiveau2', parseFloat(s.n2) || 0);
        formData.append('stockNiveau3', parseFloat(s.n3) || 0);
        if (p.description) formData.append('description', p.description);
        if (p.image) formData.append('imageUrl', p.image);
        await api.create(formData);
        nb++;
      }
      toast.success(`${nb} produit(s) ajouté(s) avec succès`);
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'ajout');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
     >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>

          {/* Header */}
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <div>
              <h5 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>
                {etape === 1 ? 'Importer des produits existants' : 'Définir le stock initial'}
              </h5>
              <p className="text-muted small mb-0">
                {etape === 1
                  ? `${selectionnes.length} sélectionné(s) — ${disponibles.length} disponible(s)`
                  : `${selectionnes.length} produit(s) à ajouter`}
              </p>
            </div>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body px-4 pb-0">

            {/* ── Étape 1 : sélection ── */}
            {etape === 1 && (
              <>
                <div className="input-group mb-3">
                  <span className="input-group-text bg-body-secondary border-end-0">
                    <FontAwesomeIcon icon={faSearch} className="text-muted" />
                  </span>
                  <input className="form-control border-start-0"
                    placeholder="Rechercher un produit..."
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)} />
                </div>

                {disponibles.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    Tous les produits sont déjà présents dans cette collection
                  </div>
                ) : filtres.length === 0 ? (
                  <div className="text-center py-4 text-muted">Aucun résultat</div>
                ) : (
                  <div>
                    {filtres.map(p => {
                      const est = selectionnes.some(s => s.id === p.id);
                      return (
                        <div key={p.id}
                          className="d-flex align-items-center gap-3 p-2 rounded mb-2"
                          style={{
                            background: est ? 'rgba(22,163,74,0.12)' : 'var(--bs-secondary-bg)',
                            border: `2px solid ${est ? '#16a34a' : 'var(--bs-border-color)'}`,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                          onClick={() => toggleSelection(p)}>
                          <div className="d-flex align-items-center justify-content-center flex-shrink-0 rounded"
                            style={{ width: 22, height: 22, background: est ? '#16a34a' : 'var(--bs-border-color)', transition: 'all 0.15s' }}>
                            {est && <FontAwesomeIcon icon={faCheck} className="text-white" style={{ fontSize: 11 }} />}
                          </div>
                          <img src={p.image || defaultProduit} alt={p.nom}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-semibold small text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                            {p.categorie && (
                              <span className="badge bg-info bg-opacity-25 text-info" style={{ fontSize: 10 }}>
                                {p.categorie}
                              </span>
                            )}
                          </div>
                          <div className="text-end flex-shrink-0">
                            <div className="fw-bold small" style={{ color: '#00a881' }}>
                              {new Intl.NumberFormat('fr-CM', {
                                style: 'currency', currency: 'XAF', maximumFractionDigits: 0,
                              }).format(p.prixVente || 0)}
                            </div>
                            <div className="text-muted" style={{ fontSize: 11 }}>
                              {p.unitePrincipale || p.unite || 'ps'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── Étape 2 : stock initial ── */}
            {etape === 2 && (
              <>
                <div className="alert py-2 mb-3" style={{ background: 'rgba(234,88,12,0.15)', borderRadius: 10, border: 'none' }}>
                  <small className="text-warning-emphasis">
                    Choisissez l'unité de réception et renseignez le stock initial. Les champs non remplis démarreront à 0.
                  </small>
                </div>

                {selectionnes.map(p => {
                  const s = stocks[p.id] || {};
                  const unite = s.uniteCustom || s.unitePrincipale || 'dz';
                  const isBallo = unite === 'ballo';
                  const isCrt   = unite === 'crt';
                  const isSac   = unite === 'sac';
                  const avecRatio = isBallo || isCrt || isSac;
                  const labelN2 = isBallo ? 'dz' : 'ps';
                  const ratioLabel = isBallo ? 'dz / ballo'
                                  : isCrt   ? 'ps / crt'
                                  : 'ps / sac';
                  const ratioPlaceholder = isBallo ? 'Ex: 10' : isCrt ? 'Ex: 144' : 'Ex: 60';
                  const ratioDesc = s.ratio
                    ? isBallo ? `1 ballo = ${s.ratio} dz = ${parseInt(s.ratio) * 12} ps`
                    : isCrt   ? `1 crt = ${s.ratio} ps`
                    : `1 sac = ${s.ratio} ps`
                    : isBallo ? 'dz par ballo'
                    : isCrt   ? 'pièces par carton'
                    : 'pièces par sac';

                  return (
                    <div key={p.id} className="card border-0 mb-3"
                      style={{ background: 'var(--bs-secondary-bg)', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <div className="card-body p-3">

                        {/* En-tête produit */}
                        <div className="d-flex align-items-center gap-3 mb-3 pb-2"
                          style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <img src={p.image || defaultProduit} alt={p.nom}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                          <div className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                        </div>

                        {/* Ligne 1 : Stock N1 + Unité principale (éditable) */}
                        <div className="row g-2 align-items-end">
                          <div className="col">
                            <label className="form-label small fw-semibold text-muted">Stock initial *</label>
                            <div className="input-group">
                              <input type="number" min="0" className="form-control"
                                placeholder="0"
                                value={s.n1 || ''}
                                onChange={(e) => setS(p.id, 'n1', e.target.value)} />
                              <span className="input-group-text bg-body-secondary" style={{ fontSize: 12 }}>{unite}</span>
                            </div>
                          </div>
                          <div className="col">
                            <label className="form-label small fw-semibold text-muted">Unité principale</label>
                            <select className="form-select"
                              value={s.unitePrincipale}
                              onChange={(e) => changerUnite(p.id, e.target.value)}>
                              {UNITES_STD.map(u => <option key={u} value={u}>{u}</option>)}
                              <option value="__custom__">— Autre (saisir) —</option>
                            </select>
                            {s.unitePrincipale === '__custom__' && (
                              <input className="form-control mt-2" placeholder="Ex: rouleau, boîte..."
                                value={s.uniteCustom || ''}
                                onChange={(e) => setS(p.id, 'uniteCustom', e.target.value)} />
                            )}
                          </div>
                        </div>

                        {/* Ligne 2 : Ratio + N2 + N3 */}
                        {avecRatio && (
                          <>
                            <div className="row g-2 mt-2">
                              <div className="col-6">
                                <div className="input-group">
                                  <span className="input-group-text bg-body-secondary small">{ratioLabel}</span>
                                  <input type="number" min="1" className="form-control"
                                    placeholder={ratioPlaceholder}
                                    value={s.ratio || ''}
                                    onChange={(e) => setS(p.id, 'ratio', e.target.value)} />
                                </div>
                              </div>
                              <div className="col">
                                <div className="input-group">
                                  <input type="number" min="0" className="form-control"
                                    placeholder="0"
                                    value={s.n2 || ''}
                                    onChange={(e) => setS(p.id, 'n2', e.target.value)} />
                                  <span className="input-group-text bg-body-secondary" style={{ fontSize: 12 }}>{labelN2}</span>
                                </div>
                              </div>
                              {isBallo && (
                                <div className="col">
                                  <div className="input-group">
                                    <input type="number" min="0" className="form-control"
                                      placeholder="0"
                                      value={s.n3 || ''}
                                      onChange={(e) => setS(p.id, 'n3', e.target.value)} />
                                    <span className="input-group-text bg-body-secondary" style={{ fontSize: 12 }}>ps</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <small className="text-muted d-block mt-1" style={{ fontSize: 11 }}>{ratioDesc}</small>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="alert py-2 mt-1 mb-0" style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 10, border: 'none' }}>
                  <small style={{ color: '#1d4ed8' }}>
                    Confirmer l'ajout de <strong>{selectionnes.length} produit(s)</strong> ? Cette action est irréversible.
                  </small>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 px-4 pb-4 pt-3">
            {etape === 1 ? (
              <>
                <button className="btn btn-light" onClick={onFermer}>Annuler</button>
                <button className="btn text-white" style={{ background: '#3b82f6' }}
                  disabled={selectionnes.length === 0}
                  onClick={allerEtape2}>
                  Suivant ({selectionnes.length})
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-light" onClick={() => setEtape(1)}>Retour</button>
                <button className="btn text-white" style={{ background: '#16a34a' }}
                  disabled={chargement}
                  onClick={handleSubmit}>
                  {chargement
                    ? <FontAwesomeIcon icon={faSpinner} spin />
                    : `Confirmer et ajouter ${selectionnes.length} produit(s)`}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModalProduitExistant;
