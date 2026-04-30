// Page de gestion des clients — CRUD complet avec photo, WhatsApp, etc.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEdit, faTrash, faHistory,
  faPhone, faSpinner, faUser, faFilter, faEye,
  faThumbtack, faGripVertical, faChevronLeft, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp as faWhatsappBrand } from '@fortawesome/free-brands-svg-icons';
import { clientsAPI } from '@/services/api';
import { toast } from 'react-toastify';
import useDragAndPin from '@/hooks/useDragAndPin';
import ModalClient from '@/components/clients/ModalClient';
import ModalDetailClient from '@/components/clients/ModalDetailClient';
import ModalConfirmation from '@/components/shared/ModalConfirmation';

const PAR_PAGE = 12;

const Clients = () => {
  const { appliquerOrdre, epingles, epingler, dragSur, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd } = useDragAndPin('clients');
  const [page, setPage] = useState(1);
  const [clients, setClients] = useState([]);
  const [filtres, setFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreProfession, setFiltreProfession] = useState('');
  const [filtreTypeProduit, setFiltreTypeProduit] = useState('');
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [clientSelectionne, setClientSelectionne] = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);

  // Charger tous les clients
  const chargerClients = async () => {
    try {
      const { data } = await clientsAPI.getAll();
      setClients(data);
      setFiltres(data);
    } catch {
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { chargerClients(); }, []);

  // Filtrer les clients selon la recherche, la profession et le type de produit
  useEffect(() => {
    let resultat = clients;
    if (recherche) {
      const terme = recherche.toLowerCase();
      resultat = resultat.filter(c =>
        `${c.nom} ${c.prenom}`.toLowerCase().includes(terme) ||
        c.surnom?.toLowerCase().includes(terme) ||
        c.telephone?.includes(terme) ||
        c.profession?.toLowerCase().includes(terme)
      );
    }
    if (filtreProfession) {
      resultat = resultat.filter(c => c.profession === filtreProfession);
    }
    if (filtreTypeProduit) {
      resultat = resultat.filter(c => c.typeProduits?.includes(filtreTypeProduit));
    }
    setFiltres(resultat);
    setPage(1);
  }, [recherche, filtreProfession, filtreTypeProduit, clients]);

  // Liste unique des professions pour le filtre
  const professions = [...new Set(clients.map(c => c.profession).filter(Boolean))];

  // Liste unique des types de produits utilisés par au moins un client
  const typesProduits = [...new Set(clients.flatMap(c => c.typeProduits || []))].sort();

  // Ouvrir WhatsApp
  const ouvrirWhatsApp = (numero) => {
    const propre = numero.replace(/\D/g, '');
    window.open(`https://wa.me/${propre}`, '_blank');
  };

  // Supprimer un client
  const supprimerClient = async (id) => {
    try {
      await clientsAPI.delete(id);
      toast.success('Client supprimé avec succès');
      chargerClients();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
    setConfirmSuppr(null);
  };

  const ouvrirModal = (client = null) => {
    setClientSelectionne(client);
    setModalOuvert(true);
  };

  const ordonnes   = appliquerOrdre(filtres);
  const totalPages = Math.max(1, Math.ceil(ordonnes.length / PAR_PAGE));
  const pc         = Math.min(page, totalPages);
  const paginees   = ordonnes.slice((pc - 1) * PAR_PAGE, pc * PAR_PAGE);

  return (
    <div>
      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Clients</h4>
          <p className="text-muted small mb-0">{clients.length} client(s) enregistré(s)</p>
        </div>
        <button
          className="btn text-white d-flex align-items-center gap-2"
          style={{ background: '#00d4aa', borderRadius: 10 }}
          onClick={() => ouvrirModal()}
        >
          <FontAwesomeIcon icon={faPlus} />
          Nouveau client
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-body-secondary border-end-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Rechercher par nom, téléphone, profession..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-body-secondary border-end-0">
                  <FontAwesomeIcon icon={faFilter} className="text-muted" />
                </span>
                <select
                  className="form-select border-start-0"
                  value={filtreProfession}
                  onChange={(e) => setFiltreProfession(e.target.value)}
                >
                  <option value="">Toutes les professions</option>
                  {professions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={filtreTypeProduit}
                onChange={(e) => setFiltreTypeProduit(e.target.value)}
              >
                <option value="">Tous les produits</option>
                {typesProduits.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grille de clients */}
      {chargement ? (
        <div className="text-center py-5">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
        </div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faUser} size="3x" className="mb-3 d-block" />
          {recherche || filtreProfession ? 'Aucun résultat trouvé' : 'Aucun client enregistré'}
        </div>
      ) : (
        <>
        <div className="row g-4">
          {paginees.map((client) => {
            const estEpingle = epingles.has(client.id);
            const estCible   = dragSur === client.id;
            return (
            <div
              key={client.id}
              className="col-12 col-sm-4 col-xl-3"
              draggable
              onDragStart={(e) => onDragStart(e, client.id)}
              onDragOver={(e)  => onDragOver(e, client.id)}
              onDragLeave={onDragLeave}
              onDrop={(e)      => onDrop(e, client.id, paginees)}
              onDragEnd={onDragEnd}
              style={{ cursor: 'grab', opacity: dragSur && !estCible && dragSur !== client.id ? 0.5 : 1 }}
            >
              <div className="card border-0 shadow-sm h-100" style={{
                borderRadius: 14,
                border: estCible ? '2px solid #00d4aa' : '2px solid transparent',
                transition: 'border 0.15s',
              }}>
                <div className="card-body p-3 d-flex flex-column">
                  {/* Barre d'outils DnD + pin */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <FontAwesomeIcon icon={faGripVertical} style={{ color: 'var(--bs-secondary-color)', fontSize: 13, cursor: 'grab' }} />
                    <button
                      className="btn btn-sm p-0"
                      style={{ background: 'transparent', border: 'none', lineHeight: 1 }}
                      title={estEpingle ? 'Désépingler' : 'Épingler en haut'}
                      onClick={() => epingler(client.id)}
                    >
                      <FontAwesomeIcon icon={faThumbtack} style={{
                        fontSize: 13,
                        color: estEpingle ? '#00d4aa' : 'var(--bs-secondary-color)',
                        transform: estEpingle ? 'none' : 'rotate(45deg)',
                        transition: 'all 0.2s',
                      }} />
                    </button>
                  </div>

                  {/* En-tête de la carte */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    {client.photo ? (
                      <img
                        src={client.photo}
                        alt={`${client.nom} ${client.prenom}`}
                        className="rounded-circle object-fit-cover flex-shrink-0"
                        style={{ width: 52, height: 52 }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0"
                        style={{ width: 52, height: 52, background: '#00d4aa', fontSize: 18 }}
                      >
                        {client.nom?.charAt(0)}{client.prenom?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>
                        {client.prenom} {client.nom}
                      </div>
                      {client.surnom && (
                        <div className="text-truncate" style={{ fontSize: 11, color: '#00a881', fontStyle: 'italic' }}>
                          « {client.surnom} »
                        </div>
                      )}
                      <span className="badge" style={{ background: '#00d4aa20', color: '#00a881', fontSize: 11 }}>
                        {client.profession}
                      </span>
                    </div>
                  </div>

                  {/* Infos — ligne horizontale fixe, sans retour à la ligne */}
                  <div className="d-flex align-items-center gap-2 mb-3 overflow-hidden" style={{ flexWrap: 'nowrap' }}>
                    <a
                      href={`tel:${client.telephone}`}
                      className="d-flex align-items-center gap-1 text-decoration-none text-muted small flex-shrink-1 overflow-hidden"
                      style={{ minWidth: 0 }}
                    >
                      <FontAwesomeIcon icon={faPhone} style={{ color: '#6366f1', flexShrink: 0 }} />
                      <span className="text-truncate">{client.telephone}</span>
                    </a>
                    {client.telephoneWhatsapp && (
                      <>
                        <span className="text-muted" style={{ flexShrink: 0 }}>·</span>
                        <button
                          className="btn btn-link p-0 d-flex align-items-center gap-1 text-decoration-none text-muted small flex-shrink-1 overflow-hidden"
                          style={{ minWidth: 0 }}
                          onClick={() => ouvrirWhatsApp(client.telephoneWhatsapp)}
                        >
                          <FontAwesomeIcon icon={faWhatsappBrand} style={{ color: '#25d366', flexShrink: 0 }} />
                          <span className="text-truncate">{client.telephoneWhatsapp}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Dette totale + actions collées en bas */}
                  <div className="mt-auto">
                    {client.totalDette > 0 && (
                      <div className="alert alert-danger py-1 px-2 mb-3 small d-flex justify-content-between align-items-center" style={{ borderRadius: 8 }}>
                        <span>Dette totale</span>
                        <strong>{new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(client.totalDette)}</strong>
                      </div>
                    )}
                    {/* Actions */}
                    <div className="d-flex gap-2">
                      <Link
                        to={`/clients/${client.id}/dettes`}
                        className="btn btn-sm flex-grow-1"
                        style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)', fontSize: 12 }}
                      >
                        <FontAwesomeIcon icon={faHistory} className="me-1" /> Dettes
                      </Link>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a' }}
                        onClick={() => setClientDetail(client)}
                        title="Voir les détails"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}
                        onClick={() => ouvrirModal(client)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                        onClick={() => setConfirmSuppr(client)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex align-items-center justify-content-between mt-4">
            <span className="text-muted small">Page {pc} / {totalPages} — {ordonnes.length} client(s)</span>
            <div className="d-flex gap-1">
              <button className="btn btn-sm btn-light" disabled={pc === 1} onClick={() => setPage(1)}>«</button>
              <button className="btn btn-sm btn-light" disabled={pc === 1} onClick={() => setPage(p => p - 1)}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => Math.abs(p - pc) <= 2)
                .map(p => (
                  <button key={p} className={`btn btn-sm ${p === pc ? 'text-white' : 'btn-light'}`}
                    style={p === pc ? { background: '#00d4aa' } : {}}
                    onClick={() => setPage(p)}>{p}</button>
                ))}
              <button className="btn btn-sm btn-light" disabled={pc === totalPages} onClick={() => setPage(p => p + 1)}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              <button className="btn btn-sm btn-light" disabled={pc === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Modal détails client */}
      {clientDetail && (
        <ModalDetailClient
          client={clientDetail}
          onFermer={() => setClientDetail(null)}
        />
      )}

      {/* Modal formulaire client */}
      {modalOuvert && (
        <ModalClient
          client={clientSelectionne}
          professions={professions}
          onFermer={() => setModalOuvert(false)}
          onSucces={() => { setModalOuvert(false); chargerClients(); }}
        />
      )}

      {/* Modal confirmation suppression */}
      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer ${confirmSuppr.prenom} ${confirmSuppr.nom} ? Cette action est irréversible.`}
          onConfirmer={() => supprimerClient(confirmSuppr.id)}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
    </div>
  );
};

export default Clients;
