// Recherche de produits (boutique / magasin) à ajouter à une facture
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import SuggestionProduit from '@/components/produits/SuggestionProduit';

const formatPrix = (n) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n || 0);

// ── Autocomplete produit — recherches séparées boutique / magasin ────────────
// La liste s'affiche sous les deux champs, sur toute la largeur (le nom reste lisible sur mobile)
const ListeProduits = ({ produits, recherche, onAjouter }) => {
  const filtres = useMemo(() => {
    const t = recherche.toLowerCase().trim();
    const liste = t ? produits.filter(p => p.nom?.toLowerCase().includes(t) || p.categorie?.toLowerCase().includes(t)) : produits;
    return liste.slice(0, 20);
  }, [recherche, produits]);

  if (filtres.length === 0) return null;

  return (
    <div className="rounded-2 border mt-1"
      style={{ maxHeight: 260, overflowY: 'auto', background: 'var(--bs-body-bg)' }}>
      {filtres.map(p => (
        <SuggestionProduit key={p.id + p._source} produit={p} detail={p.categorie}
          prix={formatPrix(p.prixVente)} onChoisir={() => onAjouter(p)} />
      ))}
    </div>
  );
};

const RechercheProduit = ({ produits, onAjouter }) => {
  const [rechercheBoutique, setRechercheBoutique] = useState('');
  const [rechercheMagasin, setRechercheMagasin]   = useState('');
  // Liste ouverte : 'boutique', 'magasin' ou null (une seule à la fois)
  const [ouverte, setOuverte] = useState(null);
  const ref = useRef(null);

  const produitsBoutique = useMemo(() => produits.filter(p => p._source === 'boutique'), [produits]);
  const produitsMagasin  = useMemo(() => produits.filter(p => p._source === 'magasin'),  [produits]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOuverte(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const choisir = (p, setRecherche) => {
    onAjouter(p);
    setRecherche('');
    setOuverte(null);
  };

  return (
    <div className="row g-2" ref={ref}>
      <div className="col-6">
        <div className="input-group">
          <span className="input-group-text bg-body-secondary border-end-0">
            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
          </span>
          <input type="text" className="form-control border-start-0"
            placeholder="Boutique..."
            value={rechercheBoutique}
            onChange={e => { setRechercheBoutique(e.target.value); setOuverte('boutique'); }}
            onFocus={() => setOuverte('boutique')} />
        </div>
      </div>
      <div className="col-6">
        <div className="input-group">
          <span className="input-group-text bg-body-secondary border-end-0">
            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
          </span>
          <input type="text" className="form-control border-start-0"
            placeholder="Magasin..."
            value={rechercheMagasin}
            onChange={e => { setRechercheMagasin(e.target.value); setOuverte('magasin'); }}
            onFocus={() => setOuverte('magasin')} />
        </div>
      </div>
      {ouverte && (
        <div className="col-12" style={{ marginTop: 0 }}>
          {ouverte === 'boutique'
            ? <ListeProduits produits={produitsBoutique} recherche={rechercheBoutique}
                onAjouter={p => choisir(p, setRechercheBoutique)} />
            : <ListeProduits produits={produitsMagasin} recherche={rechercheMagasin}
                onAjouter={p => choisir(p, setRechercheMagasin)} />}
        </div>
      )}
    </div>
  );
};

export default RechercheProduit;
