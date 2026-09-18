// Page publique — boutique protégée par mot de passe (accessible via /[slug])
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faSpinner, faLock, faSearch, faEye, faEyeSlash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { vitrineAPI } from '@/services/api';
import defaultProduit from '@/assets/img/defaultProduit.png';
import AutocompleteFiltre from '@/components/shared/AutocompleteFiltre';

const BoutiquePublique = () => {
  const { slug } = useParams();
  const [etat, setEtat]                 = useState('chargement'); // chargement | mdp | produits | erreur
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [produits, setProduits]         = useState([]);
  const [motDePasse, setMotDePasse]     = useState('');
  const [visible, setVisible]           = useState(false);
  const [erreurMdp, setErreurMdp]       = useState('');
  const [envoi, setEnvoi]               = useState(false);
  const [recherche, setRecherche]       = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');

  useEffect(() => {
    vitrineAPI.getInfosBoutique(slug)
      .then(({ data }) => { setNomEntreprise(data.nomEntreprise || slug); setEtat('mdp'); })
      .catch(err => setEtat(err.response?.status === 404 ? 'introuvable' : 'erreur'));
  }, [slug]);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurMdp('');
    setEnvoi(true);
    try {
      const { data } = await vitrineAPI.acceder(slug, motDePasse);
      setProduits(data.produits || []);
      setNomEntreprise(data.nomEntreprise || slug);
      setEtat('produits');
    } catch (err) {
      setErreurMdp(err.response?.status === 401 ? 'Mot de passe incorrect' : 'Erreur lors de la connexion');
    } finally { setEnvoi(false); }
  };

  const categories = [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort();

  const filtres = produits.filter(p => {
    if (filtreCategorie && p.categorie !== filtreCategorie) return false;
    return !recherche || p.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      p.categorie?.toLowerCase().includes(recherche.toLowerCase());
  });

  const fmtPrix = (n) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  if (etat === 'chargement') return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  if (etat === 'introuvable') return (
    <div className="d-flex flex-column justify-content-center align-items-center text-center" style={{ height: '100vh', background: '#f8fafc' }}>
      <FontAwesomeIcon icon={faStore} size="3x" className="mb-3" style={{ color: '#cbd5e1' }} />
      <h5 className="fw-bold text-muted">Boutique introuvable</h5>
      <p className="text-muted small">Le lien que vous avez utilisé n'est pas valide.</p>
    </div>
  );

  if (etat === 'erreur') return (
    <div className="d-flex flex-column justify-content-center align-items-center text-center" style={{ height: '100vh', background: '#f8fafc' }}>
      <p className="text-muted">Une erreur est survenue. Veuillez réessayer.</p>
    </div>
  );

  if (etat === 'mdp') return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div className="card border-0 shadow" style={{ width: '100%', maxWidth: 380, borderRadius: 18 }}>
        <div className="card-body p-4 text-center">
          <div className="d-flex align-items-center justify-content-center mb-3"
            style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#0f2027,#203a43)', margin: '0 auto' }}>
            <FontAwesomeIcon icon={faStore} size="lg" style={{ color: '#00d4aa' }} />
          </div>
          <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>{nomEntreprise}</h5>
          <p className="text-muted small mb-4">Entrez le mot de passe pour accéder au catalogue</p>
          <form onSubmit={soumettre}>
            <div className="input-group mb-3">
              <input
                type={visible ? 'text' : 'password'}
                className={`form-control ${erreurMdp ? 'is-invalid' : ''}`}
                placeholder="Mot de passe..."
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                autoFocus required />
              <button type="button" className="btn btn-outline-secondary"
                onClick={() => setVisible(v => !v)}>
                <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} style={{ fontSize: 13 }} />
              </button>
              {erreurMdp && <div className="invalid-feedback text-start">{erreurMdp}</div>}
            </div>
            <button type="submit" className="btn w-100 text-white"
              style={{ background: '#00d4aa', borderRadius: 10 }} disabled={envoi}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : (
                <><FontAwesomeIcon icon={faLock} className="me-2" />Accéder</>
              )}
            </button>
          </form>
        </div>
        <div className="text-center pb-3" style={{ color: '#94a3b8', fontSize: 11 }}>
          Propulsé par <strong style={{ color: '#00d4aa' }}>GesTrack</strong>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>

      {/* ── En-tête fixe ── */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(135deg, #0f2027, #203a43)', zIndex: 10 }}>
        {/* Nom + icône sur une ligne */}
        <div className="d-flex flex-column align-items-center px-3 pt-3 pb-2">
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faStore} style={{ color: '#00d4aa', fontSize: 20 }} />
            <h5 className="fw-bold mb-0 text-white">{nomEntreprise}</h5>
          </div>
          <span className="small mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {produits.length} produit(s)
          </span>
        </div>
        {/* Barre de recherche + filtre catégorie */}
        <div className="px-3 pb-3 d-flex gap-2" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 13 }} />
            </span>
            <input className="form-control border-start-0 bg-white" placeholder="Rechercher un produit..."
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
                <div className="card border-0 shadow-sm h-100 d-flex flex-column" style={{ borderRadius: 14, overflow: 'hidden' }}>
                  <img src={p.image || defaultProduit} alt={p.nom}
                    style={{ width: '100%', height: 150, objectFit: 'cover', background: '#f0f4f8' }} />
                  <div className="card-body p-3 d-flex flex-column" style={{ gap: 8 }}>
                    {/* Titre */}
                    <div className="fw-semibold" style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.3 }}>{p.nom}</div>
                    {/* Stocks */}
                    <div className="d-flex gap-2 mt-auto">
                      {p.stockBoutique !== null && (
                        <div className="flex-grow-1 text-center rounded p-2"
                          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <div className="fw-bold" style={{ color: '#16a34a', fontSize: 13 }}>
                            {p.stockBoutique} <span style={{ fontSize: 10, fontWeight: 400 }}>{p.uniteBoutique}</span>
                          </div>
                          <div style={{ fontSize: 10, color: '#16a34a' }}>Boutique</div>
                        </div>
                      )}
                      {p.stockMagasin !== null && (
                        <div className="flex-grow-1 text-center rounded p-2"
                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                          <div className="fw-bold" style={{ color: '#1e40af', fontSize: 13 }}>
                            {p.stockMagasin} <span style={{ fontSize: 10, fontWeight: 400 }}>{p.uniteMagasin}</span>
                          </div>
                          <div style={{ fontSize: 10, color: '#1e40af' }}>Magasin</div>
                        </div>
                      )}
                    </div>

                    {/* Prix */}
                    {p.prixVente > 0 && (
                      <div className="fw-bold" style={{ color: '#00a881', fontSize: 15 }}>
                        {fmtPrix(p.prixVente)}
                      </div>
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
    </div>
  );
};

export default BoutiquePublique;
