// Page publique — boutique protégée par mot de passe (accessible via /[slug])
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faSpinner, faLock, faSearch, faEye, faEyeSlash, faTimes, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { vitrineAPI } from '@/services/api';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import BackToTop from '@/components/common/BackToTop';
import CarteProduit from '@/pages/public/boutique/components/CarteProduit';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const cleSession = (slug) => `gestrack_boutique_${slug}`;

const PRODUITS_PAR_CATEGORIE = 4;

// Session locale au visiteur — évite de retaper le mot de passe (et de relire Firestore)
// à chaque actualisation pendant 24h. Rien n'est envoyé au serveur, ça reste sur cet appareil.
const lireSession = (slug) => {
  try {
    const brut = localStorage.getItem(cleSession(slug));
    if (!brut) return null;
    const session = JSON.parse(brut);
    if (!session.expiresAt || Date.now() > session.expiresAt) {
      localStorage.removeItem(cleSession(slug));
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

const ecrireSession = (slug, produits, nomEntreprise) => {
  try {
    localStorage.setItem(cleSession(slug), JSON.stringify({
      produits, nomEntreprise, expiresAt: Date.now() + SESSION_TTL_MS,
    }));
  } catch {
    // stockage indisponible (navigation privée, quota...) — tant pis, la session ne persiste pas
  }
};

const BoutiquePublique = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [etat, setEtat]                 = useState('chargement'); // chargement | mdp | produits | erreur
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [produits, setProduits]         = useState([]);
  const [motDePasse, setMotDePasse]     = useState('');
  const [visible, setVisible]           = useState(false);
  const [erreurMdp, setErreurMdp]       = useState('');
  const [envoi, setEnvoi]               = useState(false);
  const [recherche, setRecherche]       = useState('');
  // La catégorie filtrée est reflétée dans l'URL (?categorie=...) pour que le lien copié/
  // partagé rouvre directement sur la même vue filtrée chez la personne qui le reçoit.
  const [filtreCategorie, setFiltreCategorieEtat] = useState(searchParams.get('categorie') || '');
  const [categoriesEtendues, setCategoriesEtendues] = useState({});

  const setFiltreCategorie = (valeur) => {
    setFiltreCategorieEtat(valeur);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (valeur) next.set('categorie', valeur); else next.delete('categorie');
      return next;
    }, { replace: true });
  };

  const partager = async () => {
    const lien = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: nomEntreprise || 'Boutique', url: lien }); }
      catch { /* partage annulé par la personne — rien à faire */ }
    } else {
      try {
        await navigator.clipboard.writeText(lien);
        toast.success('Lien copié dans le presse-papiers');
      } catch {
        toast.error('Impossible de copier le lien');
      }
    }
  };

  useEffect(() => {
    // Session déjà valide sur cet appareil (mot de passe entré il y a moins de 24h) — on
    // saute directement le prompt et l'appel réseau, aucune lecture Firestore nécessaire.
    const session = lireSession(slug);
    if (session) {
      setProduits(session.produits || []);
      setNomEntreprise(session.nomEntreprise || slug);
      setEtat('produits');
      return;
    }
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
      const nom = data.nomEntreprise || slug;
      setProduits(data.produits || []);
      setNomEntreprise(nom);
      setEtat('produits');
      ecrireSession(slug, data.produits || [], nom);
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

  // Vue par défaut (ni recherche, ni catégorie choisie dans le filtre) : produits regroupés
  // par catégorie, quelques-uns affichés par section — dès qu'on cherche ou qu'on choisit une
  // catégorie précise, on repasse en liste à plat (tous les résultats pertinents directement).
  const vueGroupee = !recherche && !filtreCategorie;
  const groupesParCategorie = vueGroupee
    ? filtres.reduce((acc, p) => {
        const cat = p.categorie || 'Autres';
        (acc[cat] = acc[cat] || []).push(p);
        return acc;
      }, {})
    : {};

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
          <button type="button" className="btn btn-light border flex-shrink-0"
            title="Partager ce lien"
            aria-label="Partager ce lien"
            onClick={partager}>
            <FontAwesomeIcon icon={faShareAlt} style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* ── Grille scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="container py-3" style={{ maxWidth: 960 }}>
          {filtres.length === 0 ? (
            <p className="text-muted text-center py-5">Aucun produit trouvé</p>
          ) : vueGroupee ? (
            Object.keys(groupesParCategorie).sort((a, b) => a.localeCompare(b, 'fr')).map(cat => {
              const liste = groupesParCategorie[cat];
              const etendu = !!categoriesEtendues[cat];
              const visibles = etendu ? liste : liste.slice(0, PRODUITS_PAR_CATEGORIE);
              return (
                <div key={cat} className="mb-4">
                  <h6 className="fw-bold mb-2" style={{ color: '#1e293b' }}>{cat}</h6>
                  <div className="row g-3">
                    {visibles.map(p => <CarteProduit key={p.id} p={p} />)}
                  </div>
                  {!etendu && liste.length > PRODUITS_PAR_CATEGORIE && (
                    <div className="text-end mt-2">
                      <button type="button" className="px-4 btn btn-sm border"
                        style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }}
                        onClick={() => setCategoriesEtendues(prev => ({ ...prev, [cat]: true }))}>
                        Voir plus [ {liste.length - PRODUITS_PAR_CATEGORIE} ]
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="row g-3">
              {filtres.map(p => <CarteProduit key={p.id} p={p} />)}
            </div>
          )}
          <div className="text-center py-3 mt-2" style={{ color: '#94a3b8', fontSize: 12 }}>
            Propulsé par <strong style={{ color: '#00d4aa' }}>GesTrack</strong>
          </div>
        </div>
      </div>

      <BackToTop />
    </div>
  );
};

export default BoutiquePublique;
