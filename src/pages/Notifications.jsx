// Page des notifications et rappels automatiques
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faCheckDouble, faSpinner, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { notificationsAPI } from '@/services/api';
import { toast } from 'react-toastify';
import useIsMobile from '@/hooks/useIsMobile';

const Notifications = () => {
  const isMobile = useIsMobile(); // eslint-disable-line no-unused-vars
  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(true);

  const chargerNotifications = async () => {
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data);
    } catch {
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { chargerNotifications(); }, []);

  const marquerLu = async (id) => {
    try {
      await notificationsAPI.marquerLu(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    } catch {
      toast.error('Erreur');
    }
  };

  const marquerToutLu = async () => {
    try {
      await notificationsAPI.marquerToutLu();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      toast.success('Toutes les notifications marquées comme lues');
    } catch {
      toast.error('Erreur');
    }
  };

  const nbNonLues = notifications.filter(n => !n.lu).length;
  const formatMontant = (m) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>

      {/* ── En-tête fixe ── */}
      <div style={{ flexShrink: 0 }}>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Notification de rappel de dette</h4>
          <p className="text-muted small mb-0">{nbNonLues} non lue(s)</p>
        </div>
        {nbNonLues > 0 && (
          <button className="btn btn-sm btn-light d-flex align-items-center gap-2" onClick={marquerToutLu}>
            <FontAwesomeIcon icon={faCheckDouble} />
            Tout marquer comme lu
          </button>
        )}
      </div>
      </div>{/* fin fixe */}

      {/* ── Zone scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
      {chargement ? (
        <div className="text-center py-5">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faBell} size="3x" className="mb-3 d-block" />
          Aucune notification
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="card border-0 shadow-sm"
              style={{
                borderRadius: 14,
                borderLeft: notif.lu ? 'none' : '4px solid #f59e0b',
                background: notif.lu ? 'var(--bs-card-bg)' : 'rgba(245,158,11,0.08)',
              }}
            >
              <div className="card-body p-3 d-flex align-items-start gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 42, height: 42, background: 'rgba(245,158,11,0.15)' }}>
                  <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ color: '#d97706', fontSize: 16 }} />
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold small mb-1" style={{ color: 'var(--bs-body-color)' }}>{notif.clientNom}</div>
                  <div className="text-muted small mb-2">{notif.message}</div>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex gap-2">
                      <Link
                        to={`/clients/${notif.clientId}/dettes`}
                        className="btn btn-sm"
                        style={{ background: '#00d4aa', color: '#fff', fontSize: 11 }}
                      >
                        Voir les dettes
                      </Link>
                      {!notif.lu && (
                        <button className="btn btn-sm btn-light" style={{ fontSize: 11 }}
                          onClick={() => marquerLu(notif.id)}>
                          <FontAwesomeIcon icon={faCheck} className="me-1" />Lu
                        </button>
                      )}
                    </div>
                    <span className="text-muted" style={{ fontSize: 11 }}>
                      {new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>{/* fin scrollable */}
    </div>
  );
};

export default Notifications;
