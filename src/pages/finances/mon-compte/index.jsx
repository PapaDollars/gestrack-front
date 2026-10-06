// Cahier de compte personnel — espèces, Orange Money, Mobile Money
import React, { useEffect, useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faEdit, faSpinner, faFilter, faWallet,
  faGlobe, faPrint, faSortAmountDown, faEye, faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { compteAPI, estMisEnAttente } from '@/services/api';
import { imprimerRapportCompte } from '@/utils/pdfTemplates';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import useIsMobile from '@/hooks/useIsMobile';
import { TYPES, PERIODES, PERIODES_DATE, GROUPEMENTS } from '@/pages/finances/mon-compte/constants';
import { cleGroupeCompte, labelGroupeCompte, filtrerParDate, nomMois, formatDate, totaux } from '@/pages/finances/mon-compte/utils';
import ModalForm from '@/pages/finances/mon-compte/modals/ModalForm';

// ── Page principale ─────────────────────────────────────────────────────────
const MonCompte = () => {
  const isMobile = useIsMobile();
  const { formatMontant } = useParametres();
  const [transactions, setTransactions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalForm, setModalForm] = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);
  const [modalDetail, setModalDetail] = useState(null);

  // Filtres
  const [filtreType, setFiltreType] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('');
  const [filtreMois, setFiltreMois] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState('');
  const [periodeDate, setPeriodeDate] = useState('');   // aujourd_hui | semaine | ''
  const [groupement, setGroupement] = useState('mois'); // jour | semaine | mois
  const [masquerMontants, setMasquerMontants] = useState({
    global: true,
    especes: true,
    orange_money: true,
    mobile_money: true,
  });

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
      const reponse = await compteAPI.delete(id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
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

  const cartesTotaux = [
    { val: 'global', label: 'Total global', icon: faGlobe, color: '#00d4aa' },
    ...TYPES,
  ];

  // Mobile : listes en grille 2×2 pleine largeur. Desktop : elles s'étirent pour occuper
  // l'espace libre de la ligne (largeur de base `largeur`, jamais sous 140 px).
  const classeSelect = isMobile ? 'form-select form-select-sm' : 'form-select';
  const styleSelect = (largeur) => (isMobile
    ? { flex: '1 1 calc(50% - 0.25rem)', minWidth: 0 }
    : { flex: `1 1 ${largeur}px`, minWidth: 140 });

  const filtresJSX = (
    <>
      {/* Cartes totaux — compactes : icône | libellé + montant | œil */}
      <div className="row g-2 mb-2">
        {cartesTotaux.map(t => (
          <div key={t.val} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
              <div className="card-body px-2 px-md-3 py-2 d-flex align-items-center gap-1 gap-md-2">
                <FontAwesomeIcon icon={t.icon} style={{ color: t.color, fontSize: 'var(--txt-xl)' }} className="flex-shrink-0" />
                <div className="flex-grow-1 min-w-0">
                  <div className="text-muted small text-truncate">{t.label}</div>
                  <div className="fw-bold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                    {masquerMontants[t.val] ? '•••' : formatMontant(totauxGlobal[t.val])}
                  </div>
                </div>
                <button className="btn btn-sm flex-shrink-0"
                  style={{ background: 'transparent', border: 'none', padding: '4px 2px', color: '#64748b' }}
                  onClick={() => setMasquerMontants({ ...masquerMontants, [t.val]: !masquerMontants[t.val] })}
                  title={masquerMontants[t.val] ? 'Afficher' : 'Masquer'}>
                  <FontAwesomeIcon icon={masquerMontants[t.val] ? faEyeSlash : faEye} style={{ fontSize: '14px' }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres — une seule ligne : listes, raccourcis période, groupement, réinitialiser */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
        <div className="card-body px-3 py-2">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <select className={classeSelect} style={styleSelect(200)} value={filtreType}
              onChange={e => { setFiltreType(e.target.value); setFiltreMois(''); }}>
              <option value="">Tous les types</option>
              {TYPES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
            </select>
            <select className={classeSelect} style={styleSelect(200)} value={filtrePeriode}
              onChange={e => setFiltrePeriode(e.target.value)}>
              <option value="">Toutes périodes</option>
              {PERIODES.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
            </select>
            <select className={classeSelect} style={styleSelect(200)} value={filtreAnnee}
              onChange={e => { setFiltreAnnee(e.target.value); setFiltreMois(''); }}>
              <option value="">Toutes années</option>
              {annees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className={classeSelect} style={styleSelect(200)} value={filtreMois}
              onChange={e => setFiltreMois(e.target.value)}>
              <option value="">Tous les mois</option>
              {moisDispos.map(m => <option key={m} value={m}>{nomMois(m)}</option>)}
            </select>
            <div className={`d-flex gap-2 flex-wrap ${isMobile ? 'w-100' : ''}`}>
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
                <FontAwesomeIcon icon={p.icon} style={{ fontSize: 'var(--txt-sm)' }} />
                {p.label}
              </button>
            ))}
            </div>
            {/* Espace entre les raccourcis de période et le groupement */}
            {!isMobile && <div style={{ flex: '1 0 2rem' }} />}
            <div className={`d-flex align-items-center gap-1 ${isMobile ? 'w-100 justify-content-end' : ''}`}>
              <FontAwesomeIcon icon={faSortAmountDown} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
              {GROUPEMENTS.map(g => (
                <button key={g.val} className="btn btn-sm"
                  style={{
                    background: groupement === g.val ? '#00d4aa' : '#f1f5f9',
                    color: groupement === g.val ? '#fff' : '#64748b',
                    borderRadius: 8, border: 'none', fontSize: 'var(--txt-base)',
                  }}
                  onClick={() => setGroupement(g.val)}>
                  {g.label}
                </button>
              ))}
            </div>
            {/* Réinitialiser — tout au bout à droite */}
            {(filtreType || filtrePeriode || filtreMois || filtreAnnee || periodeDate) && (
              <button className="btn btn-sm d-flex align-items-center gap-1 ms-auto"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                onClick={resetFiltres}>
                <FontAwesomeIcon icon={faFilter} /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

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
                : filtreMois ? `Mois : ${nomMois(filtreMois)}`
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
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
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
          // Pas d'overflow:hidden sur la carte : il casserait l'en-tête collant.
          <div key={mois} className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
            {/* En-tête du mois — collant en haut de la zone de défilement ; borné à sa carte,
                il est poussé puis remplacé par celui du groupe suivant. */}
            <div className="px-4 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
              style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
                position: 'sticky', top: 0, zIndex: 2, borderRadius: '14px 14px 0 0' }}>
              <div className="fw-bold text-white" style={{ fontSize: 'var(--txt-lg)' }}>{labelGroupeCompte(mois, groupement)}</div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {TYPES.map(tp => t[tp.val] > 0 && (
                  <span key={tp.val} className="badge" style={{ background: tp.bg, color: tp.color, fontSize: 'var(--txt-sm)' }}>
                    <FontAwesomeIcon icon={tp.icon} className="me-1" />
                    {formatMontant(t[tp.val])}
                  </span>
                ))}
                <span className="badge text-white" style={{ background: '#00d4aa', fontSize: 'var(--txt-base)' }}>
                  Total : {formatMontant(t.global)}
                </span>
              </div>
            </div>

            {/* Entrées */}
            <div className="card-body p-0">
              {entrees.map((tx, i) => {
                const ti = typeInfo(tx.type);
                return (
                  <div key={tx.id} className="d-flex align-items-center gap-2 px-2 px-md-4 py-2"
                    style={{ borderBottom: i < entrees.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer' }}
                    onClick={() => setModalDetail(tx)}>
                    {/* Badge type */}
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{ width: 36, height: 36, background: ti.bg }}>
                      <FontAwesomeIcon icon={ti.icon} style={{ color: ti.color, fontSize: 'var(--txt-lg)' }} />
                    </div>

                    {/* Infos */}
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                        {formatDate(tx.date, tx.periode)}
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                        <span className="badge" style={{ background: ti.bg, color: ti.color, fontSize: 'var(--txt-xs)' }}>
                          {ti.label}
                        </span>
                        <span className="badge text-muted" style={{ fontSize: 'var(--txt-xs)', background: 'var(--bs-secondary-bg)' }}>
                          {tx.periode === 'semaine' ? 'Par semaine' : 'Par jour'}
                        </span>
                        {tx.note && (
                          <span className="text-muted small text-truncate" style={{ maxWidth: '40vw' }}>
                            {tx.note}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Montant */}
                    <div className="fw-bold flex-shrink-0" style={{ color: ti.color, fontSize: 'var(--txt-md)' }}>
                      {formatMontant(tx.montant)}
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
      {modalDetail && (() => {
        const ti = typeInfo(modalDetail.type);
        return (
          <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
            onClick={e => e.target === e.currentTarget && setModalDetail(null)}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0" style={{ borderRadius: 18, background: 'var(--bs-body-bg)' }}>
                <div className="modal-body p-4 text-center">
                  {/* Icône */}
                  <div className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
                    style={{ width: 56, height: 56, background: ti.bg }}>
                    <FontAwesomeIcon icon={ti.icon} style={{ color: ti.color, fontSize: 'var(--txt-3xl)' }} />
                  </div>
                  {/* Type + période */}
                  <div className="d-flex justify-content-center gap-2 mb-2">
                    <span className="badge" style={{ background: ti.bg, color: ti.color, fontSize: 'var(--txt-base)' }}>{ti.label}</span>
                    <span className="badge text-muted" style={{ background: 'var(--bs-secondary-bg)', fontSize: 'var(--txt-base)' }}>
                      {modalDetail.periode === 'semaine' ? 'Par semaine' : 'Par jour'}
                    </span>
                  </div>
                  {/* Montant */}
                  <div className="fw-bold mb-1" style={{ color: ti.color, fontSize: 'var(--txt-avatar)' }}>
                    {formatMontant(modalDetail.montant)}
                  </div>
                  {/* Date */}
                  <div className="text-muted small mb-2">{formatDate(modalDetail.date, modalDetail.periode)}</div>
                  {/* Note */}
                  {modalDetail.note && (
                    <div className="text-muted small p-2 rounded mb-3" style={{ background: 'var(--bs-secondary-bg)' }}>
                      {modalDetail.note}
                    </div>
                  )}
                  {/* Actions */}
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 10 }}
                      onClick={() => { setModalDetail(null); setModalForm(modalDetail); }}>
                      <FontAwesomeIcon icon={faEdit} /> Modifier
                    </button>
                    <button className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 10 }}
                      onClick={() => { setModalDetail(null); setConfirmSuppr(modalDetail); }}>
                      <FontAwesomeIcon icon={faTrash} /> Supprimer
                    </button>
                  </div>
                  <button className="btn btn-light btn-sm w-100 mt-2" onClick={() => setModalDetail(null)}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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
