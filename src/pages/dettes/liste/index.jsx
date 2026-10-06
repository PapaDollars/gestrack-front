// Page de toutes les dettes
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoiceDollar, faSpinner, faSearch, faFilter, faTimes, faChevronLeft,
  faChevronRight, faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { dettesAPI } from '@/services/api';
import { fmtDH } from '@/utils/pdf';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import useIsMobile from '@/hooks/useIsMobile';
import ModalDette from '@/pages/dettes/modals/ModalDette';
import ModalChoisirClient from '@/pages/dettes/modals/ModalChoisirClient';
import { ROUTES } from '@/utils/url/frontend';

const PAR_PAGE = 50;

const montantDette = (d) =>
  d.statut === 'ABANDONNEE' ? (d.montantAbandonne || d.montantInitial) : d.montantActuel;

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
  if (periode === 'mois') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (periode === 'trimestre') return Math.floor(date.getMonth() / 3) === Math.floor(now.getMonth() / 3) && date.getFullYear() === now.getFullYear();
  if (periode === 'semestre') return (date.getMonth() < 6 ? 0 : 1) === (now.getMonth() < 6 ? 0 : 1) && date.getFullYear() === now.getFullYear();
  if (periode === 'personnalise') {
    if (dateDebut && date < new Date(dateDebut)) return false;
    if (dateFin  && date > new Date(dateFin + 'T23:59:59')) return false;
    return true;
  }
  return true;
};

