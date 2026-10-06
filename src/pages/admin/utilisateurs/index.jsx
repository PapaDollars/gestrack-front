import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faSpinner, faSearch, faLock, faLockOpen, faTrash,
  faEnvelope, faCalendar, faChevronDown, faChevronUp, faTimes, faCheckCircle,
  faBan, faHourglassHalf, faCrown, faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '@/services/adminAPI';
import { toast } from 'react-toastify';
import { FILTRES_ACCES } from '@/pages/admin/utilisateurs/constants';
import BadgeAcces from '@/pages/admin/utilisateurs/components/BadgeAcces';
import { EMAIL_ADMIN } from '@/utils/url/frontend';


const AdminUtilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement]     = useState(true);
  const [recherche, setRecherche]       = useState('');
  const [detail, setDetail]             = useState(null);
  const [detailData, setDetailData]     = useState(null);
  const [chargDetail, setChargDetail]   = useState(false);
  const [action, setAction]             = useState(null); // { uid, type }
  const [filtreAcces, setFiltreAcces]   = useState('');
  const [enCours, setEnCours]           = useState(null); // uid dont l'accès est en cours de modification

  useEffect(() => {
    adminAPI.getUtilisateurs()
      .then(r => setUtilisateurs(r.data))
      .catch(() => toast.error('Erreur chargement utilisateurs'))
      .finally(() => setChargement(false));
  }, []);

  const filtres = utilisateurs.filter(u =>
    (!filtreAcces || u.statutAcces === filtreAcces) && (
      u.email.toLowerCase().includes(recherche.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(recherche.toLowerCase())
    )
  );
  const nbParStatut = (st) => utilisateurs.filter(u => u.statutAcces === st).length;
  const nbSansStatut = utilisateurs.filter(u => !u.statutAcces).length;

  // Approuver (Pro) / bloquer / prolonger l'essai — l'utilisateur est notifié côté serveur
  const changerAcces = async (u, type, jours) => {
    setEnCours(u.uid);
    try {
      const { data } = await adminAPI.changerAcces(u.uid, type, jours);
      setUtilisateurs(prev => prev.map(x => x.uid === u.uid
        ? { ...x, statutAcces: data.statutAcces, dateLimiteAcces: data.dateLimiteAcces } : x));
      toast.success(type === 'approuver' ? 'Compte approuvé (Pro)' : type === 'bloquer' ? 'Accès bloqué' : `Essai prolongé de ${jours} jours`);
    } catch { toast.error('Erreur lors du changement d\'accès'); }
    finally { setEnCours(null); }
  };

  const demarrerEssais = async () => {
    try {
      const { data } = await adminAPI.demarrerEssais();
      toast.success(data.message);
      const { data: liste } = await adminAPI.getUtilisateurs();
      setUtilisateurs(liste);
    } catch { toast.error('Erreur lors du démarrage des essais'); }
  };

  const ouvrirDetail = async (uid) => {
    if (detail === uid) { setDetail(null); setDetailData(null); return; }
    setDetail(uid);
    setChargDetail(true);
    try {
      const { data } = await adminAPI.getUtilisateur(uid);
      setDetailData(data);
    } catch { toast.error('Erreur chargement détail'); }
    finally { setChargDetail(false); }
  };

  const confirmerAction = async () => {
    if (!action) return;
    const { uid, type } = action;
    setAction(null);
    if (type === 'essais') return demarrerEssais();
    try {
      if (type === 'suspendre') {
        await adminAPI.suspendre(uid);
        setUtilisateurs(prev => prev.map(u => u.uid === uid ? { ...u, disabled: true } : u));
        toast.success('Compte suspendu');
      } else if (type === 'reactiver') {
        await adminAPI.reactiver(uid);
        setUtilisateurs(prev => prev.map(u => u.uid === uid ? { ...u, disabled: false } : u));
        toast.success('Compte réactivé');
      } else if (type === 'supprimer') {
        await adminAPI.supprimer(uid);
        setUtilisateurs(prev => prev.filter(u => u.uid !== uid));
        if (detail === uid) { setDetail(null); setDetailData(null); }
        toast.success('Compte supprimé définitivement');
      }
    } catch { toast.error('Erreur lors de l\'action'); }
  };

  const fmt = (dateStr) => dateStr
    ? new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  if (chargement) return (
    <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
      <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32, color: '#00d4aa' }} />
    </div>
  );

  return (
    <div className="admin-page">
      <div className="admin-entete">
      <div className="mb-4">
        <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
          <FontAwesomeIcon icon={faUsers} style={{ color: '#6366f1' }} />
          Utilisateurs
          <span className="badge bg-secondary" style={{ fontSize: 'var(--txt-base)' }}>{utilisateurs.length}</span>
        </h4>
        <p className="text-muted small mb-0">Gestion des comptes inscrits sur GesTrack</p>
      </div>

      {/* Comptes existants sans statut : leur période d'essai démarre à leur prochaine
          utilisation, ou tout de suite pour tous avec ce bouton (avec message) */}
      {nbSansStatut > 0 && (
        <div className="alert d-flex align-items-center gap-3 flex-wrap mb-3" style={{ background: '#e0f2fe', color: '#075985', borderRadius: 12, border: 'none' }}>
          <FontAwesomeIcon icon={faHourglassHalf} />
          <div className="flex-grow-1 small">
            <strong>{nbSansStatut} compte(s) existant(s)</strong> n'ont pas encore leur période d'essai de 30 jours.
            Elle démarre automatiquement à leur prochaine utilisation, ou maintenant pour tous :
          </div>
          <button className="btn btn-sm d-flex align-items-center gap-1" style={{ background: '#0369a1', color: '#fff', borderRadius: 8 }}
            onClick={() => setAction({ type: 'essais' })}>
            <FontAwesomeIcon icon={faPaperPlane} /> Démarrer et prévenir
          </button>
        </div>
      )}

      {/* Recherche + filtre accès */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body p-3">
          <div className="d-flex gap-2 flex-wrap mb-2">
            {FILTRES_ACCES.map(f => {
              const actif = filtreAcces === f.val;
              const nb = f.val ? nbParStatut(f.val) : utilisateurs.length;
              return (
                <button key={f.val} type="button" className="btn btn-sm"
                  style={{ borderRadius: 20, background: actif ? '#6366f1' : 'var(--bs-secondary-bg)', color: actif ? '#fff' : 'var(--bs-body-color)', fontSize: 'var(--txt-base)' }}
                  onClick={() => setFiltreAcces(f.val)}>
                  {f.label} <span className="ms-1" style={{ opacity: 0.75 }}>{nb}</span>
                </button>
              );
            })}
          </div>
          <div className="input-group">
            <span className="input-group-text bg-body-secondary border-end-0">
              <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
            </span>
            <input type="text" className="form-control border-start-0"
              placeholder="Rechercher par email ou nom..."
              value={recherche} onChange={e => setRecherche(e.target.value)} />
            {recherche && (
              <button type="button" className="btn btn-light border" onClick={() => setRecherche('')}>
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-md)' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      </div>{/* fin zone fixe */}

      <div className="admin-contenu">
      {/* Liste */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="card-body p-0">
          {filtres.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">Aucun utilisateur trouvé</p>
          ) : filtres.map((u, i) => (
            <div key={u.uid} style={{ borderBottom: i < filtres.length - 1 ? '1px solid var(--bs-border-color)' : 'none' }}>
              {/* Ligne principale */}
              <div className="d-flex align-items-center gap-2 gap-md-3 px-3 px-md-4 py-3"
                style={{ cursor: 'pointer' }}
                onClick={() => ouvrirDetail(u.uid)}>

                {/* Avatar initiale */}
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 40, height: 40, background: u.disabled ? '#fee2e2' : '#ede9fe',
                    color: u.disabled ? '#dc2626' : '#7c3aed', fontWeight: 700, fontSize: 'var(--txt-xl)' }}>
                  {(u.displayName || u.email || '?')[0].toUpperCase()}
                </div>

                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                      {u.displayName || '—'}
                    </span>
                    {u.disabled && (
                      <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: 'var(--txt-xs)' }}>Suspendu</span>
                    )}
                    <BadgeAcces u={u} />
                  </div>
                  <div className="text-muted" style={{ fontSize: 'var(--txt-base)' }}>
                    <FontAwesomeIcon icon={faEnvelope} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />
                    {u.email}
                  </div>
                </div>

                {/* Approbation rapide d'un nouveau compte, sans ouvrir le détail */}
                {u.statutAcces === 'en_attente' && (
                  <button className="btn btn-sm d-flex align-items-center gap-1 flex-shrink-0"
                    style={{ background: '#16a34a', color: '#fff', borderRadius: 8 }}
                    disabled={enCours === u.uid}
                    onClick={e => { e.stopPropagation(); changerAcces(u, 'approuver'); }}>
                    {enCours === u.uid ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />} Approuver
                  </button>
                )}

                <div className="text-end flex-shrink-0">
                  <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>
                    <FontAwesomeIcon icon={faCalendar} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />
                    {fmt(u.createdAt)}
                  </div>
                  <FontAwesomeIcon icon={detail === u.uid ? faChevronUp : faChevronDown}
                    style={{ color: '#94a3b8', fontSize: 'var(--txt-sm)', marginTop: 4 }} />
                </div>
              </div>

              {/* Panneau détail */}
              {detail === u.uid && (
                <div className="px-3 px-md-4 pb-3" style={{ background: 'var(--bs-tertiary-bg)' }}>
                  {chargDetail ? (
                    <div className="py-3 text-center">
                      <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} />
                    </div>
                  ) : detailData && (
                    <div className="row g-3 pt-3">
                      {/* Stats */}
                      <div className="col-12 col-md-6">
                        <div className="d-flex gap-3 flex-wrap">
                          {[
                            { label: 'Clients', val: detailData.stats?.clients },
                            { label: 'Produits', val: detailData.stats?.produits },
                            { label: 'Dettes', val: detailData.stats?.dettes },
                          ].map(s => (
                            <div key={s.label} className="text-center px-3 py-2 rounded-3"
                              style={{ background: 'var(--bs-secondary-bg)' }}>
                              <div className="fw-bold" style={{ fontSize: 'var(--txt-xl)', color: '#6366f1' }}>{s.val ?? 0}</div>
                              <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        {detailData.vitrine?.nomEntreprise && (
                          <div className="mt-2 text-muted" style={{ fontSize: 'var(--txt-base)' }}>
                            Vitrine : <strong>{detailData.vitrine.nomEntreprise}</strong>
                            {' '}({detailData.vitrine.catalogueActif ? '✅ active' : '⏸ inactive'})
                          </div>
                        )}
                        <div className="text-muted mt-1" style={{ fontSize: 'var(--txt-sm)' }}>
                          Dernière connexion : {fmt(detailData.lastSignIn)}
                        </div>
                      </div>

                      {/* Actions */}
                      {u.email !== EMAIL_ADMIN && (
                        <div className="col-12 col-md-6">
                          {/* Accès payant */}
                          <div className="small fw-semibold text-muted mb-1">Accès à GesTrack</div>
                          <div className="d-flex gap-2 flex-wrap mb-3">
                            {u.statutAcces !== 'actif' && (
                              <button className="btn btn-sm d-flex align-items-center gap-1" disabled={enCours === u.uid}
                                style={{ background: '#16a34a', color: '#fff', borderRadius: 8 }}
                                onClick={() => changerAcces(u, 'approuver')}>
                                <FontAwesomeIcon icon={faCrown} /> Approuver (Pro)
                              </button>
                            )}
                            <button className="btn btn-sm d-flex align-items-center gap-1" disabled={enCours === u.uid}
                              style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 8 }}
                              onClick={() => changerAcces(u, 'prolonger', 30)}>
                              <FontAwesomeIcon icon={faHourglassHalf} /> Essai +30 jours
                            </button>
                            {u.statutAcces !== 'bloque' && (
                              <button className="btn btn-sm d-flex align-items-center gap-1" disabled={enCours === u.uid}
                                style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8 }}
                                onClick={() => changerAcces(u, 'bloquer')}>
                                <FontAwesomeIcon icon={faBan} /> Bloquer l'accès
                              </button>
                            )}
                          </div>
                          <div className="small fw-semibold text-muted mb-1">Compte</div>
                          <div className="d-flex gap-2 flex-wrap">
                            {u.disabled ? (
                              <button className="btn btn-sm d-flex align-items-center gap-1"
                                style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 8 }}
                                onClick={() => setAction({ uid: u.uid, type: 'reactiver' })}>
                                <FontAwesomeIcon icon={faLockOpen} /> Réactiver
                              </button>
                            ) : (
                              <button className="btn btn-sm d-flex align-items-center gap-1"
                                style={{ background: '#fef3c7', color: '#d97706', borderRadius: 8 }}
                                onClick={() => setAction({ uid: u.uid, type: 'suspendre' })}>
                                <FontAwesomeIcon icon={faLock} /> Suspendre
                              </button>
                            )}
                            <button className="btn btn-sm d-flex align-items-center gap-1"
                              style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8 }}
                              onClick={() => setAction({ uid: u.uid, type: 'supprimer' })}>
                              <FontAwesomeIcon icon={faTrash} /> Supprimer tout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmation */}
      {action && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setAction(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0">
              <div className="modal-body p-4 text-center">
                <div className="mb-3" style={{ fontSize: 36 }}>
                  {action.type === 'supprimer' ? '🗑️' : action.type === 'suspendre' ? '🔒' : action.type === 'essais' ? '⏳' : '✅'}
                </div>
                <h6 className="fw-bold mb-2">
                  {action.type === 'supprimer' ? 'Supprimer définitivement ?' :
                   action.type === 'suspendre' ? 'Suspendre ce compte ?' :
                   action.type === 'essais' ? 'Démarrer la période d\'essai ?' : 'Réactiver ce compte ?'}
                </h6>
                <p className="text-muted small mb-4">
                  {action.type === 'supprimer'
                    ? 'Toutes les données de cet utilisateur seront effacées. Cette action est irréversible.'
                    : action.type === 'suspendre'
                    ? 'L\'utilisateur ne pourra plus se connecter.'
                    : action.type === 'essais'
                    ? `Les ${nbSansStatut} compte(s) existant(s) reçoivent 30 jours d'accès et un message les invitant à vous contacter pour passer à la version Pro. Passé ce délai, ils seront bloqués.`
                    : 'L\'utilisateur pourra à nouveau se connecter.'}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-light" onClick={() => setAction(null)}>Annuler</button>
                  <button className="btn text-white"
                    style={{ background: action.type === 'supprimer' ? '#dc2626' : action.type === 'suspendre' ? '#d97706' : action.type === 'essais' ? '#0369a1' : '#16a34a', borderRadius: 10 }}
                    onClick={confirmerAction}>
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>{/* fin zone défilante */}
    </div>
  );
};

export default AdminUtilisateurs;
