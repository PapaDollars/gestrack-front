// Inventaire — écran de comptage d'un lieu (Boutique ou Magasin), versions Pro.
// Une session est lancée depuis la page Boutique / Magasin (ModalLancerInventaire) ; ici on
// compte produit par produit, puis on valide les écarts (ModalValidation).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faQrcode, faClockRotateLeft, faSpinner, faRotate,
  faClipboardCheck, faTags, faTrash, faSearch, faTimes, faUser,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { inventairesAPI, produitsAPI, magasinAPI } from '@/services/api';
import { ROUTES } from '@/utils/url/frontend';
import { moduleExclu, demanderPassagePro, estModeLimite } from '@/utils/acces';
import { imprimerEtiquettesQR } from '@/utils/pdfTemplates';
import useTitrePage from '@/hooks/useTitrePage';
import useIsMobile from '@/hooks/useIsMobile';
import useDepots, { nomDepot } from '@/hooks/useDepots';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import LigneInventaire from '@/pages/inventaire/components/LigneInventaire';
import ModalLancerInventaire from '@/pages/inventaire/modals/ModalLancerInventaire';
import ModalValidation from '@/pages/inventaire/modals/ModalValidation';
import ModalHistoriqueInventaires from '@/pages/inventaire/modals/ModalHistoriqueInventaires';
import ModalScanner from '@/pages/inventaire/modals/ModalScanner';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import { categoriesAvecSoldes, dansCategorie, styleCategorie, iconeCategorie } from '@/utils/soldes';
import {
  LIEUX, dansPerimetre, statutDe, comptageDe, progression, texteQR, lireCompteur, memoriserCompteur, dateHeure,
} from '@/pages/inventaire/utils';

const FILTRES = [
  { cle: 'a_compter', libelle: 'À compter' },
  { cle: 'ecarts',    libelle: 'Écarts' },
  { cle: 'conformes', libelle: 'Conformes' },
  { cle: 'tous',      libelle: 'Tous' },
];

