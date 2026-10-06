// Page des paramètres de l'application
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { passeFiltreStock } from '@/services/unites';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSpinner, faSave, faSun, faMoon, faDesktop, faPrint, faUsers, faStore,
         faEye, faEyeSlash, faCopy, faCheck, faLock, faImages, faTrash, faUpload,
         faPalette, faBell, faFileExport, faBars, faChevronDown, faChevronUp, faMobileAlt,
         faSearch, faBoxOpen, faTimes, faEdit, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { parametresAPI, clientsAPI, produitsAPI, estMisEnAttente } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { imprimerListeClients, imprimerListeProduits } from '@/utils/pdfTemplates';
import ModalConfirmation from '@/components/shared/ModalConfirmation';
import AutocompleteFiltre from '@/components/shared/AutocompleteFiltre';
import Application from '@/pages/Application';
import useIsMobile from '@/hooks/useIsMobile';

const appliquerThemeLocal = (theme) => {
  if (theme === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  } else {
    document.body.setAttribute('data-bs-theme', theme);
  }
};
import { toast } from 'react-toastify';

const DEVISES = [
  { value: 'XAF',  label: 'XAF — Franc CFA (ISO)' },
  { value: 'EUR',  label: 'EUR — Euro' },
  { value: 'USD',  label: 'USD — Dollar américain' },
  { value: 'CAD',  label: 'CAD — Dollar canadien' },
];

const THEMES = [
  { value: 'light',  label: 'Clair',   icon: faSun,     color: '#f59e0b' },
  { value: 'dark',   label: 'Sombre',  icon: faMoon,    color: '#6366f1' },
  { value: 'system', label: 'Système', icon: faDesktop, color: '#6b7280' },
];

// ── Section export (clients + produits) ──────────────────────────────────
const FILTRES_CLIENTS  = [
  { val: 'tous',       label: 'Tous les clients' },
  { val: 'avec_dette', label: 'Avec dette' },
  { val: 'sans_dette', label: 'Sans dette' },
];
const FILTRES_PRODUITS = [
  { val: 'tous',     label: 'Tous les produits' },
  { val: 'boutique', label: 'Boutique' },
  { val: 'magasin',  label: 'Magasin' },
];

// Filtre stock — s'applique à l'intérieur de la source choisie (Tous / Boutique / Magasin)
const FILTRES_STOCK = [
  { val: '',        label: 'Tous stocks' },
  { val: 'stock',   label: 'En stock' },
  { val: 'faible',  label: 'Stock faible' },
  { val: 'rupture', label: 'Rupture' },
];

// Produits d'une source (Tous / Boutique / Magasin)
const filtrerParSource = (produits, source) => (produits || []).filter(p =>
  source === 'boutique' ? p._source === 'Boutique' : source === 'magasin' ? p._source === 'Magasin' : true);

// Produits correspondant à une source + un filtre stock + une catégorie
const filtrerProduitsExport = (produits, source, stock, categorie) => filtrerParSource(produits, source)
  .filter(p => passeFiltreStock(p, stock) && (!categorie || p.categorie === categorie));

const BoutonFiltre = ({ actif, onClick, label }) => (
  <button type="button" className="btn btn-sm"
    style={{
      borderRadius: 20, padding: '2px 12px', fontSize: 'var(--txt-sm)',
      background: actif ? '#00d4aa' : 'var(--bs-secondary-bg)',
      color: actif ? '#fff' : 'var(--bs-body-color)',
      border: actif ? 'none' : '1px solid var(--bs-border-color)',
    }}
    onClick={onClick}>
    {label}
  </button>
);

