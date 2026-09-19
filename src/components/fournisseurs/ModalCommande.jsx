// Modal nouvelle commande — le fournisseur est déjà connu (contexte de la page)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faTimes, faSearch, faBoxOpen, faPlus, faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { fournisseursAPI, produitsAPI, magasinAPI, estMisEnAttente } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import FormNouveauProduit from '@/components/produits/FormNouveauProduit';
import { psParUnite, calculerStockEnPieces, decomposerStock, sousUnites } from '@/services/unites';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

// Les prix (brut, transport, vente) sont toujours enregistrés par pièce — reconstitue le
// montant dans l'unité où il avait été saisi (ex: par ballo) pour l'afficher tel quel à la
// réouverture, plutôt que la valeur par pièce mal étiquetée avec l'unité commandée.
const reconstituerPrixUnite = (valeurParPiece, unite, objetRatio) => {
  if (valeurParPiece === undefined || valeurParPiece === null || valeurParPiece === '') return '';
  return +(valeurParPiece * psParUnite(unite, objetRatio)).toFixed(4);
};

const ModalCommande = ({ commande = null, fournisseur, onFermer, onSucces }) => {
  const { formatMontant } = useParametres();
  // Pour une nouvelle commande, on demande d'abord "existant ou nouveau" avant d'afficher
  // le formulaire correspondant — évite d'afficher les deux à la fois, source de confusion.
  const [etape, setEtape]           = useState(commande ? 'formulaire' : 'choix');
  const [type, setType]             = useState(!commande || commande.produitId ? 'existant' : 'nouveau');
  const [produits, setProduits]     = useState([]);
  // Deux recherches séparées — boutique et magasin — pour ne pas mélanger les deux stocks
  const [rechercheBoutique, setRechercheBoutique] = useState('');
  const [rechercheMagasin, setRechercheMagasin]   = useState('');
  const [dropOpenBoutique, setDropOpenBoutique]   = useState(false);
  const [dropOpenMagasin, setDropOpenMagasin]     = useState(false);
  const [produitLie, setProduitLie] = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(commande?.imageUrl || null);
  const [imageGalerie, setImageGalerie] = useState(null); // { url, publicId } si choisie depuis la galerie
  const [envoi, setEnvoi]           = useState(false);
  const refBoutique = useRef(null);
  const refMagasin  = useRef(null);

  const uniteInit = commande?.unite || 'ps';
  // L'unité du prix (brut/transport, et prix de vente pour un nouveau produit) est un choix
  // indépendant de l'unité commandée — ex: on commande par ballo mais le fournisseur chiffre
  // à la pièce. On la mémorise donc séparément (prixAchatUnite/prixVenteUnite) plutôt que de
  // réutiliser l'unité commandée, sinon un prix saisi dans une autre unité se retrouve mal
  // étiqueté (donc un montant qui semble "changé") à la réouverture de la commande.
  const prixAchatUniteInit = commande?.prixAchatUnite || uniteInit;
  const prixVenteUniteInit = commande?.prixVenteUnite || uniteInit;
  const [form, setForm] = useState({
    quantiteCommandee: commande?.quantiteCommandee || '',
    prixUnitaire:      commande?.prixUnitaire      || '',
    // Le prix d'achat unitaire est calculé (brut + transport) — voir prixAchatBrut/prixTransport
    // ci-dessous. Séparés pour éviter de recalculer le brut à chaque nouvelle commande.
    // Commandes créées avant l'ajout de ce détail : tout l'ancien prix est repris comme "brut".
    // Les deux sont enregistrés par pièce — reconstitués ici dans l'unité mémorisée (prixAchatUniteInit).
    prixAchatBrut:     commande
      ? reconstituerPrixUnite(commande.prixAchatBrut ?? commande.prixUnitaire, prixAchatUniteInit, commande)
      : '',
    prixTransport:     commande ? reconstituerPrixUnite(commande.prixTransport, prixAchatUniteInit, commande) : '',
    prixUnite:         prixAchatUniteInit,
    unite:             UNITES_STD.includes(uniteInit) ? uniteInit : '__custom__',
    uniteCustom:       UNITES_STD.includes(uniteInit) ? '' : uniteInit,
  });

  const [formProduit, setFormProduit] = useState({
    nom:             commande?.produitNom  || '',
    description:     commande?.description || '',
    // Enregistré par pièce — reconstitué dans l'unité mémorisée (prixVenteUniteInit).
    prixVente:       commande ? reconstituerPrixUnite(commande.prixVente, prixVenteUniteInit, commande) : '',
    prixAchat:       '',
    prixUnite:       prixVenteUniteInit,
    categorie:       commande?.categorie   || '',
    unitePrincipale: UNITES_STD.includes(uniteInit) ? uniteInit : '__custom__',
    uniteCustom:     UNITES_STD.includes(uniteInit) ? '' : uniteInit,
    dzParBallo:      commande?.dzParBallo  || '',
    psParCrt:        commande?.psParCrt    || '',
    psParSac:        commande?.psParSac    || '',
    // Modification d'une commande "nouveau produit" déjà saisie — on redécompose la quantité
    // commandée en niveaux (ballo/dz/ps...) pour pré-remplir le formulaire.
    ...(commande && !commande.produitId
      ? (() => {
          const ratioCmd = psParUnite(uniteInit, commande);
          const { n1, n2, n3 } = decomposerStock(uniteInit, commande, (commande.quantiteCommandee || 0) * ratioCmd);
          return { stockNiveau1: n1 || '', stockNiveau2: n2 || '', stockNiveau3: n3 || '' };
        })()
      : { stockNiveau1: '', stockNiveau2: '', stockNiveau3: '' }),
  });

  useEffect(() => {
    Promise.all([produitsAPI.getAll(), magasinAPI.getAll()])
      .then(([b, m]) => setProduits([
        ...b.data.map(p => ({ ...p, source: 'boutique' })),
        ...m.data.map(p => ({ ...p, source: 'magasin'  })),
      ]))
      .catch(() => {});
  }, []);

  // Modification d'une commande déjà liée à un produit — retrouver ce produit dans la liste
  // chargée ci-dessus pour préremplir la sélection (sinon les barres de recherche vides
  // réapparaissent et le calcul de conversion du prix retombe sur un ratio par défaut).
  useEffect(() => {
    if (!commande?.produitId || produitLie) return;
    const p = produits.find(x => x.id === commande.produitId && x.source === commande.produitSource);
    if (p) {
      setProduitLie(p);
      setFormProduit(f => ({ ...f, dzParBallo: p.dzParBallo || '', psParCrt: p.psParCrt || '', psParSac: p.psParSac || '' }));
    }
  }, [produits, commande]); // eslint-disable-line

  useEffect(() => {
    const h = (e) => {
      if (refBoutique.current && !refBoutique.current.contains(e.target)) setDropOpenBoutique(false);
      if (refMagasin.current  && !refMagasin.current.contains(e.target))  setDropOpenMagasin(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtrerProduits = (liste, recherche) => {
    if (!recherche.trim()) return liste.slice(0, 15);
    const t = recherche.toLowerCase();
    return liste.filter(p => p.nom?.toLowerCase().includes(t) || p.categorie?.toLowerCase().includes(t)).slice(0, 15);
  };
  const produitsBoutique = useMemo(() => produits.filter(p => p.source === 'boutique'), [produits]);
  const produitsMagasin  = useMemo(() => produits.filter(p => p.source === 'magasin'),  [produits]);
  const produitsBoutiqueFiltres = useMemo(() => filtrerProduits(produitsBoutique, rechercheBoutique), [produitsBoutique, rechercheBoutique]);
  const produitsMagasinFiltres  = useMemo(() => filtrerProduits(produitsMagasin, rechercheMagasin),   [produitsMagasin, rechercheMagasin]);

  const selectionnerProduit = (p) => {
    const u = p.unitePrincipale || p.unite || 'ps';
    setProduitLie(p);
    setForm(f => ({
      ...f,
      unite:      UNITES_STD.includes(u) ? u : '__custom__',
      uniteCustom: UNITES_STD.includes(u) ? '' : u,
      prixUnite:  u,
    }));
    // Le ratio de conversion (dz/ballo, ps/crt, ps/sac) appartient au produit — on le
    // recopie sur la commande pour que son "Total estimé" reste juste même affiché seul,
    // sans avoir à retrouver le produit lié à chaque fois.
    setFormProduit(f => ({
      ...f,
      dzParBallo: p.dzParBallo || '',
      psParCrt:   p.psParCrt   || '',
      psParSac:   p.psParSac   || '',
    }));
    setDropOpenBoutique(false);
    setDropOpenMagasin(false);
  };

  // Unité réellement commandée (selon le type) — sert de référence par défaut pour le prix
  const uniteCommandeeActuelle = type === 'nouveau'
    ? (formProduit.unitePrincipale === '__custom__' ? (formProduit.uniteCustom || 'ps') : formProduit.unitePrincipale)
    : (form.unite === '__custom__' ? (form.uniteCustom || 'ps') : form.unite);
  // Ratios de conversion à utiliser pour le prix : ceux du produit lié (existant) ou
  // ceux en cours de saisie (nouveau produit)
  const objetRatioPrix = type === 'nouveau' ? formProduit : (produitLie || {});
  const prixUniteActuel = form.prixUnite || uniteCommandeeActuelle;
  // L'unité de prix est un choix indépendant de l'unité commandée — on garde toujours
  // l'option actuellement choisie dans la liste, même si elle change entre-temps.
  const unitesPrixCommande = [...new Set([...sousUnites(uniteCommandeeActuelle), prixUniteActuel])];

  // Changer l'unité du prix reconvertit les montants déjà saisis pour garder la même
  // valeur réelle (ex: 9000/ballo devient 62,5/ps si on bascule sur "ps").
  const changerUniteDuPrix = (nouvelleUnite) => {
    const ancienRatio  = psParUnite(prixUniteActuel, objetRatioPrix);
    const nouveauRatio = psParUnite(nouvelleUnite, objetRatioPrix);
    setForm(f => ({
      ...f,
      prixUnite: nouvelleUnite,
      prixAchatBrut: f.prixAchatBrut !== '' ? +(parseFloat(f.prixAchatBrut) / ancienRatio * nouveauRatio).toFixed(2) : f.prixAchatBrut,
      prixTransport: f.prixTransport !== '' ? +(parseFloat(f.prixTransport) / ancienRatio * nouveauRatio).toFixed(2) : f.prixTransport,
    }));
  };

  // Prix d'achat unitaire — toujours par PIÈCE (comme prixVente/prixAchat des produits) —
  // brut + transport reconvertis depuis l'unité de saisie du prix (prixUnite) vers la pièce.
  // Un ballo contient plusieurs pièces : on multiplie donc par le ratio, jamais directement
  // par le nombre de ballo commandés (voir aussi "Total estimé" dans ModalDetailCommande).
  useEffect(() => {
    const ratioSaisi = psParUnite(prixUniteActuel, objetRatioPrix);
    const total = ((parseFloat(form.prixAchatBrut) || 0) + (parseFloat(form.prixTransport) || 0)) / ratioSaisi;
    setForm(f => ({ ...f, prixUnitaire: total }));
  }, [form.prixAchatBrut, form.prixTransport, prixUniteActuel]); // eslint-disable-line

  const resetType = (t) => {
    setType(t);
    setProduitLie(null);
    setRechercheBoutique('');
    setRechercheMagasin('');
    setFormProduit(f => ({ ...f, nom: '', unitePrincipale: 'ps', uniteCustom: '', prixUnite: 'ps' }));
    setForm(f => ({ ...f, prixUnite: 'ps' }));
  };

  const choisirType = (t) => {
    resetType(t);
    setEtape('formulaire');
  };

  const soumettre = async (e) => {
    e.preventDefault();
    const produitNomFinal = type === 'nouveau'
      ? formProduit.nom
      : (produitLie?.nom || commande?.produitNom || '');
    if (!produitNomFinal) { toast.error('Nom du produit requis'); return; }
    if (!form.prixAchatBrut || parseFloat(form.prixAchatBrut) <= 0) { toast.error('Le prix d\'achat brut est obligatoire'); return; }

    const uniteFinale = type === 'nouveau'
      ? (formProduit.unitePrincipale === '__custom__' ? (formProduit.uniteCustom || 'ps') : formProduit.unitePrincipale)
      : (form.unite === '__custom__' ? (form.uniteCustom || 'ps') : form.unite);

    // Pour un nouveau produit, la quantité commandée est saisie comme le stock initial
    // (niveaux par unité, ex: ballo + dz + ps) — convertie ici en nombre d'unités principales.
    const quantiteCommandeeFinale = type === 'nouveau'
      ? calculerStockEnPieces(uniteFinale, formProduit, formProduit.stockNiveau1, formProduit.stockNiveau2, formProduit.stockNiveau3) / psParUnite(uniteFinale, formProduit)
      : parseFloat(form.quantiteCommandee) || 0;
    if (!quantiteCommandeeFinale || quantiteCommandeeFinale <= 0) { toast.error('Quantité invalide'); return; }

    // Le prix de vente est saisi dans l'unité choisie (ex: par ballo) — converti ici
    // en prix par pièce, seule unité comprise par le reste du système. On mémorise aussi
    // cette unité (prixVenteUnite) pour pouvoir réafficher le bon montant à la réouverture.
    const prixVenteUniteFinale = formProduit.prixUnite || uniteFinale;
    const ratioPrixVente = type === 'nouveau' ? psParUnite(prixVenteUniteFinale, formProduit) : 1;
    const prixVenteParPs = (parseFloat(formProduit.prixVente) || 0) / ratioPrixVente;

    // Le prix d'achat (brut + transport) est saisi dans l'unité choisie (prixUnite) —
    // converti ici en prix par pièce, comme le reste du système (voir CUMP).
    const ratioPrixAchatSaisi = psParUnite(prixUniteActuel, objetRatioPrix);
    const facteurPrixAchat = 1 / ratioPrixAchatSaisi;
    const prixAchatBrutFinal = (parseFloat(form.prixAchatBrut) || 0) * facteurPrixAchat;
    const prixTransportFinal = (parseFloat(form.prixTransport) || 0) * facteurPrixAchat;

    setEnvoi(true);
    try {
      let payload;
      if (imageFile) {
        const fd = new FormData();
        fd.append('fournisseurId',     fournisseur.id);
        fd.append('produitNom',        produitNomFinal);
        fd.append('quantiteCommandee', quantiteCommandeeFinale);
        fd.append('unite',             uniteFinale);
        fd.append('prixAchatBrut',     prixAchatBrutFinal);
        fd.append('prixTransport',     prixTransportFinal);
        fd.append('prixAchatUnite',    prixUniteActuel);
        fd.append('description',       formProduit.description);
        fd.append('categorie',         formProduit.categorie);
        fd.append('prixVente',         prixVenteParPs);
        fd.append('prixVenteUnite',    prixVenteUniteFinale);
        if (formProduit.dzParBallo) fd.append('dzParBallo', formProduit.dzParBallo);
        if (formProduit.psParCrt)   fd.append('psParCrt',   formProduit.psParCrt);
        if (formProduit.psParSac)   fd.append('psParSac',   formProduit.psParSac);
        if (type === 'existant' && produitLie) {
          fd.append('produitId', produitLie.id);
          fd.append('produitSource', produitLie.source);
        } else if (commande?.produitId) {
          fd.append('produitId', commande.produitId);
        }
        fd.append('image', imageFile);
        payload = fd;
      } else {
        payload = {
          fournisseurId:     fournisseur.id,
          produitNom:        produitNomFinal,
          quantiteCommandee: quantiteCommandeeFinale,
          unite:             uniteFinale,
          prixAchatBrut:     prixAchatBrutFinal,
          prixTransport:     prixTransportFinal,
          prixAchatUnite:    prixUniteActuel,
          description:       formProduit.description,
          categorie:         formProduit.categorie,
          prixVente:         prixVenteParPs,
          prixVenteUnite:    prixVenteUniteFinale,
          dzParBallo:        formProduit.dzParBallo || undefined,
          psParCrt:          formProduit.psParCrt   || undefined,
          psParSac:          formProduit.psParSac   || undefined,
          produitId:     type === 'existant' && produitLie ? produitLie.id     : (commande?.produitId     || null),
          produitSource: type === 'existant' && produitLie ? produitLie.source : (commande?.produitSource || null),
          ...(imageGalerie && { imageUrl: imageGalerie.url, imagePublicId: imageGalerie.publicId }),
        };
      }
      const reponse = commande
        ? await fournisseursAPI.update(commande.id, payload)
        : await fournisseursAPI.create(payload);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success(commande ? 'Commande modifiée' : 'Commande créée');
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setEnvoi(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0 flex-grow-1 min-w-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faTruck} className="me-2" style={{ color: '#00d4aa' }} />
              {etape === 'choix'
                ? `Nouvelle commande — ${fournisseur.nom}`
                : commande ? 'Modifier la commande' : (type === 'existant' ? 'Commande — produit existant' : 'Commande — nouveau produit')}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-4 flex-shrink-0" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {etape === 'choix' ? (
            <div className="modal-body px-4 py-5">
              <p className="text-muted text-center mb-4">
                Cette commande concerne-t-elle un produit déjà enregistré, ou un tout nouveau produit ?
              </p>
              <div className="row g-3">
                <div className="col-6">
                  <button type="button"
                    className="btn w-100 d-flex flex-column align-items-center gap-2 py-4"
                    style={{ background: 'var(--bs-secondary-bg)', borderRadius: 14 }}
                    onClick={() => choisirType('existant')}>
                    <FontAwesomeIcon icon={faBoxOpen} size="2x" style={{ color: '#203a43' }} />
                    <span className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>Produit existant</span>
                    <span className="text-muted text-center" style={{ fontSize: 'var(--txt-sm)' }}>
                      Déjà dans la boutique ou le magasin
                    </span>
                  </button>
                </div>
                <div className="col-6">
                  <button type="button"
                    className="btn w-100 d-flex flex-column align-items-center gap-2 py-4"
                    style={{ background: 'rgba(59,130,246,0.1)', borderRadius: 14 }}
                    onClick={() => choisirType('nouveau')}>
                    <FontAwesomeIcon icon={faPlus} size="2x" style={{ color: '#3b82f6' }} />
                    <span className="fw-semibold" style={{ color: '#3b82f6' }}>Nouveau produit</span>
                    <span className="text-muted text-center" style={{ fontSize: 'var(--txt-sm)' }}>
                      Jamais commandé ni enregistré avant
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
          <>
          <div className="modal-body px-4">
            <form onSubmit={soumettre} id="form-commande">

              {!commande && (
                <button type="button" className="btn btn-sm btn-light d-flex align-items-center gap-1 mb-3"
                  onClick={() => setEtape('choix')}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 'var(--txt-sm)' }} />
                  Changer le type de produit
                </button>
              )}

              {/* Fournisseur — déjà connu (contexte de la page), affiché en lecture seule */}
              <div className="mb-3 p-2 rounded-2 d-flex align-items-center gap-2"
                style={{ background: 'var(--bs-secondary-bg)' }}>
                <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', color: '#00a881', fontWeight: 700, fontSize: 'var(--txt-base)' }}>
                  {fournisseur.nom?.[0]?.toUpperCase()}
                </div>
                <span className="small text-muted">Fournisseur : <strong style={{ color: 'var(--bs-body-color)' }}>{fournisseur.nom}</strong></span>
              </div>

              {/* Produit existant — recherche séparée boutique / magasin */}
              {type === 'existant' && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Sélectionner un produit *</label>
                  <div>
                    {!produitLie && (
                      <div className="row g-2">
                        <div className="col-6" ref={refBoutique}>
                          <div className="input-group mb-1">
                            <span className="input-group-text bg-body-secondary border-end-0">
                              <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                            </span>
                            <input className="form-control border-start-0"
                              placeholder="Boutique..."
                              value={rechercheBoutique}
                              onChange={e => { setRechercheBoutique(e.target.value); setDropOpenBoutique(true); }}
                              onFocus={() => setDropOpenBoutique(true)} />
                          </div>
                          {dropOpenBoutique && produitsBoutiqueFiltres.length > 0 && (
                            <div className="rounded-2 border mb-2"
                              style={{ maxHeight: 220, overflowY: 'auto', background: 'var(--bs-body-bg)' }}>
                              {produitsBoutiqueFiltres.map(p => (
                                <div key={p.id} className="d-flex align-items-center gap-2 px-2 py-2"
                                  style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-sm)' }}
                                  onMouseDown={() => selectionnerProduit(p)}>
                                  {p.image
                                    ? <img src={p.image} alt="" className="rounded flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                    : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: 32, height: 32, background: 'var(--bs-secondary-bg)' }}>
                                        <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 12 }} />
                                      </div>}
                                  <div className="flex-grow-1 min-w-0">
                                    <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                                    <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>
                                      {p.categorie} · {p.unitePrincipale || p.unite || 'ps'}
                                    </div>
                                  </div>
                                  {p.prixVente > 0 && (
                                    <span className="flex-shrink-0" style={{ fontSize: 'var(--txt-xs)', fontWeight: 600, color: '#00a881', whiteSpace: 'nowrap' }}>
                                      {formatMontant(p.prixVente)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="col-6" ref={refMagasin}>
                          <div className="input-group mb-1">
                            <span className="input-group-text bg-body-secondary border-end-0">
                              <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                            </span>
                            <input className="form-control border-start-0"
                              placeholder="Magasin..."
                              value={rechercheMagasin}
                              onChange={e => { setRechercheMagasin(e.target.value); setDropOpenMagasin(true); }}
                              onFocus={() => setDropOpenMagasin(true)} />
                          </div>
                          {dropOpenMagasin && produitsMagasinFiltres.length > 0 && (
                            <div className="rounded-2 border mb-2"
                              style={{ maxHeight: 220, overflowY: 'auto', background: 'var(--bs-body-bg)' }}>
                              {produitsMagasinFiltres.map(p => (
                                <div key={p.id} className="d-flex align-items-center gap-2 px-2 py-2"
                                  style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-sm)' }}
                                  onMouseDown={() => selectionnerProduit(p)}>
                                  {p.image
                                    ? <img src={p.image} alt="" className="rounded flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                    : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: 32, height: 32, background: 'var(--bs-secondary-bg)' }}>
                                        <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 12 }} />
                                      </div>}
                                  <div className="flex-grow-1 min-w-0">
                                    <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                                    <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>
                                      {p.categorie} · {p.unitePrincipale || p.unite || 'ps'}
                                    </div>
                                  </div>
                                  {p.prixVente > 0 && (
                                    <span className="flex-shrink-0" style={{ fontSize: 'var(--txt-xs)', fontWeight: 600, color: '#00a881', whiteSpace: 'nowrap' }}>
                                      {formatMontant(p.prixVente)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {produitLie && (
                      <div className="p-2 rounded-2 d-flex align-items-center gap-3"
                        style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid #00d4aa' }}>
                        {produitLie.image
                          ? <img src={produitLie.image} alt="" className="rounded flex-shrink-0"
                              style={{ width: 44, height: 44, objectFit: 'contain', background: '#f8fafc' }} />
                          : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 44, height: 44, background: '#e8f5f3' }}>
                              <FontAwesomeIcon icon={faBoxOpen} style={{ color: '#00a881' }} />
                            </div>}
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-semibold text-truncate" style={{ color: '#00a881', fontSize: 'var(--txt-lg)' }}>{produitLie.nom}</div>
                          <div className="d-flex gap-2 align-items-center flex-wrap mt-1">
                            <span className="badge"
                              style={{ background: produitLie.source === 'magasin' ? '#dbeafe' : '#dcfce7', color: produitLie.source === 'magasin' ? '#1e40af' : '#166534', fontSize: 'var(--txt-xs)' }}>
                              {produitLie.source}
                            </span>
                            {produitLie.prixVente > 0 && (
                              <span className="small text-muted">Prix vente : {formatMontant(produitLie.prixVente)}</span>
                            )}
                          </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-light flex-shrink-0"
                          onClick={() => { setProduitLie(null); setRechercheBoutique(''); setRechercheMagasin(''); }}>
                          <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nouveau produit — même formulaire que boutique/magasin. Le stock initial
                  devient ici la quantité commandée (même principe de saisie par unité). */}
              {type === 'nouveau' && (
                <FormNouveauProduit
                  form={formProduit} setForm={setFormProduit}
                  image={imageFile} setImage={setImageFile}
                  apercu={imagePreview} setApercu={setImagePreview}
                  imageGalerie={imageGalerie} setImageGalerie={setImageGalerie}
                  avecPrixAchat={false}
                  avecStockInitial={true}
                  labelQuantite="Quantité commandée *"
                />
              )}

              {/* Quantité + unité commandées — pour un produit déjà existant (pour un nouveau
                  produit, elles sont saisies ci-dessus dans FormNouveauProduit). L'unité est
                  restreinte à celles compatibles avec le produit lié — ses ratios de conversion
                  (dz/ballo, ps/crt...) sont déjà fixés à sa création, on ne peut pas en inventer
                  une nouvelle ici sans fausser le calcul du stock à la livraison. */}
              {type === 'existant' && (
                <div className="row g-2 mb-3">
                  <div className="col-7">
                    <label className="form-label small fw-semibold text-muted">Quantité commandée *</label>
                    <input type="number" min="1" className="form-control" required
                      value={form.quantiteCommandee}
                      onChange={e => setForm(f => ({ ...f, quantiteCommandee: e.target.value }))} />
                  </div>
                  <div className="col-5">
                    <label className="form-label small fw-semibold text-muted">Unité commandée *</label>
                    <select className="form-select" value={form.unite}
                      onChange={e => setForm(f => ({ ...f, unite: e.target.value, uniteCustom: '' }))}>
                      {(produitLie ? sousUnites(produitLie.unitePrincipale || produitLie.unite || 'ps') : UNITES_STD)
                        .map(u => <option key={u} value={u}>{u}</option>)}
                      {!produitLie && <option value="__custom__">— Autre (saisir) —</option>}
                    </select>
                    {!produitLie && form.unite === '__custom__' && (
                      <input className="form-control mt-2" placeholder="Ex: rouleau, boîte..."
                        value={form.uniteCustom}
                        onChange={e => setForm(f => ({ ...f, uniteCustom: e.target.value }))} />
                    )}
                  </div>
                </div>
              )}

              {/* Prix d'achat — calculé automatiquement à partir du brut + transport ci-dessous */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Prix d'achat unitaire *</label>
                <div className="input-group">
                  <input type="number" className="form-control" readOnly disabled
                    style={{ background: 'var(--bs-secondary-bg)', fontWeight: 600 }}
                    value={Math.round((form.prixUnitaire || 0) * 100) / 100} />
                  <span className="input-group-text">FCFA / ps</span>
                </div>
                <div className="text-muted mt-1" style={{ fontSize: 'var(--txt-xs)' }}>
                  Calculé automatiquement : (brut + transport) par {prixUniteActuel}, converti en prix par pièce
                </div>
              </div>

              <div className="row g-2 mb-1">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Prix d'achat brut *</label>
                  <div className="input-group">
                    <input type="number" min="0" required className="form-control" placeholder="0"
                      value={form.prixAchatBrut}
                      onChange={e => setForm(f => ({ ...f, prixAchatBrut: e.target.value }))} />
                    <span className="input-group-text bg-body-secondary px-2" style={{ fontSize: 12 }}>par</span>
                    {unitesPrixCommande.length > 1 ? (
                      <select className="form-select" style={{ maxWidth: 80 }}
                        value={prixUniteActuel} onChange={e => changerUniteDuPrix(e.target.value)}>
                        {unitesPrixCommande.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    ) : (
                      <span className="input-group-text bg-body-secondary">{unitesPrixCommande[0]}</span>
                    )}
                  </div>
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Prix de transport</label>
                  <div className="input-group">
                    <input type="number" min="0" className="form-control" placeholder="0"
                      value={form.prixTransport}
                      onChange={e => setForm(f => ({ ...f, prixTransport: e.target.value }))} />
                    <span className="input-group-text bg-body-secondary">par {prixUniteActuel}</span>
                  </div>
                </div>
              </div>

            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button type="submit" form="form-commande" className="btn text-white"
              style={{ background: '#00d4aa', borderRadius: 10, minWidth: 140 }} disabled={envoi}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : (commande ? 'Enregistrer' : 'Créer la commande')}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalCommande;
