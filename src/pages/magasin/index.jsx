// Page de gestion du stock magasin (stock en gros / entrepôt)
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEye, faEyeSlash, faWarehouse, faSpinner, faSearch,
  faClipboardList, faThumbtack, faGripVertical, faTimes,
  faFilter, faExchangeAlt,
} from '@fortawesome/free-solid-svg-icons';
import useDragAndPin from '@/hooks/useDragAndPin';
import useIsMobile from '@/hooks/useIsMobile';
import { magasinAPI, produitsAPI, invalidateCache, estMisEnAttente } from '@/services/api';
import {
  afficherStockDetails, statutStock, STATUT_STOCK, passeFiltreStock, classeBadgeStock, trierRuptureEnFond,
} from '@/services/unites';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
// Modales produit partagées avec la boutique
import ModalProduit from '@/pages/boutique/modals/ModalProduit';
import ModalMotDePasse from '@/pages/boutique/modals/ModalMotDePasse';
import ModalStockMagasin from '@/pages/magasin/modals/ModalStockMagasin';
import ModalProduitExistant from '@/pages/boutique/modals/ModalProduitExistant';
import ModalDetailProduit from '@/pages/boutique/modals/ModalDetailProduit';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import defaultProduit from '@/assets/img/defaultProduit.png';
import ModalTransfertGroupe from '@/pages/magasin/modals/ModalTransfertGroupe';
import ModalTransfertDepot from '@/pages/magasin/modals/ModalTransfertDepot';
import SelecteurDepot from '@/pages/magasin/components/SelecteurDepot';
import VueTousDepots from '@/pages/magasin/components/VueTousDepots';
import useDepots from '@/hooks/useDepots';
import { imprimerListeProduits } from '@/utils/pdfTemplates';
import { categoriesAvecSoldes, dansCategorie, styleCategorie, iconeCategorie } from '@/utils/soldes';
import BadgesProduit from '@/components/produits/BadgesProduit';
import { prixBarre } from '@/utils/promotions';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import useInventaireEnCours from '@/hooks/useInventaireEnCours';
import ModalLancerInventaire from '@/pages/inventaire/modals/ModalLancerInventaire';
import BandeauInventaire from '@/pages/inventaire/components/BandeauInventaire';
import BadgeInventaire, { styleCarteInventaire } from '@/pages/inventaire/components/BadgeInventaire';
import { ROUTES } from '@/utils/url/frontend';
import { estModeLimite, moduleExclu, demanderPassagePro } from '@/utils/acces';

// Les promotions (Soldes, Vente Flash) se gèrent depuis la boutique seulement : chaque produit
// du magasin affiche celles du même produit en boutique (lien enregistré, sinon même nom).
// Celles encore enregistrées sur le produit du magasin sont ignorées.
const promotionsDeLaBoutique = (produitsMagasin, produitsBoutique) => {
  const parId = new Map(produitsBoutique.map(b => [b.id, b]));
  const parNom = new Map(produitsBoutique.map(b => [b.nom?.toLowerCase().trim(), b]));
  return produitsMagasin.map(p => {
    const b = parId.get(p.produitLieId) || parNom.get(p.nom?.toLowerCase().trim());
    return {
      ...p,
      enSolde: !!b?.enSolde, venteFlash: !!b?.venteFlash,
      prixAvantSolde: b?.prixAvantSolde || 0, prixAvantFlash: b?.prixAvantFlash || 0,
    };
  });
};

