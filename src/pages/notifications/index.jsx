// Page des notifications et rappels automatiques
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faCheckDouble, faSpinner, faFileInvoiceDollar, faBullhorn, faCrown, faFlag } from '@fortawesome/free-solid-svg-icons';
import { notificationsAPI, estMisEnAttente } from '@/services/api';
import { fmtDH } from '@/utils/pdf';
import { toast } from 'react-toastify';
import useIsMobile from '@/hooks/useIsMobile';
import { ROUTES } from '@/utils/url/frontend';

// Présentation selon le type : rappel de dette (par défaut), message de l'admin (diffusion),
// accès GesTrack (approbation / essai / blocage), modération d'un produit.
const TYPES_NOTIF = {
  admin:      { titre: 'Message de l\'administrateur', icon: faBullhorn,  couleur: '#f59e0b', fond: '#fef3c7' },
  acces:      { titre: 'Accès GesTrack',               icon: faCrown,     couleur: '#0369a1', fond: '#e0f2fe' },
  moderation: { titre: 'Modération',                   icon: faFlag,      couleur: '#dc2626', fond: '#fee2e2' },
};

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
      const reponse = await notificationsAPI.marquerLu(id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
    } catch {
      toast.error('Erreur');
    }
  };

  const marquerToutLu = async () => {
    try {
      const reponse = await notificationsAPI.marquerToutLu();
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      toast.success('Toutes les notifications marquées comme lues');
    } catch {
      toast.error('Erreur');
    }
  };

  const nbNonLues = notifications.filter(n => !n.lu).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── En-tête fixe ── */}
      <div style={{ flexShrink: 0 }}>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Notifications</h4>
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
          {notifications.map((notif) => {
            const type = TYPES_NOTIF[notif.type];
            return (
            <div
              key={notif.id}
              className="card border-0 shadow-sm"
              style={{
                borderRadius: 14,
                borderLeft: notif.lu ? 'none' : '4px solid #00d4aa',
                background: notif.lu ? 'var(--bs-card-bg)' : '#abe2d7',
              }}
            >
              <div className="card-body p-3 d-flex align-items-start gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 42, height: 42, background: type?.fond || '#eff8ef' }}>
                  <FontAwesomeIcon icon={type?.icon || faFileInvoiceDollar} style={{ color: type?.couleur || '#d97706', fontSize: 'var(--txt-xl)' }} />
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold small mb-1" style={{ color: 'var(--bs-body-color)' }}>{type ? type.titre : notif.clientNom}</div>
                  <div className="text-muted small mb-2" style={{ whiteSpace: 'pre-line' }}>{notif.message}</div>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex gap-2">
                      {!type && notif.clientId && (
                        <Link to={ROUTES.dettesClient(notif.clientId)} className="btn btn-sm"
                          style={{ background: '#00d4aa', color: '#fff', fontSize: 'var(--txt-sm)' }}>
                          Voir les dettes
                        </Link>
                      )}
                      {type && notif.lien && (
                        <Link to={notif.lien} className="btn btn-sm"
                          style={{ background: type.couleur, color: '#fff', fontSize: 'var(--txt-sm)' }}>
                          Ouvrir
                        </Link>
                      )}
                      {!notif.lu && (
                        <button className="btn btn-sm btn-light" style={{ fontSize: 'var(--txt-sm)' }}
                          onClick={() => marquerLu(notif.id)}>
                          <FontAwesomeIcon icon={faCheck} className="me-1" />Lu
                        </button>
                      )}
                    </div>
                    <span className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>{fmtDH(notif.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
      </div>{/* fin scrollable */}
    </div>
  );
};

export default Notifications;
