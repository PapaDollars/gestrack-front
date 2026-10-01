// Page publique — catalogue produits boutique (accessible sans connexion)
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStore, faSpinner, faSearch, faTimes, faComment, faCheckCircle, faShareAlt,
  faBolt, faFire, faHeart, faClockRotateLeft, faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'react-toastify';
import { vitrineAPI, estMisEnAttente } from '@/services/api';
import defaultProduit from '@/assets/img/defaultProduit.png';
import AutocompleteFiltre from '@/components/shared/AutocompleteFiltre';
import BackToTop from '@/components/common/BackToTop';

const fmtPrix = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const PRODUITS_PAR_CATEGORIE = 4;

// ── Carte produit — utilisée à la fois dans la vue groupée par catégorie et la vue à plat
// (recherche / catégorie unique sélectionnée) pour ne pas dupliquer ce balisage deux fois ──
const CarteProduit = ({ p, onOuvrir, onReserver }) => (
  <div className="col-6 col-md-4 col-lg-3">
    <div
      className="card border-0 shadow-sm h-100"
      style={{ borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => onOuvrir(p)}>
      <img src={p.image || defaultProduit} alt={p.nom}
        style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', background: '#f0f4f8' }} />
      <div className="card-body p-3">
        <div className="fw-semibold" style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.3 }}>
          {p.nom}
        </div>
        {p.prixVente !== undefined && (
          <div className="fw-bold mt-1" style={{ color: '#00a881', fontSize: 15 }}>{fmtPrix(p.prixVente)}</div>
        )}
        {!p.enStock && (
          <span className="badge mt-2" style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10 }}>
            Épuisé
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onReserver(p); }}
          className="btn btn-sm w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
          style={{ background: 'rgba(37,211,102,0.12)', color: '#16a34a', borderRadius: 8, fontSize: 12 }}>
          <FontAwesomeIcon icon={faComment} style={{ fontSize: 12 }} />
          Réserver
        </button>
      </div>
    </div>
  </div>
);

// ── Carte "collection" — tuile fixe (pas de défilement) pour les 4 rangées Nouveautés/
// Populaire/Pour vous/Historique : photo d'un produit représentatif en fond flouté/assombri,
// titre en surimpression. Cliquer ouvre la liste complète de cette collection ────────────────
const CarteCollection = ({ titre, icone, image, onClick }) => (
  <div className="col-6 col-md-3">
    <div
      className="shadow-sm"
      style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '2 / 1', cursor: 'pointer' }}
      onClick={onClick}>
      <img src={image || defaultProduit} alt=""
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          filter: 'blur(2px) brightness(0.8)', transform: 'scale(1.06)',
        }} />
      <div className="d-flex flex-column align-items-center justify-content-center gap-2 text-center px-2"
        style={{ position: 'absolute', inset: 0 }}>
        <FontAwesomeIcon icon={icone} style={{ color: '#fff', fontSize: 20 }} />
        <span className="fw-bold text-white" style={{ fontSize: 15, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          {titre}
        </span>
      </div>
    </div>
  </div>
);

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
          <h5 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: 20 }}>{produit.nom}</h5>
          {produit.prixVente !== undefined && (
            <div className="fw-bold mb-2" style={{ color: '#00a881', fontSize: 18 }}>{fmtPrix(produit.prixVente)}</div>
          )}
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

// ── Modal message — réservation d'un produit (ctx.produit) ou contact général (ctx.general) ──
// N'envoie jamais de vrai message WhatsApp : le style reprend juste l'affordance reconnaissable
// d'un bouton de contact — le message est stocké côté serveur et lu par la boutique dans son
// menu "Messages" (voir routes/messages.js côté backend).
const ModalMessage = ({ ctx, slug, onFermer }) => {
  const produit = ctx?.produit || null;
  const [message, setMessage]   = useState('');
  const [nom, setNom]           = useState('');
  const [telephone, setTelephone] = useState('');
  const [envoi, setEnvoi]       = useState(false);
  const [envoye, setEnvoye]     = useState(false);

  useEffect(() => {
    if (!ctx) return;
    setMessage(produit ? `Bonjour, je souhaite réserver le produit "${produit.nom}".` : '');
    setNom('');
    setTelephone('');
    setEnvoye(false);
  }, [ctx]); // eslint-disable-line

  if (!ctx) return null;

  const soumettre = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const telephonePropre = telephone.replace(/\D/g, '');
    if (!/^6\d{8}$/.test(telephonePropre)) {
      toast.error('Numéro invalide — format attendu : 6XX XXX XXX (9 chiffres)');
      return;
    }
    setEnvoi(true);
    try {
      const reponse = await vitrineAPI.envoyerMessage(slug, {
        produitId:  produit?.id  || null,
        produitNom: produit?.nom || '',
        message, nom, telephone: telephonePropre,
      });
      if (estMisEnAttente(reponse)) { setEnvoye(true); return; }
      setEnvoye(true);
    } catch {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1060, padding: 16 }}
      onClick={onFermer}>
      <div className="bg-white rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: 420 }}
        onClick={e => e.stopPropagation()}>
        <div className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0" style={{ color: '#1e293b' }}>
              {produit ? 'Réserver ce produit' : 'Contacter la boutique'}
            </h6>
            <button onClick={onFermer} className="btn btn-sm btn-light rounded-circle">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {envoye ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faCheckCircle} size="2x" style={{ color: '#25d366' }} className="mb-3" />
              <p className="mb-0" style={{ color: '#334155' }}>Votre message a été envoyé à la boutique.</p>
              <p className="mb-0 small text-muted mt-1">Vous serez recontacté(e) dans les 24h qui suivent.</p>
              <button className="btn btn-sm mt-3 text-white" style={{ background: '#00d4aa' }} onClick={onFermer}>
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={soumettre}>
              {produit && (
                <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded-3" style={{ background: '#f8fafc' }}>
                  <img src={produit.image || defaultProduit} alt=""
                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />
                  <span className="small fw-semibold" style={{ color: '#1e293b' }}>{produit.nom}</span>
                </div>
              )}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Votre message</label>
                <textarea className="form-control" rows={3} required autoFocus
                  value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Votre nom *</label>
                <input className="form-control" required
                  value={nom} onChange={e => setNom(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Votre téléphone / WhatsApp *</label>
                <input type="tel" className="form-control" required inputMode="numeric" placeholder="Ex: 6XX XXX XXX"
                  value={telephone} onChange={e => setTelephone(e.target.value)} />
              </div>
              <button type="submit" disabled={envoi}
                className="btn w-100 text-white d-flex align-items-center justify-content-center gap-2"
                style={{ background: '#25d366', borderRadius: 10 }}>
                {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faWhatsapp} />}
                Envoyer le message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────
const CataloguePublic = () => {
  const { slug } = useParams();
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
