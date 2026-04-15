// Page des dettes d'un client avec historique complet
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faPlus, faMinus, faTrash,
  faHistory, faSpinner, faFileInvoiceDollar, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { dettesAPI, clientsAPI } from '../../services/api';
import { toast } from 'react-toastify';
import ModalDette from '../dettes/ModalDette';
import ModalTransaction from '../dettes/ModalTransaction';
import ModalConfirmation from '../shared/ModalConfirmation';

const DettesClient = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [dettes, setDettes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [detteExpansee, setDetteExpansee] = useState(null);
  const [historiquesDette, setHistoriquesDette] = useState({});
  const [modalDette, setModalDette] = useState(false);
  const [modalTransaction, setModalTransaction] = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);

  const chargerDonnees = async () => {
    try {
      const [clientRes, dettesRes] = await Promise.all([
        clientsAPI.getById(clientId),
        dettesAPI.getByClient(clientId),
      ]);
      setClient(clientRes.data);
      setDettes(dettesRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { chargerDonnees(); }, [clientId]);

  // Charger l'historique d'une dette
  const toggleHistorique = async (detteId) => {
    if (detteExpansee === detteId) {
      setDetteExpansee(null);
      return;
    }
    setDetteExpansee(detteId);
    if (!historiquesDette[detteId]) {
      try {
        const { data } = await dettesAPI.getHistorique(detteId);
        setHistoriquesDette(prev => ({ ...prev, [detteId]: data }));
      } catch {
        toast.error('Erreur lors du chargement de l\'historique');
      }
    }
  };

  const supprimerDette = async (id) => {
    try {
      await dettesAPI.delete(id);
      toast.success('Dette supprimée');
      chargerDonnees();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
    setConfirmSuppr(null);
  };

  const formatMontant = (m) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  const statutBadge = (statut) => {
    const styles = {
      EN_COURS: { bg: '#fff3cd', color: '#856404', label: 'En cours' },
      EN_RETARD: { bg: '#f8d7da', color: '#842029', label: 'En retard' },
      SOLDEE: { bg: '#d1e7dd', color: '#0f5132', label: 'Soldée' },
    };
    const s = styles[statut] || styles.EN_COURS;
    return (
      <span className="badge" style={{ background: s.bg, color: s.color, fontSize: 11 }}>{s.label}</span>
    );
  };

  if (chargement) return (
    <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} /></div>
  );

  const totalEnCours = dettes.filter(d => d.statut !== 'SOLDEE').reduce((acc, d) => acc + d.montantActuel, 0);

  return (
    <div>
      {/* Navigation */}
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <Link to="/clients" className="btn btn-light btn-sm">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />Clients
        </Link>
        <div>
          <h4 className="fw-bold mb-0" style={{ color: '#203a43' }}>
            {client ? `${client.prenom} ${client.nom}` : 'Dettes client'}
          </h4>
          {client && <span className="text-muted small">{client.profession}</span>}
        </div>
      </div>

      {/* Résumé */}
      {totalEnCours > 0 && (
        <div className="alert d-flex align-items-center justify-content-between mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12 }}>
          <span className="fw-semibold" style={{ color: '#991b1b' }}>Total dû</span>
          <span className="fw-bold fs-5" style={{ color: '#dc2626' }}>{formatMontant(totalEnCours)}</span>
        </div>
      )}

      {/* Bouton nouvelle dette */}
      <div className="d-flex justify-content-end mb-3">
        <button className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa', borderRadius: 10 }}
          onClick={() => setModalDette(true)}>
          <FontAwesomeIcon icon={faPlus} /> Nouvelle dette
        </button>
      </div>

      {/* Liste des dettes */}
      {dettes.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faFileInvoiceDollar} size="3x" className="mb-3 d-block" />
          Aucune dette enregistrée
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {dettes.map((dette) => (
            <div key={dette.id} className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                {/* En-tête dette */}
                <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                  <div>
                    <div className="fw-semibold mb-1" style={{ color: '#203a43' }}>
                      {dette.description || 'Dette sans description'}
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {statutBadge(dette.statut)}
                      <span className="text-muted small">
                        {new Date(dette.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold fs-5" style={{ color: dette.statut === 'SOLDEE' ? '#16a34a' : '#dc2626' }}>
                      {formatMontant(dette.montantActuel)}
                    </div>
                    {dette.montantInitial !== dette.montantActuel && (
                      <div className="text-muted small">Initial : {formatMontant(dette.montantInitial)}</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 flex-wrap mt-3">
                  {dette.statut !== 'SOLDEE' && (
                    <>
                      <button className="btn btn-sm" style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 12 }}
                        onClick={() => setModalTransaction({ dette, type: 'REDUCTION' })}>
                        <FontAwesomeIcon icon={faMinus} className="me-1" />Paiement
                      </button>
                      <button className="btn btn-sm" style={{ background: '#fff7ed', color: '#ea580c', fontSize: 12 }}
                        onClick={() => setModalTransaction({ dette, type: 'AJOUT' })}>
                        <FontAwesomeIcon icon={faPlus} className="me-1" />Ajouter
                      </button>
                    </>
                  )}
                  <button className="btn btn-sm" style={{ background: '#f0f4f8', color: '#203a43', fontSize: 12 }}
                    onClick={() => toggleHistorique(dette.id)}>
                    <FontAwesomeIcon icon={faHistory} className="me-1" />Historique
                    <FontAwesomeIcon icon={detteExpansee === dette.id ? faChevronUp : faChevronDown} className="ms-1" />
                  </button>
                  <button className="btn btn-sm ms-auto" style={{ background: '#fef2f2', color: '#ef4444' }}
                    onClick={() => setConfirmSuppr(dette)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>

                {/* Historique expansé */}
                {detteExpansee === dette.id && (
                  <div className="mt-3 pt-3 border-top">
                    <div className="small fw-semibold text-muted mb-2">Historique des transactions</div>
                    {!historiquesDette[dette.id] ? (
                      <FontAwesomeIcon icon={faSpinner} spin className="text-muted" />
                    ) : historiquesDette[dette.id].length === 0 ? (
                      <div className="text-muted small">Aucun historique</div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {historiquesDette[dette.id].map((h) => (
                          <div key={h.id} className="d-flex align-items-center justify-content-between p-2 rounded"
                            style={{ background: '#f8fafc', fontSize: 12 }}>
                            <div>
                              <span className={`badge me-2 ${
                                h.action === 'REDUCTION' ? 'bg-success' :
                                h.action === 'AJOUT' ? 'bg-warning text-dark' :
                                h.action === 'RAPPEL_AUTOMATIQUE' ? 'bg-danger' : 'bg-secondary'
                              }`} style={{ fontSize: 10 }}>
                                {h.action}
                              </span>
                              {h.details}
                            </div>
                            <div className="text-muted">{new Date(h.timestamp).toLocaleDateString('fr-FR')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modalDette && (
        <ModalDette
          clientId={clientId}
          onFermer={() => setModalDette(false)}
          onSucces={() => { setModalDette(false); chargerDonnees(); }}
        />
      )}
      {modalTransaction && (
        <ModalTransaction
          dette={modalTransaction.dette}
          type={modalTransaction.type}
          onFermer={() => setModalTransaction(null)}
          onSucces={() => { setModalTransaction(null); chargerDonnees(); }}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message="Supprimer cette dette ? L'action est irréversible."
          onConfirmer={() => supprimerDette(confirmSuppr.id)}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
    </div>
  );
};

export default DettesClient;
