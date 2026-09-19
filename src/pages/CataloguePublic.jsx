// Page publique — catalogue produits boutique (accessible sans connexion)
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faSpinner, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { vitrineAPI } from '@/services/api';
import defaultProduit from '@/assets/img/defaultProduit.png';
import AutocompleteFiltre from '@/components/shared/AutocompleteFiltre';

// ── Modal détail produit ──────────────────────────────────────────────────────
const ModalProduit = ({ produit, onFermer }) => {
  if (!produit) return null;
  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1050, padding: 16 }}
      onClick={onFermer}>
      <div
        className="bg-white rounded-4 overflow-hidden"
        style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Image grande */}
        <div style={{ position: 'relative' }}>
          <img
            src={produit.image || defaultProduit}
            alt={produit.nom}
            style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
          <button
            onClick={onFermer}
            className="btn btn-sm"
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(0,0,0,0.5)', color: '#fff',
              borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {!produit.enStock && (
            <span className="badge position-absolute"
              style={{ bottom: 10, left: 10, background: '#dc2626', color: '#fff', fontSize: 11 }}>
              Épuisé
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="p-4">
          {produit.categorie && (
            <span className="badge mb-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 11 }}>
              {produit.categorie}
            </span>
          )}
          <h5 className="fw-bold mb-2" style={{ color: '#1e293b', fontSize: 20 }}>{produit.nom}</h5>
          {produit.description && (
            <p style={{ color: '#475569', lineHeight: 1.7, fontSize: 15 }}>{produit.description}</p>
          )}
          {!produit.description && (
            <p className="text-muted small">Aucune description disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────
const CataloguePublic = () => {
  const { slug } = useParams();
  const [produits, setProduits]             = useState([]);
  const [nomEntreprise, setNomEntreprise]   = useState('');
  const [chargement, setChargement]         = useState(true);
  const [erreur, setErreur]                 = useState('');
  const [recherche, setRecherche]           = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [produitDetail, setProduitDetail]   = useState(null);

  useEffect(() => {
    vitrineAPI.getCatalogue(slug)
      .then(({ data }) => {
        setProduits(data.produits || []);
        setNomEntreprise(data.nomEntreprise || '');
      })
      .catch(err => {
        setErreur(err.response?.status === 404
          ? 'Ce catalogue n\'est pas disponible.'
          : 'Erreur lors du chargement.');
      })
      .finally(() => setChargement(false));
  }, [slug]);

  const categories = [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort();

  const filtres = produits.filter(p => {
    if (filtreCategorie && p.categorie !== filtreCategorie) return false;
    return !recherche ||
      p.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      p.categorie?.toLowerCase().includes(recherche.toLowerCase());
  });

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  if (erreur) return (
    <div className="d-flex flex-column justify-content-center align-items-center text-center"
      style={{ height: '100vh' }}>
      <FontAwesomeIcon icon={faStore} size="3x" className="mb-3" style={{ color: '#cbd5e1' }} />
      <p className="text-muted">{erreur}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>

      {/* ── En-tête fixe ── */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(135deg, #0f2027, #203a43)', zIndex: 10 }}>
        <div className="d-flex flex-column align-items-center px-3 pt-3 pb-2">
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faStore} style={{ color: '#00d4aa', fontSize: 20 }} />
            <h5 className="fw-bold mb-0 text-white">{nomEntreprise || 'Catalogue'}</h5>
          </div>
          <span className="small mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {produits.length} produit(s) disponible(s)
          </span>
        </div>
        <div className="px-3 pb-3 d-flex gap-2" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 13 }} />
            </span>
            <input className="form-control border-start-0 bg-white"
              placeholder="Rechercher un produit..."
              value={recherche} onChange={e => setRecherche(e.target.value)} />
            {recherche && (
              <button type="button" className="btn btn-light border" onClick={() => setRecherche('')}>
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: 13 }} />
              </button>
            )}
          </div>
          {categories.length > 0 && (
            <div style={{ minWidth: 150 }}>
              <AutocompleteFiltre options={categories} value={filtreCategorie}
                onChange={setFiltreCategorie} placeholder="Catégories" />
            </div>
          )}
        </div>
      </div>

      {/* ── Grille scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="container py-3" style={{ maxWidth: 960 }}>
          {filtres.length === 0 ? (
            <p className="text-muted text-center py-5">Aucun produit trouvé</p>
          ) : (
            <div className="row g-3">
              {filtres.map(p => (
                <div key={p.id} className="col-6 col-md-4 col-lg-3">
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{ borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => setProduitDetail(p)}>
                    <img src={p.image || defaultProduit} alt={p.nom}
                      style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', background: '#f0f4f8' }} />
                    <div className="card-body p-3">
                      {/* Catégorie au-dessus du titre */}
                      {p.categorie && (
                        <span className="badge d-block mb-1"
                          style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 10, width: 'fit-content' }}>
                          {p.categorie}
                        </span>
                      )}
                      <div className="fw-semibold" style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.3 }}>
                        {p.nom}
                      </div>
                      {!p.enStock && (
                        <span className="badge mt-2" style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10 }}>
                          Épuisé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center py-3 mt-2" style={{ color: '#94a3b8', fontSize: 12 }}>
            Propulsé par <strong style={{ color: '#00d4aa' }}>GesTrack</strong>
          </div>
        </div>
      </div>

      {/* Modal détail */}
      <ModalProduit produit={produitDetail} onFermer={() => setProduitDetail(null)} />
    </div>
  );
};

export default CataloguePublic;
