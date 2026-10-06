// Paramètres › Export : listes clients / produits à imprimer
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPrint, faUsers, faStore } from '@fortawesome/free-solid-svg-icons';
import { clientsAPI, produitsAPI } from '@/services/api';
import { imprimerListeClients, imprimerListeProduits } from '@/utils/pdfTemplates';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import { FILTRES_CLIENTS, FILTRES_PRODUITS, FILTRES_STOCK } from '@/pages/parametres/exports/constants';
import { filtrerParSource, filtrerProduitsExport } from '@/pages/parametres/exports/utils';
import BoutonFiltre from '@/pages/parametres/exports/components/BoutonFiltre';

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

export default SectionExport;