const SectionExport = ({ vue }) => {
  const [clients, setClients]     = useState(null);
  const [produits, setProduits]   = useState(null);
  const [selClients, setSelClients]   = useState({});
  const [selProduits, setSelProduits] = useState({});
  const [chargClients, setChargClients]   = useState(false);
  const [chargProduits, setChargProduits] = useState(false);
  const [ouvertClients, setOuvertClients]   = useState(false);
  const [ouvertProduits, setOuvertProduits] = useState(false);
  const [filtreClients, setFiltreClients]   = useState('tous');
  const [filtreProduits, setFiltreProduits] = useState('tous');
  const [filtreStockExport, setFiltreStockExport] = useState('');
  const [filtreCategorieExport, setFiltreCategorieExport] = useState('');

  const chargerClients = async () => {
    if (clients) return;
    setChargClients(true);
    try {
      const { data } = await clientsAPI.getAll();
      setClients(data);
      const sel = {};
      data.forEach(c => { sel[c.id] = true; });
      setSelClients(sel);
      setOuvertClients(true);
    } catch { } finally { setChargClients(false); }
  };

  const chargerProduits = async () => {
    if (produits) return;
    setChargProduits(true);
    try {
      const [boutiqueRes, magasinRes] = await Promise.all([
        produitsAPI.getAll(),
        import('@/services/api').then(m => m.magasinAPI.getAll()),
      ]);
      const tous = [
        ...boutiqueRes.data.map(p => ({ ...p, _source: 'Boutique' })),
        ...magasinRes.data.map(p => ({ ...p, _source: 'Magasin' })),
      ].sort((a, b) => a.nom?.localeCompare(b.nom, 'fr'));
      setProduits(tous);
      const sel = {};
      tous.forEach(p => { sel[p.id + p._source] = true; });
      setSelProduits(sel);
      setOuvertProduits(true);
    } catch { } finally { setChargProduits(false); }
  };

  const appliquerFiltreClients = (filtre) => {
    setFiltreClients(filtre);
    const liste = filtre === 'avec_dette'
      ? (clients || []).filter(c => c.totalDette > 0)
      : filtre === 'sans_dette'
      ? (clients || []).filter(c => !(c.totalDette > 0))
      : (clients || []);
    const ids = new Set(liste.map(c => c.id));
    const sel = {};
    (clients || []).forEach(c => { sel[c.id] = ids.has(c.id); });
    setSelClients(sel);
  };

  // Change la source et/ou le filtre stock, et sélectionne exactement les produits affichés
  const appliquerFiltreProduits = (source = filtreProduits, stock = filtreStockExport, categorie = filtreCategorieExport) => {
    // La catégorie choisie n'existe plus dans la nouvelle source → on la retire
    if (categorie && !filtrerParSource(produits, source).some(p => p.categorie === categorie)) categorie = '';
    setFiltreProduits(source);
    setFiltreStockExport(stock);
    setFiltreCategorieExport(categorie);
    const liste = filtrerProduitsExport(produits, source, stock, categorie);
    const cles = new Set(liste.map(p => p.id + p._source));
    const sel = {};
    (produits || []).forEach(p => { sel[p.id + p._source] = cles.has(p.id + p._source); });
    setSelProduits(sel);
  };

  const exportClients = () => {
    const selection = (clients || []).filter(c => selClients[c.id]);
    if (!selection.length) return;
    imprimerListeClients(selection);
  };

  const exportProduits = () => {
    const selection = (produits || []).filter(p => selProduits[p.id + p._source]);
    if (!selection.length) return;
    imprimerListeProduits(selection);
  };

  const clientsFiltres = filtreClients === 'avec_dette'
    ? (clients || []).filter(c => c.totalDette > 0)
    : filtreClients === 'sans_dette'
    ? (clients || []).filter(c => !(c.totalDette > 0))
    : (clients || []);

  const produitsFiltres = filtrerProduitsExport(produits, filtreProduits, filtreStockExport, filtreCategorieExport);
  // Catégories proposées : celles de la source choisie
  const categoriesExport = [...new Set(filtrerParSource(produits, filtreProduits).map(p => p.categorie).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'));

  // Chargement automatique de la liste affichée par le sous-menu
  useEffect(() => {
    if (vue === 'clients')  chargerClients();
    if (vue === 'produits') chargerProduits();
  }, [vue]); // eslint-disable-line

  const tousClientsVisible  = clientsFiltres.length > 0  && clientsFiltres.every(c => selClients[c.id]);
  const tousProduitsFiltres = produitsFiltres.length > 0 && produitsFiltres.every(p => selProduits[p.id + p._source]);

  return (
    // Hauteur pleine : titre + bouton Imprimer, en-tête de carte, filtres et « Sélectionner tout »
    // restent fixes — seule la liste défile.
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2" style={{ flexShrink: 0 }}>
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
          <FontAwesomeIcon icon={faPrint} style={{ color: '#00d4aa' }} />
          Exporter et imprimer
        </h6>
        {/* Imprimer — hors de la carte */}
        {vue === 'clients' && ouvertClients && (
          <button className="btn btn-sm d-flex align-items-center gap-1"
            style={{ background: '#00d4aa', color: '#fff', borderRadius: 8 }}
            onClick={exportClients}
            disabled={!Object.values(selClients).some(Boolean)}>
            <FontAwesomeIcon icon={faPrint} /> Imprimer
          </button>
        )}
        {vue === 'produits' && ouvertProduits && (
          <button className="btn btn-sm d-flex align-items-center gap-1"
            style={{ background: '#00d4aa', color: '#fff', borderRadius: 8 }}
            onClick={exportProduits}
            disabled={!Object.values(selProduits).some(Boolean)}>
            <FontAwesomeIcon icon={faPrint} /> Imprimer
          </button>
        )}
      </div>

      {/* ── Export clients ── */}
      {vue === 'clients' && (
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14, flex: '0 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="card-body p-3" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="d-flex align-items-center gap-2"
            style={{ flexShrink: 0, marginBottom: ouvertClients && clients ? '0.75rem' : 0 }}>
            {chargClients
              ? <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} />
              : <FontAwesomeIcon icon={faUsers} style={{ color: '#00d4aa' }} />}
            <span className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>Liste des clients</span>
            {clients && <span className="badge bg-secondary">{Object.values(selClients).filter(Boolean).length}/{clients.length}</span>}
          </div>

          {ouvertClients && clients && (
            <>
              {/* Sélectionner tout | Filtres */}
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap" style={{ flexShrink: 0 }}>
                <label className="d-flex align-items-center gap-2 mb-0 small fw-semibold me-2" style={{ cursor: 'pointer', color: '#00a881' }}>
                  <input type="checkbox" style={{ accentColor: '#00d4aa' }} checked={tousClientsVisible}
                    onChange={e => {
                      const sel = { ...selClients };
                      clientsFiltres.forEach(c => { sel[c.id] = e.target.checked; });
                      setSelClients(sel);
                    }} />
                  Sélectionner tout
                </label>
                {FILTRES_CLIENTS.map(f => (
                  <BoutonFiltre key={f.val} actif={filtreClients === f.val} label={f.label}
                    onClick={() => appliquerFiltreClients(f.val)} />
                ))}
              </div>
              <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
                {clientsFiltres.map(c => (
                  <label key={c.id} className="d-flex align-items-center gap-2 py-1 px-1 rounded" style={{ cursor: 'pointer', fontSize: 'var(--txt-md)' }}>
                    <input type="checkbox" checked={!!selClients[c.id]}
                      onChange={e => setSelClients(prev => ({ ...prev, [c.id]: e.target.checked }))} />
                    <span className="flex-grow-1">{c.prenom} {c.nom}</span>
                    <span className="text-muted small">{c.profession}</span>
                    {c.totalDette > 0 && (
                      <span style={{ color: '#dc2626', fontSize: 'var(--txt-sm)', fontWeight: 600 }}>
                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(c.totalDette)}
                      </span>
                    )}
                  </label>
                ))}
                {clientsFiltres.length === 0 && (
                  <p className="text-muted small text-center py-2 mb-0">Aucun client dans cette catégorie</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* ── Export produits ── */}
      {vue === 'produits' && (
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14, flex: '0 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="card-body p-3" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="d-flex align-items-center gap-2"
            style={{ flexShrink: 0, marginBottom: ouvertProduits && produits ? '0.75rem' : 0 }}>
            {chargProduits
              ? <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#6366f1' }} />
              : <FontAwesomeIcon icon={faStore} style={{ color: '#6366f1' }} />}
            <span className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>Liste des produits (boutique + magasin)</span>
            {produits && <span className="badge bg-secondary">{Object.values(selProduits).filter(Boolean).length}/{produits.length}</span>}
          </div>

          {ouvertProduits && produits && (
            <>
              {/* Filtres : Sélectionner tout · Source | Stock (appliqué à l'intérieur de la source) | Catégorie.
                  Chaque groupe reste d'un bloc ; le séparateur vertical n'apparaît que sur grand écran. */}
              <div className="d-flex align-items-center flex-wrap column-gap-2 row-gap-2 mb-3" style={{ flexShrink: 0 }}>
                <label className="d-flex align-items-center gap-2 mb-0 small fw-semibold me-2" style={{ cursor: 'pointer', color: '#00a881' }}>
                  <input type="checkbox" style={{ accentColor: '#00d4aa' }} checked={tousProduitsFiltres}
                    onChange={e => {
                      const sel = { ...selProduits };
                      produitsFiltres.forEach(p => { sel[p.id + p._source] = e.target.checked; });
                      setSelProduits(sel);
                    }} />
                  Sélectionner tout
                </label>
                <div className="d-flex gap-2 flex-wrap">
                  {FILTRES_PRODUITS.map(f => (
                    <BoutonFiltre key={f.val} actif={filtreProduits === f.val} label={f.label}
                      onClick={() => appliquerFiltreProduits(f.val)} />
                  ))}
                </div>
                <span className="d-none d-md-block mx-3 align-self-stretch" style={{ width: 1, background: 'var(--bs-border-color)' }} />
                <div className="d-flex gap-2 flex-wrap">
                  {FILTRES_STOCK.map(f => (
                    <BoutonFiltre key={f.val || 'tous'} actif={filtreStockExport === f.val} label={f.label}
                      onClick={() => appliquerFiltreProduits(filtreProduits, f.val)} />
                  ))}
                </div>
                <span className="d-none d-md-block mx-3 align-self-stretch" style={{ width: 1, background: 'var(--bs-border-color)' }} />
                <div style={{ width: 220, maxWidth: '100%' }}>
                  <AutocompleteFiltre options={categoriesExport} value={filtreCategorieExport}
                    onChange={(cat) => appliquerFiltreProduits(filtreProduits, filtreStockExport, cat)}
                    placeholder="Toutes catégories" />
                </div>
              </div>
              <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
                {produitsFiltres.map(p => (
                  <label key={p.id + p._source} className="d-flex flex-column py-1 px-1 rounded" style={{ cursor: 'pointer', fontSize: 'var(--txt-md)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <input type="checkbox" checked={!!selProduits[p.id + p._source]}
                        onChange={e => setSelProduits(prev => ({ ...prev, [p.id + p._source]: e.target.checked }))} />
                      <span className="fw-semibold flex-grow-1">{p.nom}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 ms-4 mt-1">
                      <span className="badge" style={{ background: p._source === 'Magasin' ? '#dbeafe' : '#dcfce7', color: p._source === 'Magasin' ? '#1e40af' : '#166534', fontSize: 'var(--txt-xs)' }}>{p._source}</span>
                      <span className="text-muted small">{p.categorie}</span>
                      <span style={{ color: '#00a881', fontSize: 'var(--txt-sm)', fontWeight: 600 }}>
                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(p.prixVente)}
                      </span>
                    </div>
                  </label>
                ))}
                {produitsFiltres.length === 0 && (
                  <p className="text-muted small text-center py-2 mb-0">Aucun produit dans cette catégorie</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

// ── Section vitrine (liens publics) ─────────────────────────────────────────
const slugify = (str) => (str || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SectionVitrine = () => {
  const { parametres, setParametres, chargement: chargementParametres } = useParametres();
  const [formV, setFormV] = useState({ nomEntreprise: '', motDePasseVitrine: '', catalogueActif: false });
  const [hasMotDePasse, setHasMotDePasse] = useState(false);
  const [montrerMdp, setMontrerMdp]       = useState(false);
  const [chargement, setChargement]       = useState(false);
  const [copie, setCopie]                 = useState('');
  const [erreurSlug, setErreurSlug]       = useState('');
  const [modalPrix, setModalPrix]         = useState(false);
  const siteUrl = window.location.origin;
  const slug    = slugify(formV.nomEntreprise);

  useEffect(() => {
    setFormV({
      nomEntreprise:     parametres.nomEntreprise  || '',
      motDePasseVitrine: '',
      catalogueActif:    parametres.catalogueActif || false,
    });
    setHasMotDePasse(parametres.hasMotDePasseVitrine || false);
  }, [parametres]);

  const copier = (url, key) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopie(key);
      setTimeout(() => setCopie(''), 2000);
    });
  };

  const sauvegarder = async () => {
    setErreurSlug('');
    setChargement(true);
    try {
      const reponse = await parametresAPI.update({
        nomEntreprise:     formV.nomEntreprise,
        motDePasseVitrine: formV.motDePasseVitrine,
        catalogueActif:    formV.catalogueActif,
      });
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      const { data } = reponse;
      setParametres(data);
      setHasMotDePasse(data.hasMotDePasseVitrine);
      setFormV(f => ({ ...f, motDePasseVitrine: '' }));
      toast.success('Vitrine mise à jour');
    } catch (err) {
      if (err.response?.data?.code === 'SLUG_TAKEN') {
        setErreurSlug('Ce nom d\'entreprise est déjà utilisé, choisissez un autre.');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally { setChargement(false); }
  };

  const lienCatalogue  = slug ? `${siteUrl}/catalogue/${slug}` : '';
  const lienBoutique   = slug ? `${siteUrl}/${slug}` : '';
  const boutiqueActive = !!(slug && (hasMotDePasse || formV.motDePasseVitrine));

  const BoutonCopier = ({ urlKey, url }) => (
    <button className="btn btn-sm flex-shrink-0"
      style={{ background: copie === urlKey ? '#dcfce7' : 'var(--bs-secondary-bg)', color: copie === urlKey ? '#16a34a' : 'var(--bs-body-color)' }}
      onClick={() => copier(url, urlKey)}>
      <FontAwesomeIcon icon={copie === urlKey ? faCheck : faCopy} />
    </button>
  );

  // Tant que les vrais paramètres du compte ne sont pas encore arrivés, ce formulaire ne doit
  // ni afficher les valeurs par défaut (vide/désactivé) comme si c'était l'état réel, ni
  // permettre "Enregistrer" — ça écraserait sinon nomEntreprise/catalogueActif déjà configurés
  // avec des valeurs vides et casserait les deux liens publics.
  if (chargementParametres) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#00d4aa' }} />
      </div>
    );
  }

  return (
    <div className="row g-4">

      {/* ── Nom de l'entreprise — commun aux deux liens ── */}
      <div className="col-12">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>
              Nom de l'entreprise
            </h6>
            <small className="text-muted d-block mb-3">
              Utilisé dans l'URL des deux liens. Si vous le modifiez, les deux URLs changent automatiquement.
            </small>
            <input className="form-control" placeholder="Ex: Boutique Daniel" autoFocus
              value={formV.nomEntreprise}
              onChange={e => setFormV(f => ({ ...f, nomEntreprise: e.target.value }))} />
            {slug && (
              <div className="mt-2 small d-flex flex-column gap-1" style={{ color: '#6b7280' }}>
                <span><FontAwesomeIcon icon={faStore} className="me-1" style={{ color: '#00d4aa' }} />
                  {siteUrl}/catalogue/<strong style={{ color: '#00a881' }}>{slug}</strong>
                </span>
                <span><FontAwesomeIcon icon={faLock} className="me-1" style={{ color: '#6366f1' }} />
                  {siteUrl}/<strong style={{ color: '#6366f1' }}>{slug}</strong>
                </span>
              </div>
            )}
            {erreurSlug && <div className="text-danger small mt-1">{erreurSlug}</div>}
          </div>
        </div>
      </div>

      {/* ── Catalogue public + Boutique protégée côte à côte ── */}
      <div className="col-12 col-md-6">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
              <div>
                <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>
                  <FontAwesomeIcon icon={faStore} className="me-2" style={{ color: '#00d4aa' }} />
                  Catalogue public
                </h6>
              </div>
              <div className="form-check form-switch flex-shrink-0">
                <input className="form-check-input" type="checkbox" id="catalogueActif"
                  checked={formV.catalogueActif}
                  onChange={e => setFormV(f => ({ ...f, catalogueActif: e.target.checked }))} />
              </div>
            </div>
            <ul className="mb-0 small text-muted ps-3" style={{ lineHeight: 1.8 }}>
              <li>Accessible par <strong>quiconque</strong> possède le lien</li>
              <li>Affiche les <strong>produits de la boutique</strong> avec photo, nom et catégorie</li>
              <li>Les <strong>stocks</strong> ne sont <strong>pas visibles</strong></li>
            </ul>
            {formV.catalogueActif && (
              <div className="d-flex align-items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
                <span className="small" style={{ color: 'var(--bs-body-color)' }}>Afficher le prix au public</span>
                <button type="button" className="btn btn-sm flex-shrink-0"
                  style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881', borderRadius: 8 }}
                  onClick={() => setModalPrix(true)}>
                  <FontAwesomeIcon icon={faEdit} className="me-1" /> sélectionner les produits
                </button>
              </div>
            )}
            {formV.catalogueActif && lienCatalogue ? (
              <div className="mt-3">
                <div className="small fw-semibold text-muted mb-1">Votre lien :</div>
                <div className="d-flex align-items-center gap-2">
                  <code className="flex-grow-1 p-2 rounded" style={{ background: 'var(--bs-secondary-bg)', fontSize: 'var(--txt-sm)', wordBreak: 'break-all' }}>
                    {lienCatalogue}
                  </code>
                  <BoutonCopier urlKey="cat" url={lienCatalogue} />
                </div>
              </div>
            ) : formV.catalogueActif && !slug ? (
              <div className="mt-2 small text-muted">
                Définissez d'abord le nom de l'entreprise ci-dessus.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#6366f1' }} />
              Boutique protégée
            </h6>
            <ul className="mb-3 small text-muted ps-3" style={{ lineHeight: 1.8 }}>
              <li>Accessible uniquement avec un <strong>mot de passe</strong></li>
              <li>Affiche le <strong>stock boutique</strong> et le <strong>stock magasin</strong></li>
              <li>Le <strong>prix de vente</strong> est visible</li>
            </ul>
            <label className="form-label small fw-semibold text-muted">
              Mot de passe
              {hasMotDePasse && (
                <span className="fw-normal ms-2" style={{ color: '#16a34a', fontSize: 'var(--txt-sm)' }}>
                  (déjà défini)
                </span>
              )}
            </label>
            <div className="input-group mb-3">
              <input type={montrerMdp ? 'text' : 'password'} className="form-control"
                placeholder={hasMotDePasse ? 'laisser vide pour ne pas changer le mot de passe' : 'Choisir un mot de passe...'}
                value={formV.motDePasseVitrine}
                onChange={e => setFormV(f => ({ ...f, motDePasseVitrine: e.target.value }))} />
              <button type="button" className="btn btn-outline-secondary"
                onClick={() => setMontrerMdp(v => !v)}>
                <FontAwesomeIcon icon={montrerMdp ? faEyeSlash : faEye} style={{ fontSize: 'var(--txt-md)' }} />
              </button>
            </div>
            {boutiqueActive ? (
              <div>
                <div className="small fw-semibold text-muted mb-1">Votre lien :</div>
                <div className="d-flex align-items-center gap-2">
                  <code className="flex-grow-1 p-2 rounded" style={{ background: 'var(--bs-secondary-bg)', fontSize: 'var(--txt-sm)', wordBreak: 'break-all' }}>
                    {lienBoutique}
                  </code>
                  <BoutonCopier urlKey="bout" url={lienBoutique} />
                </div>
              </div>
            ) : (
              <div className="small text-muted">
                {!slug
                  ? 'Définissez d\'abord le nom de l\'entreprise.'
                  : 'Ajoutez un mot de passe pour activer ce lien.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-12 pb-4 d-flex justify-content-end">
        <button className="btn text-white d-flex align-items-center gap-2"
          style={{ background: '#00d4aa', borderRadius: 10 }}
          disabled={chargement} onClick={sauvegarder}>
          {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
          Enregistrer la vitrine
        </button>
      </div>

      {modalPrix && <ModalPrixCatalogue onFermer={() => setModalPrix(false)} />}
    </div>
  );
};

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

// ── Section galerie d'images produits ─────────────────────────────────────────
// Ne liste que les images importées après l'ajout de cette galerie (étiquetées avec le
// compte à l'import) — les images déjà présentes en boutique/magasin fonctionnent toujours
// normalement, elles n'apparaissent simplement pas encore ici tant qu'elles ne sont pas
// remplacées par un nouvel import.
const SectionImages = () => {
  const [images, setImages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [aSupprimer, setASupprimer] = useState(null);
  const [enSuppression, setEnSuppression] = useState(false);
  const [enImport, setEnImport] = useState(false);
  const fileRef = useRef(null);

  // L'appel passe par l'API Cloudinary (réseau externe) — un blip DNS transitoire ne doit
  // pas afficher d'erreur immédiatement, on retente une fois avant de prévenir l'utilisateur.
  // `annule` évite aussi un double appel (StrictMode en dev) de se marcher dessus.
  useEffect(() => {
    let annule = false;
    const charger = (tentative = 0) => {
      parametresAPI.getImages()
        .then(({ data }) => {
          if (annule) return;
          setImages(data);
          setChargement(false);
        })
        .catch(() => {
          if (annule) return;
          if (tentative === 0) { setTimeout(() => charger(1), 800); return; }
          toast.error('Erreur lors du chargement des images');
          setChargement(false);
        });
    };
    setChargement(true);
    charger();
    return () => { annule = true; };
  }, []);

  const confirmerSuppression = async () => {
    setEnSuppression(true);
    try {
      await parametresAPI.supprimerImage(aSupprimer.publicId);
      toast.success('Image supprimée');
      setImages(imgs => imgs.filter(i => i.publicId !== aSupprimer.publicId));
      setASupprimer(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setEnSuppression(false);
    }
  };

  const formatTaille = (o) => o < 1024 * 1024 ? `${Math.round(o / 1024)} Ko` : `${(o / (1024 * 1024)).toFixed(1)} Mo`;

  const importerImages = async (e) => {
    const fichiers = Array.from(e.target.files || []);
    e.target.value = ''; // permet de resélectionner les mêmes fichiers ensuite
    if (fichiers.length === 0) return;
    setEnImport(true);
    try {
      const { data } = await parametresAPI.uploaderImages(fichiers);
      setImages(imgs => [
        ...data.map(img => ({ ...img, enUtilisation: false, creeLe: new Date().toISOString() })),
        ...imgs,
      ]);
      toast.success(`${data.length} image(s) importée(s)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'import des images');
    } finally {
      setEnImport(false);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-12">
        {/* Bouton d'import — hors de la carte, aligné à droite au-dessus */}
        <div className="d-flex justify-content-end mb-3">
          <button type="button" className="btn text-white d-flex align-items-center gap-2"
            style={{ background: '#00d4aa', borderRadius: 10 }}
            disabled={enImport}
            onClick={() => fileRef.current?.click()}>
            {enImport ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUpload} />}
            Importer des images
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="d-none" onChange={importerImages} />
        </div>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faImages} style={{ color: '#00d4aa' }} />
              Images produits importées
            </h6>
            <p className="text-muted small mb-4">
              Les images encore utilisées sur une carte produit (boutique, magasin ou commande fournisseur)
              sont protégées — seules celles qui ne servent plus peuvent être supprimées, directement sur Cloudinary.
              Les images importées ici sont disponibles pour un produit sans être recadrées automatiquement — choisissez-les
              directement dans la galerie au moment de créer ou modifier un produit.
            </p>

            {chargement ? (
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
                <p className="text-muted small mt-2 mb-0">Chargement des images...</p>
              </div>
            ) : images.length === 0 ? (
              <p className="text-muted text-center py-4 small">Aucune image importée pour l'instant.</p>
            ) : (
              <div className="row g-3" style={{ maxHeight: 620, overflowY: 'auto', overflowX: 'hidden' }}>
                {images.map(img => (
                  <div key={img.publicId} className="col-6 col-sm-4 col-lg-3 col-xl-2">
                    <div className="position-relative" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--bs-border-color)' }}>
                      <img src={img.url} alt="" style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', display: 'block' }} />
                      {img.enUtilisation ? (
                        <span className="badge position-absolute top-0 end-0 m-1"
                          style={{ background: 'rgba(22,163,74,0.9)', color: '#fff', fontSize: 10 }}
                          title="Encore utilisée par un produit ou une commande">
                          <FontAwesomeIcon icon={faLock} className="me-1" style={{ fontSize: 9 }} />
                          Utilisée
                        </span>
                      ) : (
                        <button
                          className="btn btn-sm position-absolute top-0 end-0 m-1 d-flex align-items-center justify-content-center"
                          style={{ width: 26, height: 26, padding: 0, background: 'rgba(239,68,68,0.9)', color: '#fff', borderRadius: '50%', border: 'none' }}
                          title="Supprimer cette image (Cloudinary)"
                          onClick={() => setASupprimer(img)}>
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />
                        </button>
                      )}
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: 11 }}>{formatTaille(img.tailleOctets)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {aSupprimer && (
        <ModalConfirmation
          message="Supprimer définitivement cette image de Cloudinary ? Elle n'est actuellement utilisée par aucun produit ni commande — cette action est irréversible."
          onConfirmer={confirmerSuppression}
          chargement={enSuppression}
          onAnnuler={() => setASupprimer(null)}
        />
      )}
    </div>
  );
};

// ── Page Paramètres ──────────────────────────────────────────────────────────
const Parametres = () => {
  const { parametres, setParametres } = useParametres();
  const [form, setForm] = useState({ periodeRappelJours: 30, devise: 'XAF', theme: 'light' });
  const [chargement, setChargement] = useState(false);
  const [onglet, setOnglet] = useState('apparence');
  // Sous-menus repliables (ex. Export) — ouverts/fermés manuellement, comme Finances dans la sidebar
  const [sousMenusOuverts, setSousMenusOuverts] = useState({});
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const isMobile = useIsMobile(768);

  useEffect(() => {
    setForm({
      periodeRappelJours: parametres.periodeRappelJours ?? 30,
      devise: parametres.devise ?? 'XAF',
      theme: parametres.theme ?? 'light',
    });
  }, [parametres]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      const reponse = await parametresAPI.update(form);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setParametres(reponse.data);
      toast.success('Paramètres enregistrés');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setChargement(false);
    }
  };

  const ONGLETS = [
    { id: 'apparence',   label: 'Apparence',   icon: faPalette },
    { id: 'application', label: 'Application', icon: faMobileAlt },
    { id: 'rappels',     label: 'Rappels',     icon: faBell },
    { id: 'vitrine',     label: 'Vitrine',     icon: faStore },
    { id: 'images',      label: 'Images',      icon: faImages },
    { id: 'export',      label: 'Export',      icon: faFileExport, enfants: [
      { id: 'export-clients',  label: 'Liste clients',  icon: faUsers },
      { id: 'export-produits', label: 'Liste produits', icon: faStore },
    ] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faCog} style={{ color: '#00d4aa' }} />
            Paramètres
          </h4>
        </div>
      </div>

      {/* Rangée manuelle (pas la grille Bootstrap) : sur mobile, .row/.col-12 passent sur deux
          lignes — chaque ligne prend alors sa propre hauteur de contenu au lieu de se partager
          la hauteur disponible, donc le "height: 100%" du contenu ne pointait plus vers rien
          de fini et son scroll interne ne se déclenchait jamais. */}
      <div className="d-flex gap-3 flex-grow-1"
        style={{ flexDirection: isMobile ? 'column' : 'row', minHeight: 0, overflow: 'hidden' }}>
        {/* ── Menu vertical ── */}
        <div style={{ flexShrink: 0, width: isMobile ? '100%' : 220 }}>
          {/* Bouton compact — mobile uniquement : évite que le menu prenne toute la
              hauteur comme sur grand écran, replié par défaut derrière "Menu" */}
          {isMobile && (
            <button type="button"
              className="btn d-flex align-items-center gap-2 w-100 mb-2"
              style={{
                background: 'linear-gradient(180deg, #0f2027 0%, #203a43 100%)',
                color: '#fff', borderRadius: 10, padding: '10px 16px', fontSize: 'var(--txt-md)',
              }}
              onClick={() => setMenuMobileOuvert(v => !v)}>
              <FontAwesomeIcon icon={faBars} style={{ fontSize: 14 }} />
              <span className="fw-semibold">Menu</span>
              <FontAwesomeIcon icon={menuMobileOuvert ? faChevronUp : faChevronDown}
                className="ms-auto" style={{ fontSize: 12 }} />
            </button>
          )}

          {(!isMobile || menuMobileOuvert) && (
          <div className="shadow-sm" style={{
            borderRadius: 14, overflow: 'hidden',
            background: 'linear-gradient(180deg, #0f2027 0%, #203a43 100%)',
          }}>
            {ONGLETS.map(({ id, label, icon, enfants }) => {
              // Un onglet parent (Export) est actif quand l'un de ses sous-onglets l'est
              const actif = enfants ? enfants.some(e => e.id === onglet) : onglet === id;
              const ouvert = !!sousMenusOuverts[id];
              return (
              <React.Fragment key={id}>
              <button
                className="btn d-flex align-items-center gap-2 w-100 text-start"
                style={{
                  borderRadius: 0,
                  borderLeft: actif ? '3px solid #00d4aa' : '3px solid transparent',
                  background: actif ? 'rgba(0,212,170,0.15)' : 'transparent',
                  color: actif ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontWeight: actif ? 600 : 400,
                  padding: '20px 16px',
                  fontSize: 'var(--txt-md)',
                  transition: 'all 0.2s',
                }}
                onClick={() => {
                  // Parent : ouvre / referme simplement son sous-menu (le menu mobile reste ouvert)
                  if (enfants) { setSousMenusOuverts(prev => ({ ...prev, [id]: !prev[id] })); return; }
                  setOnglet(id); setMenuMobileOuvert(false);
                }}>
                <FontAwesomeIcon icon={icon} style={{ width: 16, flexShrink: 0 }} />
                {label}
                {enfants && (
                  <FontAwesomeIcon icon={ouvert ? faChevronUp : faChevronDown} className="ms-auto" style={{ fontSize: 11 }} />
                )}
              </button>
              {/* Sous-menu — même style que Finances dans la barre latérale */}
              {enfants && ouvert && (
                <div style={{ marginLeft: 26, borderLeft: '1px solid rgba(255,255,255,0.15)', paddingBottom: 6 }}>
                  {enfants.map(e => (
                    <button key={e.id}
                      className="btn d-flex align-items-center gap-2 w-100 text-start"
                      style={{
                        borderRadius: '0 8px 8px 0',
                        background: onglet === e.id ? 'rgba(0,212,170,0.15)' : 'transparent',
                        color: onglet === e.id ? '#fff' : 'rgba(255,255,255,0.55)',
                        fontWeight: onglet === e.id ? 600 : 400,
                        padding: '10px 14px',
                        fontSize: 'var(--txt-base)',
                      }}
                      onClick={() => { setOnglet(e.id); setMenuMobileOuvert(false); }}>
                      <FontAwesomeIcon icon={e.icon} style={{ width: 14, flexShrink: 0 }} />
                      {e.label}
                    </button>
                  ))}
                </div>
              )}
              </React.Fragment>
              );
            })}
          </div>
          )}
        </div>

        {/* ── Contenu de l'onglet ── */}
        <div style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
      {onglet === 'export-clients'  ? <SectionExport vue="clients" /> :
       onglet === 'export-produits' ? <SectionExport vue="produits" /> :
       onglet === 'vitrine'     ? <SectionVitrine /> :
       onglet === 'images'      ? <SectionImages /> :
       onglet === 'application' ? <Application /> : (
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Rappel des dettes — onglet Rappels */}
          {onglet === 'rappels' && <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Rappel des dettes</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">
                    Délai de rappel automatique (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    className="form-control"
                    autoFocus
                    value={form.periodeRappelJours}
                    onChange={(e) => setForm({ ...form, periodeRappelJours: parseInt(e.target.value) || 30 })}
                  />
                  <small className="text-muted">
                    Les dettes sans activité depuis {form.periodeRappelJours} jours seront marquées à relancer.
                  </small>
                </div>
              </div>
            </div>
          </div>

          }
          {/* Devise — onglet Apparence */}
          {onglet === 'apparence' && <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Devise</h6>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">
                    Devise utilisée pour les montants
                  </label>
                  <select
                    className="form-select"
                    value={form.devise}
                    onChange={(e) => setForm({ ...form, devise: e.target.value })}
                  >
                    {DEVISES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Cette devise sera utilisée dans toute l'application pour l'affichage des prix.
                  </small>
                </div>
              </div>
            </div>
          </div>

          }
          {/* Thème — onglet Apparence */}
          {onglet === 'apparence' && <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <h6 className="fw-semibold mb-3" style={{ color: 'var(--bs-body-color)' }}>Thème de l'interface</h6>
                <div className="d-flex flex-wrap gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className="btn d-flex align-items-center gap-2 px-4 py-2"
                      style={{
                        borderRadius: 10,
                        border: form.theme === t.value ? `2px solid ${t.color}` : '2px solid #e5e7eb',
                        background: form.theme === t.value ? `${t.color}12` : '#f9fafb',
                        color: form.theme === t.value ? t.color : '#6b7280',
                        fontWeight: form.theme === t.value ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => { setForm({ ...form, theme: t.value }); appliquerThemeLocal(t.value); }}
                    >
                      <FontAwesomeIcon icon={t.icon} />
                      {t.label}
                    </button>
                  ))}
                </div>
                <small className="text-muted mt-2 d-block">
                  {form.theme === 'system'
                    ? 'Le thème s\'adapte automatiquement aux préférences de votre système d\'exploitation.'
                    : form.theme === 'dark'
                    ? 'Interface sombre — idéale en environnement peu éclairé.'
                    : 'Interface claire — par défaut.'}
                </small>
              </div>
            </div>
          </div>
          }
        </div>

        {/* Bouton enregistrer */}
        <div className="mt-4">
          <button
            type="submit"
            className="btn text-white d-flex align-items-center gap-2"
            style={{ background: '#00d4aa', borderRadius: 10 }}
            disabled={chargement}
          >
            {chargement
              ? <FontAwesomeIcon icon={faSpinner} spin />
              : <FontAwesomeIcon icon={faSave} />
            }
            Enregistrer les paramètres
          </button>
        </div>
      </form>
      )}
      </div>
        </div>
      </div>

    </div>
  );
};

export default Parametres;
