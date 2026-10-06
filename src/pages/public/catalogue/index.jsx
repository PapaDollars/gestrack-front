// Page publique — catalogue produits boutique (accessible sans connexion)
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore, faSpinner, faSearch, faTimes, faComment, faShareAlt,
  faBolt, faFire, faHeart, faClockRotateLeft, faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { vitrineAPI } from '@/services/api';
import logoApp from '@/assets/img/logo_apk.png';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import BackToTop from '@/components/common/BackToTop';
import CarteProduit from '@/pages/public/catalogue/components/CarteProduit';
import CarteCollection from '@/pages/public/catalogue/components/CarteCollection';
import ModalProduit from '@/pages/public/catalogue/modals/ModalProduit';
import ModalMessage from '@/pages/public/catalogue/modals/ModalMessage';

// Slug de la seule boutique ayant actuellement une app Play Store publiée — son logo ne doit
// s'afficher que là, jamais sur le catalogue générique utilisé par les autres comptes.
const SLUG_APP_PUBLIEE = 'magasin-coup-doeil';

const PRODUITS_PAR_CATEGORIE = 4;

// ── Page principale ───────────────────────────────────────────────────────────
const CataloguePublic = () => {
  const { slug } = useParams();
  // Vrai uniquement quand la page tourne dans l'app Android installée (TWA) ou une PWA
  // ajoutée à l'écran d'accueil — jamais dans un onglet de navigateur classique. Permet
  // d'afficher le vrai logo de la boutique au lieu de l'icône générique, sans jamais le
  // faire apparaître sur le catalogue web public (qui change de boutique à chaque compte).
  const [modeAppInstallee, setModeAppInstallee] = useState(false);
  useEffect(() => {
    setModeAppInstallee(window.matchMedia?.('(display-mode: standalone)').matches || false);
  }, []);
  const [searchParams, setSearchParams]     = useSearchParams();
  const [produits, setProduits]             = useState([]);
  const [nomEntreprise, setNomEntreprise]   = useState('');
  const [chargement, setChargement]         = useState(true);
  const [erreur, setErreur]                 = useState('');
  const [recherche, setRecherche]           = useState('');
  // La catégorie filtrée est reflétée dans l'URL (?categorie=...) pour que le lien copié/
  // partagé rouvre directement sur la même vue filtrée chez la personne qui le reçoit.
  const [filtreCategorie, setFiltreCategorieEtat] = useState(searchParams.get('categorie') || '');
  const [produitDetail, setProduitDetail]   = useState(null);
  const [messageCtx, setMessageCtx]         = useState(null);
  const [categoriesEtendues, setCategoriesEtendues] = useState({});
  const [categoriesPourVous, setCategoriesPourVous] = useState([]);
  const [historiqueIds, setHistoriqueIds]   = useState([]);
  // Collection ouverte en plein écran (nouveautes/populaire/pourVous/historique) — null = vue
  // par défaut avec les 4 tuiles. Un état local suffit, pas besoin de l'URL pour un "retour".
  const [collectionOuverte, setCollectionOuverte] = useState(null);

  // Identifiant anonyme persistant (aucun compte requis) — sert uniquement à faire tenir
  // "Pour vous"/"Historique" côté serveur, jamais transmis ni recoupé avec quoi que ce soit
  // d'identifiant réel du visiteur.
  const [visiteurId] = useState(() => {
    const CLE = 'gestrack_visiteur_id';
    try {
      let id = localStorage.getItem(CLE);
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(CLE, id);
      }
      return id;
    } catch {
      return null; // stockage indisponible (navigation privée stricte) — les rangées personnalisées restent simplement vides
    }
  });

  const ouvrirDetail = (p) => {
    setProduitDetail(p);
    if (visiteurId) {
      vitrineAPI.enregistrerVue(slug, { visiteurId, produitId: p.id, categorie: p.categorie || '' }).catch(() => {});
    }
  };

  const setFiltreCategorie = (valeur) => {
    setFiltreCategorieEtat(valeur);
    setCollectionOuverte(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (valeur) next.set('categorie', valeur); else next.delete('categorie');
      return next;
    }, { replace: true });
  };

  const partager = async () => {
    const lien = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: nomEntreprise || 'Catalogue', url: lien }); }
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
    const chargerCatalogue = () => {
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
    };
    chargerCatalogue();
    // La page ne se recharge jamais toute seule — un visiteur qui garde l'onglet ouvert
    // continuerait sinon de voir les produits/prix du moment de son arrivée indéfiniment.
    // Ce sondage la rafraîchit automatiquement toutes les 24h (aligné sur le cache serveur).
    const interval = setInterval(chargerCatalogue, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [slug]);

  useEffect(() => {
    if (!visiteurId) return;
    vitrineAPI.getPourVous(slug, visiteurId)
      .then(({ data }) => setCategoriesPourVous(data.categories || []))
      .catch(() => {});
    vitrineAPI.getHistorique(slug, visiteurId)
      .then(({ data }) => setHistoriqueIds(data.produitIds || []))
      .catch(() => {});
  }, [slug, visiteurId]);

  const categories = [...new Set(produits.map(p => p.categorie).filter(Boolean))].sort();

  const LIMITE_COLLECTION = 24;
  const nouveautes = [...produits]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, LIMITE_COLLECTION);
  const populaires = [...produits]
    .filter(p => p.vuesCatalogue > 0)
    .sort((a, b) => b.vuesCatalogue - a.vuesCatalogue)
    .slice(0, LIMITE_COLLECTION);
  const pourVous = categoriesPourVous.length === 0 ? [] : produits
    .filter(p => categoriesPourVous.includes(p.categorie))
    .slice(0, LIMITE_COLLECTION);
  const produitsParId = new Map(produits.map(p => [p.id, p]));
  const historique = historiqueIds
    .map(id => produitsParId.get(id))
    .filter(Boolean);

  const COLLECTIONS = {
    nouveautes: { titre: 'Nouveautés', icone: faBolt,           produits: nouveautes },
    populaire:  { titre: 'Populaire',  icone: faFire,           produits: populaires },
    pourVous:   { titre: 'Pour vous',  icone: faHeart,          produits: pourVous   },
    historique: { titre: 'Historique', icone: faClockRotateLeft, produits: historique },
  };

  const filtres = produits.filter(p => {
    if (filtreCategorie && p.categorie !== filtreCategorie) return false;
    return !recherche ||
      p.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      p.categorie?.toLowerCase().includes(recherche.toLowerCase());
  });

  // Vue par défaut (ni recherche, ni catégorie choisie dans le filtre) : produits regroupés
  // par catégorie, 6 affichés par section pour ne pas tout charger visuellement d'un coup —
  // dès qu'on cherche ou qu'on choisit une catégorie précise, on repasse en liste à plat
  // (l'utilisateur veut alors voir tous les résultats pertinents directement).
  const vueGroupee = !recherche && !filtreCategorie;
  const groupesParCategorie = vueGroupee
    ? filtres.reduce((acc, p) => {
        const cat = p.categorie || 'Autres';
        (acc[cat] = acc[cat] || []).push(p);
        return acc;
      }, {})
    : {};

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
            {modeAppInstallee && slug === SLUG_APP_PUBLIEE ? (
              <img src={logoApp} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <FontAwesomeIcon icon={faStore} style={{ color: '#00d4aa', fontSize: 20 }} />
            )}
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
              value={recherche}
              onChange={e => { setRecherche(e.target.value); setCollectionOuverte(null); }} />
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
            title="Partager la catégorie selectionner"
            aria-label="Partager ce lien"
            onClick={partager}>
            <FontAwesomeIcon icon={faShareAlt} style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* ── Grille scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="container py-3" style={{ maxWidth: 960 }}>
          {collectionOuverte ? (
            <div>
              <button type="button"
                className="btn btn-sm d-flex align-items-center gap-2 mb-3"
                style={{ background: 'var(--bs-secondary-bg, #f1f5f9)', color: '#1e293b', borderRadius: 8 }}
                onClick={() => setCollectionOuverte(null)}>
                <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 13 }} />
                Retour
              </button>
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1e293b' }}>
                <FontAwesomeIcon icon={COLLECTIONS[collectionOuverte].icone} style={{ fontSize: 14, color: '#00a881' }} />
                {COLLECTIONS[collectionOuverte].titre}
              </h6>
              <div className="row g-3">
                {COLLECTIONS[collectionOuverte].produits.map(p => (
                  <CarteProduit key={p.id} p={p} onOuvrir={ouvrirDetail}
                    onReserver={produit => setMessageCtx({ produit })} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {vueGroupee && produits.length > 0 && (
                <div className="row g-3 mb-4">
                  {Object.entries(COLLECTIONS).filter(([, c]) => c.produits.length > 0).map(([cle, c]) => (
                    <CarteCollection key={cle} titre={c.titre} icone={c.icone}
                      image={c.produits[0]?.image} onClick={() => setCollectionOuverte(cle)} />
                  ))}
                </div>
              )}
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
                        {visibles.map(p => (
                          <CarteProduit key={p.id} p={p} onOuvrir={ouvrirDetail}
                            onReserver={produit => setMessageCtx({ produit })} />
                        ))}
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
                  {filtres.map(p => (
                    <CarteProduit key={p.id} p={p} onOuvrir={ouvrirDetail}
                      onReserver={produit => setMessageCtx({ produit })} />
                  ))}
                </div>
              )}
            </>
          )}
          <div className="text-center py-3 mt-2" style={{ color: '#94a3b8', fontSize: 12 }}>
            Propulsé par <strong style={{ color: '#00d4aa' }}>GesTrack</strong>
          </div>
        </div>
      </div>

      {/* Bouton flottant — contact général avec la boutique */}
      <button
        onClick={() => setMessageCtx({ general: true })}
        aria-label="Contacter la boutique"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1050,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: '#25d366', color: '#fff',
          boxShadow: '0 4px 16px rgba(37,211,102,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
        <FontAwesomeIcon icon={faComment} style={{ fontSize: 24 }} />
      </button>

      {/* Décalé au-dessus du bouton de contact pour ne pas le chevaucher */}
      <BackToTop bottom={96} />

      {/* Modal détail */}
      <ModalProduit produit={produitDetail} onFermer={() => setProduitDetail(null)} />

      {/* Modal message — réservation produit ou contact général */}
      <ModalMessage ctx={messageCtx} slug={slug} onFermer={() => setMessageCtx(null)} />
    </div>
  );
};

export default CataloguePublic;
