// Page Fournisseurs — commandes et suivi des livraisons
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck, faPlus, faTrash, faEdit, faSpinner, faSearch, faTimes,
  faBoxOpen, faCheck, faLink, faChevronDown, faChevronUp,
  faUsers, faPhone,
} from '@fortawesome/free-solid-svg-icons';
import {
  fournisseursAPI, fournisseursContactsAPI,
  produitsAPI, magasinAPI, typesProduitAPI, invalidateCache, estMisEnAttente,
} from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalConfirmation from '@/components/shared/ModalConfirmation';
import FormNouveauProduit from '@/components/produits/FormNouveauProduit';

const PAR_PAGE = 10;
const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

const STATUTS = {
  EN_ATTENTE: { label: 'En attente',   bg: '#fff3cd', color: '#856404' },
  EN_COURS:   { label: 'En cours',     bg: '#e0f2fe', color: '#0369a1' },
  LIVREE:     { label: 'Tout livré ✓', bg: '#d1e7dd', color: '#0f5132' },
};

// ── Formulaire fournisseur contact ────────────────────────────────────────────
const ModalFournisseurForm = ({ contact = null, onFermer, onSucces }) => {
  const [typesProduits, setTypesProduits] = useState([]);
  const [ajoutEnCours, setAjoutEnCours]   = useState(false);
  const [nouveauType, setNouveauType]     = useState('');
  const [ajoutCharg, setAjoutCharg]       = useState(false);
  const [envoi, setEnvoi]                 = useState(false);
  const inputTypeRef = useRef(null);
  const [form, setForm] = useState({
    nom:               contact?.nom               || '',
    telephone:         contact?.telephone          || '',
    telephoneWhatsapp: contact?.telephoneWhatsapp  || '',
    ville:             contact?.ville              || '',
    typesProduits:     contact?.typesProduits      || [],
  });

  useEffect(() => {
    typesProduitAPI.getAll()
      .then(({ data }) => setTypesProduits(data.map(t => t.nom)))
      .catch(() => {});
  }, []);

  useEffect(() => { if (ajoutEnCours) inputTypeRef.current?.focus(); }, [ajoutEnCours]);

  const toggleType = (t) => setForm(f => ({
    ...f,
    typesProduits: f.typesProduits.includes(t)
      ? f.typesProduits.filter(x => x !== t)
      : [...f.typesProduits, t],
  }));

  const confirmerNouveauType = async () => {
    const nom = nouveauType.trim();
    if (!nom) return;
    if (typesProduits.map(t => t.toLowerCase()).includes(nom.toLowerCase())) {
      toast.warning('Ce type existe déjà'); return;
    }
    setAjoutCharg(true);
    try {
      const reponse = await typesProduitAPI.ajouter(nom);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setTypesProduits(prev => [...prev, nom].sort((a, b) => a.localeCompare(b, 'fr')));
      setForm(f => ({ ...f, typesProduits: [...f.typesProduits, nom] }));
      setNouveauType(''); setAjoutEnCours(false);
    } catch { toast.error("Erreur lors de l'ajout"); }
    finally { setAjoutCharg(false); }
  };

  const soumettre = async (e) => {
    e.preventDefault();
    if (!form.nom) { toast.error('Le nom est requis'); return; }
    setEnvoi(true);
    try {
      const data = { ...form, typesProduits: JSON.stringify(form.typesProduits) };
      const reponse = contact
        ? await fournisseursContactsAPI.update(contact.id, data)
        : await fournisseursContactsAPI.create(data);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success(contact ? 'Fournisseur modifié' : 'Fournisseur ajouté');
      onSucces();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setEnvoi(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              {contact ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={soumettre} id="form-fournisseur">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Nom complet *</label>
                <input className="form-control" required value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Téléphone</label>
                  <input className="form-control" type="tel" value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">WhatsApp (optionnel)</label>
                  <input className="form-control" type="tel" value={form.telephoneWhatsapp}
                    onChange={e => setForm(f => ({ ...f, telephoneWhatsapp: e.target.value }))} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Ville</label>
                <input className="form-control" value={form.ville}
                  onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} />
              </div>
              <div className="mb-1">
                <label className="form-label small fw-semibold text-muted">Types de produits</label>
                <div className="d-flex flex-wrap gap-2 mb-2"
                  style={typesProduits.length > 20 ? { maxHeight: 110, overflowY: 'auto', padding: '4px 2px' } : {}}>
                  {typesProduits.map(t => (
                    <button key={t} type="button" className="btn btn-sm"
                      style={{ borderRadius: 20, fontSize: 'var(--txt-base)', background: form.typesProduits.includes(t) ? '#00d4aa' : '#f0f4f8', color: form.typesProduits.includes(t) ? '#fff' : '#203a43' }}
                      onClick={() => toggleType(t)}>{t}</button>
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
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button type="submit" form="form-fournisseur" className="btn text-white"
              style={{ background: '#00d4aa', borderRadius: 10 }} disabled={envoi}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : (contact ? 'Enregistrer' : 'Ajouter')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Modal gestion des fournisseurs ────────────────────────────────────────────
const ModalGestionFournisseurs = ({ contacts, onFermer, onSucces }) => {
  const [recherche, setRecherche]       = useState('');
  const [formContact, setFormContact]   = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);
  const [enSuppression, setEnSuppression] = useState(false);

  const filtres = contacts.filter(c => {
    if (!recherche) return true;
    const t = recherche.toLowerCase();
    return c.nom?.toLowerCase().includes(t) || c.telephone?.includes(t) || c.ville?.toLowerCase().includes(t);
  });

  const supprimer = async () => {
    setEnSuppression(true);
    try {
      const reponse = await fournisseursContactsAPI.delete(confirmSuppr.id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Fournisseur supprimé');
      setConfirmSuppr(null);
      onSucces();
    } catch { toast.error('Erreur'); }
    finally { setEnSuppression(false); }
  };

  return (
    <>
      <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
            <div className="modal-header border-0 px-4 pt-4 pb-2">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faUsers} className="me-2" style={{ color: '#00d4aa' }} />
                Mes fournisseurs ({contacts.length})
              </h5>
              <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body px-4 pb-4">
              <div className="d-flex gap-2 mb-3">
                <div className="input-group flex-grow-1">
                  <span className="input-group-text bg-body-secondary border-end-0">
                    <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                  </span>
                  <input className="form-control border-start-0" placeholder="Rechercher..."
                    value={recherche} onChange={e => setRecherche(e.target.value)} />
                </div>
                <button className="btn text-white d-flex align-items-center gap-1"
                  style={{ background: '#00d4aa', borderRadius: 8, whiteSpace: 'nowrap' }}
                  onClick={() => setFormContact('new')}>
                  <FontAwesomeIcon icon={faPlus} />Ajouter
                </button>
              </div>

              {filtres.length === 0 ? (
                <p className="text-muted small text-center py-4">
                  {contacts.length === 0 ? 'Aucun fournisseur enregistré' : 'Aucun résultat'}
                </p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {filtres.map(c => (
                    <div key={c.id} className="p-3 rounded-2 d-flex align-items-center gap-3"
                      style={{ background: 'var(--bs-secondary-bg)' }}>
                      <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', color: '#00a881', fontWeight: 700, fontSize: 'var(--txt-xl)' }}>
                        {c.nom?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{c.nom}</div>
                        <div className="text-muted small d-flex gap-2 flex-wrap">
                          {c.telephone && <span><FontAwesomeIcon icon={faPhone} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />{c.telephone}</span>}
                          {c.ville && <span>· {c.ville}</span>}
                        </div>
                        {(c.typesProduits || []).length > 0 && (
                          <div className="d-flex gap-1 flex-wrap mt-1">
                            {c.typesProduits.map(t => (
                              <span key={t} className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 'var(--txt-xs)' }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 8 }}
                          onClick={() => setFormContact(c)}><FontAwesomeIcon icon={faEdit} /></button>
                        <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 8 }}
                          onClick={() => setConfirmSuppr(c)}><FontAwesomeIcon icon={faTrash} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {formContact !== null && (
        <ModalFournisseurForm
          contact={formContact === 'new' ? null : formContact}
          onFermer={() => setFormContact(null)}
          onSucces={() => { setFormContact(null); onSucces(); }}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer le fournisseur "${confirmSuppr.nom}" ?`}
          onConfirmer={supprimer}
          chargement={enSuppression}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
    </>
  );
};

// ── Modal nouvelle commande ───────────────────────────────────────────────────
const ModalCommande = ({ commande = null, fournisseursConnus = [], onFermer, onSucces }) => {
  const { formatMontant } = useParametres();
  const [type, setType]             = useState(!commande || commande.produitId ? 'existant' : 'nouveau');
  const [produits, setProduits]     = useState([]);
  const [recherche, setRecherche]   = useState(commande?.produitNom || '');
  const [dropOpen, setDropOpen]     = useState(false);
  const [produitLie, setProduitLie] = useState(null);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(commande?.imageUrl || null);
  const [showFourn, setShowFourn]   = useState(false);
  const [envoi, setEnvoi]           = useState(false);
  const ref      = useRef(null);
  const fournRef = useRef(null);

  const uniteInit = commande?.unite || 'ps';
  const [form, setForm] = useState({
    nomFournisseur:    commande?.nomFournisseur    || '',
    quantiteCommandee: commande?.quantiteCommandee || '',
    prixUnitaire:      commande?.prixUnitaire      || '',
    unite:             UNITES_STD.includes(uniteInit) ? uniteInit : '__custom__',
    uniteCustom:       UNITES_STD.includes(uniteInit) ? '' : uniteInit,
  });

  const [formProduit, setFormProduit] = useState({
    nom:             commande?.produitNom  || '',
    description:     commande?.description || '',
    prixVente:       commande?.prixVente   || '',
    prixAchat:       '',
    categorie:       '',
    categorieCustom: commande?.categorie  || '',
    unitePrincipale: UNITES_STD.includes(uniteInit) ? uniteInit : '__custom__',
    uniteCustom:     UNITES_STD.includes(uniteInit) ? '' : uniteInit,
    dzParBallo:      commande?.dzParBallo  || '',
    psParCrt:        commande?.psParCrt    || '',
    psParSac:        commande?.psParSac    || '',
    stockNiveau1: '', stockNiveau2: '', stockNiveau3: '',
  });

  useEffect(() => {
    Promise.all([produitsAPI.getAll(), magasinAPI.getAll()])
      .then(([b, m]) => setProduits([
        ...b.data.map(p => ({ ...p, source: 'boutique' })),
        ...m.data.map(p => ({ ...p, source: 'magasin'  })),
      ]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (ref.current     && !ref.current.contains(e.target))     setDropOpen(false);
      if (fournRef.current && !fournRef.current.contains(e.target)) setShowFourn(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const produitsFiltres = useMemo(() => {
    if (!recherche.trim()) return produits.slice(0, 15);
    const t = recherche.toLowerCase();
    return produits.filter(p => p.nom?.toLowerCase().includes(t) || p.categorie?.toLowerCase().includes(t)).slice(0, 15);
  }, [recherche, produits]);

  const categories = useMemo(() =>
    [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort(),
    [produits]
  );

  const fournSuggeres = useMemo(() => {
    if (!form.nomFournisseur.trim()) return fournisseursConnus;
    const t = form.nomFournisseur.toLowerCase();
    return fournisseursConnus.filter(f => f.nom.toLowerCase().includes(t));
  }, [form.nomFournisseur, fournisseursConnus]);

  const selectionnerProduit = (p) => {
    const u = p.unitePrincipale || p.unite || 'ps';
    setProduitLie(p);
    setRecherche(p.nom);
    setForm(f => ({
      ...f,
      unite:      UNITES_STD.includes(u) ? u : '__custom__',
      uniteCustom: UNITES_STD.includes(u) ? '' : u,
    }));
    setDropOpen(false);
  };

  const resetType = (t) => {
    setType(t);
    setProduitLie(null);
    setRecherche('');
    setFormProduit(f => ({ ...f, nom: '', unitePrincipale: 'ps', uniteCustom: '' }));
  };

  const soumettre = async (e) => {
    e.preventDefault();
    const produitNomFinal = type === 'nouveau'
      ? formProduit.nom
      : (produitLie?.nom || recherche || commande?.produitNom || '');
    if (!produitNomFinal) { toast.error('Nom du produit requis'); return; }
    if (!form.quantiteCommandee || parseFloat(form.quantiteCommandee) <= 0) { toast.error('Quantité invalide'); return; }
    if (!form.prixUnitaire || parseFloat(form.prixUnitaire) <= 0) { toast.error('Le prix d\'achat est obligatoire'); return; }

    const uniteFinale = type === 'nouveau'
      ? (formProduit.unitePrincipale === '__custom__' ? (formProduit.uniteCustom || 'ps') : formProduit.unitePrincipale)
      : (form.unite === '__custom__' ? (form.uniteCustom || 'ps') : form.unite);
    const categorieFinale = formProduit.categorie === '__custom__'
      ? formProduit.categorieCustom
      : (formProduit.categorieCustom || formProduit.categorie);

    setEnvoi(true);
    try {
      let payload;
      if (imageFile) {
        const fd = new FormData();
        fd.append('nomFournisseur',    form.nomFournisseur);
        fd.append('produitNom',        produitNomFinal);
        fd.append('quantiteCommandee', parseFloat(form.quantiteCommandee));
        fd.append('unite',             uniteFinale);
        fd.append('prixUnitaire',      parseFloat(form.prixUnitaire));
        fd.append('description',       formProduit.description);
        fd.append('categorie',         categorieFinale);
        fd.append('prixVente',         parseFloat(formProduit.prixVente) || 0);
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
          nomFournisseur:    form.nomFournisseur,
          produitNom:        produitNomFinal,
          quantiteCommandee: parseFloat(form.quantiteCommandee),
          unite:             uniteFinale,
          prixUnitaire:      parseFloat(form.prixUnitaire),
          description:       formProduit.description,
          categorie:         categorieFinale,
          prixVente:         parseFloat(formProduit.prixVente) || 0,
          dzParBallo:        formProduit.dzParBallo || undefined,
          psParCrt:          formProduit.psParCrt   || undefined,
          psParSac:          formProduit.psParSac   || undefined,
          produitId:     type === 'existant' && produitLie ? produitLie.id     : (commande?.produitId     || null),
          produitSource: type === 'existant' && produitLie ? produitLie.source : (commande?.produitSource || null),
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
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faTruck} className="me-2" style={{ color: '#00d4aa' }} />
              {commande ? 'Modifier la commande' : 'Nouvelle commande fournisseur'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={soumettre} id="form-commande">

              {/* Fournisseur — autocomplete depuis les contacts enregistrés */}
              <div className="mb-3" ref={fournRef}>
                <label className="form-label small fw-semibold text-muted">Fournisseur (optionnel)</label>
                <input className="form-control" placeholder="Nom du fournisseur..."
                  value={form.nomFournisseur} autoComplete="off"
                  onChange={e => { setForm(f => ({ ...f, nomFournisseur: e.target.value })); setShowFourn(true); }}
                  onFocus={() => setShowFourn(true)} />
                {showFourn && fournSuggeres.length > 0 && (
                  <div className="rounded-2 border mt-1"
                    style={{ maxHeight: 180, overflowY: 'auto', background: 'var(--bs-body-bg)', position: 'relative', zIndex: 10 }}>
                    {fournSuggeres.map(f => (
                      <div key={f.id} className="px-3 py-2 d-flex align-items-center gap-2"
                        style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-md)' }}
                        onMouseDown={() => { setForm(fm => ({ ...fm, nomFournisseur: f.nom })); setShowFourn(false); }}>
                        <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', color: '#00a881', fontWeight: 700, fontSize: 'var(--txt-base)' }}>
                          {f.nom?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{f.nom}</div>
                          {f.telephone && <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>{f.telephone}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Type de produit */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Type de produit</label>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm flex-grow-1"
                    style={{
                      background: type === 'existant' ? '#203a43' : 'var(--bs-secondary-bg)',
                      color:      type === 'existant' ? '#fff'    : 'var(--bs-secondary-color)',
                      borderRadius: 8,
                    }}
                    onClick={() => resetType('existant')}>
                    Produit existant
                  </button>
                  <button type="button" className="btn btn-sm"
                    style={{
                      background: type === 'nouveau' ? '#3b82f6' : 'var(--bs-secondary-bg)',
                      color:      type === 'nouveau' ? '#fff'    : 'var(--bs-secondary-color)',
                      borderRadius: 8, fontSize: 'var(--txt-base)',
                    }}
                    onClick={() => resetType('nouveau')}>
                    + Nouveau
                  </button>
                </div>
              </div>

              {/* Produit existant — recherche */}
              {type === 'existant' && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Sélectionner un produit *</label>
                  <div ref={ref}>
                    {!produitLie && (
                      <div className="input-group mb-1">
                        <span className="input-group-text bg-body-secondary border-end-0">
                          <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                        </span>
                        <input className="form-control border-start-0"
                          placeholder="Rechercher dans boutique + magasin..."
                          value={recherche}
                          onChange={e => { setRecherche(e.target.value); setDropOpen(true); }}
                          onFocus={() => setDropOpen(true)} />
                      </div>
                    )}
                    {dropOpen && !produitLie && produitsFiltres.length > 0 && (
                      <div className="rounded-2 border mb-2"
                        style={{ maxHeight: 220, overflowY: 'auto', background: 'var(--bs-body-bg)' }}>
                        {produitsFiltres.map(p => (
                          <div key={p.id + p.source} className="d-flex align-items-center gap-2 px-3 py-2"
                            style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-md)' }}
                            onMouseDown={() => selectionnerProduit(p)}>
                            {p.image
                              ? <img src={p.image} alt="" className="rounded flex-shrink-0" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                              : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                                  style={{ width: 36, height: 36, background: 'var(--bs-secondary-bg)' }}>
                                  <FontAwesomeIcon icon={faBoxOpen} className="text-muted" />
                                </div>}
                            <div className="flex-grow-1 min-w-0">
                              <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                              <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>
                                {p.categorie} · {p.unitePrincipale || p.unite || 'ps'}
                              </div>
                            </div>
                            <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                              <span className="badge"
                                style={{ background: p.source === 'magasin' ? '#dbeafe' : '#dcfce7', color: p.source === 'magasin' ? '#1e40af' : '#166534', fontSize: 'var(--txt-xs)' }}>
                                {p.source}
                              </span>
                              {p.prixVente > 0 && (
                                <span style={{ fontSize: 'var(--txt-sm)', fontWeight: 600, color: '#00a881', whiteSpace: 'nowrap' }}>
                                  {formatMontant(p.prixVente)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
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
                          onClick={() => { setProduitLie(null); setRecherche(''); }}>
                          <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nouveau produit — même formulaire que boutique/magasin */}
              {type === 'nouveau' && (
                <FormNouveauProduit
                  form={formProduit} setForm={setFormProduit}
                  image={imageFile} setImage={setImageFile}
                  apercu={imagePreview} setApercu={setImagePreview}
                  categories={categories}
                  avecPrixAchat={false}
                  avecStockInitial={false}
                />
              )}

              {/* Quantité commandée */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Quantité commandée *</label>
                <input type="number" min="1" className="form-control" required
                  value={form.quantiteCommandee}
                  onChange={e => setForm(f => ({ ...f, quantiteCommandee: e.target.value }))} />
              </div>

              {/* Unité — uniquement pour produit existant (pour nouveau elle est dans FormNouveauProduit) */}
              {type === 'existant' && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Unité commandée *</label>
                  <select className="form-select" value={form.unite}
                    onChange={e => setForm(f => ({ ...f, unite: e.target.value, uniteCustom: '' }))}>
                    {UNITES_STD.map(u => <option key={u} value={u}>{u}</option>)}
                    <option value="__custom__">— Autre (saisir) —</option>
                  </select>
                  {form.unite === '__custom__' && (
                    <input className="form-control mt-2" placeholder="Ex: rouleau, boîte..."
                      value={form.uniteCustom}
                      onChange={e => setForm(f => ({ ...f, uniteCustom: e.target.value }))} />
                  )}
                </div>
              )}

              {/* Prix d'achat */}
              <div className="mb-1">
                <label className="form-label small fw-semibold text-muted">Prix d'achat unitaire *</label>
                <div className="input-group">
                  <input type="number" min="1" required className="form-control" placeholder="0"
                    value={form.prixUnitaire}
                    onChange={e => setForm(f => ({ ...f, prixUnitaire: e.target.value }))} />
                  <span className="input-group-text">FCFA</span>
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
        </div>
      </div>
    </div>
  );
};

// ── Modal détail commande (livraisons) ────────────────────────────────────────
const ModalDetailCommande = ({ commande, onFermer, onActualiser, onModifier, onSupprimer }) => {
  const { formatMontant } = useParametres();
  const [quantite, setQuantite] = useState('');
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [envoi, setEnvoi]       = useState(false);
  const [validation, setValidation]             = useState(null);
  const [sourceNouveauProduit, setSourceNouveauProduit] = useState('magasin');

  const estNouveauProduit = !commande.produitId;
  const restant = commande.quantiteCommandee - (commande.quantiteLivree || 0);
  const pct     = Math.min(100, Math.round(((commande.quantiteLivree || 0) / commande.quantiteCommandee) * 100));
  const cfg     = STATUTS[commande.statut] || STATUTS.EN_ATTENTE;

  const enregistrerLivraison = async () => {
    if (!quantite || parseFloat(quantite) <= 0) { toast.error('Quantité invalide'); return; }
    setEnvoi(true);
    try {
      const reponse = await fournisseursAPI.ajouterLivraison(commande.id, { quantite: parseFloat(quantite), date });
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Livraison enregistrée');
      setQuantite('');
      invalidateCache('produits', 'magasin');
      window.dispatchEvent(new CustomEvent('gestrack:stock-updated'));
      onActualiser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setEnvoi(false); }
  };

  const validerLivraison = async (livraisonId) => {
    setValidation(livraisonId);
    try {
      const data = estNouveauProduit ? { produitSource: sourceNouveauProduit } : {};
      const reponse = await fournisseursAPI.validerLivraison(commande.id, livraisonId, data);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Stock mis à jour avec succès');
      invalidateCache('produits', 'magasin');
      window.dispatchEvent(new CustomEvent('gestrack:stock-updated'));
      onActualiser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation');
    } finally { setValidation(null); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <div className="flex-grow-1 min-w-0">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{commande.produitNom}</h5>
              {commande.nomFournisseur && <div className="text-muted small">{commande.nomFournisseur}</div>}
            </div>
            <div className="d-flex align-items-center gap-2 ms-3">
              {commande.statut !== 'LIVREE' && (
                <button className="btn btn-sm d-flex align-items-center gap-1 text-white"
                  style={{ background: '#00d4aa', borderRadius: 8 }}
                  disabled={envoi} onClick={enregistrerLivraison}>
                  {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : '+ Enregistrer'}
                </button>
              )}
              <button className="btn btn-sm"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 8 }}
                onClick={onModifier}>
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button className="btn btn-sm"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 8 }}
                onClick={onSupprimer}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
              <div style={{ width: 1, height: 24, background: 'var(--bs-border-color)', margin: '0 4px' }} />
              <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          <div className="modal-body px-4 pb-4">

            {/* Résumé */}
            <div className="p-3 rounded-3 mb-4" style={{ background: 'var(--bs-secondary-bg)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted small">Progression</span>
                <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              </div>
              <div className="progress mb-2" style={{ height: 8 }}>
                <div className="progress-bar"
                  style={{ width: `${pct}%`, background: commande.statut === 'LIVREE' ? '#16a34a' : '#00d4aa' }} />
              </div>
              <div className="d-flex justify-content-between" style={{ fontSize: 'var(--txt-md)' }}>
                <span className="text-muted">Commandé : <strong>{commande.quantiteCommandee} {commande.unite}</strong></span>
                <span className="text-muted">Livré : <strong>{commande.quantiteLivree || 0} {commande.unite}</strong></span>
                <span style={{ color: restant > 0 ? '#dc2626' : '#16a34a' }}>Restant : <strong>{restant} {commande.unite}</strong></span>
              </div>
              {commande.prixUnitaire > 0 && (
                <div className="mt-2 small text-muted">
                  Prix unitaire : {formatMontant(commande.prixUnitaire)} — Total estimé : {formatMontant(commande.quantiteCommandee * commande.prixUnitaire)}
                </div>
              )}
              {commande.produitId && (
                <div className="mt-2 small d-flex align-items-center gap-1" style={{ color: '#00a881' }}>
                  <FontAwesomeIcon icon={faLink} style={{ fontSize: 'var(--txt-xs)' }} />
                  Lié au produit dans {commande.produitSource === 'magasin' ? 'le Magasin' : 'la Boutique'}
                </div>
              )}
            </div>

            {/* Stocker dans — uniquement pour nouveaux produits non encore liés */}
            {estNouveauProduit && commande.statut !== 'LIVREE' && (
              <div className="mb-4 p-3 rounded-2"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="fw-semibold small mb-2" style={{ color: '#3b82f6' }}>
                  Où stocker ce produit à la livraison ?
                </div>
                <div className="d-flex gap-2">
                  {[{ val: 'boutique', label: 'Boutique' }, { val: 'magasin', label: 'Magasin' }].map(s => (
                    <button key={s.val} type="button" className="btn btn-sm flex-grow-1"
                      style={{
                        background: sourceNouveauProduit === s.val ? '#203a43' : 'var(--bs-secondary-bg)',
                        color:      sourceNouveauProduit === s.val ? '#fff'    : 'var(--bs-secondary-color)',
                        borderRadius: 8,
                      }}
                      onClick={() => setSourceNouveauProduit(s.val)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enregistrer une livraison */}
            {commande.statut !== 'LIVREE' && (
              <div className="mb-4">
                <div className="row g-2">
                  <div className="col">
                    <label className="form-label small text-muted mb-1">Quantité reçue ({commande.unite})</label>
                    <input type="number" min="0.1" step="any" className="form-control"
                      placeholder={`0 ${commande.unite}`}
                      value={quantite} onChange={e => setQuantite(e.target.value)} />
                  </div>
                  <div className="col">
                    <label className="form-label small text-muted mb-1">Date de réception</label>
                    <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Liste des livraisons */}
            <div>
              <div className="fw-semibold small text-muted text-uppercase mb-2" style={{ letterSpacing: 1 }}>
                Livraisons ({(commande.livraisons || []).length})
              </div>
              {(commande.livraisons || []).length === 0 ? (
                <p className="text-muted small text-center py-3">Aucune livraison enregistrée</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {[...(commande.livraisons || [])].reverse().map(l => (
                    <div key={l.id} className="d-flex align-items-center gap-3 p-3 rounded-2"
                      style={{ background: l.valide ? 'rgba(22,163,74,0.06)' : 'var(--bs-secondary-bg)', border: `1px solid ${l.valide ? '#bbf7d0' : 'var(--bs-border-color)'}` }}>
                      <div className="flex-grow-1">
                        <div className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                          {l.quantite} {commande.unite}
                        </div>
                        <div className="text-muted small">{new Date(l.date).toLocaleDateString('fr-FR')}</div>
                        {l.valide && l.valideLe && (
                          <div className="small" style={{ color: '#16a34a' }}>
                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                            Ajouté au stock le {new Date(l.valideLe).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      {l.valide ? (
                        <span className="badge" style={{ background: '#d1e7dd', color: '#0f5132' }}>
                          <FontAwesomeIcon icon={faCheck} className="me-1" />Stock ajouté
                        </span>
                      ) : (
                        <button className="btn btn-sm text-white"
                          style={{ background: '#00d4aa', borderRadius: 8, fontSize: 'var(--txt-base)' }}
                          disabled={validation === l.id}
                          onClick={() => validerLivraison(l.id)}>
                          {validation === l.id
                            ? <FontAwesomeIcon icon={faSpinner} spin />
                            : <><FontAwesomeIcon icon={faCheck} className="me-1" />Valider → Stock</>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {commande.notes && (
              <div className="mt-3 p-2 rounded-2 small text-muted" style={{ background: 'var(--bs-secondary-bg)' }}>
                {commande.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────
const Fournisseurs = () => {
  const { formatMontant } = useParametres();
  const [commandes, setCommandes]   = useState([]);
  const [contacts, setContacts]     = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche]   = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page, setPage]             = useState(1);

  const [modalForm, setModalForm]       = useState(null);
  const [modalDetail, setModalDetail]   = useState(null);
  const [modalGestion, setModalGestion] = useState(false);
  const [confirmSuppr, setConfirmSuppr] = useState(null);
  const [enSuppression, setEnSuppression] = useState(false);
  const [contactApercu, setContactApercu] = useState(null);

  const charger = async () => {
    try {
      const [{ data: cmd }, { data: cnt }] = await Promise.all([
        fournisseursAPI.getAll(),
        fournisseursContactsAPI.getAll(),
      ]);
      setCommandes(cmd);
      setContacts(cnt);
    } catch { toast.error('Erreur lors du chargement'); }
    finally { setChargement(false); }
  };

  const chargerContacts = async () => {
    try { const { data } = await fournisseursContactsAPI.getAll(); setContacts(data); } catch {}
  };

  useEffect(() => { charger(); }, []);

  const apresSucces = () => { setModalForm(null); charger(); };

  const apresDetail = () => {
    fournisseursAPI.getAll().then(({ data }) => {
      setCommandes(data);
      if (modalDetail) {
        const maj = data.find(c => c.id === modalDetail.id);
        if (maj) setModalDetail(maj);
      }
    }).catch(() => {});
  };

  const supprimer = async () => {
    setEnSuppression(true);
    try {
      const reponse = await fournisseursAPI.delete(confirmSuppr.id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Commande supprimée');
      setCommandes(prev => prev.filter(c => c.id !== confirmSuppr.id));
      setConfirmSuppr(null);
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setEnSuppression(false); }
  };

  const filtrees = useMemo(() => {
    setPage(1);
    return commandes.filter(c => {
      if (filtreStatut && c.statut !== filtreStatut) return false;
      if (recherche) {
        const t = recherche.toLowerCase();
        return c.produitNom?.toLowerCase().includes(t) || c.nomFournisseur?.toLowerCase().includes(t);
      }
      return true;
    });
  }, [commandes, filtreStatut, recherche]);

  const totalPages   = Math.max(1, Math.ceil(filtrees.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const paginees     = filtrees.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>

      {/* Titre */}
      <div style={{ flexShrink: 0 }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faTruck} className="me-2" style={{ color: '#00d4aa' }} />
              Fournisseurs
            </h4>
            <p className="text-muted small mb-0">{commandes.length} commande(s)</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-light d-flex align-items-center gap-2"
              style={{ borderRadius: 10 }}
              onClick={() => setModalGestion(true)}>
              <FontAwesomeIcon icon={faUsers} /> Fournisseurs
            </button>
            <button className="btn text-white d-flex align-items-center gap-2"
              style={{ background: '#00d4aa', borderRadius: 10 }}
              onClick={() => setModalForm('new')}>
              <FontAwesomeIcon icon={faPlus} /> Nouvelle commande
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary border-end-0">
                    <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                  </span>
                  <input className="form-control border-start-0" placeholder="Produit ou fournisseur..."
                    value={recherche} onChange={e => setRecherche(e.target.value)} />
                  {recherche && (
                    <button className="btn btn-light border" onClick={() => setRecherche('')}>
                      <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                    </button>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-3">
                <select className="form-select" value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="LIVREE">Tout livré</option>
                </select>
              </div>
              <div className="col-auto ms-auto">
                <span className="text-muted small">{filtrees.length} / {commandes.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {filtrees.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faTruck} size="3x" className="mb-3 d-block" style={{ color: '#cbd5e1' }} />
            {commandes.length === 0 ? (
              <>
                <p>Aucune commande fournisseur</p>
                <button className="btn text-white" style={{ background: '#00d4aa', borderRadius: 10 }}
                  onClick={() => setModalForm('new')}>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />Créer la première commande
                </button>
              </>
            ) : 'Aucun résultat pour ces filtres'}
          </div>
        ) : (
          <>
            <div className="row g-3">
              {paginees.map(c => {
                const cfg  = STATUTS[c.statut] || STATUTS.EN_ATTENTE;
                const pct  = Math.min(100, Math.round(((c.quantiteLivree || 0) / c.quantiteCommandee) * 100));
                const rest = c.quantiteCommandee - (c.quantiteLivree || 0);
                return (
                  <div key={c.id} className="col-12 col-md-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, cursor: 'pointer' }}
                      onClick={() => setModalDetail(c)}>
                      <div className="card-body p-3">
                        <div className="d-flex align-items-start justify-content-between mb-2">
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                              {c.produitNom}
                            </div>
                            {c.nomFournisseur && (() => {
                              const contact = contacts.find(f => f.nom === c.nomFournisseur);
                              return contact ? (
                                <button className="btn btn-link p-0 text-muted small text-truncate text-start"
                                  style={{ fontSize: 'var(--txt-sm)', maxWidth: '100%', textDecoration: 'underline dotted' }}
                                  onClick={e => { e.stopPropagation(); setContactApercu(contact); }}>
                                  {c.nomFournisseur}
                                </button>
                              ) : (
                                <div className="text-muted small text-truncate">{c.nomFournisseur}</div>
                              );
                            })()}
                          </div>
                          <span className="badge ms-2 flex-shrink-0"
                            style={{ background: cfg.bg, color: cfg.color, fontSize: 'var(--txt-xs)' }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="progress mb-1" style={{ height: 6, borderRadius: 3 }}>
                          <div className="progress-bar"
                            style={{ width: `${pct}%`, background: c.statut === 'LIVREE' ? '#16a34a' : '#00d4aa' }} />
                        </div>
                        <div className="d-flex justify-content-between mb-3" style={{ fontSize: 'var(--txt-sm)' }}>
                          <span className="text-muted">{c.quantiteLivree || 0} / {c.quantiteCommandee} {c.unite}</span>
                          <span className="text-muted">{pct}%</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          {rest > 0 && (
                            <span className="small" style={{ color: '#dc2626' }}>Restant : {rest} {c.unite}</span>
                          )}
                          {c.produitSource && (
                            <span className="badge"
                              style={{ background: c.produitSource === 'magasin' ? '#dbeafe' : '#dcfce7', color: c.produitSource === 'magasin' ? '#1e40af' : '#166534', fontSize: 'var(--txt-xs)' }}>
                              <FontAwesomeIcon icon={faLink} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />
                              {c.produitSource === 'magasin' ? 'Magasin' : 'Boutique'}
                            </span>
                          )}
                        </div>
                        {/* {c.prixUnitaire > 0 && (
                          <div className="small text-muted mt-1">
                            Total : {formatMontant(c.quantiteCommandee * c.prixUnitaire)}
                          </div>
                        )} */}
                        <div className="mt-3">
                          <button className="btn btn-sm w-100"
                            style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)', fontSize: 'var(--txt-base)' }}
                            onClick={() => setModalDetail(c)}>
                            Voir les livraisons
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between px-1 py-3">
                <span className="text-muted small">Page {pageCourante} / {totalPages}</span>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-light" disabled={pageCourante === 1}
                    onClick={() => setPage(p => p - 1)}>
                    <FontAwesomeIcon icon={faChevronDown} style={{ rotate: '90deg' }} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - pageCourante) <= 2)
                    .map(p => (
                      <button key={p} className={`btn btn-sm ${p === pageCourante ? 'text-white' : 'btn-light'}`}
                        style={p === pageCourante ? { background: '#00d4aa' } : {}}
                        onClick={() => setPage(p)}>{p}</button>
                    ))}
                  <button className="btn btn-sm btn-light" disabled={pageCourante === totalPages}
                    onClick={() => setPage(p => p + 1)}>
                    <FontAwesomeIcon icon={faChevronUp} style={{ rotate: '90deg' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modalForm !== null && (
        <ModalCommande
          commande={modalForm === 'new' ? null : modalForm}
          fournisseursConnus={contacts}
          onFermer={() => setModalForm(null)}
          onSucces={apresSucces}
        />
      )}
      {modalDetail && (
        <ModalDetailCommande
          commande={modalDetail}
          onFermer={() => setModalDetail(null)}
          onActualiser={apresDetail}
          onModifier={() => { setModalDetail(null); setModalForm(modalDetail); }}
          onSupprimer={() => { setModalDetail(null); setConfirmSuppr(modalDetail); }}
        />
      )}
      {modalGestion && (
        <ModalGestionFournisseurs
          contacts={contacts}
          onFermer={() => setModalGestion(false)}
          onSucces={chargerContacts}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer la commande "${confirmSuppr.produitNom}" ? Cette action est irréversible.`}
          onConfirmer={supprimer}
          chargement={enSuppression}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}

      {/* ── Mini-modale détail fournisseur ── */}
      {contactApercu && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1060 }}
          onClick={() => setContactApercu(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 360 }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
              <div className="modal-header border-0 pb-0 px-4 pt-4">
                <div>
                  <h6 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{contactApercu.nom}</h6>
                  {contactApercu.ville && <div className="text-muted small">{contactApercu.ville}</div>}
                </div>
                <button className="btn btn-light btn-sm rounded-circle ms-auto"
                  onClick={() => setContactApercu(null)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body px-4 py-3">
                {contactApercu.telephone && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faPhone} style={{ color: '#00d4aa', width: 16 }} />
                    <a href={`tel:${contactApercu.telephone}`} className="text-decoration-none"
                      style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-md)' }}>
                      {contactApercu.telephone}
                    </a>
                  </div>
                )}
                {contactApercu.telephoneWhatsapp && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faPhone} style={{ color: '#25d366', width: 16 }} />
                    <a href={`https://wa.me/${contactApercu.telephoneWhatsapp.replace(/\D/g,'')}`}
                      target="_blank" rel="noreferrer"
                      className="text-decoration-none whatsapp-link"
                      style={{ fontSize: 'var(--txt-md)' }}>
                      {contactApercu.telephoneWhatsapp} <span className="small">(WhatsApp)</span>
                    </a>
                  </div>
                )}
                {contactApercu.typesProduits?.length > 0 && (
                  <div className="mt-3">
                    <div className="small fw-semibold text-muted mb-2">Types de produits</div>
                    <div className="d-flex flex-wrap gap-1">
                      {contactApercu.typesProduits.map(t => (
                        <span key={t} className="badge"
                          style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881', fontSize: 'var(--txt-xs)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fournisseurs;