const Magasin = () => {
  const isMobile = useIsMobile();
  const { formatMontant } = useParametres();
  const { appliquerOrdre, epingles, epingler, dragSur, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } = useDragAndPin('magasin');
  const [produits, setProduits] = useState([]);
  // Inventaire (versions Pro) : session en cours de ce lieu, bouton et fenêtre de lancement
  const { acces } = useOutletContext() || {};
  const navigateInventaire = useNavigate();
  // ── Plusieurs dépôts (plan A.3) ──────────────────────────────────────────────────────
  // depotActif : 'principal' (le Magasin historique), l'identifiant d'un dépôt, ou 'tous'.
  // Gardé sur l'appareil pour retrouver le même dépôt à la prochaine ouverture.
  const { depots, actifs: depotsActifs, autorise: depotsAutorises, charge: depotsCharges, nomPrincipal } = useDepots(acces);
  const [depotActif, setDepotActifState] = useState(() => {
    try { return localStorage.getItem('gestrack_depot_actif') || 'principal'; } catch { return 'principal'; }
  });
  const setDepotActif = (v) => {
    setDepotActifState(v);
    try { localStorage.setItem('gestrack_depot_actif', v); } catch { /* stockage indisponible */ }
  };
  const depotCourant = depotActif === 'principal' || depotActif === 'tous' ? null : depotActif;
  const vueTous = depotActif === 'tous';
  // Dépôts proposés : principal, actifs, et archivés qui contiennent encore des produits
  const optionsDepots = useMemo(() => {
    const nb = (cle) => produits.filter(p => (p.depotId || 'principal') === cle).length;
    const liste = depots.filter(d => !d.archive || nb(d.id) > 0);
    if (liste.length === 0) return [];
    return [{ cle: 'principal', nom: nomPrincipal, nb: nb('principal') }, ...liste.map(d => ({ cle: d.id, nom: d.nom + (d.archive ? ' (archivé)' : ''), nb: nb(d.id) }))];
  }, [depots, produits, nomPrincipal]);
  const nomDepotCourant = optionsDepots.find(o => o.cle === depotActif)?.nom || nomPrincipal;
  // Produits du dépôt affiché (tous les produits en vue « Tous les dépôts »)
  const produitsDepot = useMemo(() => (vueTous ? produits : produits.filter(p => (p.depotId || null) === depotCourant)),
    [produits, vueTous, depotCourant]);
  // Autres dépôts vers lesquels transférer depuis le dépôt affiché
  const destinationsDepots = useMemo(() => (!depotsAutorises || optionsDepots.length === 0) ? [] : [
    { cle: 'principal', nom: nomPrincipal },
    ...depotsActifs.map(d => ({ cle: d.id, nom: d.nom })),
  ].filter(d => vueTous || d.cle !== (depotCourant || 'principal')), [depotsAutorises, optionsDepots, depotsActifs, depotCourant, vueTous, nomPrincipal]);
  const [transfertDepot, setTransfertDepot] = useState(null); // produit à transférer vers un autre dépôt
  // Création d'un produit (ou import) : dans le dépôt affiché
  const apiDepot = useMemo(() => (depotCourant ? {
    ...magasinAPI,
    create: (fd) => { fd.append('depotId', depotCourant); return magasinAPI.create(fd); },
  } : magasinAPI), [depotCourant]);

  const inventaire = useInventaireEnCours('magasin', acces, depotCourant);
  const [modalInventaire, setModalInventaire] = useState(false);
  const ouvrirInventaire = () => {
    if (estModeLimite(acces)) { demanderPassagePro(); return; }
    if (inventaire && !vueTous) navigateInventaire(ROUTES.inventaire('magasin', depotCourant));
    else setModalInventaire(true);
  };

  // Stock de chaque dépôt en PDF (vue « Tous les dépôts »)
  const imprimerStockDepots = () => imprimerListeProduits(produits.map(p => ({
    ...p, _source: `Magasin — ${optionsDepots.find(o => o.cle === (p.depotId || 'principal'))?.nom || nomPrincipal}`,
  })));
  const [produitsBoutique, setProduitsBoutique] = useState([]);
  const [filtres, setFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreStock, setFiltreStock] = useState('');
  const [recherchePrix, setRecherchePrix] = useState('');
  const [chargement, setChargement] = useState(true);
  // Dépôt choisi qui n'existe plus (supprimé, autre compte) : retour au principal
  useEffect(() => {
    if (!depotsCharges || chargement || depotActif === 'principal') return;
    const existe = depotActif === 'tous' ? optionsDepots.length > 1 : optionsDepots.some(o => o.cle === depotActif);
    if (!existe) setDepotActif('principal');
  }, [optionsDepots, depotsCharges, chargement]); // eslint-disable-line
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
  const [modalTransfert, setModalTransfert] = useState(false);

  // Zone qui défile et position gardée pendant un rechargement de la liste
  const zoneRef = useRef(null);
  const positionAvantRechargement = useRef(null);

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
      const avecPromos = promotionsDeLaBoutique(magRes.data, boutiqueRes.data);
      // Position notée juste avant la mise à jour, remise en place après (voir plus bas)
      if (zoneRef.current) positionAvantRechargement.current = zoneRef.current.scrollTop;
      setProduits(avecPromos);
      // Liste affichée recalculée par l'effet des filtres (sans passer par la liste complète)
      setProduitsBoutique(boutiqueRes.data);
      // Le modal "Détails" garde sa propre copie du produit — sans ça, annuler un
      // mouvement de stock rafraîchit bien la liste derrière, mais le modal continue
      // d'afficher l'ancien stock tant qu'il reste ouvert.
      setModalDetail(d => d ? (avecPromos.find(p => p.id === d.id) || d) : d);
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
  const categories = categoriesAvecSoldes([...new Set([
    ...produits.map(p => p.categorie),
    ...produitsBoutique.map(p => p.categorie),
  ].filter(Boolean))].sort(), produits);

  // Avant l'affichage (useLayoutEffect) : après un rechargement, la liste ne passe jamais par un
  // état intermédiaire (vide ou non filtrée) qui ferait sauter la page
  useLayoutEffect(() => {
    let res = produitsDepot;
    if (recherche) {
      const t = recherche.toLowerCase();
      res = res.filter(p =>
        p.nom?.toLowerCase().includes(t) ||
        p.categorie?.toLowerCase().includes(t)
      );
    }
    if (filtreCategorie) {
      res = res.filter(p => dansCategorie(p, filtreCategorie));
    }
    // Recherche par prix : on compare les chiffres saisis à ceux du prix de vente
    // (« 1500 » trouve 1 500, « 15 » trouve aussi 15 000, 1 500…), espaces/séparateurs ignorés.
    const chiffresPrix = recherchePrix.replace(/\D/g, '');
    if (chiffresPrix) {
      res = res.filter(p => String(Math.round(p.prixVente || 0)).includes(chiffresPrix));
    }
    if (filtreStock) {
      res = res.filter(p => passeFiltreStock(p, filtreStock));
    }
    setFiltres(res);
  }, [recherche, filtreCategorie, filtreStock, recherchePrix, produitsDepot]);

  // Après un rechargement (action sur un produit) : la liste revient exactement à la position
  // d'avant, avant même l'affichage — on reste au niveau du produit modifié
  useLayoutEffect(() => {
    if (positionAvantRechargement.current === null || !zoneRef.current) return;
    zoneRef.current.scrollTop = positionAvantRechargement.current;
    positionAvantRechargement.current = null;
  }, [filtres]);

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
                placeholder="Rechercher un produit..."
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
              onChange={setFiltreCategorie} placeholder="Catégories" styleOption={styleCategorie} iconeOption={iconeCategorie} />
          </div>

          {/* Stock */}
          <div className="col-6 col-md-2">
            <div className="input-group">
              <select className="form-select"
                value={filtreStock} onChange={(e) => setFiltreStock(e.target.value)}>
                <option value="">Tous stocks</option>
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

          {/* Recherche par prix */}
          <div className="col-12 col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-body-secondary border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" />
              </span>
              <input type="text" inputMode="numeric" className="form-control border-start-0"
                placeholder="Recherche par prix..."
                value={recherchePrix} onChange={(e) => setRecherchePrix(e.target.value)} />
              {recherchePrix && (
                <button type="button" className="btn btn-light border" onClick={() => setRecherchePrix('')}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
          </div>

          {/* Bouton reset */}
          {(recherche || filtreCategorie || filtreStock || recherchePrix) && (
            <div className="col-auto">
              <button className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                onClick={() => { setRecherche(''); setFiltreCategorie(''); setFiltreStock(''); setRecherchePrix(''); }}>
                <FontAwesomeIcon icon={faFilter} style={{ fontSize: 'var(--txt-sm)' }} /> Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Titre — toujours fixe ── */}
      <div style={{ flexShrink: 0 }}>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
        <div className="me-auto">
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Magasin</h4>
          <p className="text-muted small mb-0">
            {optionsDepots.length > 0 && <>{vueTous ? 'Tous les dépôts' : nomDepotCourant} · </>}
            {filtres.length === produitsDepot.length
              ? `${produitsDepot.length} produit(s)`
              : `${filtres.length} produit(s) sur ${produitsDepot.length}`}
          </p>
        </div>
        {/* Mobile : titre + bouton principal sur la même ligne, les autres boutons en dessous */}
        <div className="col-12 col-md-auto order-2 order-md-1 d-flex gap-2 flex-wrap justify-content-end">
          <button className="btn d-flex align-items-center gap-2"
            style={{ borderRadius: 10, background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)' }}
            onClick={() => setModalTransfert(true)}>
            <FontAwesomeIcon icon={faExchangeAlt} /> Transférer
          </button>
          <button className="btn d-flex align-items-center gap-2"
            style={{ borderRadius: 10, background: '#dbeafe', color: '#1d4ed8' }}
            onClick={() => setModalExistant(true)}>
            <FontAwesomeIcon icon={faClipboardList} /> Importer produit
          </button>
          <button className="btn d-flex align-items-center gap-2"
            style={{ borderRadius: 10, background: '#e0e7ff', color: '#3730a3' }}
            onClick={ouvrirInventaire}>
            <FontAwesomeIcon icon={faClipboardCheck} /> {inventaire ? 'Inventaire en cours' : 'Inventaire'}
          </button>
        </div>
        <button className="btn text-white d-flex align-items-center gap-2 order-1 order-md-2 flex-shrink-0" style={{ background: '#00d4aa', borderRadius: 10 }}
            onClick={() => { setProduitEdite(null); setModalProduit(true); }}>
            <FontAwesomeIcon icon={faPlus} /> Nouveau produit
          </button>
      </div>
      </div>{/* fin titre */}

      {/* Inventaire en cours : progression et accès au comptage */}
      {/* Plusieurs dépôts : choix du dépôt affiché */}
      {optionsDepots.length > 0 && (
        <SelecteurDepot options={optionsDepots} valeur={depotActif} onChoisir={setDepotActif}
          total={produits.length} peutAjouter={depotsAutorises} />
      )}
      {optionsDepots.length === 0 && depotsAutorises && (
        <SelecteurDepot options={[]} valeur="principal" onChoisir={() => {}} total={0} peutAjouter />
      )}
      {inventaire && !vueTous && <BandeauInventaire session={inventaire} produits={produitsDepot} lieu='magasin' depot={depotCourant} />}

      {/* ── Filtres — fixe desktop, dans le scroll mobile ── */}
      {!isMobile && (
        <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}

      {/* ── Zone scrollable : grille + pagination ── */}
      {/* overflowAnchor 'none' : après une action, la vue reste où elle était. Sans ça, Chrome
          « suit » la carte du produit modifié — jusqu'en bas s'il passe en rupture (rangé en fin de liste). */}
      <div ref={zoneRef} style={{ flex:1, overflowY:'auto', overflowX:'hidden', minHeight:0, paddingTop:'0.5rem', overflowAnchor:'none' }}>
      {isMobile && (
        <div style={{ marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}
      {/* Grille produits */}
      {chargement ? (
        <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} /></div>
      ) : vueTous ? (
        <>
          <div className="d-flex justify-content-end mb-2">
            <button type="button" className="btn btn-sm btn-light" onClick={imprimerStockDepots}>
              Imprimer le stock par dépôt
            </button>
          </div>
          <VueTousDepots produits={filtres} colonnes={optionsDepots} onChoisirDepot={setDepotActif} />
        </>
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
                  // Inventaire en cours : produits pas encore comptés estompés
                  ...styleCarteInventaire(inventaire, produit),
                }}>
                  {/* Image produit + grip + pin */}
                  <div className="position-relative">
                    <BadgeInventaire session={inventaire} produit={produit} />
                  {produit.image ? (
                    <img draggable="false" src={produit.image} alt={produit.nom} className="card-img-top object-fit-cover"
                      style={{ aspectRatio: '3 / 2', height: 'auto', borderRadius: '14px 14px 0 0' }} />
                  ) : (
                    <img draggable="false" src={defaultProduit} alt={produit.nom} className="card-img-top object-fit-cover"
                      style={{ aspectRatio: '3 / 2', height: 'auto', borderRadius: '14px 14px 0 0' }} />
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
                    {/* Nom et stock — empilés (pas côte à côte) pour que la quantité ne soit
                        jamais coupée, quelle que soit sa longueur (ex: "1 ballo 55 dz") */}
                    <div className="mb-2">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
                      {/* Stock à gauche, badge « Soldes » à droite (passe à la ligne, toujours à droite, si la quantité est longue) */}
                      <div className="d-flex flex-wrap align-items-center column-gap-2">
                        <span className={`badge ${classeBadgeStock(statut)} mt-1`} style={{ fontSize: 'var(--txt-sm)' }}>
                          {afficherStockDetails(produit)}
                        </span>
                        {/* Nouveau, Vente Flash, Soldes */}
                        <div className="d-flex flex-wrap justify-content-end gap-1 mt-1 ms-auto">
                          <BadgesProduit produit={produit} gestion />
                        </div>
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="d-flex flex-column gap-1 mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Prix </span>
                        <span className="text-end">
                          {prixBarre(produit) > 0 && (
                            <s className="text-muted small me-2">{formatMontant(prixBarre(produit))}</s>
                          )}
                          <span className="fw-bold" style={{ color: '#00a881' }}>{formatMontant(produit.prixVente)}</span>
                        </span>
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

                    <div className="mt-auto">
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
      {modalInventaire && (
        <ModalLancerInventaire lieuInitial='magasin' depotInitial={depotCourant} magasinExclu={moduleExclu(acces, 'magasin')}
          onFermer={() => setModalInventaire(false)} />
      )}
      {modalProduit && (
        <ModalProduit
          produit={produitEdite}
          api={apiDepot}
          sansPromotions
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
          onVendre={(p) => { setModalDetail(null); setModalStock({ produit: p, type: 'REDUCTION' }); }}
          libelleVendre="Transférer"
          iconeVendre={faExchangeAlt}
          onAjuster={(p) => { setModalDetail(null); setModalStock({ produit: p, type: 'AJUSTEMENT' }); }}
          onTransfererDepot={destinationsDepots.length > 0 ? (p) => { setModalDetail(null); setTransfertDepot(p); } : undefined}
        />
      )}
      {transfertDepot && (
        <ModalTransfertDepot
          produit={transfertDepot}
          depotSourceNom={optionsDepots.find(o => o.cle === (transfertDepot.depotId || 'principal'))?.nom || nomPrincipal}
          destinations={destinationsDepots.filter(d => d.cle !== (transfertDepot.depotId || 'principal'))}
          onFermer={() => setTransfertDepot(null)}
          onSucces={() => { setTransfertDepot(null); chargerProduits(); }}
        />
      )}
      {modalExistant && (
        <ModalProduitExistant
          produits={produitsBoutique}
          produitsActuels={produitsDepot}
          api={apiDepot}
          onFermer={() => setModalExistant(false)}
          onSucces={() => { setModalExistant(false); chargerProduits(); }}
        />
      )}
      {modalTransfert && (
        <ModalTransfertGroupe
          produits={produitsDepot}
          produitsBoutique={produitsBoutique}
          destinationsDepots={destinationsDepots}
          onFermer={() => setModalTransfert(false)}
          onSucces={() => {
            setModalTransfert(false);
            chargerProduits();
          }}
        />
      )}
    </div>
  );
};

export default Magasin;
