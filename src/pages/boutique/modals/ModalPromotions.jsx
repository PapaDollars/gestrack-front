// Fenêtre « Promotions » (Boutique seulement) : mettre plusieurs produits en Soldes ou en
// Vente Flash d'un coup, avec leur prix d'avant (barré sur les cartes). Même réglage que les
// cases de « Modifier un produit » ; une seule confirmation à l'enregistrement.
// Prix d'avant saisis dans l'unité principale du produit, enregistrés par pièce.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearch, faSpinner, faSave, faBolt, faTags, faBoxOpen, faBan, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useParametres } from '@/context/ParametresContext';
import { estMisEnAttente } from '@/services/api';
import { psParUnite } from '@/services/unites';
import { imageOptimisee } from '@/utils/images';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import ModalConfirmation from '@/components/common/ModalConfirmation';

const uniteDe = (p) => p.unitePrincipale || p.unite || 'ps';
const ratioDe = (p) => psParUnite(uniteDe(p), p) || 1;
const arrondi = (n) => Math.round(n * 100) / 100;
const champ = (prixParPs, p) => (prixParPs > 0 ? String(arrondi(prixParPs * ratioDe(p))) : '');

const etatInitial = (produits) => Object.fromEntries(produits.map(p => [p.id, {
  // Soldes OU Vente Flash : un ancien produit avec les deux garde la Vente Flash
  enSolde: !!p.enSolde && !p.venteFlash, venteFlash: !!p.venteFlash,
  prixAvantSolde: p.venteFlash ? '' : champ(p.prixAvantSolde, p), prixAvantFlash: champ(p.prixAvantFlash, p),
}]));

const ChampPrix = ({ couleur, libelle, unite, valeur, onChange }) => (
  <div className="col-12 col-sm-6">
    <label className="small fw-semibold mb-1" style={{ color: couleur }}>{libelle} (par {unite})</label>
    <div className="input-group input-group-sm">
      <input type="number" min="0" step="any" className="form-control" placeholder="Facultatif"
        value={valeur} onChange={(e) => onChange(e.target.value)} />
      <span className="input-group-text">FCFA</span>
    </div>
  </div>
);

