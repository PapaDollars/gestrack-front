// Page Fournisseurs — liste des fournisseurs ; on ouvre un fournisseur (page dédiée)
// pour voir et gérer ses commandes, plutôt que de lister les commandes avec le nom du
// fournisseur en sous-titre.
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck, faPlus, faSearch, faTimes, faUsers, faSpinner,
  faEye, faEdit, faTrash, faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp as faWhatsappBrand } from '@fortawesome/free-brands-svg-icons';
import { fournisseursAPI, fournisseursContactsAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import useIsMobile from '@/hooks/useIsMobile';
import ModalFournisseurForm from '@/components/fournisseurs/ModalFournisseurForm';
import ModalConfirmation from '@/components/shared/ModalConfirmation';

const Fournisseurs = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [commandes, setCommandes]   = useState([]);
  const [contacts, setContacts]     = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche]   = useState('');

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

  const filtres = useMemo(() => contacts.filter(c => {
    if (!recherche) return true;
    const t = recherche.toLowerCase();
    return c.nom?.toLowerCase().includes(t) || c.telephone?.includes(t) || c.ville?.toLowerCase().includes(t);
  }), [contacts, recherche]);

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  const filtresJSX = contacts.length > 0 && (
    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
      <div className="card-body p-3">
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
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>

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
                    onClick={() => navigate(`/fournisseurs/${c.id}`)}>
                    <button className="btn btn-sm rounded-circle position-absolute"
                      style={{ top: 8, right: 8, width: 30, height: 30, padding: 0, background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)', zIndex: 1 }}
                      title="Voir / modifier le fournisseur"
                      onClick={e => { e.stopPropagation(); setApercuFournisseur(c); }}>
                      <FontAwesomeIcon icon={faEye} style={{ fontSize: 12 }} />
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
      {apercuFournisseur && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1060 }}
          onClick={() => setApercuFournisseur(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 380 }}
            onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
              <div className="modal-header border-0 pb-0 px-4 pt-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', color: '#00a881', fontWeight: 700, fontSize: 'var(--txt-xl)' }}>
                    {apercuFournisseur.nom?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{apercuFournisseur.nom}</h6>
                    {apercuFournisseur.ville && <div className="text-muted small">{apercuFournisseur.ville}</div>}
                  </div>
                </div>
                <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={() => setApercuFournisseur(null)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body px-4 py-3">
                {apercuFournisseur.telephone && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faPhone} style={{ color: '#00d4aa', width: 16 }} />
                    <a href={`tel:${apercuFournisseur.telephone}`} className="text-decoration-none"
                      style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-md)' }}>
                      {apercuFournisseur.telephone}
                    </a>
                  </div>
                )}
                {apercuFournisseur.telephoneWhatsapp && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faWhatsappBrand} style={{ color: '#25d366', width: 16 }} />
                    <a href={`https://wa.me/${apercuFournisseur.telephoneWhatsapp.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer" className="text-decoration-none"
                      style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-md)' }}>
                      {apercuFournisseur.telephoneWhatsapp} <span className="small text-muted">(WhatsApp)</span>
                    </a>
                  </div>
                )}
                {apercuFournisseur.typesProduits?.length > 0 && (
                  <div className="mt-3">
                    <div className="small fw-semibold text-muted mb-2">Types de produits</div>
                    <div className="d-flex flex-wrap gap-1">
                      {apercuFournisseur.typesProduits.map(t => (
                        <span key={t} className="badge"
                          style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881', fontSize: 'var(--txt-xs)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button className="btn btn-sm d-flex align-items-center gap-1" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 8 }}
                  onClick={() => { const f = apercuFournisseur; setApercuFournisseur(null); setModalFournisseurForm(f); }}>
                  <FontAwesomeIcon icon={faEdit} /> Modifier
                </button>
                <button className="btn btn-sm d-flex align-items-center gap-1" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 8 }}
                  onClick={() => { const f = apercuFournisseur; setApercuFournisseur(null); setConfirmSupprId(f.id); }}>
                  <FontAwesomeIcon icon={faTrash} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fournisseurs;