const Dettes = () => {
  const isMobile = useIsMobile();
  const { formatMontant } = useParametres();
  const navigate = useNavigate();
  const [dettes, setDettes]         = useState([]);
  const [recherche, setRecherche]   = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [dateDebut, setDateDebut]   = useState('');
  const [dateFin, setDateFin]       = useState('');
  const [montantMin, setMontantMin] = useState(0);
  const [montantMax, setMontantMax] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [page, setPage]             = useState(1);
  const [modalSelectClient, setModalSelectClient] = useState(false);
  const [clientPourDette, setClientPourDette]     = useState(null);
  const scrollRef = useRef(null);

  const charger = async () => {
    try {
      const { data } = await dettesAPI.getAll();
      setDettes(data);
      setMontantMax(Math.max(0, ...data.map(montantDette)));
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []); // eslint-disable-line

  const montantMaxPossible = useMemo(() => Math.max(0, ...dettes.map(montantDette)), [dettes]);

  const filtres = useMemo(() => {
    setPage(1);
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

  const totalPages   = Math.max(1, Math.ceil(filtres.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const paginees     = filtres.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

  // Remonte la liste en haut à chaque changement de page — sinon le clic sur « suivant »,
  // fait tout en bas, laisse la vue sur le bas de la nouvelle page.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageCourante]);

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
  const filtresActifs = recherche || filtreStatut || filtrePeriode || montantMin > 0 || montantMax < montantMaxPossible;

  const CFG_STATUT = {
    EN_RETARD:  { cls: 'bg-danger',            label: 'En retard' },
    SOLDEE:     { cls: 'bg-success',           label: 'Soldée' },
    ABANDONNEE: { cls: 'bg-secondary',         label: 'Abandonnée' },
    EN_COURS:   { cls: 'bg-warning text-dark', label: 'En cours' },
  };

  const filtresJSX = (
    <>
      {/* Cartes résumé */}
      <div className="row g-3 mb-3">
        {[
          { label: 'Total en cours',  val: totalEnCours,  bg: '#fff3cd',                    color: '#856404'  },
          { label: 'Total en retard', val: totalEnRetard, bg: '#f8d7da',                    color: '#dc2626'  },
          { label: 'Abandonné',       val: totalAbandon,  bg: 'var(--bs-secondary-bg)',     color: 'var(--bs-secondary-color)'  },
          { label: 'Espèces',         val: totalEspeces,  bg: 'rgba(22,163,74,0.12)',       color: '#16a34a'  },
          { label: 'Orange Money',    val: totalOM,       bg: 'rgba(234,88,12,0.12)',       color: '#ea580c'  },
          { label: 'MTN Money',       val: totalMTN,      bg: '#fefce8',                    color: '#ca8a04'  },
        ].map(({ label, val, bg, color }) => (
          <div key={label} className="col-6 col-md-2">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12, background: bg }}>
              <div className="card-body p-3">
                <div className="small mb-1" style={{ color, opacity: 0.75 }}>{label}</div>
                <div className="fw-bold" style={{ color, fontSize: 'var(--txt-lg)' }}>{formatMontant(val)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-body-secondary border-end-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input className="form-control border-start-0" placeholder="Client ou description..."
                  value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                {recherche && (
                  <button type="button" className="btn btn-light border" onClick={() => setRecherche('')}>
                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                  </button>
                )}
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="input-group">
                <select className="form-select" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                  <option value="">Tous statuts</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="EN_RETARD">En retard</option>
                  <option value="SOLDEE">Soldée</option>
                  <option value="ABANDONNEE">Abandonnée</option>
                </select>
                {filtreStatut && (
                  <button type="button" className="btn btn-light border" onClick={() => setFiltreStatut('')}>
                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                  </button>
                )}
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="input-group">
                <select className="form-select" value={filtrePeriode} onChange={(e) => { setFiltrePeriode(e.target.value); setDateDebut(''); setDateFin(''); }}>
                  <option value="">Toutes dates</option>
                  <option value="jour">Aujourd'hui</option>
                  <option value="semaine">Cette semaine</option>
                  <option value="mois">Ce mois</option>
                  <option value="trimestre">Ce trimestre</option>
                  <option value="semestre">Ce semestre</option>
                  <option value="personnalise">Personnalisé…</option>
                </select>
                {filtrePeriode && (
                  <button type="button" className="btn btn-light border" onClick={() => { setFiltrePeriode(''); setDateDebut(''); setDateFin(''); }}>
                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                  </button>
                )}
              </div>
            </div>
            {montantMaxPossible > 0 && (
              <>
                <div className="col-6 col-md">
                  <label className="form-label small text-muted mb-0">
                    <FontAwesomeIcon icon={faFilter} className="me-1" />Min : <strong>{formatMontant(montantMin)}</strong>
                  </label>
                  <input type="range" className="form-range range-vert d-block" min={0} max={montantMaxPossible} step={1000}
                    style={{ '--vert-fin': `${montantMaxPossible ? montantMin / montantMaxPossible * 100 : 0}%` }}
                    value={montantMin} onChange={(e) => setMontantMin(Math.min(+e.target.value, montantMax))} />
                </div>
                <div className="col-6 col-md">
                  <label className="form-label small text-muted mb-0">Max : <strong>{formatMontant(montantMax)}</strong></label>
                  <input type="range" className="form-range range-vert d-block" min={0} max={montantMaxPossible} step={1000}
                    style={{ '--vert-debut': `${montantMaxPossible ? montantMax / montantMaxPossible * 100 : 100}%`, '--vert-fin': '100%' }}
                    value={montantMax} onChange={(e) => setMontantMax(Math.max(+e.target.value, montantMin))} />
                </div>
              </>
            )}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2" style={{ minHeight: 38 }}>
              {filtresActifs && (
                <button className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                  onClick={reinitialiserFiltres}>
                  <FontAwesomeIcon icon={faFilter} /> Réinitialiser
                </button>
              )}
              <span className="text-muted small ms-auto text-nowrap">{filtres.length} / {dettes.length}</span>
            </div>
          </div>
          {filtrePeriode === 'personnalise' && (
            <div className="row g-2 mt-1">
              <div className="col-6 col-md-3">
                <label className="form-label small text-muted mb-1">Du</label>
                <input type="date" className="form-control form-control-sm" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label small text-muted mb-1">Au</label>
                <input type="date" className="form-control form-control-sm" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Titre — toujours fixe ── */}
      <div style={{ flexShrink: 0 }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Toutes les dettes</h4>
            <p className="text-muted small mb-0">{dettes.length} dette(s) enregistrée(s)</p>
          </div>
          <button className="btn text-white d-flex align-items-center gap-2"
            style={{ background: '#00d4aa', borderRadius: 10 }}
            onClick={() => setModalSelectClient(true)}>
            <FontAwesomeIcon icon={faPlus} /> Nouvelle dette
          </button>
        </div>
      </div>{/* fin titre */}

      {/* ── Filtres — fixe desktop, dans le scroll mobile ── */}
      {!isMobile && (
        <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}

      {/* ── Zone scrollable ── */}
      <div ref={isMobile ? scrollRef : null}
        style={isMobile
          ? { flex:1, overflowY:'auto', overflowX:'hidden', minHeight:0 }
          : { flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>
      {isMobile && (
        <div style={{ marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: isMobile ? 'visible' : 'hidden', flex: isMobile ? undefined : 1 }}>
        {chargement ? (
          <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} /></div>
        ) : filtres.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faFileInvoiceDollar} size="3x" className="mb-3 d-block" />
            Aucune dette trouvée
          </div>
        ) : (
          <>
            {/* Desktop : le tableau défile seul (en-tête + pagination fixes). Mobile : la page défile, en-tête et pagination collants. */}
            <div ref={isMobile ? null : scrollRef}
              style={isMobile ? undefined : { flex: 1, minHeight: 0, overflow: 'auto' }}>
              <table className="table table-hover align-middle mb-0">
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bs-body-bg)', zIndex: 2 }}>
                  <tr>
                    <th className="small fw-semibold text-muted border-0 ps-3">Client</th>
                    <th className="small fw-semibold text-muted border-0 d-none d-md-table-cell">Description</th>
                    <th className="small fw-semibold text-muted border-0">Montant</th>
                    <th className="small fw-semibold text-muted border-0">Statut</th>
                    <th className="small fw-semibold text-muted border-0 d-none d-sm-table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginees.map((dette) => {
                    const { cls, label } = CFG_STATUT[dette.statut] || CFG_STATUT.EN_COURS;
                    return (
                      <tr key={dette.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(ROUTES.dettesClient(dette.clientId))}
                        title="Cliquer pour voir les détails">
                        <td className="fw-semibold ps-3 small">{dette.clientNom}</td>
                        <td className="text-muted small d-none d-md-table-cell">{dette.description || '—'}</td>
                        <td className="fw-bold" style={{
                          color: dette.statut === 'SOLDEE' ? '#16a34a' : dette.statut === 'ABANDONNEE' ? '#9ca3af' : '#dc2626'
                        }}>
                          {formatMontant(montantDette(dette))}
                        </td>
                        <td><span className={`badge ${cls}`} style={{ fontSize: 'var(--txt-xs)' }}>{label}</span></td>
                        <td className="text-muted small d-none d-sm-table-cell">{fmtDH(dette.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between px-4 py-2 border-top"
                style={{ flexShrink: 0, background: 'var(--bs-body-bg)', borderRadius: '0 0 14px 14px', ...(isMobile ? { position: 'sticky', bottom: 0, zIndex: 2 } : {}) }}>
                <span className="text-muted small">
                  Page {pageCourante} / {totalPages} — {filtres.length} dette(s)
                </span>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-light" disabled={pageCourante === 1} onClick={() => setPage(1)}>«</button>
                  <button className="btn btn-sm btn-light" disabled={pageCourante === 1} onClick={() => setPage(p => p - 1)}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - pageCourante) <= 2)
                    .map(p => (
                      <button key={p} className={`btn btn-sm ${p === pageCourante ? 'text-white' : 'btn-light'}`}
                        style={p === pageCourante ? { background: '#00d4aa' } : {}}
                        onClick={() => setPage(p)}>{p}</button>
                    ))}
                  <button className="btn btn-sm btn-light" disabled={pageCourante === totalPages} onClick={() => setPage(p => p + 1)}>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                  <button className="btn btn-sm btn-light" disabled={pageCourante === totalPages} onClick={() => setPage(totalPages)}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>{/* fin card */}
      </div>{/* fin zone scrollable */}

      {/* Étape 1 — Sélection du client */}
      {modalSelectClient && !clientPourDette && (
        <ModalChoisirClient
          onSelect={(c) => { setModalSelectClient(false); setClientPourDette(c); }}
          onFermer={() => setModalSelectClient(false)}
        />
      )}

      {/* Étape 2 — Formulaire de dette */}
      {clientPourDette && (
        <ModalDette
          clientId={clientPourDette.id}
          onFermer={() => setClientPourDette(null)}
          onSucces={() => { setClientPourDette(null); charger(); }}
        />
      )}
    </div>
  );
};

export default Dettes;
