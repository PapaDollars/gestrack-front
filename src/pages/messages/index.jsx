// Messages de réservation/contact envoyés par les visiteurs depuis le catalogue public
import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faCheck, faCheckDouble, faSpinner, faTrash, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { messagesAPI, estMisEnAttente } from '@/services/api';
import { fmtDH } from '@/utils/pdf';
import { toast } from 'react-toastify';
import useIsMobile from '@/hooks/useIsMobile';
import { ROUTES } from '@/utils/url/frontend';

const Messages = () => {
  const isMobile = useIsMobile(); // eslint-disable-line no-unused-vars
  const { setNbMessages } = useOutletContext() || {};
  const [messages, setMessages] = useState([]);
  const [chargement, setChargement] = useState(true);

  // Contourne toujours le cache : cette page doit refléter les messages arrivés depuis des
  // sessions anonymes (visiteurs du catalogue public) que rien d'autre ne peut invalider.
  const chargerMessages = async (silencieux = false) => {
    try {
      const { data } = await messagesAPI.refresh();
      setMessages(data);
      setNbMessages?.(data.filter(m => !m.lu).length);
    } catch {
      if (!silencieux) toast.error('Erreur lors du chargement des messages');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerMessages();
    // Sondage périodique pendant que la page reste ouverte — pas de toast d'erreur sur
    // les tentatives silencieuses pour ne pas spammer en cas de coupure réseau passagère.
    const interval = setInterval(() => chargerMessages(true), 360 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  const marquerLu = async (id) => {
    try {
      const reponse = await messagesAPI.marquerLu(id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setMessages(prev => {
        const next = prev.map(m => m.id === id ? { ...m, lu: true } : m);
        setNbMessages?.(next.filter(m => !m.lu).length);
        return next;
      });
    } catch {
      toast.error('Erreur');
    }
  };

  const marquerToutLu = async () => {
    try {
      const reponse = await messagesAPI.marquerToutLu();
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setMessages(prev => prev.map(m => ({ ...m, lu: true })));
      setNbMessages?.(0);
      toast.success('Tous les messages marqués comme lus');
    } catch {
      toast.error('Erreur');
    }
  };

  const supprimer = async (id) => {
    try {
      const reponse = await messagesAPI.delete(id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setMessages(prev => {
        const next = prev.filter(m => m.id !== id);
        setNbMessages?.(next.filter(m => !m.lu).length);
        return next;
      });
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const ouvrirWhatsApp = (numero) => {
    const propre = (numero || '').replace(/\D/g, '');
    if (propre) window.open(`https://wa.me/${propre}`, '_blank');
  };

  const nbNonLus = messages.filter(m => !m.lu).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── En-tête fixe ── */}
      <div style={{ flexShrink: 0 }}>
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Messages</h4>
            <p className="text-muted small mb-0">
              Réservations et demandes de contact envoyées depuis votre catalogue public
              {nbNonLus > 0 ? ` · ${nbNonLus} non lu(s)` : ''}
            </p>
          </div>
          {nbNonLus > 0 && (
            <button className="btn btn-sm btn-light d-flex align-items-center gap-2" onClick={marquerToutLu}>
              <FontAwesomeIcon icon={faCheckDouble} />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* ── Zone scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {chargement ? (
          <div className="text-center py-5">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faCommentDots} size="3x" className="mb-3 d-block" />
            Aucun message pour le moment
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="card border-0 shadow-sm"
                style={{
                  borderRadius: 14,
                  borderLeft: msg.lu ? 'none' : '4px solid #25d366',
                  background: msg.lu ? 'var(--bs-card-bg)' : 'rgba(37,211,102,0.08)',
                }}
              >
                <div className="card-body p-3 d-flex align-items-start gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{ width: 42, height: 42, background: 'rgba(37,211,102,0.12)' }}>
                    <FontAwesomeIcon icon={msg.produitId ? faBoxOpen : faCommentDots}
                      style={{ color: '#16a34a', fontSize: 'var(--txt-xl)' }} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <span className="fw-semibold small" style={{ color: 'var(--bs-body-color)' }}>
                        {msg.nomClient || 'Visiteur anonyme'}
                      </span>
                      {msg.produitNom && (
                        msg.produitId ? (
                          <Link to={ROUTES.produitBoutique(msg.produitId)}
                            className="badge text-decoration-none"
                            style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 'var(--txt-xs)' }}>
                            {msg.produitNom}
                          </Link>
                        ) : (
                          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 'var(--txt-xs)' }}>
                            {msg.produitNom}
                          </span>
                        )
                      )}
                    </div>
                    <div className="text-muted small mb-2" style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div className="d-flex gap-2 flex-wrap">
                        {msg.telephoneClient && (
                          <button className="btn btn-sm d-flex align-items-center gap-2"
                            style={{ background: '#25d366', color: '#fff', fontSize: 'var(--txt-sm)' }}
                            onClick={() => ouvrirWhatsApp(msg.telephoneClient)}>
                            <FontAwesomeIcon icon={faWhatsapp} />
                            {msg.telephoneClient}
                          </button>
                        )}
                        {!msg.lu && (
                          <button className="btn btn-sm btn-light" style={{ fontSize: 'var(--txt-sm)' }}
                            onClick={() => marquerLu(msg.id)}>
                            <FontAwesomeIcon icon={faCheck} className="me-1" />Lu
                          </button>
                        )}
                        <button className="btn btn-sm btn-light text-danger" style={{ fontSize: 'var(--txt-sm)' }}
                          onClick={() => supprimer(msg.id)}>
                          <FontAwesomeIcon icon={faTrash} className="me-1" />Supprimer
                        </button>
                      </div>
                      <span className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>{fmtDH(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
