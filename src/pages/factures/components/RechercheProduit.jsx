// Recherche de produits (boutique / magasin) à ajouter à une facture
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';

// ── Autocomplete produit — recherches séparées boutique / magasin ────────────
const ListeProduits = ({ produits, recherche, ouvert, onAjouter }) => {
  const filtres = useMemo(() => {
    const t = recherche.toLowerCase().trim();
    const liste = t ? produits.filter(p => p.nom?.toLowerCase().includes(t) || p.categorie?.toLowerCase().includes(t)) : produits;
    return liste.slice(0, 20);
  }, [recherche, produits]);

  if (!ouvert || filtres.length === 0) return null;

  return (
    <div className="rounded-2 border mt-1"
      style={{ maxHeight: 260, overflowY: 'auto', background: 'var(--bs-body-bg)' }}>
      {filtres.map(p => (
        <div key={p.id + p._source} className="d-flex align-items-center gap-2 px-2 py-2"
          style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-sm)' }}
          onMouseDown={() => onAjouter(p)}>
          {p.image
            ? <img src={p.image} alt="" className="rounded flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'contain', background: '#f8fafc' }} />
            : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 32, height: 32, background: 'var(--bs-secondary-bg)' }}>
                <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 12 }} />
              </div>}
          <div className="flex-grow-1 min-w-0">
            <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
            <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>{p.categorie}</div>
          </div>
          <div className="fw-bold flex-shrink-0" style={{ color: '#00a881', fontSize: 'var(--txt-xs)', whiteSpace: 'nowrap' }}>
            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(p.prixVente || 0)}
          </div>
        </div>
      ))}
    </div>
  );
};

const RechercheProduit = ({ produits, onAjouter }) => {
  const [rechercheBoutique, setRechercheBoutique] = useState('');
  const [rechercheMagasin, setRechercheMagasin]   = useState('');
  const [dropOpenBoutique, setDropOpenBoutique]   = useState(false);
  const [dropOpenMagasin, setDropOpenMagasin]     = useState(false);
  const refBoutique = useRef(null);
  const refMagasin  = useRef(null);

  const produitsBoutique = useMemo(() => produits.filter(p => p._source === 'boutique'), [produits]);
  const produitsMagasin  = useMemo(() => produits.filter(p => p._source === 'magasin'),  [produits]);

  useEffect(() => {
    const h = (e) => {
      if (refBoutique.current && !refBoutique.current.contains(e.target)) setDropOpenBoutique(false);
      if (refMagasin.current  && !refMagasin.current.contains(e.target))  setDropOpenMagasin(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const choisir = (p, setRecherche, setOuvert) => {
    onAjouter(p);
    setRecherche('');
    setOuvert(false);
  };

  return (
    <div className="row g-2">
      <div className="col-6" ref={refBoutique}>
        <div className="input-group">
          <span className="input-group-text bg-body-secondary border-end-0">
            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
          </span>
          <input type="text" className="form-control border-start-0"
            placeholder="Boutique..."
            value={rechercheBoutique}
            onChange={e => { setRechercheBoutique(e.target.value); setDropOpenBoutique(true); }}
            onFocus={() => setDropOpenBoutique(true)} />
        </div>
        <ListeProduits produits={produitsBoutique} recherche={rechercheBoutique} ouvert={dropOpenBoutique}
          onAjouter={p => choisir(p, setRechercheBoutique, setDropOpenBoutique)} />
      </div>
      <div className="col-6" ref={refMagasin}>
        <div className="input-group">
          <span className="input-group-text bg-body-secondary border-end-0">
            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
          </span>
          <input type="text" className="form-control border-start-0"
            placeholder="Magasin..."
            value={rechercheMagasin}
            onChange={e => { setRechercheMagasin(e.target.value); setDropOpenMagasin(true); }}
            onFocus={() => setDropOpenMagasin(true)} />
        </div>
        <ListeProduits produits={produitsMagasin} recherche={rechercheMagasin} ouvert={dropOpenMagasin}
          onAjouter={p => choisir(p, setRechercheMagasin, setDropOpenMagasin)} />
      </div>
    </div>
  );
};

export default RechercheProduit;
