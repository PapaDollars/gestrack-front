// Page des paramètres de l'application
import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave, faSearch, faBoxOpen, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { produitsAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import { toast } from 'react-toastify';

// ── Modal de sélection des produits dont le prix est visible sur le catalogue public ──
// Remplace un simple bouton "afficher/masquer tous les prix" par un choix produit par
// produit : le prix de vente peut être sensible pour certains articles mais pas d'autres.
const ModalPrixCatalogue = ({ onFermer }) => {
  const { formatMontant } = useParametres();
  const [produits, setProduits]       = useState([]);
  const [chargement, setChargement]   = useState(true);
  const [recherche, setRecherche]     = useState('');
  const [categorie, setCategorie]     = useState('');
  const [selection, setSelection]     = useState({});
  const [prixOverride, setPrixOverride] = useState({});
  const [enSauvegarde, setEnSauvegarde] = useState(false);

  useEffect(() => {
    produitsAPI.getAll()
      .then(({ data }) => {
        setProduits(data);
        const sel = {};
        const prix = {};
        data.forEach(p => {
          sel[p.id] = !!p.afficherPrixCatalogue;
          prix[p.id] = p.prixCatalogue != null ? String(p.prixCatalogue) : '';
        });
        setSelection(sel);
        setPrixOverride(prix);
      })
      .catch(() => toast.error('Erreur lors du chargement des produits'))
      .finally(() => setChargement(false));
  }, []);

  const categories = useMemo(() => (
    [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'))
  ), [produits]);

  const filtres = useMemo(() => {
    const t = recherche.toLowerCase().trim();
    return produits.filter(p =>
      (!t || p.nom?.toLowerCase().includes(t)) &&
      (!categorie || p.categorie === categorie)
    );
  }, [produits, recherche, categorie]);

  const tousFiltresVisibles = filtres.length > 0 && filtres.every(p => selection[p.id]);
  const total = Object.values(selection).filter(Boolean).length;

  const toutAfficherPrix = (visible) => {
    const sel = {};
    produits.forEach(p => { sel[p.id] = visible; });
    setSelection(sel);
  };

  const enregistrer = async () => {
    setEnSauvegarde(true);
    try {
      const produitsVisibles = Object.entries(selection)
        .filter(([, v]) => v)
        .map(([id]) => {
          const brut = parseFloat(prixOverride[id]);
          return { id, prixCatalogue: !isNaN(brut) && brut > 0 ? brut : null };
        });
      await produitsAPI.definirPrixVisibleCatalogue(produitsVisibles);
      toast.success('Visibilité des prix mise à jour');
      onFermer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally { setEnSauvegarde(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <div>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>Prix visibles sur le catalogue</h5>
              <div className="text-muted small">{total} / {produits.length} produit(s) avec prix affiché</div>
            </div>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            {chargement ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} />
              </div>
            ) : (
              <>
                <div className="small p-2 rounded-2 mb-3 d-flex align-items-start gap-2"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                  <FontAwesomeIcon icon={faInfoCircle} className="flex-shrink-0 mt-1" />
                  <span>
                    Pour un produit coché, vous pouvez ajuster le prix affiché uniquement sur le
                    catalogue public — cela ne modifie jamais le prix de vente réel du produit
                    dans l'application. Laissez le champ vide pour afficher le prix réel.
                  </span>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-12 col-sm-6">
                    <div className="input-group">
                      <span className="input-group-text bg-body-secondary border-end-0">
                        <FontAwesomeIcon icon={faSearch} className="text-muted" />
                      </span>
                      <input type="text" className="form-control border-start-0" autoFocus
                        placeholder="Rechercher un produit..."
                        value={recherche} onChange={e => setRecherche(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <AutocompleteFiltre options={categories} value={categorie} onChange={setCategorie}
                      placeholder="Toutes les catégories" />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <label className="d-flex align-items-center text-secondary gap-2 mb-0 small fw-semibold" style={{ cursor: 'pointer' }}>
                    <input type="checkbox" checked={tousFiltresVisibles}
                      onChange={e => {
                        const sel = { ...selection };
                        filtres.forEach(p => { sel[p.id] = e.target.checked; });
                        setSelection(sel);
                      }} />
                    Sélectionner tout {(recherche || categorie) ? '(résultats affichés)' : ''}
                  </label>
                  <div className="d-flex gap-3">
                    <button type="button" className="btn btn-sm p-0" style={{ background: 'none', border: 'none', color: '#00a881', fontSize: 'var(--txt-sm)' }}
                      onClick={() => toutAfficherPrix(true)}>
                      Tout afficher
                    </button>
                    <button type="button" className="btn btn-sm p-0" style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 'var(--txt-sm)' }}
                      onClick={() => toutAfficherPrix(false)}>
                      Tout masquer
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {filtres.map(p => (
                    <div key={p.id} className="p-2 rounded-2 mb-1"
                      style={{ border: '1px solid var(--bs-border-color)' }}>
                      <label className="d-flex align-items-center gap-3 mb-0" style={{ cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!selection[p.id]}
                          onChange={e => setSelection(prev => ({ ...prev, [p.id]: e.target.checked }))} />
                        {p.image
                          ? <img src={p.image} alt="" className="rounded flex-shrink-0" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                          : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 36, height: 36, background: 'var(--bs-secondary-bg)' }}>
                              <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 12 }} />
                            </div>}
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                          <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>{p.categorie || '—'}</div>
                        </div>
                        <div className="fw-semibold flex-shrink-0" style={{ color: '#00a881', fontSize: 'var(--txt-sm)' }}>
                          {formatMontant(p.prixVente || 0)}
                        </div>
                      </label>
                      {selection[p.id] && (
                        <div className="mt-2 ps-4">
                          <label className="form-label small text-muted mb-1">
                            Prix affiché sur le catalogue public (optionnel)
                          </label>
                          <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
                            <input type="number" min="0" className="form-control"
                              placeholder={String(p.prixVente || 0)}
                              value={prixOverride[p.id] || ''}
                              onChange={e => setPrixOverride(prev => ({ ...prev, [p.id]: e.target.value }))} />
                            <span className="input-group-text">FCFA</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {filtres.length === 0 && (
                    <p className="text-muted text-center small py-3 mb-0">Aucun produit trouvé</p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={enSauvegarde}>Annuler</button>
            <button className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa', borderRadius: 10 }}
              onClick={enregistrer} disabled={enSauvegarde || chargement}>
              {enSauvegarde ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPrixCatalogue;
