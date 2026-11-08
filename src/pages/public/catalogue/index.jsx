// Page publique — catalogue produits boutique (accessible sans connexion)
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore, faSearch, faTimes, faComment, faShareAlt,
  faBolt, faFire, faHeart, faClockRotateLeft, faArrowLeft, faChevronRight, faStar, faTag,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { vitrineAPI } from '@/services/api';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import BackToTop, { BOTTOM_AU_DESSUS_BARRE } from '@/components/common/BackToTop';
import EcranChargement from '@/components/common/EcranChargement';
import CarteProduit from '@/pages/public/catalogue/components/CarteProduit';
import BandeauAppli from '@/pages/public/catalogue/components/BandeauAppli';
import CarteCollection from '@/pages/public/catalogue/components/CarteCollection';
import RangeeDefilante from '@/pages/public/catalogue/components/RangeeDefilante';
import ModalProduit from '@/pages/public/catalogue/modals/ModalProduit';
import ModalMessage from '@/pages/public/catalogue/modals/ModalMessage';
import useTitrePage from '@/hooks/useTitrePage';
import LiensLegaux from '@/pages/public/components/LiensLegaux';
import LogoBoutique from '@/pages/public/components/LogoBoutique';
import BarreNavigation from '@/pages/public/components/BarreNavigation';
import VoletCategories from '@/pages/public/components/VoletCategories';
import useMasquerAuDefilement from '@/hooks/useMasquerAuDefilement';
import { dansCategorie, estFlash, estSoldes } from '@/utils/soldes';
import { memoriserMarqueBoutique } from '@/utils/marque';

// Produits montrés dans la rangée d'une catégorie (vue par défaut) ; « Voir tout » pour le reste
const PRODUITS_PAR_CATEGORIE = 8;

// ── Page principale ───────────────────────────────────────────────────────────

// Produits déjà consultés aujourd'hui sur ce catalogue (mémoire du navigateur) : la vue
// n'est envoyée qu'une fois par jour et par produit
const dejaVuAujourdhui = (slug, produitId) => {
  try {
    const cle = `gestrack_vues_${slug}`;
    const jour = new Date().toISOString().slice(0, 10);
    const vues = JSON.parse(localStorage.getItem(cle) || '{}');
    if (vues._jour !== jour) { localStorage.setItem(cle, JSON.stringify({ _jour: jour, [produitId]: 1 })); return false; }
    if (vues[produitId]) return true;
    vues[produitId] = 1;
    localStorage.setItem(cle, JSON.stringify(vues));
    return false;
  } catch { return false; } // stockage indisponible : la vue est envoyée (le serveur dédoublonne aussi)
};

