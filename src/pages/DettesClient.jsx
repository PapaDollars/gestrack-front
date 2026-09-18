// Page des dettes d'un client avec historique complet
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faPlus, faMinus, faTrash, faFilter, faTimes,
  faHistory, faSpinner, faFileInvoiceDollar, faChevronDown, faChevronUp, faCheckCircle, faBan,
  faChevronLeft, faChevronRight, faPrint,
} from '@fortawesome/free-solid-svg-icons';
import { imprimerFactureDette, imprimerToutesDettesClient } from '@/utils/pdfTemplates';
import { fmtDH } from '@/utils/pdf';
import { dettesAPI, clientsAPI, estMisEnAttente } from '@/services/api';
import useIsMobile from '@/hooks/useIsMobile';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalDette, { ModalTransaction, ModalSolder } from '@/components/dettes/ModalDette';
import ModalImprimerDettes from '@/components/dettes/ModalImprimerDettes';
import ModalConfirmation from '@/components/shared/ModalConfirmation';

// Montant pertinent selon le statut
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

const PAR_PAGE = 8;

// Anti-doublon : bloque la répétition silencieuse d'une même action (clic multiple, reflow, etc.)
const DUREE_ANTI_DOUBLON_MS = 180 * 1000;
const LABELS_ACTION_DOUBLON = {
  REDUCTION: 'un paiement de',
  AJOUT: 'un ajout de',
  SOLDE: 'un solde de',
  ABANDON: 'un abandon de',
};

