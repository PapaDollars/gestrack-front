// Page Fournisseurs — liste des fournisseurs ; on ouvre un fournisseur (page dédiée)
// pour voir et gérer ses commandes, plutôt que de lister les commandes avec le nom du
// fournisseur en sous-titre.
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck, faPlus, faSearch, faTimes, faUsers, faSpinner,
  faInfoCircle, faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { fournisseursAPI, fournisseursContactsAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import useIsMobile from '@/hooks/useIsMobile';
import ModalFournisseurForm from '@/pages/fournisseurs/modals/ModalFournisseurForm';
import ModalApercuFournisseur from '@/pages/fournisseurs/modals/ModalApercuFournisseur';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import { ROUTES } from '@/utils/url/frontend';

const Fournisseurs = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [commandes, setCommandes]   = useState([]);
  const [contacts, setContacts]     = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche]   = useState('');
  const [filtreTypeProduit, setFiltreTypeProduit] = useState('');
  const [filtreVille, setFiltreVille]             = useState('');
  const [filtreStatut, setFiltreStatut]           = useState('');

  const [modalFournisseurForm, setModalFournisseurForm] = useState(null); // null | 'new' | contact
  const [apercuFournisseur, setApercuFournisseur]       = useState(null);
  const [confirmSupprId, setConfirmSupprId]             = useState(null);
  const [enSuppression, setEnSuppression]               = useState(false);

  const charger = async () => {
    try {
      const [{ data: cmd }, { data: cnt }] = await Promise.all([
        fournisseursAPI.getAll(),
        fournisseursContactsAPI.getAll(),
      ]);
      setCommandes(cmd);
      setContacts(cnt);
    } catch { toast.error('Erreur lors du chargement'); }
    finally { setChargement(false); }
  };

  useEffect(() => { charger(); }, []);

  const commandesDe = (fournisseurId) => commandes.filter(c => c.fournisseurId === fournisseurId);

  const apresSuccesFournisseur = () => { setModalFournisseurForm(null); charger(); };

  const confirmSuppr = contacts.find(c => c.id === confirmSupprId) || null;

  const supprimerFournisseur = async () => {
    setEnSuppression(true);
    try {
      const reponse = await fournisseursContactsAPI.delete(confirmSupprId);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Fournisseur supprimé');
      setConfirmSupprId(null);
      charger();
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setEnSuppression(false); }
  };

  // Types de produits réellement commandés (pas juste ceux déclarés par le fournisseur)
  // et villes des fournisseurs — pour peupler les filtres dynamiquement.
  const typesProduitsCommandes = useMemo(() =>
    [...new Set(commandes.map(c => c.categorie).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
    [commandes]
  );
  const villesFournisseurs = useMemo(() =>
    [...new Set(contacts.map(c => c.ville).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
    [contacts]
  );

  const filtres = useMemo(() => contacts.filter(c => {
    if (recherche) {
      const t = recherche.toLowerCase();
      if (!(c.nom?.toLowerCase().includes(t) || c.telephone?.includes(t) || c.ville?.toLowerCase().includes(t))) return false;
    }
    if (filtreVille && c.ville !== filtreVille) return false;
    const cmdsFourn = commandesDe(c.id);
    if (filtreTypeProduit && !cmdsFourn.some(cmd => cmd.categorie === filtreTypeProduit)) return false;
    if (filtreStatut && !cmdsFourn.some(cmd => cmd.statut === filtreStatut)) return false;
    return true;
  }), [contacts, commandes, recherche, filtreVille, filtreTypeProduit, filtreStatut]); // eslint-disable-line

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  const filtreActif = recherche || filtreTypeProduit || filtreVille || filtreStatut;

  const filtresJSX = contacts.length > 0 && (
    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
      <div className="card-body p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-body-secondary border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
              </span>
              <input className="form-control border-start-0" placeholder="Nom, téléphone, ville..."
                value={recherche} onChange={e => setRecherche(e.target.value)} />
              {recherche && (
                <button className="btn btn-light border" onClick={() => setRecherche('')}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
          </div>
          <div className="col-6 col-md">
            <AutocompleteFiltre options={typesProduitsCommandes} value={filtreTypeProduit}
              onChange={setFiltreTypeProduit} placeholder="Types produits" />
          </div>
          <div className="col-6 col-md">
            <div className="input-group">
              <select className="form-select" value={filtreVille} onChange={e => setFiltreVille(e.target.value)}>
                <option value="">Toutes villes</option>
                {villesFournisseurs.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              {filtreVille && (
                <button type="button" className="btn btn-light border" onClick={() => setFiltreVille('')}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
          </div>
          <div className="col-6 col-md">
            <div className="input-group">
              <select className="form-select" value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
                <option value="">Statuts commande</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="EN_COURS">En cours</option>
                <option value="LIVREE">Tout livré</option>
              </select>
              {filtreStatut && (
                <button type="button" className="btn btn-light border" onClick={() => setFiltreStatut('')}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
          </div>
          {filtreActif && (
            <div className="col-6 col-md-auto">
              <button className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                onClick={() => { setRecherche(''); setFiltreTypeProduit(''); setFiltreVille(''); setFiltreStatut(''); }}>
                <FontAwesomeIcon icon={faFilter} style={{ fontSize: 'var(--txt-sm)' }} /> Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Titre — toujours fixe ── */}
      <div style={{ flexShrink: 0 }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faTruck} className="me-2" style={{ color: '#00d4aa' }} />
              Fournisseurs
            </h4>
            <p className="text-muted small mb-0">{contacts.length} fournisseur(s) · {commandes.length} commande(s)</p>
          </div>
          <button className="btn text-white d-flex align-items-center gap-2"
            style={{ background: '#00d4aa', borderRadius: 10 }}
            onClick={() => setModalFournisseurForm('new')}>
            <FontAwesomeIcon icon={faPlus} /> Nouveau fournisseur
          </button>
        </div>
      </div>

      {/* ── Filtres — fixe desktop, dans le scroll mobile ── */}
      {!isMobile && (
        <div style={{ flexShrink: 0 }}>
          {filtresJSX}
        </div>
      )}

      {/* ── Zone scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {isMobile && filtresJSX}

        {filtres.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faUsers} size="3x" className="mb-3 d-block" style={{ color: '#cbd5e1' }} />
            {contacts.length === 0 ? (
              <>
                <p>Aucun fournisseur enregistré</p>
                <button className="btn text-white" style={{ background: '#00d4aa', borderRadius: 10 }}
                  onClick={() => setModalFournisseurForm('new')}>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />Ajouter votre premier fournisseur
                </button>
              </>
            ) : 'Aucun résultat pour cette recherche'}
          </div>
        ) : (
          <div className="row g-3" style={{ maxHeight: 700, overflowY: 'auto', paddingBottom: 4 }}>
            {filtres.map(c => {
              const cmdsFourn = commandesDe(c.id);
              const enCours = cmdsFourn.filter(x => x.statut !== 'LIVREE').length;
              return (
                <div key={c.id} className="col-12 col-md-6 col-xl-3">
                  <div className="card border-0 shadow-sm h-100 position-relative" style={{ borderRadius: 14, cursor: 'pointer' }}
                    onClick={() => navigate(ROUTES.fournisseur(c.id))}>
                    <button className="btn btn-sm rounded-circle position-absolute"
                      style={{ top: 8, right: 8, width: 30, height: 30, padding: 0, background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)', zIndex: 1 }}
                      title="Voir / modifier le fournisseur"
                      onClick={e => { e.stopPropagation(); setApercuFournisseur(c); }}>
                      <FontAwesomeIcon icon={faInfoCircle} style={{ fontSize: 12 }} />
                    </button>
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', color: '#00a881', fontWeight: 700, fontSize: 'var(--txt-xl)' }}>
                          {c.nom?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0" style={{ paddingRight: 28 }}>
                          <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{c.nom}</div>
                          <div className="text-muted small text-truncate">
                            {c.telephone || <span className="fst-italic">Pas de téléphone</span>}
                            {c.ville && ` · ${c.ville}`}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="badge" style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)' }}>
                          {cmdsFourn.length} commande{cmdsFourn.length > 1 ? 's' : ''}
                        </span>
                        {enCours > 0 && (
                          <span className="badge" style={{ background: '#fff3cd', color: '#856404' }}>
                            {enCours} en cours
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalFournisseurForm !== null && (
        <ModalFournisseurForm
          contact={modalFournisseurForm === 'new' ? null : modalFournisseurForm}
          onFermer={() => setModalFournisseurForm(null)}
          onSucces={apresSuccesFournisseur}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message={
            commandesDe(confirmSuppr.id).length > 0
              ? `Supprimer "${confirmSuppr.nom}" supprimera aussi ses ${commandesDe(confirmSuppr.id).length} commande(s) et leur historique de livraisons. Cette action est irréversible.`
              : `Supprimer le fournisseur "${confirmSuppr.nom}" ?`
          }
          onConfirmer={supprimerFournisseur}
          chargement={enSuppression}
          onAnnuler={() => setConfirmSupprId(null)}
        />
      )}

      {/* Aperçu rapide d'un fournisseur — infos + actions, sans quitter la liste */}
      <ModalApercuFournisseur
        fournisseur={apercuFournisseur}
        onFermer={() => setApercuFournisseur(null)}
        onModifier={() => { const f = apercuFournisseur; setApercuFournisseur(null); setModalFournisseurForm(f); }}
        onSupprimer={() => { const f = apercuFournisseur; setApercuFournisseur(null); setConfirmSupprId(f.id); }}
      />
    </div>
  );
};

export default Fournisseurs;
