import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faSpinner, faSearch } from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '@/services/adminAPI';
import { toast } from 'react-toastify';

const ACTION_STYLE = {
  suspension:    { emoji: '🔒', color: '#d97706', bg: '#fef3c7' },
  reactivation:  { emoji: '✅', color: '#16a34a', bg: '#dcfce7' },
  suppression:   { emoji: '🗑️', color: '#dc2626', bg: '#fee2e2' },
  diffusion:     { emoji: '📢', color: '#6366f1', bg: '#ede9fe' },
  scan_complet:  { emoji: '🔍', color: '#0ea5e9', bg: '#e0f2fe' },
};

const AdminJournal = () => {
  const [journal, setJournal]     = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreAction, setFiltreAction] = useState('');

  useEffect(() => {
    adminAPI.getJournal()
      .then(r => setJournal(r.data))
      .catch(() => toast.error('Erreur chargement journal'))
      .finally(() => setChargement(false));
  }, []);

  const filtres = journal.filter(log => {
    if (filtreAction && log.action !== filtreAction) return false;
    if (recherche && !log.details?.toLowerCase().includes(recherche.toLowerCase())) return false;
    return true;
  });

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
          <FontAwesomeIcon icon={faClipboardList} style={{ color: '#6366f1' }} />
          Journal des actions
          <span className="badge bg-secondary" style={{ fontSize: 12 }}>{journal.length}</span>
        </h4>
        <p className="text-muted small mb-0">Historique complet de toutes les actions administratives</p>
      </div>

      {/* Filtres */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body p-3">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            {Object.entries(ACTION_STYLE).map(([val, s]) => (
              <button key={val} type="button" className="btn btn-sm"
                style={{
                  borderRadius: 20, padding: '3px 14px',
                  background: filtreAction === val ? s.bg : 'var(--bs-secondary-bg)',
                  color: filtreAction === val ? s.color : 'var(--bs-body-color)',
                  border: filtreAction === val ? 'none' : '1px solid var(--bs-border-color)',
                  fontWeight: filtreAction === val ? 600 : 400,
                  fontSize: 12,
                }}
                onClick={() => setFiltreAction(filtreAction === val ? '' : val)}>
                {s.emoji} {val}
              </button>
            ))}
            <div className="input-group ms-auto" style={{ maxWidth: 240 }}>
              <span className="input-group-text bg-body-secondary border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 11 }} />
              </span>
              <input type="text" className="form-control border-start-0" placeholder="Rechercher..."
                value={recherche} onChange={e => setRecherche(e.target.value)} style={{ fontSize: 12 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="card-body p-0">
          {filtres.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">Aucune entrée dans le journal</p>
          ) : filtres.map((log, i) => {
            const s = ACTION_STYLE[log.action] || { emoji: '⚙️', color: '#6b7280', bg: '#f3f4f6' };
            return (
              <div key={log.id} className="d-flex align-items-start gap-3 px-4 py-3"
                style={{ borderBottom: i < filtres.length - 1 ? '1px solid var(--bs-border-color)' : 'none' }}>
                <span className="badge rounded-pill flex-shrink-0 mt-1"
                  style={{ background: s.bg, color: s.color, fontSize: 11, minWidth: 90, textAlign: 'center' }}>
                  {s.emoji} {log.action}
                </span>
                <div className="flex-grow-1 min-w-0">
                  <div className="text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 13 }}>
                    {log.details}
                  </div>
                  {log.cibleUid && (
                    <div className="text-muted" style={{ fontSize: 10 }}>
                      UID cible : <code>{log.cibleUid}</code>
                    </div>
                  )}
                </div>
                <div className="text-end flex-shrink-0" style={{ minWidth: 130 }}>
                  <div className="text-muted" style={{ fontSize: 11 }}>{fmt(log.createdAt)}</div>
                  <div className="text-muted" style={{ fontSize: 10 }}>{log.adminEmail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminJournal;
