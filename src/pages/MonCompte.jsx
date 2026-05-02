// Cahier de compte personnel — espèces, Orange Money, Mobile Money
import React, { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faEdit, faSpinner, faTimes, faFilter,
  faWallet, faMobile, faMoneyBillWave, faGlobe, faCheck, faPrint,
  faCalendarDay, faCalendarWeek, faCalendarAlt, faSortAmountDown,
} from '@fortawesome/free-solid-svg-icons';
import { compteAPI } from '@/services/api';
import { imprimerRapportCompte } from '@/utils/pdfTemplates';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalConfirmation from '@/components/shared/ModalConfirmation';
import useIsMobile from '@/hooks/useIsMobile';

const TYPES = [
  { val: 'especes',      label: 'Espèces',      color: '#16a34a', bg: '#dcfce7', icon: faMoneyBillWave },
  { val: 'orange_money', label: 'Orange Money',  color: '#ea580c', bg: '#fff7ed', icon: faMobile },
  { val: 'mobile_money', label: 'Mobile Money',  color: '#7c3aed', bg: '#f3e8ff', icon: faWallet },
];

const PERIODES = [
  { val: 'jour',    label: 'Par jour' },
  { val: 'semaine', label: 'Par semaine' },
];

const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const PERIODES_DATE = [
  { val: 'aujourd_hui', label: "Aujourd'hui",  icon: faCalendarDay },
  { val: 'semaine',     label: 'Cette semaine', icon: faCalendarWeek },
  { val: 'mois',        label: 'Ce mois',       icon: faCalendarAlt },
];

const GROUPEMENTS = [
  { val: 'jour',    label: 'Par jour' },
  { val: 'semaine', label: 'Par semaine' },
  { val: 'mois',    label: 'Par mois' },
];

const debutSemaine = (d) => {
  const j = new Date(d);
  const dow = j.getDay() || 7;
  j.setDate(j.getDate() - dow + 1);
  j.setHours(0, 0, 0, 0);
  return j;
};

const cleGroupeCompte = (dateStr, groupement) => {
  if (!dateStr) return '';
  if (groupement === 'jour') return dateStr;
  if (groupement === 'semaine') {
    const lun = debutSemaine(new Date(dateStr + 'T00:00:00'));
    return lun.toISOString().split('T')[0];
  }
  return dateStr.substring(0, 7);
};

