// Finances métier — ventes boutique, magasin direct, et global
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { imprimerRapportFinances } from '@/utils/pdfTemplates';
import {
  faStore, faWarehouse, faGlobe, faSpinner, faFilter, faTimes,
  faCalendarDay, faCalendarWeek, faCalendarAlt, faSortAmountDown, faPrint,
  faLock, faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { financesAPI } from '@/services/api';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { fmtDH } from '@/utils/pdf';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import useIsMobile from '@/hooks/useIsMobile';
import AutocompleteFiltre from '@/components/shared/AutocompleteFiltre';

// ── Helpers ──────────────────────────────────────────────────────────────────
const debutSemaine = (d) => {
  const j = new Date(d);
  const dow = j.getDay() || 7;
  j.setDate(j.getDate() - dow + 1);
  j.setHours(0,0,0,0);
  return j;
};

const cleGroupe = (timestamp, groupement) => {
  const d = new Date(timestamp);
  if (groupement === 'jour')    return d.toISOString().split('T')[0];
  if (groupement === 'semaine') {
    const lun = debutSemaine(d);
    return lun.toISOString().split('T')[0];
  }
  return d.toISOString().substring(0, 7); // mois
};

const labelGroupe = (cle, groupement) => {
  if (groupement === 'jour') {
    return new Date(cle + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (groupement === 'semaine') {
    const lun = new Date(cle + 'T00:00:00');
    const dim = new Date(lun); dim.setDate(lun.getDate() + 6);
    return `Semaine du ${lun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${dim.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  const [y, m] = cle.split('-');
  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${MOIS[parseInt(m)-1]} ${y}`;
};

const PERIODES = [
  { val: 'aujourd_hui', label: "Aujourd'hui", icon: faCalendarDay },
  { val: 'semaine',     label: 'Cette semaine', icon: faCalendarWeek },
  { val: 'mois',        label: 'Ce mois', icon: faCalendarAlt },
  { val: '3mois',       label: '3 derniers mois', icon: faCalendarAlt },
  { val: 'annee',       label: 'Cette année', icon: faCalendarAlt },
  { val: 'perso',       label: 'Personnalisé', icon: faFilter },
];

const GROUPEMENTS = [
  { val: 'jour', label: 'Par jour' },
  { val: 'semaine', label: 'Par semaine' },
  { val: 'mois', label: 'Par mois' },
];

const filtrerParPeriode = (entrees, periode, dateDebut, dateFin) => {
  const maintenant = new Date();
  const today = maintenant.toISOString().split('T')[0];
  return entrees.filter(e => {
    if (!e.timestamp) return false;
    const ts = e.timestamp;
    if (periode === 'aujourd_hui') return ts >= today + 'T00:00:00' && ts <= today + 'T23:59:59';
    if (periode === 'semaine') {
      const lun = debutSemaine(maintenant);
      return new Date(ts) >= lun;
    }
    if (periode === 'mois') {
      const debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString();
      return ts >= debut;
    }
    if (periode === '3mois') {
      const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 2, 1).toISOString();
      return ts >= debut;
    }
    if (periode === 'annee') {
      return ts.startsWith(maintenant.getFullYear().toString());
    }
    if (periode === 'perso') {
      if (dateDebut && ts < dateDebut + 'T00:00:00') return false;
      if (dateFin   && ts > dateFin   + 'T23:59:59') return false;
      return true;
    }
    return true;
  });
};

// ── Composant tableau groupé ──────────────────────────────────────────────
const TableauVentes = ({ ventes, groupement, formatMontant, couleur }) => {
  const groupes = useMemo(() => {
    const map = {};
    ventes.forEach(v => {
      const cle = cleGroupe(v.timestamp, groupement);
      if (!map[cle]) map[cle] = { cle, entrees: [], total: 0, nbTx: 0 };
      map[cle].entrees.push(v);
      map[cle].total += v.montant;
      map[cle].nbTx++;
    });
    return Object.values(map).sort((a, b) => b.cle > a.cle ? 1 : -1);
  }, [ventes, groupement]);

  if (ventes.length === 0) {
    return <p className="text-muted text-center py-4 small">Aucune vente sur cette période</p>;
  }

  return (
    <div>
      {groupes.map(g => (
        <div key={g.cle} className="mb-3">
          {/* En-tête groupe */}
          <div className="d-flex align-items-center justify-content-between px-3 py-2 rounded-top"
            style={{ background: 'var(--bs-secondary-bg)', borderBottom: `3px solid ${couleur}` }}>
            <span className="fw-semibold small" style={{ color: 'var(--bs-body-color)' }}>{labelGroupe(g.cle, groupement)}</span>
            <span className="fw-bold" style={{ color: couleur }}>{formatMontant(g.total)}</span>
          </div>
          {/* Détail */}
          <div className="border rounded-bottom" style={{ borderTop: 'none', borderColor: 'var(--bs-border-color)' }}>
            {g.entrees.map((v, i) => (
              <div key={v.id} className="d-flex align-items-center gap-3 px-3 py-2"
                style={{ borderBottom: i < g.entrees.length - 1 ? '1px solid #f8fafc' : 'none', fontSize: 'var(--txt-md)' }}>
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{v.produitNom}</div>
                  <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>
                    {v.categorie} · {v.details || 'Sortie'}
                  </div>
                </div>
                <div className="text-end flex-shrink-0">
                  <div className="fw-bold" style={{ color: couleur }}>{formatMontant(v.montant)}</div>
                  <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>
                    {fmtDH(v.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {/* Pied */}
            <div className="px-3 py-1 d-flex justify-content-between"
              style={{ background: 'var(--bs-secondary-bg)', borderTop: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-base)' }}>
              <span className="text-muted">{g.nbTx} transaction(s)</span>
              <span className="fw-semibold" style={{ color: couleur }}>{formatMontant(g.total)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Carte de résumé source ────────────────────────────────────────────────
const CarteSource = ({ icon, label, total, nbTx, couleur, bg, actif, onClick }) => (
  <div className="card border-0 shadow-sm" style={{ borderRadius: 14, cursor: 'pointer', border: actif ? `2px solid ${couleur}` : '2px solid transparent' }}
    onClick={onClick}>
    <div className="card-body p-3 d-flex align-items-center gap-3">
      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 44, height: 44, background: bg }}>
        <FontAwesomeIcon icon={icon} style={{ color: couleur, fontSize: 'var(--txt-2xl)' }} />
      </div>
      <div>
        <div className="fw-bold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-xl)' }}>{total}</div>
        <div className="text-muted small">{label} · {nbTx} transaction(s)</div>
      </div>
    </div>
  </div>
);

// ── Modal mot de passe pour les bénéfices ────────────────────────────────
const ModalMdpBenefice = ({ onValide, onFermer }) => {
  const [mdp, setMdp]       = useState('');
  const [charg, setCharg]   = useState(false);
  const [erreur, setErreur] = useState('');

  const verifier = async (e) => {
    e.preventDefault();
    setCharg(true); setErreur('');
    try {
      const email = auth.currentUser?.email;
      if (!email) { setErreur('Session expirée, reconnectez-vous'); return; }
      await signInWithEmailAndPassword(auth, email, mdp);
      onValide();
    } catch { setErreur('Mot de passe incorrect'); }
    finally { setCharg(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold d-flex align-items-center gap-2 mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faLock} style={{ color: '#6366f1' }} />
              Accès aux bénéfices
            </h6>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 pb-4">
            <p className="text-muted small mb-3">Entrez votre mot de passe de connexion pour révéler les bénéfices.</p>
            {erreur && <div className="alert alert-danger py-1 small mb-2">{erreur}</div>}
            <form onSubmit={verifier}>
              <input type="password" className="form-control mb-3" required autoFocus
                placeholder="Mot de passe" value={mdp} onChange={e => setMdp(e.target.value)} />
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light flex-grow-1" onClick={onFermer}>Annuler</button>
                <button type="submit" className="btn text-white flex-grow-1"
                  style={{ background: '#6366f1' }} disabled={charg}>
                  {charg ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────
const MesFinances = () => {
  const isMobile = useIsMobile();
  const { formatMontant } = useParametres();
  const [donnees, setDonnees] = useState({ boutique: [], magasin: [] });
  const [chargement, setChargement] = useState(true);

  // Filtres
  const [periode, setPeriode]         = useState('mois');
  const [groupement, setGroupement]   = useState('jour');
  const [dateDebut, setDateDebut]     = useState('');
  const [dateFin, setDateFin]         = useState('');
  const [source, setSource]           = useState('tout'); // tout | boutique | magasin
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreProduit, setFiltreProduit]     = useState('');
  const [pageDebloquee, setPageDebloquee]     = useState(false);
  const navigate = useNavigate();

  const reinitialiserFiltres = () => {
    setPeriode('mois'); setGroupement('jour'); setDateDebut(''); setDateFin('');
    setSource('tout'); setFiltreCategorie(''); setFiltreProduit('');
  };

  const filtresActifs = periode !== 'mois' || filtreCategorie || filtreProduit || source !== 'tout';

  const charger = async () => {
    try {
      const { data } = await financesAPI.get();
      setDonnees(data);
    } catch { toast.error('Erreur lors du chargement des finances'); }
    finally { setChargement(false); }
  };

  useEffect(() => { charger(); }, []);

  // Catégories et produits disponibles
  const toutesCategories = useMemo(() => {
    const all = [...donnees.boutique, ...donnees.magasin].map(v => v.categorie).filter(Boolean);
    return [...new Set(all)].sort();
  }, [donnees]);

  const tousProduits = useMemo(() => {
    const all = [...donnees.boutique, ...donnees.magasin].map(v => v.produitNom).filter(Boolean);
    return [...new Set(all)].sort();
  }, [donnees]);

  // Appliquer filtres période + catégorie + produit
  const appliquerFiltres = (liste) => {
    let res = filtrerParPeriode(liste, periode, dateDebut, dateFin);
    if (filtreCategorie) res = res.filter(v => v.categorie === filtreCategorie);
    if (filtreProduit)   res = res.filter(v => v.produitNom === filtreProduit);
    return res;
  };

  const ventesBoutique = useMemo(() => appliquerFiltres(donnees.boutique), [donnees, periode, dateDebut, dateFin, filtreCategorie, filtreProduit]); // eslint-disable-line
  const ventesMagasin  = useMemo(() => appliquerFiltres(donnees.magasin),  [donnees, periode, dateDebut, dateFin, filtreCategorie, filtreProduit]); // eslint-disable-line
  const ventesTout     = useMemo(() => [...ventesBoutique, ...ventesMagasin].sort((a,b) => b.timestamp > a.timestamp ? 1 : -1), [ventesBoutique, ventesMagasin]);

  const totalB = useMemo(() => ventesBoutique.reduce((s, v) => s + v.montant, 0), [ventesBoutique]);
  const totalM = useMemo(() => ventesMagasin.reduce((s, v) => s + v.montant, 0),  [ventesMagasin]);
  const totalG = totalB + totalM;

  const beneficeB = useMemo(() => ventesBoutique.reduce((s, v) => s + (v.benefice || 0), 0), [ventesBoutique]);
  const beneficeM = useMemo(() => ventesMagasin.reduce((s, v) => s + (v.benefice || 0), 0),  [ventesMagasin]);
  const beneficeG = beneficeB + beneficeM;

  const ventesAffichees = source === 'boutique' ? ventesBoutique
                        : source === 'magasin'  ? ventesMagasin
                        : ventesTout;

  const couleurSource = source === 'boutique' ? '#0ea5e9'
                      : source === 'magasin'  ? '#f97316'
                      : '#00d4aa';

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  // Bloquer l'accès à toute la page avant authentification
  if (!pageDebloquee) return (
    <ModalMdpBenefice
      onValide={() => setPageDebloquee(true)}
      onFermer={() => navigate(-1)}
    />
  );

  const filtresJSX = (
    <>
      {/* Filtre période */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="d-flex flex-wrap gap-2 mb-3">
            {PERIODES.map(p => (
              <button key={p.val} className="btn btn-sm d-flex align-items-center gap-1"
                style={{
                  background: periode === p.val ? '#203a43' : '#f1f5f9',
                  color: periode === p.val ? '#fff' : '#64748b',
                  borderRadius: 8, border: 'none',
                }}
                onClick={() => setPeriode(p.val)}>
                <FontAwesomeIcon icon={p.icon} style={{ fontSize: 'var(--txt-sm)' }} />
                {p.label}
              </button>
            ))}
          </div>
          {/* Date perso */}
          {periode === 'perso' && (
            <div className="d-flex gap-2 flex-wrap mb-3">
              <div className="input-group" style={{ maxWidth: 200 }}>
                <span className="input-group-text bg-body-secondary small">Du</span>
                <input type="date" className="form-control" value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)} />
              </div>
              <div className="input-group" style={{ maxWidth: 200 }}>
                <span className="input-group-text bg-body-secondary small">Au</span>
                <input type="date" className="form-control" value={dateFin}
                  onChange={e => setDateFin(e.target.value)} />
              </div>
            </div>
          )}
          {/* Filtres complémentaires */}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <FontAwesomeIcon icon={faFilter} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
            <div style={{ width: 250 }}>
              <AutocompleteFiltre options={toutesCategories} value={filtreCategorie}
                onChange={setFiltreCategorie} placeholder="Toutes catégories" />
            </div>
            <div style={{ width: 250 }}>
              <AutocompleteFiltre options={tousProduits} value={filtreProduit}
                onChange={setFiltreProduit} placeholder="Tous les produits" />
            </div>
            {filtresActifs && (
              <button className="btn btn-sm d-flex align-items-center gap-1"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                onClick={reinitialiserFiltres}>
                <FontAwesomeIcon icon={faFilter} style={{ fontSize: 'var(--txt-sm)' }} /> Réinitialiser
              </button>
            )}
            <div className="d-flex align-items-center gap-1 ms-auto">
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
          </div>
        </div>
      </div>

      {/* Cartes résumé — sélectionnables */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <CarteSource icon={faStore} label="Boutique" couleur="#0ea5e9" bg="#e0f2fe"
            total={formatMontant(totalB)} nbTx={ventesBoutique.length}
            actif={source === 'boutique'} onClick={() => setSource(source === 'boutique' ? 'tout' : 'boutique')} />
        </div>
        <div className="col-12 col-md-4">
          <CarteSource icon={faWarehouse} label="Magasin direct" couleur="#f97316" bg="#fff7ed"
            total={formatMontant(totalM)} nbTx={ventesMagasin.length}
            actif={source === 'magasin'} onClick={() => setSource(source === 'magasin' ? 'tout' : 'magasin')} />
        </div>
        <div className="col-12 col-md-4">
          <CarteSource icon={faGlobe} label="Global combiné" couleur="#00d4aa" bg="#d1faf3"
            total={formatMontant(totalG)} nbTx={ventesTout.length}
            actif={source === 'tout'} onClick={() => setSource('tout')} />
        </div>
      </div>

      {/* ── Bénéfices — visibles après authentification ── */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14, borderLeft: '3px solid #6366f1' }}>
        <div className="card-body p-3">
          <div className="fw-semibold d-flex align-items-center gap-2 mb-3" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: '#6366f1' }} />
            Bénéfices (période sélectionnée)
          </div>
          <div className="row g-3">
            {[
              { label: 'Boutique',       val: beneficeB, color: '#0ea5e9', bg: '#e0f2fe' },
              { label: 'Magasin direct', val: beneficeM, color: '#f97316', bg: '#fff7ed' },
              { label: 'Global',         val: beneficeG, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className="col-12 col-md-4">
                <div className="p-3 rounded-3 h-100" style={{ background: bg }}>
                  <div className="small mb-1" style={{ color, opacity: 0.8 }}>{label}</div>
                  <div className="fw-bold" style={{ color, fontSize: 'var(--txt-2xl)' }}>{formatMontant(val)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Titre — toujours fixe ── */}
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Mes Finances</h4>
          <p className="text-muted small mb-0">Ventes boutique et sorties magasin (hors transferts)</p>
        </div>
      </div>{/* fin titre */}

      {/* ── Filtres — fixe desktop, dans le scroll mobile ── */}
      {!isMobile && (
        <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}

      {/* ── Zone scrollable : tableau des transactions ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: '0.5rem' }}>
      {isMobile && (
        <div style={{ marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}
      {/* Tableau groupé */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <div className="card-header border-0 px-4 py-3 d-flex align-items-center justify-content-between"
          style={{ background: 'var(--bs-secondary-bg)' }}>
          <span className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
            {source === 'boutique' ? 'Ventes Boutique'
            : source === 'magasin' ? 'Sorties Magasin (direct)'
            : 'Toutes les transactions'}
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="badge" style={{ background: couleurSource, fontSize: 'var(--txt-base)' }}>
              {formatMontant(ventesAffichees.reduce((s,v) => s+v.montant, 0))}
            </span>
            <button className="btn btn-sm d-flex align-items-center gap-1"
              style={{ background: '#e8f5f3', color: '#00a881', borderRadius: 8, fontSize: 'var(--txt-base)' }}
              title="Imprimer / Partager ce rapport"
              onClick={() => {
                const titreP = PERIODES.find(p => p.val === periode)?.label || periode;
                imprimerRapportFinances(ventesAffichees, titreP, groupement);
              }}>
              <FontAwesomeIcon icon={faPrint} /> Imprimer
            </button>
          </div>
        </div>
        <div className="card-body p-3">
          <TableauVentes
            ventes={ventesAffichees}
            groupement={groupement}
            formatMontant={formatMontant}
            couleur={couleurSource}
          />
        </div>
      </div>
      </div>{/* fin scrollable */}

    </div>
  );
};

export default MesFinances;
