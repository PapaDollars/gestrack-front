// Page de toutes les dettes
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoiceDollar, faSpinner, faSearch, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import { dettesAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';

// Calcule le montant pertinent d'une dette selon son statut
const montantDette = (d) =>
  d.statut === 'ABANDONNEE' ? (d.montantAbandonne || d.montantInitial) : d.montantActuel;

// Filtre par période de date
const passeFiltrePeriode = (dette, periode, dateDebut, dateFin) => {
  if (!periode) return true;
  const date = new Date(dette.createdAt);
  const now  = new Date();
  if (periode === 'jour') {
    const debut = new Date(); debut.setHours(0, 0, 0, 0);
    return date >= debut;
  }
  if (periode === 'semaine') {
    const debut = new Date(); const j = debut.getDay() || 7;
    debut.setDate(debut.getDate() - j + 1); debut.setHours(0, 0, 0, 0);
    return date >= debut;
  }
  if (periode === 'mois') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  if (periode === 'trimestre') {
    return Math.floor(date.getMonth() / 3) === Math.floor(now.getMonth() / 3) &&
           date.getFullYear() === now.getFullYear();
  }
  if (periode === 'semestre') {
    return (date.getMonth() < 6 ? 0 : 1) === (now.getMonth() < 6 ? 0 : 1) &&
           date.getFullYear() === now.getFullYear();
  }
  if (periode === 'personnalise') {
    if (dateDebut && date < new Date(dateDebut)) return false;
    if (dateFin  && date > new Date(dateFin + 'T23:59:59')) return false;
    return true;
  }
  return true;
};

const Dettes = () => {
  const { formatMontant } = useParametres();
  const [dettes, setDettes]         = useState([]);
  const [recherche, setRecherche]   = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [dateDebut, setDateDebut]   = useState('');
  const [dateFin, setDateFin]       = useState('');
  const [montantMin, setMontantMin] = useState(0);
  const [montantMax, setMontantMax] = useState(0);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await dettesAPI.getAll();
        setDettes(data);
        const max = Math.max(0, ...data.map(montantDette));
        setMontantMin(0);
        setMontantMax(max);
      } catch {
        toast.error('Erreur lors du chargement');
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const montantMaxPossible = useMemo(() => Math.max(0, ...dettes.map(montantDette)), [dettes]);

  const filtres = useMemo(() => {
    return dettes.filter(d => {
      if (recherche) {
        const t = recherche.toLowerCase();
        if (!d.clientNom?.toLowerCase().includes(t) && !d.description?.toLowerCase().includes(t)) return false;
      }
      if (filtreStatut && d.statut !== filtreStatut) return false;
      if (!passeFiltrePeriode(d, filtrePeriode, dateDebut, dateFin)) return false;
      const m = montantDette(d);
      if (m < montantMin || m > montantMax) return false;
      return true;
    });
  }, [dettes, recherche, filtreStatut, filtrePeriode, dateDebut, dateFin, montantMin, montantMax]);

  const totalEnCours  = dettes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD').reduce((a, d) => a + d.montantActuel, 0);
  const totalEnRetard = dettes.filter(d => d.statut === 'EN_RETARD').reduce((a, d) => a + d.montantActuel, 0);
  const totalAbandon  = dettes.filter(d => d.statut === 'ABANDONNEE').reduce((a, d) => a + (d.montantAbandonne || d.montantInitial), 0);
  const totalEspeces  = dettes.reduce((a, d) => a + (d.regleEspeces || 0), 0);
  const totalOM       = dettes.reduce((a, d) => a + (d.regleOM || 0), 0);
  const totalMTN      = dettes.reduce((a, d) => a + (d.regleMTN || 0), 0);

  const reinitialiserFiltres = () => {
    setRecherche(''); setFiltreStatut(''); setFiltrePeriode('');
    setDateDebut(''); setDateFin('');
    setMontantMin(0); setMontantMax(montantMaxPossible);
  };

  const filtresActifs = recherche || filtreStatut || filtrePeriode ||
    montantMin > 0 || montantMax < montantMaxPossible;

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: '#203a43' }}>Toutes les dettes</h4>
        <p className="text-muted small mb-0">{dettes.length} dette(s) enregistrée(s)</p>
      </div>

      {/* Résumé financier */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#fff3cd' }}>
            <div className="card-body p-3">
              <div className="small text-warning-emphasis mb-1">Total en cours</div>
              <div className="fw-bold fs-5" style={{ color: '#856404' }}>{formatMontant(totalEnCours)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#f8d7da' }}>
            <div className="card-body p-3">
              <div className="small text-danger-emphasis mb-1">Total en retard</div>
              <div className="fw-bold fs-5 text-danger">{formatMontant(totalEnRetard)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#f3f4f6' }}>
            <div className="card-body p-3">
              <div className="small mb-1" style={{ color: '#4b5563' }}>Total abandonné</div>
              <div className="fw-bold fs-5" style={{ color: '#6b7280' }}>{formatMontant(totalAbandon)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Récupéré par moyen de paiement */}
      {dettes.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#f0fdf4' }}>
              <div className="card-body p-3">
                <div className="small mb-1" style={{ color: '#166534' }}>Récupéré — Espèces</div>
                <div className="fw-bold fs-5" style={{ color: '#16a34a' }}>{formatMontant(totalEspeces)}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#fff7ed' }}>
              <div className="card-body p-3">
                <div className="small mb-1" style={{ color: '#9a3412' }}>Récupéré — Orange Money</div>
                <div className="fw-bold fs-5" style={{ color: '#ea580c' }}>{formatMontant(totalOM)}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: '#fefce8' }}>
              <div className="card-body p-3">
                <div className="small mb-1" style={{ color: '#854d0e' }}>Récupéré — MTN Mobile Money</div>
                <div className="fw-bold fs-5" style={{ color: '#ca8a04' }}>{formatMontant(totalMTN)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panneau de filtres */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="row g-2 mb-2">
            {/* Recherche */}
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input className="form-control border-start-0" placeholder="Client ou description..."
                  value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              </div>
            </div>
            {/* Statut */}
            <div className="col-6 col-md-2">
              <select className="form-select" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="EN_COURS">En cours</option>
                <option value="EN_RETARD">En retard</option>
                <option value="SOLDEE">Soldée</option>
                <option value="ABANDONNEE">Abandonnée</option>
              </select>
            </div>
            {/* Période */}
            <div className="col-6 col-md-3">
              <select className="form-select" value={filtrePeriode} onChange={(e) => { setFiltrePeriode(e.target.value); setDateDebut(''); setDateFin(''); }}>
                <option value="">Toutes les dates</option>
                <option value="jour">Aujourd'hui</option>
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois</option>
                <option value="trimestre">Ce trimestre</option>
                <option value="semestre">Ce semestre</option>
                <option value="personnalise">Personnalisé…</option>
              </select>
            </div>
            {/* Réinitialiser */}
            <div className="col-12 col-md-3 d-flex align-items-center gap-2">
              {filtresActifs && (
                <button className="btn btn-sm btn-light d-flex align-items-center gap-1" onClick={reinitialiserFiltres}>
                  <FontAwesomeIcon icon={faTimes} />
                  Réinitialiser
                </button>
              )}
              <span className="text-muted small ms-auto">
                {filtres.length} / {dettes.length} dette(s)
              </span>
            </div>
          </div>

          {/* Dates personnalisées */}
          {filtrePeriode === 'personnalise' && (
            <div className="row g-2 mb-2">
              <div className="col-6 col-md-3">
                <label className="form-label small text-muted mb-1">Du</label>
                <input type="date" className="form-control form-control-sm" value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label small text-muted mb-1">Au</label>
                <input type="date" className="form-control form-control-sm" value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)} />
              </div>
            </div>
          )}

          {/* Filtre montant */}
          {montantMaxPossible > 0 && (
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted mb-1 d-flex justify-content-between">
                  <span><FontAwesomeIcon icon={faFilter} className="me-1" />Min : <strong>{formatMontant(montantMin)}</strong></span>
                </label>
                <input type="range" className="form-range" min={0} max={montantMaxPossible} step={1000}
                  value={montantMin}
                  onChange={(e) => setMontantMin(Math.min(+e.target.value, montantMax))} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small text-muted mb-1 d-flex justify-content-between">
                  <span>Max : <strong>{formatMontant(montantMax)}</strong></span>
                </label>
                <input type="range" className="form-range" min={0} max={montantMaxPossible} step={1000}
                  value={montantMax}
                  onChange={(e) => setMontantMax(Math.max(+e.target.value, montantMin))} />
              </div>
            </div>
          )}
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
                {filtres.map((dette) => {
                  const cfg = {
                    EN_RETARD:  { cls: 'bg-danger',            label: 'En retard' },
                    SOLDEE:     { cls: 'bg-success',           label: 'Soldée' },
                    ABANDONNEE: { cls: 'bg-secondary',         label: 'Abandonnée' },
                    EN_COURS:   { cls: 'bg-warning text-dark', label: 'En cours' },
                  };
                  const { cls, label } = cfg[dette.statut] || cfg.EN_COURS;
                  return (
                    <tr key={dette.id}>
                      <td className="fw-semibold ps-4 small">{dette.clientNom}</td>
                      <td className="text-muted small">{dette.description || '—'}</td>
                      <td className="fw-bold" style={{
                        color: dette.statut === 'SOLDEE'     ? '#16a34a'
                             : dette.statut === 'ABANDONNEE' ? '#9ca3af'
                             : '#dc2626'
                      }}>
                        {formatMontant(montantDette(dette))}
                      </td>
                      <td><span className={`badge ${cls}`} style={{ fontSize: 10 }}>{label}</span></td>
                      <td className="text-muted small">{new Date(dette.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <Link to={`/clients/${dette.clientId}/dettes`} className="btn btn-sm btn-light" style={{ fontSize: 11 }}>
                          Détails
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dettes;
