// Page des paramètres de l'application
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSpinner, faSave, faSun, faMoon, faDesktop, faPrint, faUsers, faStore,
         faEye, faEyeSlash, faCopy, faCheck, faLock } from '@fortawesome/free-solid-svg-icons';
import { parametresAPI, clientsAPI, produitsAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { imprimerListeClients, imprimerListeProduits } from '@/utils/pdfTemplates';

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

const SectionExport = () => {
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

  const chargerClients = async () => {
    if (clients) { setOuvertClients(v => !v); return; }
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
    if (produits) { setOuvertProduits(v => !v); return; }
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

  const appliquerFiltreProduits = (filtre) => {
    setFiltreProduits(filtre);
    const liste = filtre === 'boutique'
      ? (produits || []).filter(p => p._source === 'Boutique')
      : filtre === 'magasin'
      ? (produits || []).filter(p => p._source === 'Magasin')
      : (produits || []);
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

  const produitsFiltres = filtreProduits === 'boutique'
    ? (produits || []).filter(p => p._source === 'Boutique')
    : filtreProduits === 'magasin'
    ? (produits || []).filter(p => p._source === 'Magasin')
    : (produits || []);

  const tousClientsVisible  = clientsFiltres.length > 0  && clientsFiltres.every(c => selClients[c.id]);
  const tousProduitsFiltres = produitsFiltres.length > 0 && produitsFiltres.every(p => selProduits[p.id + p._source]);

  return (
    <div className="mt-4">
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
        <FontAwesomeIcon icon={faPrint} style={{ color: '#00d4aa' }} />
        Exporter et imprimer
      </h6>

      {/* ── Export clients ── */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14, cursor: 'pointer' }}
        onClick={chargerClients}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between"
            style={{ marginBottom: ouvertClients && clients ? '0.75rem' : 0 }}>
            <div className="d-flex align-items-center gap-2">
              {chargClients
                ? <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} />
                : <FontAwesomeIcon icon={faUsers} style={{ color: '#00d4aa' }} />}
              <span className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>Liste des clients</span>
              {clients && <span className="badge bg-secondary">{Object.values(selClients).filter(Boolean).length}/{clients.length}</span>}
            </div>
            {ouvertClients && (
              <button className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: '#00d4aa', color: '#fff', borderRadius: 8 }}
                onClick={e => { e.stopPropagation(); exportClients(); }}
                disabled={!Object.values(selClients).some(Boolean)}>
                <FontAwesomeIcon icon={faPrint} /> Imprimer
              </button>
            )}
          </div>

          {ouvertClients && clients && (
            <div onClick={e => e.stopPropagation()}>
              {/* Filtres */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {FILTRES_CLIENTS.map(f => (
                  <BoutonFiltre key={f.val} actif={filtreClients === f.val} label={f.label}
                    onClick={() => appliquerFiltreClients(f.val)} />
                ))}
              </div>
              <label className="d-flex align-items-center gap-2 mb-2 small fw-semibold" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={tousClientsVisible}
                  onChange={e => {
                    const sel = { ...selClients };
                    clientsFiltres.forEach(c => { sel[c.id] = e.target.checked; });
                    setSelClients(sel);
                  }} />
                Sélectionner tout
              </label>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
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
            </div>
          )}
        </div>
      </div>

      {/* ── Export produits ── */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14, cursor: 'pointer' }}
        onClick={chargerProduits}>
        <div className="card-body p-3">
          <div className="d-flex align-items-center justify-content-between"
            style={{ marginBottom: ouvertProduits && produits ? '0.75rem' : 0 }}>
            <div className="d-flex align-items-center gap-2">
              {chargProduits
                ? <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#6366f1' }} />
                : <FontAwesomeIcon icon={faStore} style={{ color: '#6366f1' }} />}
              <span className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>Liste des produits (boutique + magasin)</span>
              {produits && <span className="badge bg-secondary">{Object.values(selProduits).filter(Boolean).length}/{produits.length}</span>}
            </div>
            {ouvertProduits && (
              <button className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: '#6366f1', color: '#fff', borderRadius: 8 }}
                onClick={e => { e.stopPropagation(); exportProduits(); }}
                disabled={!Object.values(selProduits).some(Boolean)}>
                <FontAwesomeIcon icon={faPrint} /> Imprimer
              </button>
            )}
          </div>

          {ouvertProduits && produits && (
            <div onClick={e => e.stopPropagation()}>
              {/* Filtres */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {FILTRES_PRODUITS.map(f => (
                  <BoutonFiltre key={f.val} actif={filtreProduits === f.val} label={f.label}
                    onClick={() => appliquerFiltreProduits(f.val)} />
                ))}
              </div>
              <label className="d-flex align-items-center gap-2 mb-2 small fw-semibold" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={tousProduitsFiltres}
                  onChange={e => {
                    const sel = { ...selProduits };
                    produitsFiltres.forEach(p => { sel[p.id + p._source] = e.target.checked; });
                    setSelProduits(sel);
                  }} />
                Sélectionner tout
              </label>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
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
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

// ── Section vitrine (liens publics) ─────────────────────────────────────────
const slugify = (str) => (str || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SectionVitrine = () => {
  const { parametres, setParametres } = useParametres();
  const [formV, setFormV] = useState({ nomEntreprise: '', motDePasseVitrine: '', catalogueActif: false });
  const [hasMotDePasse, setHasMotDePasse] = useState(false);
  const [montrerMdp, setMontrerMdp]       = useState(false);
  const [chargement, setChargement]       = useState(false);
  const [copie, setCopie]                 = useState('');
  const [erreurSlug, setErreurSlug]       = useState('');
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
      const { data } = await parametresAPI.update({
        nomEntreprise:     formV.nomEntreprise,
        motDePasseVitrine: formV.motDePasseVitrine,
        catalogueActif:    formV.catalogueActif,
      });
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
            <input className="form-control" placeholder="Ex: Boutique Daniel"
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
              <li>Le <strong>prix</strong> et les <strong>stocks</strong> ne sont <strong>pas visibles</strong></li>
            </ul>
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

      <div className="col-12">
        <button className="btn text-white d-flex align-items-center gap-2"
          style={{ background: '#00d4aa', borderRadius: 10 }}
          disabled={chargement} onClick={sauvegarder}>
          {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
          Enregistrer la vitrine
        </button>
      </div>
    </div>
  );
};

// ── Page Paramètres ──────────────────────────────────────────────────────────
const Parametres = () => {
  const { parametres, setParametres } = useParametres();
  const [form, setForm] = useState({ periodeRappelJours: 30, devise: 'XAF', theme: 'light' });
  const [chargement, setChargement] = useState(false);
  const [onglet, setOnglet] = useState('apparence');

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
      const { data } = await parametresAPI.update(form);
      setParametres(data);
      toast.success('Paramètres enregistrés');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faCog} style={{ color: '#00d4aa' }} />
            Paramètres
          </h4>
        </div>
        {/* ── Onglets ── */}
        <div className="d-flex gap-1 mb-1 flex-wrap">
          {[
            { id: 'apparence', label: 'Apparence' },
            { id: 'rappels',   label: 'Rappels' },
            { id: 'export',    label: 'Export' },
            { id: 'vitrine',   label: 'Vitrine' },
          ].map(({ id, label }) => (
            <button key={id}
              className="btn"
              style={{
                borderRadius: '10px 10px 0 0',
                background: onglet === id ? '#00d4aa' : 'var(--bs-secondary-bg)',
                color: onglet === id ? '#fff' : 'var(--bs-secondary-color)',
                fontWeight: onglet === id ? 600 : 400,
                border: 'none',
                padding: '10px 45px',
                fontSize: 'var(--txt-lg)',
              }}
              onClick={() => setOnglet(id)}>
              {label}
            </button>
          ))}
        <div style={{ height: 2, background: '#00d4aa', borderRadius: 2, marginBottom: '1rem' }} />
        <div style={{ display: 'none' }}>{/* placeholder pour aligner le padding avec la section scrollable */}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
      {onglet === 'export'   ? <SectionExport /> :
       onglet === 'vitrine'  ? <SectionVitrine /> : (
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
  );
};

export default Parametres;
