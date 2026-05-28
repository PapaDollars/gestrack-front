import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faStore, faFlag, faBox,
  faBullhorn, faShieldAlt, faSpinner, faBell,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '@/services/adminAPI';
import { toast } from 'react-toastify';

const Stat = ({ icon, color, label, value, sub }) => (
  <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
    <div className="card-body p-4">
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{ width: 48, height: 48, background: `${color}18` }}>
          <FontAwesomeIcon icon={icon} style={{ color, fontSize: 20 }} />
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--bs-body-color)', lineHeight: 1 }}>{value ?? '—'}</div>
          <div className="text-muted small mt-1">{label}</div>
          {sub && <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [journal, setJournal] = useState([]);
  const [diffusion, setDiffusion] = useState({ message: '', lien: '' });
  const [envoi, setEnvoi] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const [s, j] = await Promise.all([adminAPI.getStats(), adminAPI.getJournal()]);
        setStats(s.data);
        setJournal(j.data.slice(0, 20));
      } catch { toast.error('Erreur chargement stats'); }
      finally { setChargement(false); }
    };
    charger();
  }, []);

  const handleDiffusion = async (e) => {
    e.preventDefault();
    if (!diffusion.message.trim()) return;
    setEnvoi(true);
    try {
      const { data } = await adminAPI.diffuser(diffusion);
      toast.success(data.message);
      setDiffusion({ message: '', lien: '' });
    } catch { toast.error('Erreur lors de la diffusion'); }
    finally { setEnvoi(false); }
  };

  const actionLabel = {
    suspension: '🔒 Suspension',
    reactivation: '✅ Réactivation',
    suppression: '🗑️ Suppression',
    diffusion: '📢 Diffusion',
    scan_complet: '🔍 Scan',
  };

  if (chargement) return (
    <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
      <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32, color: '#00d4aa' }} />
    </div>
  );

  return (
    <div>
      {/* En-tête */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
          <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#00d4aa' }} />
          Tableau de bord admin
        </h4>
        <p className="text-muted small mb-0">Vue globale de l'application GesTrack</p>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <Stat icon={faUsers} color="#6366f1" label="Utilisateurs" value={stats?.utilisateurs.total}
            sub={`${stats?.utilisateurs.suspendus ?? 0} suspendu(s)`} />
        </div>
        <div className="col-6 col-md-3">
          <Stat icon={faStore} color="#00d4aa" label="Vitrines actives" value={stats?.vitrines.actives} />
        </div>
        <div className="col-6 col-md-3">
          <Stat icon={faFlag} color="#ef4444" label="Modération en attente" value={stats?.moderation.enAttente}
            sub={stats?.moderation.enAttente > 0 ? 'À traiter' : 'Aucun signalement'} />
        </div>
        <div className="col-6 col-md-3">
          <Stat icon={faBox} color="#f59e0b" label="Produits totaux" value={stats?.contenu.produits} />
        </div>
      </div>

      <div className="row g-4">
        {/* Diffusion */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faBullhorn} style={{ color: '#f59e0b' }} />
                Diffuser une notification
              </h6>
              <form onSubmit={handleDiffusion}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Message</label>
                  <textarea className="form-control" rows={3} placeholder="Message envoyé à tous les utilisateurs..."
                    value={diffusion.message}
                    onChange={e => setDiffusion(d => ({ ...d, message: e.target.value }))} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Lien (optionnel)</label>
                  <input type="text" className="form-control" placeholder="/guide, /parametres..."
                    value={diffusion.lien}
                    onChange={e => setDiffusion(d => ({ ...d, lien: e.target.value }))} />
                </div>
                <button type="submit" className="btn text-white d-flex align-items-center gap-2"
                  style={{ background: '#f59e0b', borderRadius: 10 }} disabled={envoi}>
                  {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faBell} />}
                  Envoyer à tous
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Journal */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#6366f1' }} />
                Journal des actions admin
              </h6>
              {journal.length === 0 ? (
                <p className="text-muted small text-center py-3">Aucune action enregistrée</p>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {journal.map(log => (
                    <div key={log.id} className="d-flex align-items-start gap-2 py-2"
                      style={{ borderBottom: '1px solid var(--bs-border-color)', fontSize: 12 }}>
                      <span style={{ flexShrink: 0, minWidth: 100, color: '#6366f1', fontWeight: 600 }}>
                        {actionLabel[log.action] || log.action}
                      </span>
                      <div className="flex-grow-1 text-muted text-truncate">{log.details}</div>
                      <span className="text-muted flex-shrink-0" style={{ fontSize: 10 }}>
                        {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
