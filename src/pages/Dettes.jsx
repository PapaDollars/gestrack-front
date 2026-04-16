// Page de toutes les dettes en cours
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar, faSpinner, faSearch, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { dettesAPI } from '@/services/api';
import { toast } from 'react-toastify';

const Dettes = () => {
  const [dettes, setDettes] = useState([]);
  const [filtres, setFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await dettesAPI.getAll();
        setDettes(data);
        setFiltres(data);
      } catch {
        toast.error('Erreur lors du chargement');
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  useEffect(() => {
    let res = dettes;
    if (recherche) {
      const t = recherche.toLowerCase();
      res = res.filter(d => d.clientNom?.toLowerCase().includes(t) || d.description?.toLowerCase().includes(t));
    }
    if (filtreStatut) res = res.filter(d => d.statut === filtreStatut);
    setFiltres(res);
  }, [recherche, filtreStatut, dettes]);

  const formatMontant = (m) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  const totalEnCours = dettes.filter(d => d.statut !== 'SOLDEE').reduce((a, d) => a + d.montantActuel, 0);
  const totalEnRetard = dettes.filter(d => d.statut === 'EN_RETARD').reduce((a, d) => a + d.montantActuel, 0);

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: '#203a43' }}>Toutes les dettes</h4>
        <p className="text-muted small mb-0">{dettes.length} dette(s) enregistrée(s)</p>
      </div>

      {/* Résumé financier */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#fff3cd' }}>
            <div className="card-body p-3">
              <div className="small text-warning-emphasis mb-1">Total en cours</div>
              <div className="fw-bold fs-5" style={{ color: '#856404' }}>{formatMontant(totalEnCours)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#f8d7da' }}>
            <div className="card-body p-3">
              <div className="small text-danger-emphasis mb-1">Total en retard</div>
              <div className="fw-bold fs-5 text-danger">{formatMontant(totalEnRetard)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="row g-2">
            <div className="col-12 col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input className="form-control border-start-0" placeholder="Rechercher par client ou description..."
                  value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <select className="form-select" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="EN_COURS">En cours</option>
                <option value="EN_RETARD">En retard</option>
                <option value="SOLDEE">Soldée</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      {chargement ? (
        <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} /></div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faFileInvoiceDollar} size="3x" className="mb-3 d-block" />
          Aucune dette trouvée
        </div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="small fw-semibold text-muted border-0 ps-4">Client</th>
                  <th className="small fw-semibold text-muted border-0">Description</th>
                  <th className="small fw-semibold text-muted border-0">Montant</th>
                  <th className="small fw-semibold text-muted border-0">Statut</th>
                  <th className="small fw-semibold text-muted border-0">Date</th>
                  <th className="small fw-semibold text-muted border-0">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtres.map((dette) => (
                  <tr key={dette.id}>
                    <td className="fw-semibold ps-4 small">{dette.clientNom}</td>
                    <td className="text-muted small">{dette.description || '—'}</td>
                    <td className="fw-bold" style={{ color: dette.statut === 'SOLDEE' ? '#16a34a' : '#dc2626' }}>
                      {formatMontant(dette.montantActuel)}
                    </td>
                    <td>
                      <span className={`badge ${dette.statut === 'EN_RETARD' ? 'bg-danger' : dette.statut === 'SOLDEE' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: 10 }}>
                        {dette.statut === 'EN_RETARD' ? 'En retard' : dette.statut === 'SOLDEE' ? 'Soldée' : 'En cours'}
                      </span>
                    </td>
                    <td className="text-muted small">{new Date(dette.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <Link to={`/clients/${dette.clientId}/dettes`} className="btn btn-sm btn-light" style={{ fontSize: 11 }}>
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dettes;