const labelGroupeCompte = (cle, groupement) => {
  if (!cle) return '—';
  if (groupement === 'jour') {
    return new Date(cle + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (groupement === 'semaine') {
    const lun = new Date(cle + 'T00:00:00');
    const dim = new Date(lun); dim.setDate(lun.getDate() + 6);
    return `Semaine du ${lun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${dim.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return nomMois(cle);
};

const filtrerParDate = (liste, periodeDate) => {
  if (!periodeDate) return liste;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (periodeDate === 'aujourd_hui') return liste.filter(t => t.date === today);
  if (periodeDate === 'semaine') {
    const lunStr = debutSemaine(now).toISOString().split('T')[0];
    return liste.filter(t => t.date >= lunStr);
  }
  if (periodeDate === 'mois') {
    const debutMois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return liste.filter(t => t.date?.startsWith(debutMois));
  }
  return liste;
};

const nomMois = (moisStr) => {
  const [year, month] = moisStr.split('-');
  return `${MOIS_FR[parseInt(month) - 1]} ${year}`;
};

const formatDate = (dateStr, periode) => {
  const d = new Date(dateStr + 'T00:00:00');
  if (periode === 'semaine') {
    const lun = new Date(d);
    const jour = d.getDay() || 7;
    lun.setDate(d.getDate() - jour + 1);
    const dim = new Date(lun);
    dim.setDate(lun.getDate() + 6);
    return `Sem. du ${lun.getDate()}/${lun.getMonth()+1} au ${dim.getDate()}/${dim.getMonth()+1}/${dim.getFullYear()}`;
  }
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const totaux = (liste) => ({
  especes:      liste.filter(t => t.type === 'especes').reduce((s,t) => s + t.montant, 0),
  orange_money: liste.filter(t => t.type === 'orange_money').reduce((s,t) => s + t.montant, 0),
  mobile_money: liste.filter(t => t.type === 'mobile_money').reduce((s,t) => s + t.montant, 0),
  global:       liste.reduce((s,t) => s + t.montant, 0),
});

// ── Modal Ajout/Modification ────────────────────────────────────────────────
const ModalForm = ({ initial, onFermer, onSucces }) => {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: today, montant: '', type: 'especes', periode: 'jour', note: '',
    ...initial,
  });
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.montant || parseFloat(form.montant) <= 0) { toast.error('Montant invalide'); return; }
    setChargement(true);
    try {
      if (initial?.id) {
        await compteAPI.update(initial.id, form);
        toast.success('Transaction modifiée');
      } else {
        await compteAPI.create(form);
        toast.success('Transaction ajoutée');
      }
      onSucces();
    } catch { toast.error('Erreur lors de l\'enregistrement'); }
    finally { setChargement(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
     >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>
              {initial?.id ? 'Modifier la transaction' : 'Nouvelle transaction'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={handleSubmit} id="form-compte">

              {/* Date */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Date *</label>
                <input type="date" className="form-control" required
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>

              {/* Montant */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Montant *</label>
                <div className="input-group">
                  <input type="number" min="1" className="form-control" required
                    placeholder="0" value={form.montant}
                    onChange={e => setForm({ ...form, montant: e.target.value })} />
                  <span className="input-group-text bg-body-secondary">FCFA</span>
                </div>
              </div>

              {/* Type */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Type de paiement *</label>
                <div className="d-flex gap-2 flex-wrap">
                  {TYPES.map(t => (
                    <button key={t.val} type="button"
                      className="btn d-flex align-items-center gap-2"
                      style={{
                        background: form.type === t.val ? t.bg : '#f8fafc',
                        color: form.type === t.val ? t.color : '#64748b',
                        border: `2px solid ${form.type === t.val ? t.color : '#e2e8f0'}`,
                        borderRadius: 10, fontSize: 13,
                      }}
                      onClick={() => setForm({ ...form, type: t.val })}>
                      <FontAwesomeIcon icon={t.icon} />
                      {t.label}
                      {form.type === t.val && <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10 }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Période */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Période</label>
                <div className="d-flex gap-2">
                  {PERIODES.map(p => (
                    <button key={p.val} type="button"
                      className="btn flex-grow-1"
                      style={{
                        background: form.periode === p.val ? '#eff6ff' : '#f8fafc',
                        color: form.periode === p.val ? '#1d4ed8' : '#64748b',
                        border: `2px solid ${form.periode === p.val ? '#1d4ed8' : '#e2e8f0'}`,
                        borderRadius: 10, fontSize: 13,
                      }}
                      onClick={() => setForm({ ...form, periode: p.val })}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="mb-1">
                <label className="form-label small fw-semibold text-muted">Note (optionnel)</label>
                <input className="form-control" placeholder="Ex: Marché du matin, Transfert client..."
                  value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-compte" className="btn text-white"
              style={{ background: '#00d4aa', borderRadius: 10 }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (initial?.id ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Page principale ─────────────────────────────────────────────────────────
const MonCompte = () => {
  const isMobile = useIsMobile();
  const { formatMontant } = useParametres();
  const [transactions, setTransactions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalForm, setModalForm] = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);

  // Filtres
  const [filtreType, setFiltreType] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [filtreMois, setFiltreMois] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState('');
  const [periodeDate, setPeriodeDate] = useState('');   // aujourd_hui | semaine | ''
  const [groupement, setGroupement] = useState('mois'); // jour | semaine | mois

  const charger = async () => {
    try {
      const { data } = await compteAPI.getAll();
      setTransactions(data);
    } catch { toast.error('Erreur lors du chargement'); }
    finally { setChargement(false); }
  };

  useEffect(() => { charger(); }, []);

  const supprimer = async (id) => {
    try {
      await compteAPI.delete(id);
      toast.success('Transaction supprimée');
      charger();
    } catch { toast.error('Erreur lors de la suppression'); }
    setConfirmSuppr(null);
  };

  // Données filtrées
  const filtre = useMemo(() => {
    let res = transactions;
    if (filtreType)    res = res.filter(t => t.type === filtreType);
    if (filtrePeriode) res = res.filter(t => t.periode === filtrePeriode);
    if (filtreAnnee)   res = res.filter(t => t.date?.startsWith(filtreAnnee));
    if (filtreMois)    res = res.filter(t => t.date?.startsWith(filtreMois));
    res = filtrerParDate(res, periodeDate);
    return res;
  }, [transactions, filtreType, filtrePeriode, filtreMois, filtreAnnee, periodeDate]);

  // Totaux globaux (sur données filtrées)
  const totauxGlobal = useMemo(() => totaux(filtre), [filtre]);

  // Groupés par jour / semaine / mois selon le groupement sélectionné
  const groupes = useMemo(() => {
    const map = {};
    filtre.forEach(t => {
      const cle = cleGroupeCompte(t.date || '', groupement);
      if (!map[cle]) map[cle] = [];
      map[cle].push(t);
    });
    Object.keys(map).forEach(k => map[k].sort((a, b) => b.date > a.date ? 1 : -1));
    return Object.entries(map).sort((a, b) => b[0] > a[0] ? 1 : -1);
  }, [filtre, groupement]);

  // Années disponibles pour filtre
  const annees = useMemo(() =>
    [...new Set(transactions.map(t => t.date?.substring(0, 4)).filter(Boolean))].sort().reverse(),
    [transactions]);

  // Mois disponibles selon l'année sélectionnée
  const moisDispos = useMemo(() =>
    [...new Set(transactions
      .filter(t => !filtreAnnee || t.date?.startsWith(filtreAnnee))
      .map(t => t.date?.substring(0, 7)).filter(Boolean))].sort().reverse(),
    [transactions, filtreAnnee]);

  const resetFiltres = () => {
    setFiltreType(''); setFiltrePeriode(''); setFiltreMois(''); setFiltreAnnee('');
    setPeriodeDate(''); setGroupement('mois');
  };

  const typeInfo = (val) => TYPES.find(t => t.val === val) || TYPES[0];

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  const filtresJSX = (
    <>
      {/* Cartes totaux globaux */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
            <div className="card-body text-center p-3">
              <FontAwesomeIcon icon={faGlobe} style={{ color: '#00d4aa', fontSize: 22 }} className="mb-2" />
              <div className="fw-bold" style={{ color: 'var(--bs-body-color)', fontSize: 15 }}>
                {formatMontant(totauxGlobal.global)}
              </div>
              <div className="text-muted small">Total global</div>
            </div>
          </div>
        </div>
        {TYPES.map(t => (
          <div key={t.val} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-body text-center p-3">
                <FontAwesomeIcon icon={t.icon} style={{ color: t.color, fontSize: 22 }} className="mb-2" />
                <div className="fw-bold" style={{ color: 'var(--bs-body-color)', fontSize: 15 }}>
                  {formatMontant(totauxGlobal[t.val])}
                </div>
                <div className="text-muted small">{t.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          {/* Ligne 1 : période date (gauche) + groupement affichage (droite) */}
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <div className="d-flex gap-2">
              {PERIODES_DATE.map(p => (
                <button key={p.val} className="btn btn-sm d-flex align-items-center gap-1"
                  style={{
                    background: periodeDate === p.val ? '#203a43' : '#f1f5f9',
                    color: periodeDate === p.val ? '#fff' : '#64748b',
                    borderRadius: 8, border: 'none',
                  }}
                  onClick={() => {
                    const next = periodeDate === p.val ? '' : p.val;
                    setPeriodeDate(next);
                    if (next === 'aujourd_hui') setGroupement('jour');
                    if (next === 'semaine') setGroupement('semaine');
                    if (next === 'mois') setGroupement('jour');
                  }}>
                  <FontAwesomeIcon icon={p.icon} style={{ fontSize: 11 }} />
                  {p.label}
                </button>
              ))}
            </div>
            <div className="d-flex align-items-center gap-1 ms-auto">
              <FontAwesomeIcon icon={faSortAmountDown} className="text-muted" style={{ fontSize: 12 }} />
              {GROUPEMENTS.map(g => (
                <button key={g.val} className="btn btn-sm"
                  style={{
                    background: groupement === g.val ? '#00d4aa' : '#f1f5f9',
                    color: groupement === g.val ? '#fff' : '#64748b',
                    borderRadius: 8, border: 'none', fontSize: 12,
                  }}
                  onClick={() => setGroupement(g.val)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          {/* Ligne 2 : dropdowns existants */}
          <div className="row g-2 align-items-center">
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm" value={filtreType} onChange={e => { setFiltreType(e.target.value); setFiltreMois(''); }}>
                <option value="">Tous les types</option>
                {TYPES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm" value={filtrePeriode} onChange={e => setFiltrePeriode(e.target.value)}>
                <option value="">Toutes périodes</option>
                {PERIODES.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm" value={filtreAnnee}
                onChange={e => { setFiltreAnnee(e.target.value); setFiltreMois(''); }}>
                <option value="">Toutes années</option>
                {annees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select className="form-select form-select-sm" value={filtreMois} onChange={e => setFiltreMois(e.target.value)}>
                <option value="">Tous les mois</option>
                {moisDispos.map(m => <option key={m} value={m}>{nomMois(m)}</option>)}
              </select>
            </div>
            <div className="col-md-auto">
              {(filtreType || filtrePeriode || filtreMois || filtreAnnee || periodeDate) && (
                <button className="btn btn-light btn-sm d-flex align-items-center gap-2" onClick={resetFiltres}>
                  <FontAwesomeIcon icon={faFilter} /> Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px - 4rem)', overflow:'hidden' }}>

      {/* ── Titre — toujours fixe ── */}
      <div style={{ flexShrink: 0 }}>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Mon Compte</h4>
          <p className="text-muted small mb-0">{transactions.length} entrée(s) au total</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm d-flex align-items-center gap-1"
            style={{ background: '#e8f5f3', color: '#00a881', borderRadius: 8 }}
            title="Imprimer / Partager ce rapport"
            onClick={() => {
              const titre = periodeDate === 'aujourd_hui' ? "Aujourd'hui"
                : periodeDate === 'semaine' ? 'Cette semaine'
                : periodeDate === 'mois' ? 'Ce mois'
                : filtreMois ? `Mois : ${filtreMois}`
                : filtreAnnee ? `Année : ${filtreAnnee}`
                : 'Toutes les transactions';
              imprimerRapportCompte(filtre, titre, groupement);
            }}>
            <FontAwesomeIcon icon={faPrint} /> Imprimer
          </button>
          <button className="btn text-white d-flex align-items-center gap-2"
            style={{ background: '#00d4aa', borderRadius: 10 }}
            onClick={() => setModalForm({})}>
            <FontAwesomeIcon icon={faPlus} /> Nouvelle entrée
          </button>
        </div>
      </div>
      </div>{/* fin titre */}

      {/* ── Filtres — fixe desktop, dans le scroll mobile ── */}
      {!isMobile && (
        <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}

      {/* ── Zone scrollable : liste des groupes ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: '0.5rem' }}>
      {isMobile && (
        <div style={{ marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}
      {/* Contenu vide */}
      {groupes.length === 0 && (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faWallet} size="3x" className="mb-3" style={{ color: '#cbd5e1' }} />
          <p>Aucune entrée trouvée. Commencez par ajouter une transaction.</p>
        </div>
      )}

      {/* Ledger mensuel */}
      {groupes.map(([mois, entrees]) => {
        const t = totaux(entrees);
        return (
          <div key={mois} className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14, overflow: 'hidden' }}>
            {/* En-tête du mois */}
            <div className="px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
              style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 100%)' }}>
              <div className="fw-bold text-white" style={{ fontSize: 16 }}>{labelGroupeCompte(mois, groupement)}</div>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {TYPES.map(tp => t[tp.val] > 0 && (
                  <span key={tp.val} className="badge" style={{ background: tp.bg, color: tp.color, fontSize: 11 }}>
                    <FontAwesomeIcon icon={tp.icon} className="me-1" />
                    {formatMontant(t[tp.val])}
                  </span>
                ))}
                <span className="badge text-white" style={{ background: '#00d4aa', fontSize: 12 }}>
                  Total : {formatMontant(t.global)}
                </span>
              </div>
            </div>

            {/* Entrées */}
            <div className="card-body p-0">
              {entrees.map((tx, i) => {
                const ti = typeInfo(tx.type);
                return (
                  <div key={tx.id} className="d-flex align-items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < entrees.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    {/* Badge type */}
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{ width: 36, height: 36, background: ti.bg }}>
                      <FontAwesomeIcon icon={ti.icon} style={{ color: ti.color, fontSize: 14 }} />
                    </div>

                    {/* Infos */}
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 14 }}>
                        {formatDate(tx.date, tx.periode)}
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                        <span className="badge" style={{ background: ti.bg, color: ti.color, fontSize: 10 }}>
                          {ti.label}
                        </span>
                        <span className="badge text-muted" style={{ fontSize: 10, background: 'var(--bs-secondary-bg)' }}>
                          {tx.periode === 'semaine' ? 'Par semaine' : 'Par jour'}
                        </span>
                        {tx.note && (
                          <span className="text-muted small text-truncate" style={{ maxWidth: 200 }}>
                            {tx.note}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Montant */}
                    <div className="fw-bold flex-shrink-0" style={{ color: ti.color, fontSize: 15 }}>
                      {formatMontant(tx.montant)}
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-1 flex-shrink-0">
                      <button className="btn btn-light btn-sm rounded-circle" style={{ width: 32, height: 32 }}
                        onClick={() => setModalForm(tx)}>
                        <FontAwesomeIcon icon={faEdit} style={{ fontSize: 12 }} />
                      </button>
                      <button className="btn btn-sm rounded-circle" style={{ width: 32, height: 32, background: '#fee2e2', color: '#dc2626' }}
                        onClick={() => setConfirmSuppr(tx)}>
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pied du mois — sous-totaux */}
            <div className="px-4 py-2 d-flex gap-3 flex-wrap"
              style={{ background: 'var(--bs-secondary-bg)', borderTop: '1px solid var(--bs-border-color)' }}>
              <span className="small text-muted">{entrees.length} entrée(s)</span>
              {TYPES.map(tp => t[tp.val] > 0 && (
                <span key={tp.val} className="small" style={{ color: tp.color }}>
                  {tp.label} : <strong>{formatMontant(t[tp.val])}</strong>
                </span>
              ))}
            </div>
          </div>
        );
      })}

      </div>{/* fin scrollable */}

      {/* Modals */}
      {modalForm !== null && (
        <ModalForm
          initial={modalForm}
          onFermer={() => setModalForm(null)}
          onSucces={() => { setModalForm(null); charger(); }}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer cette transaction de ${formatMontant(confirmSuppr.montant)} ?`}
          onConfirmer={() => supprimer(confirmSuppr.id)}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
    </div>
  );
};

export default MonCompte;