const ModalPromotions = ({ produits, api, lieu = 'Boutique', onFermer, onSucces }) => {
  const { formatMontant } = useParametres();
  const [initial] = useState(() => etatInitial(produits));
  const [etat, setEtat] = useState(initial);
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('');
  // Liste ramenée en haut à chaque changement de recherche, de catégorie ou du filtre promo
  const corpsRef = useRef(null);
  const [enPromoSeuls, setEnPromoSeuls] = useState(false);
  useEffect(() => { corpsRef.current?.scrollTo({ top: 0 }); }, [recherche, categorie, enPromoSeuls]);
  const [selection, setSelection] = useState(() => new Set());
  const [confirmation, setConfirmation] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  const categories = useMemo(() => [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort(), [produits]);

  const visibles = useMemo(() => {
    const t = recherche.toLowerCase().trim();
    return produits.filter(p => (!t || p.nom?.toLowerCase().includes(t))
      && (!categorie || p.categorie === categorie)
      && (!enPromoSeuls || etat[p.id].enSolde || etat[p.id].venteFlash));
  }, [produits, recherche, categorie, enPromoSeuls, etat]);

  const maj = (id, champs) => setEtat(prev => ({ ...prev, [id]: { ...prev[id], ...champs } }));
  const basculer = (id) => setSelection(prev => {
    const s = new Set(prev);
    if (s.has(id)) s.delete(id); else s.add(id);
    return s;
  });
  const toutVisibleCoche = visibles.length > 0 && visibles.every(p => selection.has(p.id));
  const cocherVisibles = (oui) => setSelection(prev => {
    const s = new Set(prev);
    visibles.forEach(p => { if (oui) s.add(p.id); else s.delete(p.id); });
    return s;
  });
  // Action sur tous les produits cochés
  const appliquer = (champs) => setEtat(prev => {
    const suite = { ...prev };
    selection.forEach(id => { suite[id] = { ...suite[id], ...champs }; });
    return suite;
  });

  const modifies = produits.filter(p => {
    const a = initial[p.id]; const b = etat[p.id];
    return a.enSolde !== b.enSolde || a.venteFlash !== b.venteFlash
      || (b.enSolde && a.prixAvantSolde !== b.prixAvantSolde)
      || (b.venteFlash && a.prixAvantFlash !== b.prixAvantFlash);
  });

  // Prix d'avant non supérieur au prix affiché (en gestion, puis sur le catalogue public)
  const alerteCatalogue = (p, e) => {
    if (!p.afficherPrixCatalogue || !(p.prixCatalogue > 0)) return false;
    const avant = parseFloat(e.venteFlash ? e.prixAvantFlash : e.enSolde ? e.prixAvantSolde : 0) || 0;
    return avant > 0 && avant / ratioDe(p) <= p.prixCatalogue;
  };

  const demanderConfirmation = () => {
    const invalide = modifies.find(p => {
      const e = etat[p.id];
      const vente = (p.prixVente || 0) * ratioDe(p);
      const trop = (v) => v && parseFloat(v) <= vente;
      return (e.enSolde && trop(e.prixAvantSolde)) || (e.venteFlash && trop(e.prixAvantFlash));
    });
    if (invalide) {
      toast.error(`« ${invalide.nom} » : le prix d'avant doit être plus élevé que le prix de vente`);
      return;
    }
    const soldes = modifies.filter(p => etat[p.id].enSolde && !initial[p.id].enSolde).length;
    const flash = modifies.filter(p => etat[p.id].venteFlash && !initial[p.id].venteFlash).length;
    const parties = [
      soldes && `${soldes} produit(s) passeront en Soldes : leurs ventes ne compteront plus dans les bénéfices.`,
      flash && `${flash} produit(s) passeront en Vente Flash.`,
    ].filter(Boolean);
    setConfirmation(`${modifies.length} produit(s) modifié(s). ${parties.join(' ')} Confirmer ?`);
  };

  const enregistrer = async () => {
    setEnvoi(true);
    try {
      const changements = modifies.map(p => {
        const e = etat[p.id];
        const parPs = (v) => (v ? parseFloat(v) / ratioDe(p) : 0);
        return {
          id: p.id, enSolde: e.enSolde, venteFlash: e.venteFlash,
          prixAvantSolde: parPs(e.prixAvantSolde), prixAvantFlash: parPs(e.prixAvantFlash),
        };
      });
      const reponse = await api.enregistrerPromotions(changements);
      if (estMisEnAttente(reponse)) return;
      toast.success(`Promotions enregistrées (${changements.length} produit(s))`);
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      setConfirmation(null);
    } finally { setEnvoi(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      {/* Pas de fermeture au clic à côté : on ne perd pas les promotions en cours de saisie */}
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-3 px-sm-4 pt-4 pb-2">
            <div className="min-w-0">
              <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faTags} style={{ color: '#d97706' }} /> Promotions — {lieu}
              </h5>
              <div className="small text-muted">Soldes et Vente Flash sur plusieurs produits</div>
              <div className="small text-muted" style={{ fontSize: 12 }}>
                Le prix d'avant est barré sur les pages publiques seulement s'il est plus grand que le prix affiché (prix catalogue s'il est rempli, sinon prix de vente).
              </div>
            </div>
            <button className="btn btn-light btn-sm rounded-circle ms-auto flex-shrink-0" onClick={onFermer} disabled={envoi}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="px-3 px-sm-4 pb-2">
            <div className="row g-2 mb-2">
              <div className="col-12 col-sm-6">
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary border-end-0"><FontAwesomeIcon icon={faSearch} className="text-muted" /></span>
                  <input className="form-control border-start-0" placeholder="Rechercher un produit..."
                    value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <AutocompleteFiltre options={categories} value={categorie} onChange={setCategorie} placeholder="Toutes les catégories" />
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2 gap-sm-3 small">
              <label className="d-flex align-items-center gap-2 mb-0" style={{ cursor: 'pointer', color: 'var(--bs-body-color)' }}>
                <input type="checkbox" checked={toutVisibleCoche} onChange={(e) => cocherVisibles(e.target.checked)} />
                Tout sélectionner ({visibles.length})
              </label>
              <label className="d-flex align-items-center gap-2 mb-0" style={{ cursor: 'pointer', color: 'var(--bs-body-color)' }}>
                <input type="checkbox" checked={enPromoSeuls} onChange={(e) => setEnPromoSeuls(e.target.checked)} />
                En promotion seulement
              </label>
            </div>
            {selection.size === 0 && (
              <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                Cochez des produits pour leur appliquer la même promotion d'un coup.
              </div>
            )}
            {selection.size > 0 && (
              <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mt-2 p-2 rounded-3" style={{ background: 'var(--bs-secondary-bg)' }}>
                <span className="small fw-semibold me-auto" style={{ color: 'var(--bs-body-color)' }}>{selection.size} sélectionné(s)</span>
                <button type="button" className="btn btn-sm" style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 8 }}
                  onClick={() => appliquer({ enSolde: false, venteFlash: false, prixAvantSolde: '', prixAvantFlash: '' })}>
                  <FontAwesomeIcon icon={faBan} className="me-1" />Retirer
                </button>
                <button type="button" className="btn btn-sm" style={{ background: '#fef3c7', color: '#b45309', borderRadius: 8 }}
                  onClick={() => appliquer({ enSolde: true, venteFlash: false, prixAvantFlash: '' })}>
                  <FontAwesomeIcon icon={faTags} className="me-1" />Soldes
                </button>
                <button type="button" className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8 }}
                  onClick={() => appliquer({ venteFlash: true, enSolde: false, prixAvantSolde: '' })}>
                  <FontAwesomeIcon icon={faBolt} className="me-1" />Vente Flash
                </button>
              </div>
            )}
          </div>

          <div ref={corpsRef} className="modal-body px-3 px-sm-4 pt-2">
            {visibles.length === 0 && <div className="text-center text-muted py-5">Aucun produit</div>}
            <div className="d-flex flex-column gap-2">
              {visibles.map(p => {
                const e = etat[p.id];
                const unite = uniteDe(p);
                return (
                  <div key={p.id} className="p-2 p-sm-3 rounded-3" style={{ border: '1px solid var(--bs-border-color)' }}>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <input type="checkbox" className="flex-shrink-0" aria-label={`Sélectionner ${p.nom}`}
                        checked={selection.has(p.id)} onChange={() => basculer(p.id)} />
                      {p.image
                        ? <img src={imageOptimisee(p.image, 120)} alt="" loading="lazy" className="rounded-2 flex-shrink-0" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                        : <div className="rounded-2 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: 'var(--bs-secondary-bg)' }}>
                            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" />
                          </div>}
                      <div className="flex-grow-1 min-w-0" style={{ flexBasis: 120 }}>
                        <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                        <div className="small" style={{ color: '#00a881' }}>{formatMontant((p.prixVente || 0) * ratioDe(p))} / {unite}</div>
                        {/* Prix du catalogue public (Paramètres > Sites vitrine) — déjà dans la liste, aucune lecture en plus */}
                        {!p.afficherPrixCatalogue
                          ? <div className="text-muted" style={{ fontSize: 12 }}>Prix masqué sur le catalogue</div>
                          : p.prixCatalogue > 0 && (
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              Catalogue : {formatMontant(p.prixCatalogue * ratioDe(p))} / {unite}
                            </div>
                          )}
                      </div>
                      <div className="d-flex gap-2 ms-auto">
                        <button type="button" className="btn btn-sm" aria-pressed={e.enSolde}
                          style={{ background: e.enSolde ? '#d97706' : 'var(--bs-secondary-bg)', color: e.enSolde ? '#fff' : 'var(--bs-secondary-color)', borderRadius: 8 }}
                          onClick={() => maj(p.id, e.enSolde
                            ? { enSolde: false, prixAvantSolde: '' }
                            : { enSolde: true, venteFlash: false, prixAvantFlash: '' })}>
                          Soldes
                        </button>
                        <button type="button" className="btn btn-sm" aria-pressed={e.venteFlash}
                          style={{ background: e.venteFlash ? '#dc2626' : 'var(--bs-secondary-bg)', color: e.venteFlash ? '#fff' : 'var(--bs-secondary-color)', borderRadius: 8 }}
                          onClick={() => maj(p.id, e.venteFlash
                            ? { venteFlash: false, prixAvantFlash: '' }
                            : { venteFlash: true, enSolde: false, prixAvantSolde: '' })}>
                          <FontAwesomeIcon icon={faBolt} className="me-1" />Flash
                        </button>
                      </div>
                    </div>
                    {(e.enSolde || e.venteFlash) && (
                      <div className="row g-2 mt-1">
                        {e.enSolde && <ChampPrix couleur="#b45309" libelle="Prix d'avant Soldes" unite={unite}
                          valeur={e.prixAvantSolde} onChange={(v) => maj(p.id, { prixAvantSolde: v })} />}
                        {e.venteFlash && <ChampPrix couleur="#dc2626" libelle="Prix d'avant Flash" unite={unite}
                          valeur={e.prixAvantFlash} onChange={(v) => maj(p.id, { prixAvantFlash: v })} />}
                      </div>
                    )}
                    {alerteCatalogue(p, e) && (
                      <div className="small mt-2" style={{ color: '#b45309' }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
                        Prix catalogue public : {formatMontant(p.prixCatalogue * ratioDe(p))} / {unite}. Mettez un prix d'avant plus élevé, sinon il ne sera pas barré sur le catalogue.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="modal-footer border-0 px-3 px-sm-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa', borderRadius: 10 }}
              disabled={envoi || modifies.length === 0} onClick={demanderConfirmation}>
              <FontAwesomeIcon icon={envoi ? faSpinner : faSave} spin={envoi} />
              Enregistrer{modifies.length > 0 ? ` (${modifies.length})` : ''}
            </button>
          </div>
        </div>
      </div>
      {confirmation && (
        <ModalConfirmation message={confirmation} labelConfirmer="Confirmer" chargement={envoi}
          onConfirmer={enregistrer} onAnnuler={() => setConfirmation(null)} />
      )}
    </div>
  );
};

export default ModalPromotions;
