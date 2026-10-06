// Modal : transfert groupé magasin → boutique
import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSearch, faTimes, faExchangeAlt, faCheck, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { magasinAPI } from '@/services/api';
import { afficherStockDetails, sousUnites, psParUnite } from '@/services/unites';
import { toast } from 'react-toastify';

// ── Modal de transfert groupé magasin → boutique ────────────────────────────────────────
// Même principe que l'ajout de produits à une facture : une recherche en haut (suggestions
// qui se ferment dès qu'on choisit), et les produits choisis listés séparément en dessous,
// entièrement visibles d'un coup pour vérifier/ajuster avant de confirmer — pas besoin de
// re-rechercher chaque produit déjà ajouté pour le retrouver.
const ModalTransfertGroupe = ({ produits, produitsBoutique, onFermer, onSucces }) => {
  const [recherche, setRecherche] = useState('');
  const [dropOuvert, setDropOuvert] = useState(false);
  const refRecherche = useRef(null);
  const [panier, setPanier]       = useState([]); // [{produitId, nom, produit, quantite, unite, uniteOptions, maxUnites, produitBoutiqueId, creerBoutique, cibleLabel}]
  const [envoi, setEnvoi]         = useState(false);
  const [resultats, setResultats] = useState(null); // [{produitId, nom, success, message}]

  useEffect(() => {
    const h = (e) => { if (refRecherche.current && !refRecherche.current.contains(e.target)) setDropOuvert(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const t = recherche.trim().toLowerCase();
  const suggestions = (t ? produits.filter(p => p.nom?.toLowerCase().includes(t) || p.categorie?.toLowerCase().includes(t)) : produits)
    .filter(p => !panier.find(l => l.produitId === p.id)) // déjà dans le panier → plus dans les suggestions
    .slice(0, 20);

  const resoudreCible = (p) => {
    const dejaLie = p.produitLieId
      ? produitsBoutique.find(b => b.id === p.produitLieId)
      : produitsBoutique.find(b => (b.nom || '').trim().toLowerCase() === (p.nom || '').trim().toLowerCase());
    return {
      produitBoutiqueId: dejaLie?.id || null,
      creerBoutique: !dejaLie,
      cibleLabel: dejaLie ? `→ lié à "${dejaLie.nom}" en boutique` : '→ sera créé en boutique',
    };
  };

  const ajouter = (p) => {
    const unite = p.unitePrincipale || p.unite || 'ps';
    const maxUnites = Math.floor((p.stockEnPieces ?? 0) / psParUnite(unite, p));
    setPanier(prev => [
      { produitId: p.id, nom: p.nom, produit: p, unite, uniteOptions: sousUnites(unite), maxUnites, quantite: '', ...resoudreCible(p) },
      ...prev,
    ]);
    setRecherche('');
    setDropOuvert(false);
  };

  const majQuantite = (produitId, val) => {
    setPanier(prev => prev.map(l => l.produitId === produitId
      ? { ...l, quantite: val === '' ? '' : Math.max(0, Math.min(l.maxUnites, parseInt(val) || 0)) }
      : l));
  };

  // Changer d'unité change le maximum disponible — la quantité déjà saisie est remise à
  // vide plutôt que recalculée, pour éviter toute confusion sur ce qui vient d'être tapé.
  const majUnite = (produitId, nouvelleUnite) => {
    setPanier(prev => prev.map(l => {
      if (l.produitId !== produitId) return l;
      const maxUnites = Math.floor((l.produit.stockEnPieces ?? 0) / psParUnite(nouvelleUnite, l.produit));
      return { ...l, unite: nouvelleUnite, maxUnites, quantite: '' };
    }));
  };

  const retirer = (produitId) => setPanier(prev => prev.filter(l => l.produitId !== produitId));

  const confirmerTransfert = async () => {
    if (panier.length === 0) { toast.error('Ajoutez au moins un produit'); return; }
    const incompletes = panier.filter(l => !(parseInt(l.quantite) > 0));
    if (incompletes.length > 0) {
      toast.error(`Indiquez une quantité pour : ${incompletes.map(l => l.nom).join(', ')}`);
      return;
    }
    setEnvoi(true);
    try {
      const { data } = await magasinAPI.transfertGroupe(panier.map(l => ({
        produitId: l.produitId, quantite: l.quantite, unite: l.unite,
        produitBoutiqueId: l.produitBoutiqueId, creerBoutique: l.creerBoutique,
      })));
      const reussis = (data.resultats || []).filter(r => r.success).length;
      const echoues = (data.resultats || []).length - reussis;
      if (reussis > 0) toast.success(`${reussis} produit(s) transféré(s) à la boutique`);
      if (echoues > 0) {
        setResultats(data.resultats);
        setPanier(prev => prev.filter(l => data.resultats.find(r => r.produitId === l.produitId && !r.success)));
      } else {
        onSucces();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du transfert');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-lg modal-fullscreen-sm-down modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faExchangeAlt} className="me-2" style={{ color: '#00d4aa' }} />
              Transférer à la boutique
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-body px-4 d-flex flex-column gap-3" style={{ minHeight: '50vh' }}>
            {/* Recherche — suggestions qui se ferment dès qu'on choisit un produit */}
            <div ref={refRecherche} className="position-relative">
              <div className="input-group">
                <span className="input-group-text bg-body-secondary border-end-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input type="text" className="form-control border-start-0" autoFocus
                  placeholder="Rechercher un produit du magasin..."
                  value={recherche}
                  onChange={e => { setRecherche(e.target.value); setDropOuvert(true); }}
                  onFocus={() => setDropOuvert(true)} />
              </div>
              {dropOuvert && suggestions.length > 0 && (
                <div className="rounded-2 border mt-1"
                  style={{ position: 'absolute', zIndex: 5, width: '100%', maxHeight: 260, overflowY: 'auto', background: 'var(--bs-body-bg)' }}>
                  {suggestions.map(p => (
                    <div key={p.id} className="d-flex align-items-center gap-2 px-2 py-2"
                      style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-sm)' }}
                      onMouseDown={() => ajouter(p)}>
                      {p.image
                        ? <img src={p.image} alt="" className="rounded flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                        : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 32, height: 32, background: 'var(--bs-secondary-bg)' }}>
                            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 12 }} />
                          </div>}
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>{afficherStockDetails(p)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Produits choisis — tous visibles d'un coup pour vérifier avant de confirmer */}
            {panier.length > 0 ? (
              <div>
                <div className="small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: 1 }}>
                  Produits sélectionnés ({panier.length})
                </div>
                <div className="d-flex flex-column gap-2">
                  {panier.map(l => {
                    const erreur = resultats?.find(r => r.produitId === l.produitId && !r.success);
                    return (
                      <div key={l.produitId} className="p-3 rounded-3 d-flex align-items-center gap-3 flex-wrap"
                        style={{ background: erreur ? 'rgba(239,68,68,0.08)' : 'var(--bs-secondary-bg)' }}>
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{l.nom}</div>
                          <div className="small text-muted">{l.cibleLabel}</div>
                          {erreur && <div className="small" style={{ color: '#ef4444' }}>{erreur.message}</div>}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <input type="number" min="0" max={l.maxUnites} className="form-control form-control-sm text-center"
                            placeholder="0" style={{ width: 70 }}
                            value={l.quantite} onChange={e => majQuantite(l.produitId, e.target.value)} />
                          <select className="form-select form-select-sm" style={{ width: 90 }}
                            value={l.unite} onChange={e => majUnite(l.produitId, e.target.value)}>
                            {l.uniteOptions.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <span className="small text-muted text-nowrap">/ {l.maxUnites} dispo</span>
                        </div>
                        <button className="btn btn-sm flex-shrink-0"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 8 }}
                          onClick={() => retirer(l.produitId)}>
                          <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-muted text-center py-4 mb-0">Recherchez un produit ci-dessus pour l'ajouter au transfert.</p>
            )}
          </div>

          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn" style={{ color: 'var(--bs-body-color)' }} onClick={onFermer}>Fermer</button>
            <button className="btn text-white d-flex align-items-center gap-2"
              style={{ background: '#00d4aa', borderRadius: 10 }}
              disabled={envoi || panier.length === 0}
              onClick={confirmerTransfert}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
              Confirmer le transfert {panier.length > 0 && `(${panier.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTransfertGroupe;
