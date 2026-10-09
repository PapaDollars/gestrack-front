// Modal de détails complets d'un client avec résumé de ses dettes
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faPhone, faUser, faSpinner,
  faFileInvoiceDollar, faArrowRight, faTag, faStickyNote, faPrint, faEdit, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp as faWhatsappBrand } from '@fortawesome/free-brands-svg-icons';
import { dettesAPI } from '@/services/api';
import { imprimerRapportClient } from '@/utils/pdfTemplates';
import { ROUTES } from '@/utils/url/frontend';

const ModalDetailClient = ({ client, onFermer, onModifier, onSupprimer }) => {
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

  const dettesActives    = dettes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD');
  const dettesAbandon    = dettes.filter(d => d.statut === 'ABANDONNEE');

  const ouvrirWhatsApp = (numero) => {
    window.open(`https://wa.me/${numero.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>

          {/* En-tête */}
          {/* Identité + fermer sur la 1re ligne ; actions en dessous sur mobile, entre les deux sur grand écran */}
          <div className="modal-header border-0 px-4 pt-4 pb-3 d-flex flex-wrap align-items-center row-gap-3">
            <div className="d-flex align-items-center gap-3 order-1 min-w-0" style={{ flex: '1 1 0', minWidth: 0 }}>
              {client.photo ? (
                <img src={client.photo} alt="" className="rounded-circle object-fit-cover flex-shrink-0"
                  style={{ width: 56, height: 56 }} />
              ) : (
                <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0"
                  style={{ width: 56, height: 56, background: '#00d4aa', fontSize: 20 }}>
                  {client.nom?.charAt(0)}{client.prenom?.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{client.prenom} {client.nom}</h5>
                <span className="badge" style={{ background: '#00d4aa20', color: '#00a881', fontSize: 12 }}>
                  {client.profession}
                </span>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap order-3 order-md-2 col-12 col-md-auto">
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
              {onModifier && (
                <button
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', borderRadius: 8, fontSize: 12 }}
                  onClick={() => { onFermer(); onModifier(client); }}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Modifier
                </button>
              )}
              {onSupprimer && (
                <button
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 8, fontSize: 12 }}
                  onClick={() => { onFermer(); onSupprimer(client); }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Supprimer
                </button>
              )}
            </div>
            <button className="btn btn-light btn-sm rounded-circle ms-2 ms-md-4 order-2 order-md-3 flex-shrink-0" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
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

            {/* Dettes — résumé et lien vers la page des dettes, sur une seule ligne */}
            <div className="card border-0 mb-3" style={{ background: 'var(--bs-secondary-bg)', borderRadius: 12 }}>
              <div className="card-body p-3 d-flex align-items-center flex-wrap column-gap-4 row-gap-2">
                <div className="small fw-semibold text-muted text-uppercase" style={{ letterSpacing: 1, fontSize: 11 }}>
                  <FontAwesomeIcon icon={faFileInvoiceDollar} className="me-1" /> Dettes
                </div>

                {chargement ? (
                  <FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} />
                ) : dettes.length === 0 ? (
                  <span className="text-muted small">Aucune dette enregistrée</span>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="fw-bold" style={{ color: '#dc2626', fontSize: 16 }}>
                        {formatMontant(dettesActives.reduce((s, d) => s + d.montantActuel, 0))}
                      </div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Restant dû</div>
                    </div>
                    {/* Abandonné : montant au moment de l'abandon (montantActuel est remis à 0) */}
                    <div className="text-center">
                      <div className="fw-bold" style={{ color: '#6b7280', fontSize: 16 }}>
                        {formatMontant(dettesAbandon.reduce((s, d) => s + (d.montantAbandonne ?? d.montantInitial ?? 0), 0))}
                      </div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Abandonné</div>
                    </div>
                  </>
                )}

                <Link
                  to={ROUTES.dettesClient(client.id)}
                  className="btn btn-sm d-flex align-items-center gap-1 text-white ms-auto"
                  style={{ background: '#00d4aa', borderRadius: 8, fontSize: 12 }}
                  onClick={onFermer}
                >
                  Voir toutes les dettes <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetailClient;