const CataloguePublic = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams]     = useSearchParams();
  const [produits, setProduits]             = useState([]);
  const [nomEntreprise, setNomEntreprise]   = useState('');
  // Logo de l'entreprise (forfait payant), à la place de l'icône de boutique
  const [marque, setMarque]                 = useState(null); // { logo, forme }
  const [chargement, setChargement]         = useState(true);
  const [erreur, setErreur]                 = useState('');
  const [recherche, setRecherche]           = useState('');
  // La catégorie filtrée est reflétée dans l'URL (?categorie=...) pour que le lien copié/
  // partagé rouvre directement sur la même vue filtrée chez la personne qui le reçoit.
  const [filtreCategorie, setFiltreCategorieEtat] = useState(searchParams.get('categorie') || '');
  const [produitDetail, setProduitDetail]   = useState(null);
  const [messageCtx, setMessageCtx]         = useState(null);
  const [categoriesPourVous, setCategoriesPourVous] = useState([]);
  const [historiqueIds, setHistoriqueIds]   = useState([]);
  // Collection ouverte en plein écran (nouveautes/populaire/pourVous/historique) — null = vue
  // par défaut avec les 4 tuiles. Un état local suffit, pas besoin de l'URL pour un "retour".
  const [collectionOuverte, setCollectionOuverte] = useState(null);
  // Rangées de catégorie défilées jusqu'au bout : leur bouton « Voir tout » du titre est masqué
  // (la carte « Voir tout » en fin de rangée est alors visible)
  const [rangeesAuBout, setRangeesAuBout] = useState({});
  // Volet « Catégories » (barre du bas, mobile)
  const [voletOuvert, setVoletOuvert] = useState(false);

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

  useTitrePage(produitDetail
    ? `${produitDetail.nom} — ${nomEntreprise || 'Catalogue'}`
    : nomEntreprise ? `${nomEntreprise} — Catalogue` : 'Catalogue');

  // Fiche produit ouverte = lien partageable (?produit=<id>) ; fermée = retiré de l'URL
  const majProduitUrl = (id) => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    if (id) next.set('produit', id); else next.delete('produit');
    return next;
  }, { replace: true });

  const fermerDetail = () => { setProduitDetail(null); majProduitUrl(null); };

  const ouvrirDetail = (p) => {
    setProduitDetail(p);
    majProduitUrl(p.id);
    // Une vue par produit et par jour suffit (chaque vue coûte des écritures côté serveur)
    if (visiteurId && !dejaVuAujourdhui(slug, p.id)) {
      vitrineAPI.enregistrerVue(slug, { visiteurId, produitId: p.id, categorie: p.categorie || '' }).catch(() => {});
    }
  };

  // Zone qui défile (la page elle-même ne défile pas) : remise en haut quand on change de vue
  const zoneDefilementRef = useRef(null);
  // En descendant : en-tête replié (seule la recherche reste) et barre du bas cachée
  const masque = useMasquerAuDefilement(zoneDefilementRef);

  const setFiltreCategorie = (valeur) => {
    zoneDefilementRef.current?.scrollTo({ top: 0 });
    setFiltreCategorieEtat(valeur);
    setCollectionOuverte(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (valeur) next.set('categorie', valeur); else next.delete('categorie');
      return next;
    }, { replace: true });
  };

  // « Voir tout » d'une catégorie ou carte collection : on retient où on était dans la page,
  // et « Retour » y ramène (au lieu du haut de la page). La position est remise une fois la
  // vue par défaut ré-affichée (effet ci-dessous).
  const positionAvantRef = useRef(null);
  const positionARestaurer = useRef(null);
  const ouvrirVue = (ouvrir) => {
    positionAvantRef.current = zoneDefilementRef.current?.scrollTop ?? 0;
    ouvrir();
  };
  const revenir = (fermer) => {
    positionARestaurer.current = positionAvantRef.current;
    positionAvantRef.current = null;
    fermer();
  };
  useEffect(() => {
    if (positionARestaurer.current == null || filtreCategorie || collectionOuverte) return;
    zoneDefilementRef.current?.scrollTo({ top: positionARestaurer.current });
    positionARestaurer.current = null;
  }, [filtreCategorie, collectionOuverte]);

  const partager = async () => {
    const lien = window.location.href;
    if (navigator.share) {
      // Texte adapté à ce qu'on partage : la boutique entière ou la catégorie affichée
      const nom = nomEntreprise || 'Catalogue';
      const texte = filtreCategorie ? `${filtreCategorie} — ${nom}` : `Découvrez ${nom}`;
      try { await navigator.share({ title: texte, text: texte, url: lien }); }
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

  // « Accueil » (barre du bas) : vue par défaut, en haut de la page
  const allerAccueil = () => {
    positionAvantRef.current = null;
    setRecherche('');
    setFiltreCategorie('');
  };
  const choisirCategorie = (cat) => {
    setVoletOuvert(false);
    positionAvantRef.current = null;
    setRecherche('');
    setFiltreCategorie(cat);
  };

  useEffect(() => {
    const chargerCatalogue = () => {
      vitrineAPI.getCatalogue(slug)
        .then(({ data }) => {
          setProduits(data.produits || []);
          setNomEntreprise(data.nomEntreprise || '');
          setMarque(data.marque || null);
          memoriserMarqueBoutique(slug, data.marque); // écran de chargement des prochaines ouvertures
          // Lien direct vers un produit (partagé depuis sa fiche) : fiche ouverte d'emblée
          const idPartage = new URLSearchParams(window.location.search).get('produit');
          const partage = idPartage && (data.produits || []).find(p => p.id === idPartage);
          if (partage) setProduitDetail(partage);
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

  // Soldes et Vente Flash ne sont plus dans le filtre des catégories : ils ont leur carte dans
  // la rangée défilante (plus visible). Un ancien lien ?categorie=Soldes filtre toujours.
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

  // Ordre d'affichage de la rangée défilante : les promotions en premier. Une carte n'apparaît
  // que si elle contient au moins un produit (filtre plus bas).
  const COLLECTIONS = {
    venteFlash: { titre: 'Vente Flash', icone: faBolt,          produits: produits.filter(estFlash) },
    soldes:     { titre: 'Soldes',     icone: faTag,            produits: produits.filter(estSoldes) },
    nouveautes: { titre: 'Nouveautés', icone: faStar,           produits: nouveautes },
    populaire:  { titre: 'Populaire',  icone: faFire,           produits: populaires },
    pourVous:   { titre: 'Pour vous',  icone: faHeart,          produits: pourVous   },
    historique: { titre: 'Historique', icone: faClockRotateLeft, produits: historique },
  };

  const filtres = produits.filter(p => {
    if (filtreCategorie && !dansCategorie(p, filtreCategorie)) return false;
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

  if (chargement) return <EcranChargement />;

  if (erreur) return (
    <div data-bs-theme="light" className="d-flex flex-column justify-content-center align-items-center text-center"
      style={{ height: '100vh' }}>
      <FontAwesomeIcon icon={faStore} size="3x" className="mb-3" style={{ color: '#cbd5e1' }} />
      <p className="text-muted">{erreur}</p>
    </div>
  );

  // data-bs-theme="light" : la page publique reste toujours claire, même si le compte connecté
  // sur cet appareil utilise le thème sombre ou « système » — on voit ce que voient les clients
  return (
    <div data-bs-theme="light" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>

      {/* ── Bandeau « Télécharger l'appli » (Android, hors appli) ── */}
      <BandeauAppli slug={slug} />

      {/* ── En-tête fixe ── */}
      <div style={{ flexShrink: 0, background: 'linear-gradient(135deg, #0f2027, #203a43)', zIndex: 10 }}>
        {/* Logo + nom : replié quand on descend (seule la recherche reste fixée) */}
        <div style={{ maxHeight: masque ? 0 : 90, opacity: masque ? 0 : 1, overflow: 'hidden', transition: 'max-height .25s ease, opacity .2s' }}>
          <div className="d-flex align-items-center justify-content-center gap-2 px-3 pt-3 pb-2">
            <LogoBoutique logo={marque?.logo} forme={marque?.forme} />
            <h5 className="fw-bold mb-0 text-white text-truncate">{nomEntreprise || 'Catalogue'}</h5>
          </div>
        </div>
        <div className="px-3 pb-3 d-flex gap-2" style={{ maxWidth: 600, margin: '0 auto', width: '100%', paddingTop: masque ? 12 : 0, transition: 'padding .25s' }}>
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
          {/* Sur mobile, les catégories sont dans la barre du bas */}
          {categories.length > 0 && (
            <div className="d-none d-md-block" style={{ minWidth: 150 }}>
              <AutocompleteFiltre options={categories} value={filtreCategorie}
                onChange={setFiltreCategorie} placeholder="Catégories" />
            </div>
          )}
          <button type="button" className="btn btn-light border flex-shrink-0"
            title={filtreCategorie ? `Partager la catégorie ${filtreCategorie}` : 'Partager la boutique'}
            aria-label="Partager ce lien"
            onClick={partager}>
            <FontAwesomeIcon icon={faShareAlt} style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {/* ── Grille scrollable ── */}
      <div ref={zoneDefilementRef} style={{ flex: 1, overflowY: 'auto' }}>
        <div className="container py-3" style={{ maxWidth: 960 }}>
          {collectionOuverte ? (
            <div>
              <button type="button"
                className="btn btn-sm d-flex align-items-center gap-2 mb-3"
                style={{ background: 'var(--bs-secondary-bg, #f1f5f9)', color: '#1e293b', borderRadius: 8 }}
                onClick={() => revenir(() => setCollectionOuverte(null))}>
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
                <RangeeDefilante className="mb-3" apercu={0.4 /* rangée Vente Flash… : 30 % de la 3e carte */}>
                  {Object.entries(COLLECTIONS).filter(([, c]) => c.produits.length > 0).map(([cle, c]) => (
                    <CarteCollection key={cle} titre={c.titre} icone={c.icone}
                      images={c.produits.map(p => p.image)} onClick={() => ouvrirVue(() => {
                        zoneDefilementRef.current?.scrollTo({ top: 0 }); setCollectionOuverte(cle);
                      })} />
                  ))}
                </RangeeDefilante>
              )}
              {filtres.length === 0 ? (
                <p className="text-muted text-center py-5">Aucun produit trouvé</p>
              ) : vueGroupee ? (
                Object.keys(groupesParCategorie).sort((a, b) => a.localeCompare(b, 'fr')).map(cat => {
                  const liste = groupesParCategorie[cat];
                  const restants = liste.length - PRODUITS_PAR_CATEGORIE;
                  return (
                    <div key={cat} className="mb-3">
                      {/* Titre + « Voir tout +N » sur la même ligne : vu avant les produits */}
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <h2 className="fw-bold mb-0 text-truncate" style={{ color: '#1e293b', fontSize: 17 }}>{cat}</h2>
                        {restants > 0 && (
                          <button type="button" className="btn btn-sm fw-semibold d-flex align-items-center gap-1 flex-shrink-0"
                            tabIndex={rangeesAuBout[cat] ? -1 : 0}
                            style={{ background: '#fff460', color: '#223322', borderRadius: 999, border: 'none', padding: '4px 12px', fontSize: 13,
                              transition: 'opacity .2s', opacity: rangeesAuBout[cat] ? 0 : 1, visibility: rangeesAuBout[cat] ? 'hidden' : 'visible' }}
                            onClick={() => ouvrirVue(() => setFiltreCategorie(cat))}>
                            Voir tout +{restants}
                            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 11 }} />
                          </button>
                        )}
                      </div>
                      <RangeeDefilante onFin={restants > 0 ? (auBout => {
                        if (!!rangeesAuBout[cat] !== auBout) setRangeesAuBout(prev => ({ ...prev, [cat]: auBout }));
                      }) : undefined}>
                        {liste.slice(0, PRODUITS_PAR_CATEGORIE).map(p => (
                          <CarteProduit key={p.id} p={p} enRangee onOuvrir={ouvrirDetail}
                            onReserver={produit => setMessageCtx({ produit })} />
                        ))}
                        {/* En bout de rangée : carte « Voir tout » (même hauteur que les produits) */}
                        {restants > 0 && (
                          <div>
                            <button type="button" onClick={() => ouvrirVue(() => setFiltreCategorie(cat))}
                              className="card border-0 shadow-sm h-100 w-100 d-flex flex-column align-items-center justify-content-center gap-2 text-center p-3"
                              style={{ borderRadius: 14, background: '#fffde0', color: '#223322' }}>
                              <span className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{ width: 44, height: 44, background: '#fff460' }}>
                                <FontAwesomeIcon icon={faChevronRight} />
                              </span>
                              <span className="fw-semibold">Voir tout</span>
                              <span className="small text-muted">+{restants} produit{restants > 1 ? 's' : ''}</span>
                            </button>
                          </div>
                        )}
                      </RangeeDefilante>
                    </div>
                  );
                })
              ) : (
                <>
                {filtreCategorie && !recherche && (
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <button type="button" className="btn btn-sm d-flex align-items-center gap-2 flex-shrink-0"
                      style={{ background: 'var(--bs-secondary-bg, #f1f5f9)', color: '#1e293b', borderRadius: 8 }}
                      onClick={() => revenir(() => setFiltreCategorie(''))}>
                      <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 13 }} />
                      Retour
                    </button>
                    <h2 className="fw-bold mb-0 text-truncate" style={{ color: '#1e293b', fontSize: 17 }}>
                      {filtreCategorie} <span className="text-muted fw-normal" style={{ fontSize: 14 }}>({filtres.length})</span>
                    </h2>
                  </div>
                )}
                <div className="row g-3">
                  {filtres.map(p => (
                    <CarteProduit key={p.id} p={p} onOuvrir={ouvrirDetail}
                      onReserver={produit => setMessageCtx({ produit })} />
                  ))}
                </div>
                </>
              )}
            </>
          )}
          <div className="text-center py-3 mt-2" style={{ color: '#94a3b8', fontSize: 12 }}>
            <div className="mb-1">Prix et disponibilités indicatifs, fixés par la boutique.</div>
            <div className="mb-2">Propulsé par <strong style={{ color: '#00d4aa' }}>GesTrack</strong></div>
            <LiensLegaux avecContact={false} />
          </div>
          {/* Place pour la barre du bas (mobile) */}
          <div className="d-md-none" style={{ height: 72 }} />
        </div>
      </div>

      {/* Bouton flottant — contact général avec la boutique (ordinateur ; sur mobile : barre du bas) */}
      <button
        className="d-none d-md-flex"
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

      {/* Décalé au-dessus du bouton de contact / de la barre du bas pour ne pas les chevaucher */}
      <BackToTop bottom={BOTTOM_AU_DESSUS_BARRE} />

      {/* Barre du bas (mobile) : Accueil · Catégories · Contact */}
      <BarreNavigation
        actif={voletOuvert || filtreCategorie ? 'categories' : (!recherche && !collectionOuverte ? 'accueil' : null)}
        onAccueil={allerAccueil}
        onCategories={() => setVoletOuvert(true)}
        onContact={() => setMessageCtx({ general: true })} />
      <VoletCategories ouvert={voletOuvert} actif={filtreCategorie} onChoisir={choisirCategorie}
        onFermer={() => setVoletOuvert(false)}
        categories={categories.map(nom => ({ nom, nombre: produits.filter(p => p.categorie === nom).length }))} />

      {/* Modal détail */}
      <ModalProduit produit={produitDetail} slug={slug} nomEntreprise={nomEntreprise} onFermer={fermerDetail} />

      {/* Modal message — réservation produit ou contact général */}
      <ModalMessage ctx={messageCtx} slug={slug} onFermer={() => setMessageCtx(null)} />
    </div>
  );
};

export default CataloguePublic;
