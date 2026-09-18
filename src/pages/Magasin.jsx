// Page de gestion du stock magasin (stock en gros / entrepôt)
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEye, faEyeSlash,
  faWarehouse, faSpinner, faSearch, faPlusCircle, faMinusCircle, faClipboardList,
  faThumbtack, faGripVertical, faTimes, faFilter,
} from '@fortawesome/free-solid-svg-icons';
import useDragAndPin from '@/hooks/useDragAndPin';
import useIsMobile from '@/hooks/useIsMobile';
import { magasinAPI, produitsAPI, invalidateCache, estMisEnAttente } from '@/services/api';
import {
  afficherStockDetails, statutStock, STATUT_STOCK, passeFiltreStock,
  trierRuptureEnFond, classeBadgeStock,
} from '@/services/unites';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import { ModalProduit } from '@/components/produits/ModalProduit';
import { ModalStockMagasin } from '@/components/produits/ModalProduit';
import { ModalMotDePasse } from '@/components/produits/ModalProduit';
import ModalProduitExistant from '@/components/produits/ModalProduitExistant';
import ModalDetailProduit from '@/components/produits/ModalDetailProduit';
import ModalConfirmation from '@/components/shared/ModalConfirmation';
import AutocompleteFiltre from '@/components/shared/AutocompleteFiltre';
import defaultProduit from '@/assets/img/defaultProduit.png';

