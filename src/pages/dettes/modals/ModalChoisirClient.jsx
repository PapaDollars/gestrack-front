// Modal : choix du client avant de créer une dette
import React, { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSearch, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { clientsAPI } from '@/services/api';
import { toast } from 'react-toastify';

// ── Modal sélection du client ─────────────────────────────────────────────────
const ModalChoisirClient = ({ onSelect, onFermer }) => {
  const [clients, setClients] = useState([]);
  const [charg, setCharg] = useState(true);
  const [texte, setTexte] = useState('');

  useEffect(() => {
    clientsAPI.getAll()
      .then(r => setClients(r.data))
      .catch(() => toast.error('Erreur lors du chargement des clients'))
      .finally(() => setCharg(false));
  }, []);

  const filtres = useMemo(() => {
    if (!texte.trim()) return clients;
    const t = texte.toLowerCase();
    return clients.filter(c =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(t) ||
      c.surnom?.toLowerCase().includes(t) ||
      c.telephone?.includes(t)
    );
  }, [texte, clients]);

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faUser} className="me-2" style={{ color: '#00d4aa' }} />
              Choisir le client
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 pb-4">
            <div className="input-group mb-3">
              <span className="input-group-text bg-body-secondary border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
              </span>
              <input type="text" className="form-control border-start-0" autoFocus
                placeholder="Nom, prénom, téléphone, surnom..."
                value={texte} onChange={e => setTexte(e.target.value)} />
              {texte && (
                <button type="button" className="btn btn-light border" onClick={() => setTexte('')}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
            {charg ? (
              <div className="text-center py-3">
                <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} />
              </div>
            ) : (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {filtres.length === 0 ? (
                  <p className="text-muted text-center small py-3">Aucun client trouvé</p>
                ) : filtres.map(c => (
                  <div key={c.id}
                    className="d-flex align-items-center gap-3 p-2 rounded-2 mb-1"
                    style={{ cursor: 'pointer', border: '1px solid var(--bs-border-color)' }}
                    onClick={() => onSelect(c)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bs-secondary-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {c.photo
                      ? <img src={c.photo} alt="" className="rounded-circle flex-shrink-0" style={{ width: 38, height: 38, objectFit: 'cover' }} />
                      : <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
                          style={{ width: 38, height: 38, background: '#00d4aa', fontSize: 'var(--txt-lg)' }}>
                          {c.prenom?.[0]}{c.nom?.[0]}
                        </div>}
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                        {c.prenom} {c.nom}
                        {c.surnom && <span className="text-muted ms-1" style={{ fontSize: 'var(--txt-base)' }}>« {c.surnom} »</span>}
                      </div>
                      <div className="text-muted" style={{ fontSize: 'var(--txt-base)' }}>{c.profession} · {c.telephone}</div>
                    </div>
                    {c.totalDette > 0 && (
                      <span className="badge flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', fontSize: 'var(--txt-sm)' }}>
                        Dette : {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(c.totalDette)}
      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalChoisirClient;
