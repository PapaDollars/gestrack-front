import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag, faSpinner, faCheck, faTimes, faSearch,
  faShieldAlt, faSync,
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '@/services/adminAPI';
import { toast } from 'react-toastify';

const STATUT_STYLE = {
  en_attente: { bg: '#fef3c7', color: '#d97706', label: 'En attente' },
  approuve:   { bg: '#dcfce7', color: '#16a34a', label: 'Approuvé' },
  rejete:     { bg: '#fee2e2', color: '#dc2626', label: 'Rejeté' },
};

const AdminModeration = () => {
  const [items, setItems]         = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('en_attente');
  const [recherche, setRecherche] = useState('');
  const [scanning, setScanning]   = useState(false);
  const [actionId, setActionId]   = useState(null);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await adminAPI.getModeration();
      setItems(data);
    } catch { toast.error('Erreur chargement modération'); }
    finally { setChargement(false); }
  };

  useEffect(() => { charger(); }, []);

  const filtres = items.filter(item => {
    if (filtreStatut && item.statut !== filtreStatut) return false;
    if (recherche && !item.contenu?.toLowerCase().includes(recherche.toLowerCase())) return false;
    return true;
  });

  const approuver = async (id) => {
    setActionId(id);
    try {
      await adminAPI.approuver(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, statut: 'approuve' } : i));
      toast.success('Contenu approuvé et rendu visible');
    } catch { toast.error('Erreur approbation'); }
    finally { setActionId(null); }
  };

  const rejeter = async (id) => {
    setActionId(id);
    try {
      await adminAPI.rejeter(id);
      setItems(prev => prev.map(i => i.id === id ? { ...i, statut: 'rejete' } : i));
      toast.success('Contenu rejeté — utilisateur notifié');
    } catch { toast.error('Erreur rejet'); }
    finally { setActionId(null); }
  };

  const scanner = async () => {
    setScanning(true);
    try {
      const { data } = await adminAPI.scanner();
      toast.success(data.message);
      await charger();
    } catch { toast.error('Erreur scan'); }
    finally { setScanning(false); }
  };

  const fmt = (dateStr) => dateStr
    ? new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

  const nbAttente = items.filter(i => i.statut === 'en_attente').length;

  if (chargement) return (
    <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
      <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32, color: '#00d4aa' }} />
    </div>
  );

  return (
    <div>
      <div className="mb-4 d-flex align-items-start justify-content-between flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faFlag} style={{ color: '#ef4444' }} />
            Modération de contenu
            {nbAttente > 0 && (
              <span className="badge rounded-pill" style={{ background: '#ef4444', fontSize: 12 }}>{nbAttente}</span>
            )}
          </h4>
          <p className="text-muted small mb-0">Contenu signalé automatiquement pour langage inapproprié</p>
        </div>
        <button className="btn d-flex align-items-center gap-2"
          style={{ background: '#6366f1', color: '#fff', borderRadius: 10 }}
          onClick={scanner} disabled={scanning}>
          {scanning ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSync} />}
          Scanner tout le contenu
        </button>
      </div>

      {/* Filtres */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body p-3">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            {Object.entries(STATUT_STYLE).map(([val, s]) => (
              <button key={val} type="button" className="btn btn-sm"
                style={{
                  borderRadius: 20, padding: '3px 14px',
                  background: filtreStatut === val ? s.bg : 'var(--bs-secondary-bg)',
                  color: filtreStatut === val ? s.color : 'var(--bs-body-color)',
                  border: filtreStatut === val ? 'none' : '1px solid var(--bs-border-color)',
                  fontWeight: filtreStatut === val ? 600 : 400,
                }}
                onClick={() => setFiltreStatut(filtreStatut === val ? '' : val)}>
                {s.label}
                <span className="ms-1 badge" style={{ background: s.bg, color: s.color, fontSize: 10 }}>
                  {items.filter(i => i.statut === val).length}
                </span>
              </button>
            ))}
            <div className="input-group ms-auto" style={{ maxWidth: 240 }}>
              <span className="input-group-text bg-body-secondary border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 11 }} />
              </span>
              <input type="text" className="form-control border-start-0" placeholder="Rechercher..."
                value={recherche} onChange={e => setRecherche(e.target.value)}
                style={{ fontSize: 12 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      {filtres.length === 0 ? (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body p-5 text-center">
            <FontAwesomeIcon icon={faShieldAlt} style={{ fontSize: 40, color: '#00d4aa', marginBottom: 12 }} />
            <p className="text-muted mb-0">
              {filtreStatut === 'en_attente' ? 'Aucun contenu en attente de modération ✅' : 'Aucun élément trouvé'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body p-0">
            {filtres.map((item, i) => {
              const s = STATUT_STYLE[item.statut] || STATUT_STYLE.en_attente;
              return (
                <div key={item.id}
                  style={{ borderBottom: i < filtres.length - 1 ? '1px solid var(--bs-border-color)' : 'none' }}>
                  <div className="px-4 py-3">
                    <div className="d-flex align-items-start gap-3">
                      {/* Statut */}
                      <span className="badge rounded-pill flex-shrink-0 mt-1"
                        style={{ background: s.bg, color: s.color, fontSize: 10 }}>
                        {s.label}
                      </span>

                      <div className="flex-grow-1 min-w-0">
                        {/* Contenu signalé */}
                        <div className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 14 }}>
                          « {item.contenu} »
                        </div>
                        <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                          Collection : <strong>{item.collection}</strong>
                          {' · '}Doc : <code style={{ fontSize: 10 }}>{item.docId?.substring(0, 12)}…</code>
                          {' · '}{fmt(item.createdAt)}
                        </div>
                        {/* Mots détectés */}
                        {item.champsFlags && Object.entries(item.champsFlags).map(([champ, mots]) => (
                          <div key={champ} className="mt-1" style={{ fontSize: 11 }}>
                            <span className="text-muted">{champ} :</span>{' '}
                            {mots.map(m => (
                              <span key={m} className="badge me-1"
                                style={{ background: '#fee2e2', color: '#dc2626', fontSize: 10 }}>
                                {m}
                              </span>
                            ))}
                          </div>
                        ))}
                        {item.traitePar && (
                          <div className="text-muted mt-1" style={{ fontSize: 10 }}>
                            Traité par : {item.traitePar} le {fmt(item.traiteAt)}
                          </div>
                        )}
                      </div>

                      {/* Actions (uniquement en_attente) */}
                      {item.statut === 'en_attente' && (
                        <div className="d-flex gap-2 flex-shrink-0">
                          <button className="btn btn-sm d-flex align-items-center gap-1"
                            style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 8 }}
                            onClick={() => approuver(item.id)}
                            disabled={actionId === item.id}>
                            {actionId === item.id
                              ? <FontAwesomeIcon icon={faSpinner} spin />
                              : <FontAwesomeIcon icon={faCheck} />}
                            Approuver
                          </button>
                          <button className="btn btn-sm d-flex align-items-center gap-1"
                            style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8 }}
                            onClick={() => rejeter(item.id)}
                            disabled={actionId === item.id}>
                            <FontAwesomeIcon icon={faTimes} />
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