const Magasin = () => {
  const isMobile = useIsMobile();
  const { formatMontant } = useParametres();
  const { appliquerOrdre, epingles, epingler, dragSur, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } = useDragAndPin('magasin');
  const [produits, setProduits] = useState([]);
  const [produitsBoutique, setProduitsBoutique] = useState([]);
  const [filtres, setFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreStock, setFiltreStock] = useState('');
  const [prixMin, setPrixMin] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [chargement, setChargement] = useState(true);
  const [prixAchatAutorises, setPrixAchatAutorises] = useState({});
  const [prixAchatData, setPrixAchatData] = useState({});
  const [modalProduit, setModalProduit] = useState(false);
  const [produitEdite, setProduitEdite] = useState(null);
  const [modalStock, setModalStock] = useState(null);
  const [modalMdp, setModalMdp] = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);
  const [idEnSuppression, setIdEnSuppression] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);
  const [modalExistant, setModalExistant] = useState(false);

  const chargerProduits = async () => {
    try {
      let [magRes, boutiqueRes] = await Promise.all([
        magasinAPI.getAll(),
        produitsAPI.getAll(),
      ]);
      // Une panne réseau transitoire (fréquente en prod juste après un upload d'image) peut
      // avoir fait retomber la réponse sur le cache local périmé — on retente une fois pour
      // éviter d'afficher une liste obsolète (ex: produit tout juste créé manquant).
      if (magRes.fromCache || boutiqueRes.fromCache) {
        invalidateCache('produits', 'magasin');
        [magRes, boutiqueRes] = await Promise.all([
          magasinAPI.getAll(),
          produitsAPI.getAll(),
        ]);
      }
      setProduits(magRes.data);
      setFiltres(magRes.data);
      setProduitsBoutique(boutiqueRes.data);
    } catch {
      toast.error('Erreur lors du chargement du magasin');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { chargerProduits(); }, []);

  useEffect(() => {
    window.addEventListener('gestrack:stock-updated', chargerProduits);
    return () => window.removeEventListener('gestrack:stock-updated', chargerProduits);
  }, []);

  // Catégories uniques : magasin + boutique fusionnés
  const categories = [...new Set([
    ...produits.map(p => p.categorie),
    ...produitsBoutique.map(p => p.categorie),
  ].filter(Boolean))].sort();

  useEffect(() => {
    let res = produits;
    if (recherche) {
      const t = recherche.toLowerCase();
      res = res.filter(p =>
        p.nom?.toLowerCase().includes(t) ||
        p.categorie?.toLowerCase().includes(t)
      );
    }
    if (filtreCategorie) {
      res = res.filter(p => p.categorie === filtreCategorie);
    }
    if (prixMin !== '') {
      res = res.filter(p => p.prixVente >= parseFloat(prixMin));
    }
    if (prixMax !== '') {
      res = res.filter(p => p.prixVente <= parseFloat(prixMax));
    }
    if (filtreStock) {
      res = res.filter(p => passeFiltreStock(p, filtreStock));
    }
    setFiltres(res);
  }, [recherche, filtreCategorie, filtreStock, prixMin, prixMax, produits]);

  const demanderPrixAchat = (produit) => {
    setModalMdp(produit);
  };

  const onMdpValide = async (produit) => {
    try {
      const { data } = await magasinAPI.getPrixAchat(produit.id);
      setPrixAchatAutorises(prev => ({ ...prev, [produit.id]: true }));
      setPrixAchatData(prev => ({ ...prev, [produit.id]: data.prixAchat }));
    } catch {
      toast.error('Erreur lors du chargement du prix d\'achat');
    }
    setModalMdp(null);
  };

  const masquerPrixAchat = (produitId) => {
    setPrixAchatAutorises(prev => ({ ...prev, [produitId]: false }));
  };

  const supprimerProduit = async (id) => {
    setIdEnSuppression(id);
    try {
      const reponse = await magasinAPI.delete(id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur, on laisse la modale ouverte
      toast.success('Produit supprimé');
      chargerProduits();
      setConfirmSuppr(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIdEnSuppression(null);
    }
  };

  const ordonnerListe = (items) => {
    const ordered = appliquerOrdre(items);
    const epingle = ordered.filter(i => epingles.has(i.id));
    // Les produits non épinglés suivent l'ordre alphabétique plutôt que l'ordre
    // de glisser-déposer, qui n'a de sens que pour la sélection manuelle des épinglés.
    const libre = ordered.filter(i => !epingles.has(i.id))
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));
    return [...trierRuptureEnFond(epingle), ...trierRuptureEnFond(libre)];
  };
  const ordonnes = ordonnerListe(filtres);

  const filtresJSX = (
    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
      <div className="card-body p-3">
        <div className="row g-2 align-items-center">
          {/* Recherche */}
          <div className="col-12 col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-body-secondary border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" />
              </span>
              <input type="text" className="form-control border-start-0"
                placeholder="Rechercher..."
                value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              {recherche && (
                <button type="button" className="btn btn-light border" onClick={() => setRecherche('')}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
          </div>

          {/* Catégorie */}
          <div className="col-6 col-md-2">
            <AutocompleteFiltre options={categories} value={filtreCategorie}
              onChange={setFiltreCategorie} placeholder="Catégories" />
          </div>

          {/* Stock */}
          <div className="col-6 col-md-2">
            <div className="input-group">
              <select className="form-select"
                value={filtreStock} onChange={(e) => setFiltreStock(e.target.value)}>
                <option value="">Tous les stocks</option>
                <option value="rupture">Rupture (0)</option>
                <option value="faible">Stock faible (1-9)</option>
                <option value="stock">En stock (≥10)</option>
              </select>
              {filtreStock && (
                <button type="button" className="btn btn-light border" onClick={() => setFiltreStock('')}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
          </div>

          {/* Prix min */}
          <div className="col-6 col-md-2">
            <input type="number" min="0" className="form-control"
              placeholder="Prix min"
              value={prixMin} onChange={(e) => setPrixMin(e.target.value)} />
          </div>

          {/* Slider prix max */}
          <div className="col-12 col-md">
            {(() => {
              const prixMaxProduits = produits.length
                ? Math.max(...produits.map(p => p.prixVente || 0))
                : 1000000;
              const sliderMin = prixMin !== '' ? parseFloat(prixMin) : 0;
              const sliderVal = prixMax !== '' ? parseFloat(prixMax) : prixMaxProduits;
              const pct = prixMaxProduits > sliderMin
                ? ((sliderVal - sliderMin) / (prixMaxProduits - sliderMin)) * 100
                : 100;
              return (
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>Max :</span>
                  <input type="range" className="form-range flex-grow-1"
                    min={sliderMin} max={prixMaxProduits} step={500} value={sliderVal}
                    onChange={(e) => setPrixMax(e.target.value)}
                    style={{ accentColor: '#00d4aa',
                      background: `linear-gradient(to right, #00d4aa ${pct}%, #e2e8f0 ${pct}%)` }}
                  />
                  <span className="fw-semibold small flex-shrink-0" style={{ color: '#00a881', whiteSpace: 'nowrap', minWidth: 90, textAlign: 'right' }}>
                    {formatMontant(sliderVal)}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Bouton reset */}
          {(recherche || filtreCategorie || filtreStock || prixMin || prixMax) && (
            <div className="col-auto">
              <button className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                onClick={() => { setRecherche(''); setFiltreCategorie(''); setFiltreStock(''); setPrixMin(''); setPrixMax(''); }}>
                <FontAwesomeIcon icon={faFilter} style={{ fontSize: 'var(--txt-sm)' }} /> Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px - 4rem)', overflow:'hidden' }}>

      {/* ── Titre — toujours fixe ── */}
      <div style={{ flexShrink: 0 }}>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Magasin</h4>
          <p className="text-muted small mb-0">{produits.length} produit(s)</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn d-flex align-items-center gap-2"
            style={{ borderRadius: 10, background: '#dbeafe', color: '#1d4ed8' }}
            onClick={() => setModalExistant(true)}>
            <FontAwesomeIcon icon={faClipboardList} /> Produit existant
          </button>
          <button className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa', borderRadius: 10 }}
            onClick={() => { setProduitEdite(null); setModalProduit(true); }}>
            <FontAwesomeIcon icon={faPlus} /> Nouveau produit
          </button>
        </div>
      </div>
      </div>{/* fin titre */}

      {/* ── Filtres — fixe desktop, dans le scroll mobile ── */}
      {!isMobile && (
        <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}

      {/* ── Zone scrollable : grille + pagination ── */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', minHeight:0, paddingTop:'0.5rem' }}>
      {isMobile && (
        <div style={{ marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}
      {/* Grille produits */}
      {chargement ? (
        <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} /></div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faWarehouse} size="3x" className="mb-3 d-block" />
          Aucun produit enregistré dans le magasin
        </div>
      ) : (
        <>
        <div className="row g-3">
          {ordonnes.map((produit) => {
            const prixVisible = prixAchatAutorises[produit.id];
            const statut      = statutStock(produit);
            const estEpingle  = epingles.has(produit.id);
            const estCible    = dragSur === produit.id;

            return (
              <div
                key={produit.id}
                className="col-12 col-sm-4 col-xl-2"
                draggable
                onDragStart={(e) => onDragStart(e, produit.id)}
                onDragOver={(e)  => onDragOver(e, produit.id)}
                onDragLeave={onDragLeave}
                onDrop={(e)      => onDrop(e, produit.id, ordonnes)}
                onDragEnd={onDragEnd}
                style={{ cursor: 'grab', opacity: dragSur && !estCible && dragSur !== produit.id ? 0.5 : 1 }}
              >
                <div className="card border-0 shadow-sm h-100" style={{
                  borderRadius: 14,
                  border: estCible ? '2px solid #00d4aa' : '2px solid transparent',
                  transition: 'border 0.15s',
                }}>
                  {/* Image produit + grip + pin */}
                  <div className="position-relative">
                  {produit.image ? (
                    <img draggable="false" src={produit.image} alt={produit.nom} className="card-img-top object-fit-cover"
                      style={{ height: 140, borderRadius: '14px 14px 0 0' }} />
                  ) : (
                    <img draggable="false" src={defaultProduit} alt={produit.nom} className="card-img-top object-fit-cover"
                      style={{ height: 140, borderRadius: '14px 14px 0 0' }} />
                  )}
                  <span className="position-absolute bottom-0 start-0 m-1"
                    style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 6, padding: '2px 5px', lineHeight: 1 }}>
                    <FontAwesomeIcon icon={faGripVertical} style={{ color: '#fff', fontSize: 'var(--txt-sm)' }} />
                  </span>
                  <button
                    className="position-absolute top-0 end-0 m-1 btn btn-sm p-0"
                    style={{ background: estEpingle ? 'rgba(0,212,170,0.85)' : 'rgba(0,0,0,0.35)', borderRadius: 6, width: 26, height: 26, border: 'none' }}
                    title={estEpingle ? 'Désépingler' : 'Épingler en haut'}
                    onClick={(e) => { e.stopPropagation(); epingler(produit.id); }}
                  >
                    <FontAwesomeIcon icon={faThumbtack} style={{
                      fontSize: 'var(--txt-base)', color: '#fff',
                      transform: estEpingle ? 'none' : 'rotate(45deg)',
                      transition: 'all 0.2s',
                    }} />
                  </button>
                  </div>

                  <div className="card-body p-3 d-flex flex-column">
                    {/* Nom et stock */}
                    <div className="d-flex align-items-start justify-content-between mb-2">
                      <div>
                        <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)', width: '170px' }}>{produit.nom}</div>
                      </div>
                      <span className={`badge ${classeBadgeStock(statut)}`} style={{ fontSize: 'var(--txt-sm)' }}>
                        {afficherStockDetails(produit)}
                      </span>
                    </div>

                    {/* Prix */}
                    <div className="d-flex flex-column gap-1 mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Prix </span>
                        <span className="fw-bold" style={{ color: '#00a881' }}>{formatMontant(produit.prixVente)}</span>
                      </div>
                      {/* <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Prix d'achat</span>
                        <div className="d-flex align-items-center gap-2">
                          {prixVisible ? (
                            <>
                              <span className="fw-bold" style={{ color: '#6366f1' }}>
                                {formatMontant(prixAchatData[produit.id])}
                              </span>
                              <button className="btn btn-link p-0" onClick={() => masquerPrixAchat(produit.id)}
                                title="Masquer le prix d'achat">
                                <FontAwesomeIcon icon={faEyeSlash} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-muted" style={{ letterSpacing: 2 }}>••••••</span>
                              <button className="btn btn-link p-0" onClick={() => demanderPrixAchat(produit)}
                                title="Voir le prix d'achat">
                                <FontAwesomeIcon icon={faEye} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
                              </button>
                            </>
                          )}
                        </div>
                      </div> */}
                    </div>

                    {/* Alerte stock faible */}
                    {statut === STATUT_STOCK.RUPTURE && (
                      <div className="alert alert-danger py-1 px-2 mb-3 small" style={{ borderRadius: 8 }}>
                        Rupture de stock
                      </div>
                    )}
                    {statut === STATUT_STOCK.FAIBLE && (
                      <div className="alert alert-warning py-1 px-2 mb-3 small" style={{ borderRadius: 8 }}>
                        ⚠ Stock faible
                      </div>
                    )}

                    {/* Actions stock + CRUD — toujours en bas */}
                    <div className="mt-auto">
                      <div className="d-flex gap-2 mb-2">
                        <button className="btn btn-sm flex-grow-1" style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a', fontSize: 'var(--txt-base)' }}
                          onClick={() => setModalStock({ produit, type: 'AJOUT' })}>
                          <FontAwesomeIcon icon={faPlusCircle} className="me-1" />Entrée
                        </button>
                        <button className="btn btn-sm flex-grow-1" style={{ background: 'rgba(234,88,12,0.15)', color: '#ea580c', fontSize: 'var(--txt-base)' }}
                          onClick={() => setModalStock({ produit, type: 'REDUCTION' })}>
                          <FontAwesomeIcon icon={faMinusCircle} className="me-1" />Sortie
                        </button>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm flex-grow-1" style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)', fontSize: 'var(--txt-base)' }}
                          onClick={() => setModalDetail(produit)}>
                          <FontAwesomeIcon icon={faEye} className="me-1" />Voir plus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

</>
      )}
      </div>{/* fin zone scrollable */}

      {/* Modals */}
      {modalProduit && (
        <ModalProduit
          produit={produitEdite}
          api={magasinAPI}
          onFermer={() => setModalProduit(false)}
          onSucces={() => { setModalProduit(false); chargerProduits(); }}
        />
      )}
      {modalStock && (
        <ModalStockMagasin
          produit={modalStock.produit}
          type={modalStock.type}
          produitsBoutique={produitsBoutique}
          onFermer={() => setModalStock(null)}
          onSucces={() => { setModalStock(null); chargerProduits(); }}
        />
      )}
      {modalMdp && (
        <ModalMotDePasse
          produit={modalMdp}
          onValide={() => onMdpValide(modalMdp)}
          onFermer={() => setModalMdp(null)}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer le produit "${confirmSuppr.nom}" du magasin ? Cette action est irréversible.`}
          onConfirmer={() => supprimerProduit(confirmSuppr.id)}
          chargement={idEnSuppression !== null}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
      {modalDetail && (
        <ModalDetailProduit
          produit={modalDetail}
          api={magasinAPI}
          onFermer={() => setModalDetail(null)}
          onActualiser={chargerProduits}
          onModifier={(p) => { setModalDetail(null); setProduitEdite(p); setModalProduit(true); }}
          onSupprimer={(p) => { setModalDetail(null); setConfirmSuppr(p); }}
          onAjuster={(p) => { setModalDetail(null); setModalStock({ produit: p, type: 'AJUSTEMENT' }); }}
        />
      )}
      {modalExistant && (
        <ModalProduitExistant
          produits={produitsBoutique}
          produitsActuels={produits}
          api={magasinAPI}
          onFermer={() => setModalExistant(false)}
          onSucces={() => { setModalExistant(false); chargerProduits(); }}
        />
      )}
    </div>
  );
};

export default Magasin;
