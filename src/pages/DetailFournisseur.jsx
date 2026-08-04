// Page détail d'un fournisseur — ses infos + toutes ses commandes (remplace l'ancien modal)
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useIsMobile from '@/hooks/useIsMobile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faTruck, faPlus, faSpinner, faSearch,
  faBoxOpen, faLink, faChevronDown, faChevronUp, faPhone,
} from '@fortawesome/free-solid-svg-icons';
import {
  fournisseursAPI, fournisseursContactsAPI, produitsAPI, magasinAPI, estMisEnAttente,
} from '@/services/api';
import { psParUnite } from '@/services/unites';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalConfirmation from '@/components/shared/ModalConfirmation';
import ModalCommande from '@/components/fournisseurs/ModalCommande';
import ModalDetailCommande, { STATUTS } from '@/components/fournisseurs/ModalDetailCommande';

const PAR_PAGE = 8;

const DetailFournisseur = () => {
  const isMobile = useIsMobile();
  const { fournisseurId } = useParams();
  const navigate = useNavigate();
  const { formatMontant } = useParametres();

  const [fournisseur, setFournisseur] = useState(null);
  const [commandes, setCommandes]     = useState([]);
  const [produits, setProduits]       = useState([]);
  const [chargement, setChargement]   = useState(true);

  const [recherche, setRecherche]         = useState('');
  const [filtreStatut, setFiltreStatut]   = useState('');
  const [filtreProduit, setFiltreProduit] = useState('');
  const [page, setPage]                   = useState(1);

  const [modalForm, setModalForm]         = useState(null); // null | 'new' | commande
  const [modalDetailId, setModalDetailId] = useState(null);
  const [confirmSupprId, setConfirmSupprId] = useState(null);
  const [enSuppression, setEnSuppression]   = useState(false);

  const charger = async () => {
    try {
      const [{ data: contacts }, { data: cmd }, { data: boutique }, { data: magasin }] = await Promise.all([
        fournisseursContactsAPI.getAll(),
        fournisseursAPI.getAll(),
        produitsAPI.getAll(),
        magasinAPI.getAll(),
      ]);
      setFournisseur(contacts.find(c => c.id === fournisseurId) || null);
      setCommandes(cmd.filter(c => c.fournisseurId === fournisseurId));
      setProduits([
        ...boutique.map(p => ({ ...p, source: 'boutique' })),
        ...magasin.map(p  => ({ ...p, source: 'magasin'  })),
      ]);
    } catch { toast.error('Erreur lors du chargement'); }
    finally { setChargement(false); }
  };

  useEffect(() => { charger(); }, [fournisseurId]); // eslint-disable-line

  const modalDetail = commandes.find(c => c.id === modalDetailId) || null;
  const confirmSuppr = commandes.find(c => c.id === confirmSupprId) || null;

  // Ratio de conversion (dz/ballo, ps/crt, ps/sac) : celui du produit lié fait foi — la
  // commande peut ne pas l'avoir (ou plus l'avoir à jour) si le produit a été modifié depuis.
  const produitDe = (c) => produits.find(p => p.id === c.produitId && p.source === c.produitSource);
  const ratioCommande = (c) => psParUnite(c.unite || 'ps', produitDe(c) || c);

  const apresSucces = () => { setModalForm(null); charger(); };

  const supprimerCommande = async () => {
    setEnSuppression(true);
    try {
      const reponse = await fournisseursAPI.delete(confirmSupprId);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Commande supprimée');
      setConfirmSupprId(null);
      charger();
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setEnSuppression(false); }
  };

  // Liste des produits déjà commandés à ce fournisseur — pour le filtre rapide
  const produitsUniques = useMemo(() =>
    [...new Set(commandes.map(c => c.produitNom).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
    [commandes]
  );

  const filtrees = useMemo(() => {
    setPage(1);
    return commandes.filter(c => {
      if (filtreStatut && c.statut !== filtreStatut) return false;
      if (filtreProduit && c.produitNom !== filtreProduit) return false;
      if (recherche) return c.produitNom?.toLowerCase().includes(recherche.toLowerCase());
      return true;
    });
  }, [commandes, filtreStatut, filtreProduit, recherche]);

  // Un même produit peut être commandé plusieurs fois — stats cumulées toutes commandes
  // confondues (indépendamment des autres filtres) dès qu'un produit précis est choisi.
  const statsProduit = useMemo(() => {
    if (!filtreProduit) return null;
    const cmds = commandes.filter(c => c.produitNom === filtreProduit);
    if (cmds.length === 0) return null;
    const totalCommande = cmds.reduce((s, c) => s + (c.quantiteCommandee || 0), 0);
    const totalLivree   = cmds.reduce((s, c) => s + (c.quantiteLivree || 0), 0);
    // prixUnitaire est un prix par pièce — on multiplie par le nombre réel de pièces
    // (quantité commandée × ratio de l'unité), pas directement par la quantité en ballo/carton.
    const montantTotal  = cmds.reduce((s, c) => s + (c.quantiteCommandee || 0) * ratioCommande(c) * (c.prixUnitaire || 0), 0);
    return {
      nbCommandes: cmds.length,
      totalCommande, totalLivree,
      totalRestant: totalCommande - totalLivree,
      montantTotal,
      unite: cmds[0].unite,
    };
  }, [commandes, filtreProduit]);

  const totalPages   = Math.max(1, Math.ceil(filtrees.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const paginees     = filtrees.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

  // Photo de la commande : celle jointe à la commande (nouveau produit), sinon celle du
  // produit existant lié en boutique/magasin.
  const imageDe = (c) => c.imageUrl || produits.find(p => p.id === c.produitId && p.source === c.produitSource)?.image || null;

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  if (!fournisseur) return (
    <div className="text-center py-5 text-muted">
      <FontAwesomeIcon icon={faTruck} size="3x" className="mb-3 d-block" style={{ color: '#cbd5e1' }} />
      <p>Fournisseur introuvable</p>
      <button className="btn btn-light" onClick={() => navigate('/fournisseurs')}>
        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />Retour aux fournisseurs
      </button>
    </div>
  );

  const filtresJSX = (
    <>
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-body-secondary border-end-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                </span>
                <input className="form-control border-start-0" placeholder="Rechercher un produit..."
                  value={recherche} onChange={e => setRecherche(e.target.value)} />
              </div>
            </div>
            <div className="col-6 col-md-4">
              <select className="form-select" value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)}>
                <option value="">Tous les produits</option>
                {produitsUniques.map(nom => <option key={nom} value={nom}>{nom}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select className="form-select" value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="EN_COURS">En cours</option>
                <option value="LIVREE">Tout livré</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cumulées du produit sélectionné — un même produit pouvant être commandé plusieurs fois */}
      {statsProduit && (
        <div className="p-3 rounded-3 mb-3" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)' }}>
          <div className="fw-semibold small mb-2" style={{ color: '#00a881' }}>
            {filtreProduit} — {statsProduit.nbCommandes} commande{statsProduit.nbCommandes > 1 ? 's' : ''} au total
          </div>
          <div className="row g-2 text-center">
            <div className="col-6 col-md-3">
              <div className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>{statsProduit.totalCommande} {statsProduit.unite}</div>
              <div className="text-muted" style={{ fontSize: 'var(--txt-xs)' }}>Commandé</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fw-bold" style={{ color: '#16a34a' }}>{statsProduit.totalLivree} {statsProduit.unite}</div>
              <div className="text-muted" style={{ fontSize: 'var(--txt-xs)' }}>Livré</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fw-bold" style={{ color: statsProduit.totalRestant > 0 ? '#dc2626' : '#16a34a' }}>{statsProduit.totalRestant} {statsProduit.unite}</div>
              <div className="text-muted" style={{ fontSize: 'var(--txt-xs)' }}>Restant</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>{formatMontant(statsProduit.montantTotal)}</div>
              <div className="text-muted" style={{ fontSize: 'var(--txt-xs)' }}>Montant total</div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>

      {/* En-tête — toujours fixe */}
      <div style={{ flexShrink: 0 }}>
        <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
          <button className="btn btn-light btn-sm" onClick={() => navigate('/fournisseurs')}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />Retour
          </button>
          <div className="d-flex align-items-center gap-3 flex-grow-1 min-w-0">
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', color: '#00a881', fontWeight: 700, fontSize: 'var(--txt-xl)' }}>
              {fournisseur.nom?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h5 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--bs-body-color)' }}>{fournisseur.nom}</h5>
              <div className="text-muted small d-flex gap-2 flex-wrap">
                {fournisseur.telephone && <span><FontAwesomeIcon icon={faPhone} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />{fournisseur.telephone}</span>}
                {fournisseur.ville && <span>· {fournisseur.ville}</span>}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn text-white d-flex align-items-center gap-2"
              style={{ background: '#00d4aa', borderRadius: 10 }}
              onClick={() => setModalForm('new')}>
              <FontAwesomeIcon icon={faPlus} /> Nouvelle commande
            </button>
          </div>
        </div>
      </div>

      {/* Filtres — fixe desktop, dans le scroll mobile */}
      {!isMobile && (
        <div style={{ flexShrink: 0 }}>
          {filtresJSX}
        </div>
      )}

      {/* Zone scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {isMobile && filtresJSX}

        {filtrees.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faTruck} size="2x" className="mb-3 d-block" style={{ color: '#cbd5e1' }} />
            {commandes.length === 0 ? (
              <>
                <p>Aucune commande pour ce fournisseur</p>
                <button className="btn text-white" style={{ background: '#00d4aa', borderRadius: 10 }}
                  onClick={() => setModalForm('new')}>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />Créer la première commande
                </button>
              </>
            ) : 'Aucun résultat pour ces filtres'}
          </div>
        ) : (
          <>
            <div className="row g-3">
              {paginees.map(c => {
                const cfg  = STATUTS[c.statut] || STATUTS.EN_ATTENTE;
                const pct  = Math.min(100, Math.round(((c.quantiteLivree || 0) / c.quantiteCommandee) * 100));
                const rest = c.quantiteCommandee - (c.quantiteLivree || 0);
                const image = imageDe(c);
                return (
                  <div key={c.id} className="col-12 col-md-6 col-xl-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, cursor: 'pointer' }}
                      onClick={() => setModalDetailId(c.id)}>
                      <div className="card-body p-3">
                        <div className="d-flex gap-3">
                          {image ? (
                            <img src={image} alt="" className="rounded flex-shrink-0"
                              style={{ width: 56, height: 56, objectFit: 'contain', background: 'var(--bs-secondary-bg)' }} />
                          ) : (
                            <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 56, height: 56, background: 'var(--bs-secondary-bg)' }}>
                              <FontAwesomeIcon icon={faBoxOpen} className="text-muted" />
                            </div>
                          )}
                          <div className="flex-grow-1 min-w-0">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                              <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                                {c.produitNom}
                              </div>
                              <span className="badge ms-2 flex-shrink-0"
                                style={{ background: cfg.bg, color: cfg.color, fontSize: 'var(--txt-xs)' }}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className="progress mb-1" style={{ height: 6, borderRadius: 3 }}>
                              <div className="progress-bar"
                                style={{ width: `${pct}%`, background: c.statut === 'LIVREE' ? '#16a34a' : '#00d4aa' }} />
                            </div>
                            <div className="d-flex justify-content-between" style={{ fontSize: 'var(--txt-sm)' }}>
                              <span className="text-muted">{c.quantiteLivree || 0} / {c.quantiteCommandee} {c.unite}</span>
                              <span className="text-muted">{pct}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center justify-content-between gap-2 mt-3">
                          {rest > 0 && (
                            <span className="small" style={{ color: '#dc2626' }}>Restant : {rest} {c.unite}</span>
                          )}
                          {c.produitSource && (
                            <span className="badge"
                              style={{ background: c.produitSource === 'magasin' ? '#dbeafe' : '#dcfce7', color: c.produitSource === 'magasin' ? '#1e40af' : '#166534', fontSize: 'var(--txt-xs)' }}>
                              <FontAwesomeIcon icon={faLink} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />
                              {c.produitSource === 'magasin' ? 'Magasin' : 'Boutique'}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <button className="btn btn-sm w-100"
                            style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)', fontSize: 'var(--txt-base)' }}
                            onClick={() => setModalDetailId(c.id)}>
                            Voir les livraisons
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between px-1 py-3">
                <span className="text-muted small">Page {pageCourante} / {totalPages}</span>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-light" disabled={pageCourante === 1}
                    onClick={() => setPage(p => p - 1)}>
                    <FontAwesomeIcon icon={faChevronDown} style={{ rotate: '90deg' }} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - pageCourante) <= 2)
                    .map(p => (
                      <button key={p} className={`btn btn-sm ${p === pageCourante ? 'text-white' : 'btn-light'}`}
                        style={p === pageCourante ? { background: '#00d4aa' } : {}}
                        onClick={() => setPage(p)}>{p}</button>
                    ))}
                  <button className="btn btn-sm btn-light" disabled={pageCourante === totalPages}
                    onClick={() => setPage(p => p + 1)}>
                    <FontAwesomeIcon icon={faChevronUp} style={{ rotate: '90deg' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modalForm !== null && (
        <ModalCommande
          commande={modalForm === 'new' ? null : modalForm}
          fournisseur={fournisseur}
          onFermer={() => setModalForm(null)}
          onSucces={apresSucces}
        />
      )}
      {modalDetail && (
        <ModalDetailCommande
          commande={modalDetail}
          produit={produitDe(modalDetail)}
          onFermer={() => setModalDetailId(null)}
          onActualiser={charger}
          onModifier={() => { setModalDetailId(null); setModalForm(modalDetail); }}
          onSupprimer={() => { setModalDetailId(null); setConfirmSupprId(modalDetail.id); }}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer la commande "${confirmSuppr.produitNom}" ? Cette action est irréversible.`}
          onConfirmer={supprimerCommande}
          chargement={enSuppression}
          onAnnuler={() => setConfirmSupprId(null)}
        />
      )}
    </div>
  );
};

export default DetailFournisseur;
