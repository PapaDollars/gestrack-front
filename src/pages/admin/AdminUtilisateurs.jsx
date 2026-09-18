import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faSpinner, faSearch, faLock, faLockOpen,
  faTrash, faEnvelope, faCalendar, faChevronDown, faChevronUp, faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '@/services/adminAPI';
import { toast } from 'react-toastify';

const ADMIN_EMAIL = 'gestrack.gt@gmail.com';

const AdminUtilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement]     = useState(true);
  const [recherche, setRecherche]       = useState('');
  const [detail, setDetail]             = useState(null);
  const [detailData, setDetailData]     = useState(null);
  const [chargDetail, setChargDetail]   = useState(false);
  const [action, setAction]             = useState(null); // { uid, type }

  useEffect(() => {
    adminAPI.getUtilisateurs()
      .then(r => setUtilisateurs(r.data))
      .catch(() => toast.error('Erreur chargement utilisateurs'))
      .finally(() => setChargement(false));
  }, []);

  const filtres = utilisateurs.filter(u =>
    u.email.toLowerCase().includes(recherche.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(recherche.toLowerCase())
  );

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
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
          <FontAwesomeIcon icon={faUsers} style={{ color: '#6366f1' }} />
          Utilisateurs
          <span className="badge bg-secondary" style={{ fontSize: 12 }}>{utilisateurs.length}</span>
        </h4>
        <p className="text-muted small mb-0">Gestion des comptes inscrits sur GesTrack</p>
      </div>

      {/* Recherche */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-body-secondary border-end-0">
              <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 13 }} />
            </span>
            <input type="text" className="form-control border-start-0"
              placeholder="Rechercher par email ou nom..."
              value={recherche} onChange={e => setRecherche(e.target.value)} />
            {recherche && (
              <button type="button" className="btn btn-light border" onClick={() => setRecherche('')}>
                <FontAwesomeIcon icon={faTimes} style={{ fontSize: 13 }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="card-body p-0">
          {filtres.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">Aucun utilisateur trouvé</p>
          ) : filtres.map((u, i) => (
            <div key={u.uid} style={{ borderBottom: i < filtres.length - 1 ? '1px solid var(--bs-border-color)' : 'none' }}>
              {/* Ligne principale */}
              <div className="d-flex align-items-center gap-3 px-4 py-3"
                style={{ cursor: 'pointer' }}
                onClick={() => ouvrirDetail(u.uid)}>

                {/* Avatar initiale */}
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 40, height: 40, background: u.disabled ? '#fee2e2' : '#ede9fe',
                    color: u.disabled ? '#dc2626' : '#7c3aed', fontWeight: 700, fontSize: 16 }}>
                  {(u.displayName || u.email || '?')[0].toUpperCase()}
                </div>

                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 14 }}>
                      {u.displayName || '—'}
                    </span>
                    {u.disabled && (
                      <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: 10 }}>Suspendu</span>
                    )}
                    {u.email === ADMIN_EMAIL && (
                      <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontSize: 10 }}>Admin</span>
                    )}
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    <FontAwesomeIcon icon={faEnvelope} className="me-1" style={{ fontSize: 10 }} />
                    {u.email}
                  </div>
                </div>

                <div className="text-end flex-shrink-0">
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    <FontAwesomeIcon icon={faCalendar} className="me-1" style={{ fontSize: 9 }} />
                    {fmt(u.createdAt)}
                  </div>
                  <FontAwesomeIcon icon={detail === u.uid ? faChevronUp : faChevronDown}
                    style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }} />
                </div>
              </div>

              {/* Panneau détail */}
              {detail === u.uid && (
                <div className="px-4 pb-3" style={{ background: 'var(--bs-tertiary-bg)' }}>
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
                              <div className="fw-bold" style={{ fontSize: 18, color: '#6366f1' }}>{s.val ?? 0}</div>
                              <div className="text-muted" style={{ fontSize: 11 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        {detailData.vitrine?.nomEntreprise && (
                          <div className="mt-2 text-muted" style={{ fontSize: 12 }}>
                            Vitrine : <strong>{detailData.vitrine.nomEntreprise}</strong>
                            {' '}({detailData.vitrine.catalogueActif ? '✅ active' : '⏸ inactive'})
                          </div>
                        )}
                        <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                          Dernière connexion : {fmt(detailData.lastSignIn)}
                        </div>
                      </div>

                      {/* Actions */}
                      {u.email !== ADMIN_EMAIL && (
                        <div className="col-12 col-md-6">
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
                  {action.type === 'supprimer' ? '🗑️' : action.type === 'suspendre' ? '🔒' : '✅'}
                </div>
                <h6 className="fw-bold mb-2">
                  {action.type === 'supprimer' ? 'Supprimer définitivement ?' :
                   action.type === 'suspendre' ? 'Suspendre ce compte ?' : 'Réactiver ce compte ?'}
                </h6>
                <p className="text-muted small mb-4">
                  {action.type === 'supprimer'
                    ? 'Toutes les données de cet utilisateur seront effacées. Cette action est irréversible.'
                    : action.type === 'suspendre'
                    ? 'L\'utilisateur ne pourra plus se connecter.'
                    : 'L\'utilisateur pourra à nouveau se connecter.'}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-light" onClick={() => setAction(null)}>Annuler</button>
                  <button className="btn text-white"
                    style={{ background: action.type === 'supprimer' ? '#dc2626' : action.type === 'suspendre' ? '#d97706' : '#16a34a', borderRadius: 10 }}
                    onClick={confirmerAction}>
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUtilisateurs;
