// Modal de détails complets d'un client avec résumé de ses dettes
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faPhone, faUser, faSpinner,
  faFileInvoiceDollar, faArrowRight, faTag, faStickyNote, faPrint
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp as faWhatsappBrand } from '@fortawesome/free-brands-svg-icons';
import { dettesAPI } from '@/services/api';
import { imprimerRapportClient } from '@/utils/pdfTemplates';

const ModalDetailClient = ({ client, onFermer }) => {
  const [dettes, setDettes] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await dettesAPI.getByClient(client.id);
        setDettes(data);
      } catch {
        // Silencieux — les dettes sont optionnelles dans ce contexte
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [client.id]);

  const formatMontant = (m) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  const statutStyle = {
    EN_COURS:    { bg: '#fff3cd', color: '#856404', label: 'En cours' },
    EN_RETARD:   { bg: '#f8d7da', color: '#842029', label: 'En retard' },
    SOLDEE:      { bg: '#d1e7dd', color: '#0f5132', label: 'Soldée' },
    ABANDONNEE:  { bg: '#f3f4f6', color: '#6b7280', label: 'Abandonnée' },
  };

  const dettesActives    = dettes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD');
  const dettesReglees    = dettes.filter(d => d.statut === 'SOLDEE');
  const dettesAbandon    = dettes.filter(d => d.statut === 'ABANDONNEE');

  const ouvrirWhatsApp = (numero) => {
    window.open(`https://wa.me/${numero.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>

          {/* En-tête */}
          <div className="modal-header border-0 px-4 pt-4 pb-3">
            <div className="d-flex align-items-center gap-3">
              {client.photo ? (
                <img src={client.photo} alt="" className="rounded-circle object-fit-cover flex-shrink-0"
                  style={{ width: 56, height: 56 }} />
              ) : (
                <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0"
                  style={{ width: 56, height: 56, background: '#00d4aa', fontSize: 20 }}>
                  {client.nom?.charAt(0)}{client.prenom?.charAt(0)}
                </div>
              )}
              <div>
                <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{client.prenom} {client.nom}</h5>
                <span className="badge" style={{ background: '#00d4aa20', color: '#00a881', fontSize: 12 }}>
                  {client.profession}
                </span>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <button
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: '#e8f5f3', color: '#00a881', borderRadius: 8, fontSize: 12 }}
                title="Imprimer le rapport client"
                onClick={() => imprimerRapportClient(client, dettes)}
                disabled={chargement}
              >
                <FontAwesomeIcon icon={faPrint} />
                Imprimer
              </button>
              <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="modal-body px-4 pb-4">

            {/* Coordonnées */}
            <div className="card border-0 mb-3" style={{ background: 'var(--bs-secondary-bg)', borderRadius: 12 }}>
              <div className="card-body p-3">
                <div className="small fw-semibold text-muted mb-2 text-uppercase" style={{ letterSpacing: 1, fontSize: 11 }}>
                  <FontAwesomeIcon icon={faUser} className="me-1" /> Coordonnées
                </div>
                <div className="d-flex flex-column gap-2">
                  <a href={`tel:${client.telephone}`} className="d-flex align-items-center gap-2 text-decoration-none text-dark small">
                    <FontAwesomeIcon icon={faPhone} style={{ color: '#6366f1', width: 16 }} />
                    <span>{client.telephone}</span>
                  </a>
                  {client.telephoneWhatsapp && (
                    <button className="btn btn-link p-0 d-flex align-items-center gap-2 text-decoration-none text-dark small text-start"
                      onClick={() => ouvrirWhatsApp(client.telephoneWhatsapp)}>
                      <FontAwesomeIcon icon={faWhatsappBrand} style={{ color: '#25d366', width: 16 }} />
                      <span>{client.telephoneWhatsapp}</span>
                    </button>
                  )}
                  {client.age && (
                    <span className="text-muted small">
                      <strong>Âge :</strong> {client.age} ans
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Types de produits */}
            {client.typeProduits?.length > 0 && (
              <div className="card border-0 mb-3" style={{ background: 'var(--bs-secondary-bg)', borderRadius: 12 }}>
                <div className="card-body p-3">
                  <div className="small fw-semibold text-muted mb-2 text-uppercase" style={{ letterSpacing: 1, fontSize: 11 }}>
                    <FontAwesomeIcon icon={faTag} className="me-1" /> Types de produits
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {client.typeProduits.map(t => (
                      <span key={t} className="badge" style={{ background: '#e8f5f3', color: '#00a881', fontSize: 12, fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="card border-0 mb-3" style={{ background: 'var(--bs-secondary-bg)', borderRadius: 12 }}>
                <div className="card-body p-3">
                  <div className="small fw-semibold text-muted mb-2 text-uppercase" style={{ letterSpacing: 1, fontSize: 11 }}>
                    <FontAwesomeIcon icon={faStickyNote} className="me-1" /> Notes
                  </div>
                  <p className="small text-dark mb-0" style={{ whiteSpace: 'pre-wrap' }}>{client.notes}</p>
                </div>
              </div>
            )}

            {/* Dettes */}
            <div className="card border-0 mb-3" style={{ background: 'var(--bs-secondary-bg)', borderRadius: 12 }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="small fw-semibold text-muted text-uppercase" style={{ letterSpacing: 1, fontSize: 11 }}>
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-1" /> Dettes
                  </div>
                  <Link
                    to={`/clients/${client.id}/dettes`}
                    className="btn btn-sm d-flex align-items-center gap-1 text-white"
                    style={{ background: '#00d4aa', borderRadius: 8, fontSize: 12 }}
                    onClick={onFermer}
                  >
                    Voir tout <FontAwesomeIcon icon={faArrowRight} />
                  </Link>
                </div>

                {chargement ? (
                  <div className="text-center py-3">
                    <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} />
                  </div>
                ) : dettes.length === 0 ? (
                  <p className="text-muted small mb-0">Aucune dette enregistrée</p>
                ) : (
                  <>
                    {/* Résumé chiffré */}
                    <div className="d-flex gap-3 mb-3 flex-wrap">
                      <div className="text-center">
                        <div className="fw-bold" style={{ color: '#dc2626', fontSize: 16 }}>
                          {formatMontant(dettesActives.reduce((s, d) => s + d.montantActuel, 0))}
                        </div>
                        <div className="text-muted" style={{ fontSize: 11 }}>Restant dû</div>
                      </div>
                      <div className="text-center">
                        <div className="fw-bold" style={{ color: '#16a34a', fontSize: 16 }}>
                          {formatMontant(dettesReglees.reduce((s, d) => s + d.montantInitial, 0))}
                        </div>
                        <div className="text-muted" style={{ fontSize: 11 }}>Réglé</div>
                      </div>
                      {dettesAbandon.length > 0 && (
                        <div className="text-center">
                          <div className="fw-bold" style={{ color: '#6b7280', fontSize: 16 }}>
                            {formatMontant(dettesAbandon.reduce((s, d) => s + d.montantActuel, 0))}
                          </div>
                          <div className="text-muted" style={{ fontSize: 11 }}>Abandonné</div>
                        </div>
                      )}
                    </div>

                    {/* Liste des dettes actives */}
                    {dettesActives.length > 0 && (
                      <div className="d-flex flex-column gap-2">
                        {dettesActives.slice(0, 5).map(d => {
                          const s = statutStyle[d.statut] || statutStyle.EN_COURS;
                          return (
                            <div key={d.id} className="d-flex align-items-center justify-content-between p-2 rounded"
                              style={{ background: '#fff', fontSize: 13 }}>
                              <div className="d-flex align-items-center gap-2 overflow-hidden">
                                <span className="badge" style={{ background: s.bg, color: s.color, fontSize: 10, flexShrink: 0 }}>{s.label}</span>
                                <span className="text-truncate text-muted">{d.description || 'Sans description'}</span>
                              </div>
                              <span className="fw-semibold ms-2 flex-shrink-0" style={{ color: '#dc2626' }}>
                                {formatMontant(d.montantActuel)}
                              </span>
                            </div>
                          );
                        })}
                        {dettesActives.length > 5 && (
                          <p className="text-muted small mb-0 text-center">
                            +{dettesActives.length - 5} autre(s) — <Link to={`/clients/${client.id}/dettes`} onClick={onFermer}>voir tout</Link>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetailClient;