const DettesClient = () => {
  const isMobile = useIsMobile();
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [dettes, setDettes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [page, setPage] = useState(1);
  const [detteExpansee, setDetteExpansee] = useState(null);
  const [historiquesDette, setHistoriquesDette] = useState({});
  const [modalDette, setModalDette] = useState(false);
  const [modalTransaction, setModalTransaction] = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);
  const [confirmAbandon, setConfirmAbandon] = useState(null);
  const [confirmSolder, setConfirmSolder] = useState(null);
  const [confirmDoublon, setConfirmDoublon] = useState(null);
  const [modalImprimer, setModalImprimer] = useState(false);
  // Id de la dette dont une action (paiement/ajout/solde/abandon/suppression) est en cours de traitement.
  // Tant qu'elle n'est pas null, les boutons d'action de TOUTES les cartes sont désactivés pour
  // empêcher qu'un double-clic (ou un clic mal placé après un réagencement de la liste) ne vienne
  // impacter une autre dette que celle visée.
  const [detteEnTraitement, setDetteEnTraitement] = useState(null);
  // Mémorise, par dette, la dernière action effectuée (type + montant + horodatage)
  const dernieresActionsRef = useRef({});
  // Filtres
  const [filtreStatut, setFiltreStatut]   = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [dateDebut, setDateDebut]         = useState('');
  const [dateFin, setDateFin]             = useState('');
  const [montantMin, setMontantMin]       = useState(0);
  const [montantMax, setMontantMax]       = useState(0);

  const chargerDonnees = async () => {
    setHistoriquesDette({});
    try {
      const [clientRes, dettesRes] = await Promise.all([
        clientsAPI.getById(clientId),
        dettesAPI.getByClient(clientId),
      ]);
      setClient(clientRes.data);
      setDettes(dettesRes.data);
      // Initialiser le slider au max réel
      const max = Math.max(0, ...dettesRes.data.map(montantDette));
      setMontantMin(0);
      setMontantMax(max);
    } catch (error) {
      toast.error('Erreur lors du chargement', { toastId: `chargement-${clientId}` });
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

  const { formatMontant } = useParametres();

  // Si la même action (même type, même montant) a déjà été appliquée à cette dette il y a moins
  // de 180s, on redemande une confirmation explicite avant de continuer — au lieu de la rejouer
  // silencieusement suite à un double-clic ou un clic répété faute de retour visuel.
  const verifierDoublon = (detteId, action, montant) => new Promise((resoudre) => {
    const derniere = dernieresActionsRef.current[detteId];
    const estDoublon = derniere && derniere.action === action && derniere.montant === montant
      && (Date.now() - derniere.timestamp) < DUREE_ANTI_DOUBLON_MS;
    if (!estDoublon) { resoudre(true); return; }
    const secondes = Math.max(1, Math.round((Date.now() - derniere.timestamp) / 1000));
    setConfirmDoublon({
      message: `Vous avez déjà effectué ${LABELS_ACTION_DOUBLON[action]} ${formatMontant(montant)} sur cette dette il y a ${secondes} seconde(s). Voulez-vous vraiment refaire cette action ?`,
      resoudre,
    });
  });

  const enregistrerAction = (detteId, action, montant) => {
    dernieresActionsRef.current[detteId] = { action, montant, timestamp: Date.now() };
  };

  const supprimerDette = async (id) => {
    if (detteEnTraitement) return;
    setDetteEnTraitement(id);
    try {
      const reponse = await dettesAPI.delete(id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Dette supprimée');
      setConfirmSuppr(null);
      chargerDonnees();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDetteEnTraitement(null);
    }
  };

  const abandonnerDette = async (dette) => {
    if (detteEnTraitement) return;
    setDetteEnTraitement(dette.id);
    try {
      const montant = dette.montantActuel;
      const ok = await verifierDoublon(dette.id, 'ABANDON', montant);
      if (!ok) return;
      const reponse = await dettesAPI.abandonner(dette.id, { motif: 'Créance irrécupérable' });
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Dette abandonnée');
      enregistrerAction(dette.id, 'ABANDON', montant);
      setConfirmAbandon(null);
      chargerDonnees();
    } catch {
      toast.error('Erreur lors de l\'abandon');
    } finally {
      setDetteEnTraitement(null);
    }
  };

  const solderDette = async (dette, moyenPaiement) => {
    if (detteEnTraitement) return;
    setDetteEnTraitement(dette.id);
    try {
      const montant = dette.montantActuel;
      const ok = await verifierDoublon(dette.id, 'SOLDE', montant);
      if (!ok) return;
      const reponse = await dettesAPI.reduire(dette.id, {
        montant,
        description: 'Dette soldée intégralement',
        moyenPaiement,
      });
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Dette soldée avec succès');
      enregistrerAction(dette.id, 'SOLDE', montant);
      setConfirmSolder(null);
      chargerDonnees();
    } catch {
      toast.error('Erreur lors du solde de la dette');
    } finally {
      setDetteEnTraitement(null);
    }
  };

  // Soumission d'un paiement ("Paiement") ou d'un ajout ("Ajouter"), déléguée par ModalTransaction
  const soumettreTransaction = async (form) => {
    const { dette, type } = modalTransaction;
    if (detteEnTraitement) return;
    setDetteEnTraitement(dette.id);
    try {
      const montant = parseFloat(form.montant);
      const ok = await verifierDoublon(dette.id, type, montant);
      if (!ok) return;
      const reponse = type === 'REDUCTION'
        ? await dettesAPI.reduire(dette.id, form)
        : await dettesAPI.ajouter(dette.id, form);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success(type === 'REDUCTION' ? 'Paiement enregistré avec succès' : 'Montant ajouté avec succès');
      enregistrerAction(dette.id, type, montant);
      setModalTransaction(null);
      chargerDonnees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la transaction');
    } finally {
      setDetteEnTraitement(null);
    }
  };

  const imprimerDette = async (dette) => {
    let histo = historiquesDette[dette.id];
    if (!histo) {
      try {
        const { data } = await dettesAPI.getHistorique(dette.id);
        histo = data;
        setHistoriquesDette(prev => ({ ...prev, [dette.id]: data }));
      } catch { histo = []; }
    }
    imprimerFactureDette(client, dette, histo);
  };

  const montantMaxPossible = useMemo(() => Math.max(0, ...dettes.map(montantDette)), [dettes]);

  const dettesFiltrees = useMemo(() => dettes.filter(d => {
    if (filtreStatut && d.statut !== filtreStatut) return false;
    if (!passeFiltrePeriode(d, filtrePeriode, dateDebut, dateFin)) return false;
    const m = montantDette(d);
    if (m < montantMin || m > montantMax) return false;
    return true;
  }), [dettes, filtreStatut, filtrePeriode, dateDebut, dateFin, montantMin, montantMax]);

  const reinitialiserFiltres = () => {
    setFiltreStatut(''); setFiltrePeriode('');
    setDateDebut(''); setDateFin('');
    setMontantMin(0); setMontantMax(montantMaxPossible);
  };

  const filtresActifs = filtreStatut || filtrePeriode || montantMin > 0 || montantMax < montantMaxPossible;

  const totalPages   = Math.max(1, Math.ceil(dettesFiltrees.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const dettesPaginees = dettesFiltrees.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

  const statutBadge = (statut) => {
    const styles = {
      EN_COURS:    { bg: '#fff3cd', color: '#856404', label: 'En cours' },
      EN_RETARD:   { bg: '#f8d7da', color: '#842029', label: 'En retard' },
      SOLDEE:      { bg: '#d1e7dd', color: '#0f5132', label: 'Soldée' },
      ABANDONNEE:  { bg: '#f3f4f6', color: '#6b7280', label: 'Abandonnée' },
    };
    const s = styles[statut] || styles.EN_COURS;
    return (
      <span className="badge" style={{ background: s.bg, color: s.color, fontSize: 'var(--txt-sm)' }}>{s.label}</span>
    );
  };

  if (chargement) return (
    <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} /></div>
  );

  const totalDu      = dettes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD').reduce((a, d) => a + d.montantActuel, 0);
  const totalRetard  = dettes.filter(d => d.statut === 'EN_RETARD').reduce((a, d) => a + d.montantActuel, 0);
  const totalAbandon = dettes.filter(d => d.statut === 'ABANDONNEE').reduce((a, d) => a + (d.montantAbandonne || d.montantInitial), 0);
  const totalEspeces = dettes.reduce((a, d) => a + (d.regleEspeces || 0), 0);
  const totalOM      = dettes.reduce((a, d) => a + (d.regleOM || 0), 0);
  const totalMTN     = dettes.reduce((a, d) => a + (d.regleMTN || 0), 0);

  const entete = (
    <>
      <div className="d-flex justify-content-end gap-2 mb-3">
        {dettes.length > 0 && (
          <button className="btn d-flex align-items-center gap-2" style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881', borderRadius: 10 }}
            onClick={() => setModalImprimer(true)}>
            <FontAwesomeIcon icon={faPrint} /> Imprimer les dettes
          </button>
        )}
        <button className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa', borderRadius: 10 }}
          onClick={() => setModalDette(true)}>
          <FontAwesomeIcon icon={faPlus} /> Nouvelle dette
        </button>
      </div>

      <div className="row g-3 mb-3">
        {[
          { label: 'Total dû', val: totalDu, bg: 'rgba(239,68,68,0.15)', color: '#dc2626' },
          { label: 'En retard', val: totalRetard, bg: '#fff3cd', color: '#b45309' },
          { label: 'Abandonné', val: totalAbandon, bg: '#f3f4f6', color: '#6b7280' },
        ].map(({ label, val, bg, color }) => (
          <div key={label} className="col-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12, background: bg }}>
              <div className="card-body p-2">
                <div className="small mb-1" style={{ color, opacity: 0.8 }}>{label}</div>
                <div className="fw-bold" style={{ color, fontSize: 'var(--txt-md)' }}>{formatMontant(val)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dettes.length > 0 && (
        <div className="row g-3 mb-3">
          {[
            { label: 'Espèces', val: totalEspeces, bg: 'rgba(22,163,74,0.15)', color: '#16a34a' },
            { label: 'Orange Money', val: totalOM, bg: 'rgba(234,88,12,0.15)', color: '#ea580c' },
            { label: 'MTN Money', val: totalMTN, bg: '#fefce8', color: '#ca8a04' },
          ].map(({ label, val, bg, color }) => (
            <div key={label} className="col-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12, background: bg }}>
                <div className="card-body p-2">
                  <div className="small mb-1" style={{ color, opacity: 0.8, fontSize: 'var(--txt-sm)' }}>{label}</div>
                  <div className="fw-bold" style={{ color, fontSize: 'var(--txt-md)' }}>{formatMontant(val)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dettes.length > 0 && (
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
          <div className="card-body p-3">
            <div className="row g-2 mb-2">
              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="EN_RETARD">En retard</option>
                  <option value="SOLDEE">Soldée</option>
                  <option value="ABANDONNEE">Abandonnée</option>
                </select>
              </div>
              <div className="col-6 col-md-4">
                <select className="form-select form-select-sm" value={filtrePeriode}
                  onChange={(e) => { setFiltrePeriode(e.target.value); setDateDebut(''); setDateFin(''); }}>
                  <option value="">Toutes les dates</option>
                  <option value="jour">Aujourd'hui</option>
                  <option value="semaine">Cette semaine</option>
                  <option value="mois">Ce mois</option>
                  <option value="trimestre">Ce trimestre</option>
                  <option value="semestre">Ce semestre</option>
                  <option value="personnalise">Personnalisé…</option>
                </select>
              </div>
              <div className="col-12 col-md-5 d-flex align-items-center gap-2">
                {filtresActifs && (
                  <button className="btn btn-sm d-flex align-items-center gap-1"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                    onClick={reinitialiserFiltres}>
                    <FontAwesomeIcon icon={faFilter} /> Réinitialiser
                  </button>
                )}
                <span className="text-muted small ms-auto">{dettesFiltrees.length} / {dettes.length} dette(s)</span>
              </div>
            </div>
            {filtrePeriode === 'personnalise' && (
              <div className="row g-2 mb-2">
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
            {montantMaxPossible > 0 && (
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-6">
                  <label className="form-label small text-muted mb-1">
                    <FontAwesomeIcon icon={faFilter} className="me-1" />Min : <strong>{formatMontant(montantMin)}</strong>
                  </label>
                  <input type="range" className="form-range" min={0} max={montantMaxPossible} step={1000}
                    value={montantMin} onChange={(e) => setMontantMin(Math.min(+e.target.value, montantMax))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small text-muted mb-1">Max : <strong>{formatMontant(montantMax)}</strong></label>
                  <input type="range" className="form-range" min={0} max={montantMaxPossible} step={1000}
                    value={montantMax} onChange={(e) => setMontantMax(Math.max(+e.target.value, montantMin))} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Titre — toujours fixe ── */}
      <div style={{ flexShrink: 0 }}>
        <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
          <button className="btn btn-light btn-sm" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />Retour
          </button>
          <div>
            <h4 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              {client ? `${client.prenom} ${client.nom}` : 'Dettes client'}
            </h4>
            {client && <span className="text-muted small">{client.profession}</span>}
          </div>
        </div>
      </div>

      {/* ── Stats + filtres — fixe desktop, scroll mobile ── */}
      {!isMobile && (
        <div style={{ flexShrink: 0 }}>
          {entete}
        </div>
      )}

      {/* ── Zone scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {isMobile && entete}

      {/* ── Liste scrollable + pagination ── */}
      {dettes.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faFileInvoiceDollar} size="3x" className="mb-3 d-block" />
          Aucune dette enregistrée
        </div>
      ) : (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <div className="d-flex flex-column gap-3">
          {dettesFiltrees.length === 0 ? (
            <div className="text-center py-4 text-muted small">Aucune dette ne correspond aux filtres</div>
          ) : dettesPaginees.map((dette) => (
            <div key={dette.id} className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                {/* En-tête */}
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                  <div>
                    {dette.factureId ? (
                      <button className="btn p-0 fw-semibold mb-1 text-start"
                        style={{ color: '#0020d4', textDecoration: 'underline dotted', background: 'none', border: 'none', fontSize: 'inherit' }}
                        title="Voir la facture associée"
                        onClick={() => navigate(`/factures?id=${dette.factureId}`)}>
                        {dette.description || 'Facture'}
                      </button>
                    ) : (
                      <div className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>
                        {dette.description || 'Dette sans description'}
                      </div>
                    )}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {statutBadge(dette.statut)}
                      <span className="text-muted small">{fmtDH(dette.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold fs-5" style={{
                      color: dette.statut === 'SOLDEE' ? '#16a34a'
                           : dette.statut === 'ABANDONNEE' ? '#6b7280'
                           : '#dc2626'
                    }}>
                      {dette.statut === 'ABANDONNEE'
                        ? formatMontant(dette.montantAbandonne || dette.montantInitial)
                        : formatMontant(dette.montantActuel)}
                    </div>
                    {dette.montantInitial !== dette.montantActuel && dette.statut !== 'ABANDONNEE' && (
                      <div className="text-muted small">Initial : {formatMontant(dette.montantInitial)}</div>
                    )}
                    {dette.statut === 'ABANDONNEE' && (
                      <div className="text-muted small">Abandonnée</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 flex-wrap">
                  {dette.statut !== 'SOLDEE' && dette.statut !== 'ABANDONNEE' && (
                    <>
                      <button className="btn btn-sm" style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a', fontSize: 'var(--txt-base)' }}
                        disabled={detteEnTraitement !== null}
                        onClick={() => setModalTransaction({ dette, type: 'REDUCTION' })}>
                        <FontAwesomeIcon icon={faMinus} className="me-1" />Paiement
                      </button>
                      <button className="btn btn-sm" style={{ background: 'rgba(234,88,12,0.15)', color: '#ea580c', fontSize: 'var(--txt-base)' }}
                        disabled={detteEnTraitement !== null}
                        onClick={() => setModalTransaction({ dette, type: 'AJOUT' })}>
                        <FontAwesomeIcon icon={faPlus} className="me-1" />Ajouter
                      </button>
                      <button className="btn btn-sm" style={{ background: '#d1e7dd', color: '#0f5132', fontSize: 'var(--txt-base)' }}
                        disabled={detteEnTraitement !== null}
                        onClick={() => setConfirmSolder(dette)}>
                        <FontAwesomeIcon icon={faCheckCircle} className="me-1" />Solder
                      </button>
                      <button className="btn btn-sm" style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 'var(--txt-base)' }}
                        disabled={detteEnTraitement !== null}
                        onClick={() => setConfirmAbandon(dette)}>
                        <FontAwesomeIcon icon={faBan} className="me-1" />Abandonner
                      </button>
                    </>
                  )}
                  <button className="btn btn-sm" style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)', fontSize: 'var(--txt-base)' }}
                    onClick={() => toggleHistorique(dette.id)}>
                    <FontAwesomeIcon icon={faHistory} className="me-1" />Historique
                    <FontAwesomeIcon icon={detteExpansee === dette.id ? faChevronUp : faChevronDown} className="ms-1" />
                  </button>
                  <button className="btn btn-sm" style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881' }}
                    title="Imprimer / Télécharger PDF"
                    onClick={() => imprimerDette(dette)}>
                    <FontAwesomeIcon icon={faPrint} />
                  </button>
                  <button className="btn btn-sm ms-auto" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                    disabled={detteEnTraitement !== null}
                    onClick={() => setConfirmSuppr(dette)} >
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
                            style={{ background: 'var(--bs-secondary-bg)', fontSize: 'var(--txt-base)' }}>
                            <div className="d-flex align-items-center gap-1 flex-wrap">
                              <span className={`badge ${
                                h.action === 'REDUCTION' ? 'bg-success' :
                                h.action === 'AJOUT' ? 'bg-warning text-dark' :
                                h.action === 'RAPPEL_AUTOMATIQUE' ? 'bg-danger' :
                                h.action === 'ABANDON' ? 'bg-secondary' : 'bg-secondary'
                              }`} style={{ fontSize: 'var(--txt-xs)' }}>
                                {h.action === 'REDUCTION' ? 'PAIEMENT' : h.action === 'AJOUT' ? 'AJOUT' : h.action}
                              </span>
                              {h.action === 'REDUCTION' && h.moyenPaiement && (
                                <span className="badge" style={{ fontSize: 'var(--txt-xs)',
                                  background: h.moyenPaiement === 'om' ? '#fff7ed' : h.moyenPaiement === 'mtn' ? '#fefce8' : '#f0fdf4',
                                  color: h.moyenPaiement === 'om' ? '#ea580c' : h.moyenPaiement === 'mtn' ? '#ca8a04' : '#16a34a' }}>
                                  {h.moyenPaiement === 'om' ? 'OM' : h.moyenPaiement === 'mtn' ? 'MTN' : 'Espèces'}
                                </span>
                              )}
                              {/* Montant concerné mis en avant */}
                              {h.montantConcerne != null && (
                                <span className="fw-bold" style={{
                                  color: h.action === 'REDUCTION' ? '#16a34a' : h.action === 'AJOUT' ? '#ea580c' : 'var(--bs-body-color)',
                                  fontSize: 'var(--txt-base)',
                                }}>
                                  {h.action === 'REDUCTION' ? '−' : h.action === 'AJOUT' ? '+' : ''}
                                  {formatMontant(h.montantConcerne)}
                                </span>
                              )}
                              <span className="text-muted">{h.details}</span>
                            </div>
                            <div className="text-muted ms-2" style={{ whiteSpace: 'nowrap' }}>
                              {fmtDH(h.timestamp)}
                            </div>
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between px-4 py-2 border-top" style={{ flexShrink: 0 }}>
              <span className="text-muted small">
                Page {pageCourante} / {totalPages} — {dettesFiltrees.length} dette(s)
              </span>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-light" disabled={pageCourante === 1} onClick={() => setPage(1)}>«</button>
                <button className="btn btn-sm btn-light" disabled={pageCourante === 1} onClick={() => setPage(p => p - 1)}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - pageCourante) <= 2)
                  .map(p => (
                    <button key={p}
                      className={`btn btn-sm ${p === pageCourante ? 'text-white' : 'btn-light'}`}
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
          onSoumettre={soumettreTransaction}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message="Supprimer cette dette ? L'action est irréversible."
          onConfirmer={() => supprimerDette(confirmSuppr.id)}
          chargement={detteEnTraitement === confirmSuppr.id}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
      {confirmAbandon && (
        <ModalConfirmation
          message={`Abandonner cette dette de ${formatMontant(confirmAbandon.montantActuel)} ? Elle sera retirée des dettes en cours et comptabilisée séparément dans les statistiques.`}
          onConfirmer={() => abandonnerDette(confirmAbandon)}
          chargement={detteEnTraitement === confirmAbandon.id}
          onAnnuler={() => setConfirmAbandon(null)}
        />
      )}
      {confirmSolder && (
        <ModalSolder
          dette={confirmSolder}
          onConfirmer={(moyen) => solderDette(confirmSolder, moyen)}
          onFermer={() => setConfirmSolder(null)}
        />
      )}
      {confirmDoublon && (
        <ModalConfirmation
          message={confirmDoublon.message}
          labelConfirmer="Continuer quand même"
          onConfirmer={() => { confirmDoublon.resoudre(true); setConfirmDoublon(null); }}
          onAnnuler={() => { confirmDoublon.resoudre(false); setConfirmDoublon(null); }}
        />
      )}
      {modalImprimer && (
        <ModalImprimerDettes
          dettes={dettes}
          onFermer={() => setModalImprimer(false)}
          onImprimer={(selection) => {
            setModalImprimer(false);
            if (selection.length === 0) {
              toast.info('Aucune dette à imprimer pour ce choix');
              return;
            }
            imprimerToutesDettesClient(client, selection);
          }}
        />
      )}
    </div>
    </div>
  );
};

export default DettesClient;
