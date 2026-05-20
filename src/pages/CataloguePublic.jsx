// Page publique — catalogue produits boutique (accessible sans connexion)
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faSpinner, faSearch } from '@fortawesome/free-solid-svg-icons';
import { vitrineAPI } from '@/services/api';
import defaultProduit from '@/assets/img/defaultProduit.png';

const CataloguePublic = () => {
  const { slug } = useParams();
  const [produits, setProduits]         = useState([]);
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [chargement, setChargement]     = useState(true);
  const [erreur, setErreur]             = useState('');
  const [recherche, setRecherche]       = useState('');

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

  const filtres = produits.filter(p =>
    !recherche || p.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
    p.categorie?.toLowerCase().includes(recherche.toLowerCase())
  );

  const fmtPrix = (n) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  if (erreur) return (
    <div className="d-flex flex-column justify-content-center align-items-center text-center" style={{ height: '100vh' }}>
      <FontAwesomeIcon icon={faStore} size="3x" className="mb-3" style={{ color: '#cbd5e1' }} />
      <p className="text-muted">{erreur}</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div className="text-white py-4 px-3 text-center"
        style={{ background: 'linear-gradient(135deg, #0f2027, #203a43)' }}>
        <FontAwesomeIcon icon={faStore} className="mb-2 d-block mx-auto" size="2x" style={{ color: '#00d4aa' }} />
        <h4 className="fw-bold mb-0">{nomEntreprise || 'Catalogue'}</h4>
        <p className="small mb-0 mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {produits.length} produit(s) disponible(s)
        </p>
      </div>

      <div className="container py-4" style={{ maxWidth: 960 }}>
        {/* Recherche */}
        <div className="input-group mb-4">
          <span className="input-group-text bg-white border-end-0">
            <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 13 }} />
          </span>
          <input className="form-control border-start-0 bg-white" placeholder="Rechercher un produit..."
            value={recherche} onChange={e => setRecherche(e.target.value)} />
        </div>

        {filtres.length === 0 ? (
          <p className="text-muted text-center py-5">Aucun produit trouvé</p>
        ) : (
          <div className="row g-3">
            {filtres.map(p => (
              <div key={p.id} className="col-6 col-md-4 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <img src={p.image || defaultProduit} alt={p.nom}
                    style={{ width: '100%', height: 160, objectFit: 'cover', background: '#f0f4f8' }} />
                  <div className="card-body p-3">
                    <div className="fw-semibold mb-1" style={{ fontSize: 14, color: '#1e293b' }}>{p.nom}</div>
                    {p.categorie && (
                      <span className="badge mb-2" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 10 }}>
                        {p.categorie}
                      </span>
                    )}
                    {p.description && (
                      <p className="text-muted small mb-2" style={{ fontSize: 12, lineHeight: 1.4 }}>
                        {p.description}
                      </p>
                    )}
                    <div className="d-flex align-items-center justify-content-between mt-auto">
                      <span className="fw-bold" style={{ color: '#00a881', fontSize: 15 }}>
                        {fmtPrix(p.prixVente)}
                      </span>
                      {!p.enStock && (
                        <span className="badge" style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10 }}>
                          Épuisé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-3" style={{ color: '#94a3b8', fontSize: 12 }}>
        Propulsé par <strong style={{ color: '#00d4aa' }}>GesTrack</strong>
      </div>
    </div>
  );
};

export default CataloguePublic;