const Inventaire = () => {
  const { lieu } = useParams();
  // Magasin à plusieurs dépôts (plan A.3) : dépôt inventorié dans l'adresse (?depot=…)
  const [params] = useSearchParams();
  const depot = lieu === 'magasin' ? (params.get('depot') || null) : null;
  const navigate = useNavigate();
  // Mobile : à partir de la recherche, les filtres défilent avec la liste
  const isMobile = useIsMobile();
  const { acces } = useOutletContext() || {};
  const lieuValide = !!LIEUX[lieu];
  const pageRetour = lieu === 'magasin' ? ROUTES.magasin : ROUTES.boutique;
  const { depots, nomPrincipal } = useDepots(acces);
  // « Boutique », « Magasin », ou le nom du dépôt quand le compte en a plusieurs
  const libelleLieu = lieuValide
    ? (lieu === 'magasin' && depots.length > 0 ? nomDepot(depots, depot, nomPrincipal) : LIEUX[lieu].libelle)
    : '';
  useTitrePage(lieuValide ? `Inventaire ${libelleLieu}` : null);

  const [session, setSession] = useState(undefined); // undefined = chargement, null = aucune
  const [produits, setProduits] = useState([]);
  const [filtre, setFiltre] = useState('a_compter');
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('');
  const [ouvert, setOuvert] = useState(null);
  const [enCours, setEnCours] = useState(null); // id du produit en cours d'enregistrement
  const [compteur, setCompteur] = useState(lireCompteur);
  const [modal, setModal] = useState(null); // 'lancer' | 'validation' | 'historique' | 'scanner' | 'annuler'
  const [annulation, setAnnulation] = useState(false);
  const [etiquettes, setEtiquettes] = useState(false);

  const chargerSession = useCallback(async () => {
    try {
      const { data } = await inventairesAPI.enCours(lieu, depot);
      setSession(data);
    } catch {
      setSession(s => (s === undefined ? null : s));
    }
  }, [lieu, depot]);

  useEffect(() => {
    if (!lieuValide) return;
    chargerSession();
    (lieu === 'magasin' ? magasinAPI : produitsAPI).getAll()
      // Magasin : seulement les produits du dépôt inventorié
      .then(({ data }) => setProduits(lieu === 'magasin' ? data.filter(p => (p.depotId || null) === depot) : data))
      .catch(() => toast.error('Erreur lors du chargement des produits'));
  }, [lieu, lieuValide, chargerSession, depot]);

  // Plusieurs téléphones peuvent compter en même temps : en revenant sur l'appli, on relit
  // l'inventaire pour voir les comptages des autres
  useEffect(() => {
    const surRetour = () => { if (document.visibilityState === 'visible') chargerSession(); };
    document.addEventListener('visibilitychange', surRetour);
    return () => document.removeEventListener('visibilitychange', surRetour);
  }, [chargerSession]);

  const concernes = useMemo(() => (session ? produits.filter(p => dansPerimetre(session, p)) : []), [session, produits]);
  const totaux = useMemo(() => progression(session, produits), [session, produits]);

  const visibles = useMemo(() => {
    const t = recherche.trim().toLowerCase();
    return concernes
      .filter((p) => {
        if (t && !p.nom?.toLowerCase().includes(t) && !p.categorie?.toLowerCase().includes(t)) return false;
        // Même filtre que Boutique / Magasin : vraies catégories + « Soldes » et « Vente Flash »
        if (categorie && !dansCategorie(p, categorie)) return false;
        // Produit ouvert : reste affiché même s'il change de statut pendant la saisie
        if (p.id === ouvert) return true;
        const s = statutDe(session, p.id);
        if (filtre === 'a_compter') return s === 'a_compter';
        if (filtre === 'ecarts') return s === 'manquant' || s === 'surplus';
        if (filtre === 'conformes') return s === 'conforme';
        return true;
      })
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));
  }, [concernes, session, filtre, recherche, categorie, ouvert]);
  // Catégories des produits de l'inventaire (filtre)
  const categories = useMemo(() => categoriesAvecSoldes(
    [...new Set(concernes.map(p => p.categorie).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
    concernes,
  ), [concernes]);

  // Depuis les écarts : rouvrir un produit pour le recompter (le nouveau comptage remplace l'ancien)
  const recompter = (produitId) => {
    setModal(null); setRecherche(''); setCategorie(''); setFiltre('tous'); setOuvert(produitId);
    setTimeout(() => document.getElementById(`inv-${produitId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
  };

  const nbFiltre = (cle) => {
    if (cle === 'a_compter') return totaux.total - totaux.faits;
    if (cle === 'ecarts') return totaux.ecarts;
    if (cle === 'conformes') return totaux.conformes;
    return totaux.total;
  };

  // ── Enregistrement d'un comptage ───────────────────────────────────────────────────
  const envoyer = async (produitId, corps, fermer = true) => {
    setEnCours(produitId);
    try {
      const { data } = await inventairesAPI.compter(session.id, produitId, { ...corps, par: compteur });
      setSession((s) => {
        const comptes = { ...(s.comptes || {}) };
        if (data.comptage) comptes[produitId] = data.comptage; else delete comptes[produitId];
        return { ...s, comptes };
      });
      if (fermer) setOuvert(null);
    } catch (e) {
      toast.error(e.response?.data?.message || (e.response ? 'Erreur lors de l’enregistrement' : 'Pas de connexion : comptage non enregistré'));
    } finally { setEnCours(null); }
  };

  const changerCompteur = (nom) => { setCompteur(nom); memoriserCompteur(nom); };

  // ── Scanner : ouvre le produit trouvé ─────────────────────────────────────────────────
  const surScan = useCallback(({ lieu: lieuCode, produitId }) => {
    setModal(null);
    if (lieuCode !== lieu) { toast.warning(`Cette étiquette est celle d'un produit du ${LIEUX[lieuCode].libelle}`); return; }
    const p = produits.find(x => x.id === produitId);
    if (!p) { toast.error('Produit introuvable (peut-être supprimé)'); return; }
    if (!dansPerimetre(session, p)) { toast.info(`${p.nom} ne fait pas partie de cet inventaire`); return; }
    setRecherche(''); setFiltre('tous'); setOuvert(p.id);
    setTimeout(() => document.getElementById(`inv-${p.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
  }, [lieu, produits, session]);

  // ── Étiquettes QR à imprimer (produits de l'inventaire, ou tout le lieu) ─────────────────
  const imprimerEtiquettes = async () => {
    setEtiquettes(true);
    try {
      const { default: QRCode } = await import('qrcode');
      const liste = (session ? concernes : produits).slice().sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
      const items = await Promise.all(liste.map(async p => ({
        nom: p.nom, categorie: p.categorie || '',
        qr: await QRCode.toDataURL(texteQR(lieu, p.id), { margin: 1, width: 180, errorCorrectionLevel: 'M' }),
      })));
      imprimerEtiquettesQR(libelleLieu, items);
    } catch {
      toast.error('Impossible de préparer les étiquettes');
    } finally { setEtiquettes(false); }
  };

  const annuler = async () => {
    setAnnulation(true);
    try {
      await inventairesAPI.annuler(session.id);
      toast.success('Inventaire annulé, aucun stock modifié');
      navigate(pageRetour);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de l’annulation');
      setAnnulation(false); setModal(null);
    }
  };

  if (!lieuValide) return <Navigate to={ROUTES.dashboard} replace />;
  // Plan sans le Magasin (A.1) : pas d'inventaire du Magasin
  if (lieu === 'magasin' && moduleExclu(acces, 'magasin')) return <Navigate to={ROUTES.boutique} replace />;

  const boutonEntete = (icone, label, onClick, extra = {}) => (
    <button type="button" aria-label={label} title={label} onClick={onClick} {...extra}
      className="btn d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: '#fff' }}>
      <FontAwesomeIcon icon={icone} />
    </button>
  );

  // Recherche, catégorie, « Qui compte ? », Actualiser et Écarts : fixes sur grand écran,
  // dans la zone qui défile sur mobile
  const champsFiltres = (
    <>
            {/* Recherche, catégorie et « Qui compte ? » (passent dessous sur petit écran) */}
            <div className="d-flex gap-2 align-items-start flex-wrap flex-md-nowrap" style={{ flex: '1 1 460px', minWidth: 0 }}>
              <div className="input-group" style={{ flex: '2 1 260px', minWidth: 0 }}>
                <span className="input-group-text bg-body-secondary border-end-0"><FontAwesomeIcon icon={faSearch} className="text-muted" /></span>
                <input type="text" className="form-control border-start-0" placeholder="Rechercher un produit…"
                  value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                {recherche && (
                  <button type="button" className="btn btn-light border" aria-label="Effacer la recherche" onClick={() => setRecherche('')}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
              {categories.length > 0 && (
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <AutocompleteFiltre options={categories} value={categorie} onChange={setCategorie}
                    placeholder="Catégories" styleOption={styleCategorie} iconeOption={iconeCategorie} />
                </div>
              )}
              {/* Plusieurs personnes peuvent compter : le prénom est noté sur chaque produit compté */}
              <div className="input-group" style={{ flex: '1 1 160px', minWidth: 0 }}
                title="Facultatif : votre prénom est noté sur chaque produit que vous comptez (utile quand plusieurs personnes comptent)">
                <span className="input-group-text bg-body-secondary border-end-0"><FontAwesomeIcon icon={faUser} className="text-muted" /></span>
                <input type="text" className="form-control border-start-0" placeholder="Qui compte ? (prénom)"
                  aria-label="Qui compte ? Votre prénom, noté sur chaque produit compté" maxLength={40}
                  value={compteur} onChange={(e) => changerCompteur(e.target.value)} />
                {compteur && (
                  <button type="button" className="btn btn-light border" aria-label="Effacer le prénom" onClick={() => changerCompteur('')}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            </div>
            {/* Actualiser (comptages des autres téléphones) et écarts / validation */}
            <div className="d-flex gap-2 flex-shrink-0 ms-auto">
              <button type="button" className="btn btn-light btn-sm d-flex align-items-center gap-1" style={{ minHeight: 38 }}
                onClick={chargerSession} title="Voir les comptages faits sur les autres téléphones">
                <FontAwesomeIcon icon={faRotate} /> Actualiser
              </button>
              <button type="button" className="btn btn-sm text-white fw-semibold" style={{ background: '#ea580c', minHeight: 38 }}
                onClick={() => setModal('validation')}>
                Écarts et validations ({totaux.ecarts})
              </button>
            </div>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── En-tête : titre, progression ── */}
      <div className="flex-shrink-0 rounded-4 p-3 mb-3" style={{ background: '#0f2027', color: '#fff' }}>
        <div className="d-flex align-items-center gap-2">
          {boutonEntete(faArrowLeft, 'Retour', () => navigate(pageRetour))}
          <div className="flex-grow-1 min-w-0">
            <div className="fw-bold text-truncate" style={{ fontSize: 17 }}>
              {session ? session.nom : `Inventaire ${libelleLieu}`}
            </div>
            <div className="small text-truncate" style={{ color: '#a7f3d0' }}>
              {session ? `${libelleLieu} · lancé le ${dateHeure(session.createdAt)}` : libelleLieu}
            </div>
          </div>
        </div>

        {/* Actions, avec leur nom (plus de menu caché) */}
        <div className="d-flex gap-2 mt-3 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {session && (
            <button type="button" className="btn btn-sm d-flex align-items-center gap-2 flex-shrink-0 fw-semibold"
              style={{ background: '#00d4aa', color: '#0f2027', borderRadius: 10, minHeight: 40 }} onClick={() => setModal('scanner')}>
              <FontAwesomeIcon icon={faQrcode} /> Scanner
            </button>
          )}
          <button type="button" className="btn btn-sm d-flex align-items-center gap-2 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10, minHeight: 40 }}
            disabled={etiquettes} onClick={imprimerEtiquettes} title="Planche d'étiquettes à imprimer et coller sur les rayons">
            <FontAwesomeIcon icon={etiquettes ? faSpinner : faTags} spin={etiquettes} /> Étiquettes QR
          </button>
          <button type="button" className="btn btn-sm d-flex align-items-center gap-2 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 10, minHeight: 40 }} onClick={() => setModal('historique')}>
            <FontAwesomeIcon icon={faClockRotateLeft} /> Inventaires passés
          </button>
          {session && (
            <button type="button" className="btn btn-sm d-flex align-items-center gap-2 flex-shrink-0 ms-auto"
              style={{ background: 'rgba(239,68,68,0.18)', color: '#fecaca', borderRadius: 10, minHeight: 40 }} onClick={() => setModal('annuler')}>
              <FontAwesomeIcon icon={faTrash} /> Annuler l'inventaire
            </button>
          )}
        </div>

        {session && (
          <div className="mt-3 d-flex flex-column gap-2">
            <div className="d-flex justify-content-between small">
              <span><strong>{totaux.faits}</strong> / {totaux.total} comptés</span>
              <strong style={{ color: '#00d4aa' }}>{totaux.pourcentage} %</strong>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}
              role="progressbar" aria-valuenow={totaux.pourcentage} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l'inventaire">
              <div style={{ width: `${totaux.pourcentage}%`, height: '100%', borderRadius: 8, background: '#00d4aa', transition: 'width .3s' }} />
            </div>
            <div className="d-flex flex-wrap gap-3 small" style={{ color: '#cbd5e1' }}>
              <span><span style={{ color: '#4ade80' }}>●</span> {totaux.conformes} conformes</span>
              <span><span style={{ color: '#fb923c' }}>●</span> {totaux.ecarts} écarts</span>
              <span><span style={{ color: '#94a3b8' }}>●</span> {totaux.ignores} ignorés</span>
            </div>
          </div>
        )}
      </div>

      {session === undefined ? (
        <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} /></div>
      ) : session === null ? (
        /* ── Aucun inventaire en cours ── */
        <div className="card border-0 shadow-sm mx-auto text-center p-4" style={{ borderRadius: 16, maxWidth: 480 }}>
          <FontAwesomeIcon icon={faClipboardCheck} size="3x" className="mb-3" style={{ color: '#00d4aa' }} />
          <h5 className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>Aucun inventaire en cours</h5>
          <p className="text-muted">Comptez vos produits sur place : GesTrack compare avec le stock enregistré et corrige les écarts.</p>
          <button type="button" className="btn text-white fw-semibold" style={{ background: '#00a881', minHeight: 48 }}
            onClick={() => (estModeLimite(acces) ? demanderPassagePro() : setModal('lancer'))}>
            Lancer un inventaire
          </button>
        </div>
      ) : (
        <>
          {/* ── Statuts (À compter, Écarts…), recherche, catégorie, qui compte, actions ──
              Grand écran : fixes en haut, seule la liste défile.
              Mobile : seuls l'en-tête et les statuts restent fixes ; à partir de la recherche,
              tout défile avec la liste. */}
          <div className="flex-shrink-0 d-flex flex-column gap-2 mb-2">
            <div className="d-flex gap-2 align-items-center flex-wrap">
            <div className="d-flex gap-2 overflow-auto flex-shrink-0" style={{ scrollbarWidth: 'none', maxWidth: '100%' }}>
              {FILTRES.map(f => (
                <button type="button" key={f.cle} onClick={() => setFiltre(f.cle)} aria-pressed={filtre === f.cle}
                  className="btn btn-sm rounded-pill flex-shrink-0 fw-semibold"
                  style={filtre === f.cle
                    ? { background: '#0f2027', color: '#fff', minHeight: 38 }
                    : { background: 'var(--bs-body-bg)', color: 'var(--bs-body-color)', border: '1px solid var(--bs-border-color)', minHeight: 38 }}>
                  {f.libelle} · {nbFiltre(f.cle)}
                </button>
              ))}
            </div>
{!isMobile && (
              <>
            {champsFiltres}
              </>
            )}
            </div>
            {!isMobile && (
              <>
            {compteur.trim() && (
              <div className="small text-muted d-none d-md-block">
                Les produits que vous comptez à partir de maintenant, sur ce téléphone, porteront « par {compteur.trim()} ».
              </div>
            )}
              </>
            )}
          </div>

          {/* ── Liste des produits (et, sur mobile, les champs de filtre au-dessus) ── */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, overflowAnchor: 'none' }} className="d-flex flex-column gap-2 pb-2">
            {isMobile && (
              <div className="d-flex gap-2 align-items-center flex-wrap mb-1">
            {champsFiltres}
              </div>
            )}
            {visibles.length === 0 ? (
              <div className="text-center text-muted py-5">
                {filtre === 'a_compter' && !recherche ? 'Tous les produits sont comptés. Vous pouvez valider l’inventaire.' : 'Aucun produit ici.'}
              </div>
            ) : visibles.map(p => (
              <LigneInventaire key={p.id}
                produit={p}
                statut={statutDe(session, p.id)}
                comptage={comptageDe(session, p.id)}
                ouvert={ouvert === p.id}
                enCours={enCours === p.id}
                onBasculer={() => setOuvert(o => (o === p.id ? null : p.id))}
                onConforme={() => envoyer(p.id, { conforme: true }, false)}
                onEnregistrer={(compte) => envoyer(p.id, { compte })}
                onIgnorer={() => envoyer(p.id, { ignorer: true })}
                onRetirer={() => envoyer(p.id, { retirer: true }, false)}
              />
            ))}
          </div>

        </>
      )}

      {modal === 'lancer' && (
        <ModalLancerInventaire lieuInitial={lieu} depotInitial={depot} magasinExclu={moduleExclu(acces, 'magasin')} onFermer={() => setModal(null)} />
      )}
      {modal === 'validation' && session && (
        <ModalValidation session={session} produits={produits} onFermer={() => setModal(null)} onRecompter={recompter}
          onCorrige={(produitId, comptage) => setSession(s => ({ ...s, comptes: { ...(s.comptes || {}), [produitId]: comptage } }))}
          onValide={() => navigate(pageRetour)} />
      )}
      {modal === 'historique' && (
        <ModalHistoriqueInventaires lieu={lieu} depot={depot} produits={produits} onFermer={() => setModal(null)} />
      )}
      {modal === 'scanner' && (
        <ModalScanner onTrouve={surScan} onFermer={() => setModal(null)}
          onImprimerEtiquettes={() => { setModal(null); imprimerEtiquettes(); }} />
      )}
      {modal === 'annuler' && (
        <ModalConfirmation
          message="Annuler cet inventaire ? Les comptages faits seront perdus. Aucun stock ne sera modifié."
          labelConfirmer="Annuler l'inventaire"
          chargement={annulation}
          onConfirmer={annuler}
          onAnnuler={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default Inventaire;
