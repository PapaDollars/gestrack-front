// Finances métier — ventes boutique, magasin direct, et global
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { imprimerRapportFinances } from '@/utils/pdfTemplates';
import { faStore, faWarehouse, faGlobe, faSpinner, faFilter, faSortAmountDown, faPrint } from '@fortawesome/free-solid-svg-icons';
import { financesAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import useIsMobile from '@/hooks/useIsMobile';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import { PERIODES, GROUPEMENTS } from '@/pages/finances/mes-finances/constants';
import { filtrerParPeriode } from '@/pages/finances/mes-finances/utils';
import TableauVentes from '@/pages/finances/mes-finances/components/TableauVentes';
import CarteSource from '@/pages/finances/mes-finances/components/CarteSource';
import ModalMdpBenefice from '@/pages/finances/mes-finances/modals/ModalMdpBenefice';

// ── Page principale ───────────────────────────────────────────────────────
const MesFinances = () => {
  const isMobile = useIsMobile();
  const { formatMontant } = useParametres();
  const [donnees, setDonnees] = useState({ boutique: [], magasin: [], remises: [] });
  const [chargement, setChargement] = useState(true);

  // Filtres
  const [periode, setPeriode]         = useState('mois');
  const [groupement, setGroupement]   = useState('jour');
  // Hauteur de l'en-tête « Toutes les transactions » (collant) : les en-têtes de groupe
  // se collent juste en dessous.
  const enteteTableauRef = useRef(null);
  const [hauteurEntete, setHauteurEntete] = useState(0);
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
  // Remises de factures — pas rattachées à une source (boutique/magasin) en particulier,
  // donc comptées seulement dans la vue globale "tout", pas dans les totaux par source.
  const remises = useMemo(() => appliquerFiltres(donnees.remises || []), [donnees, periode, dateDebut, dateFin, filtreCategorie, filtreProduit]); // eslint-disable-line
  const ventesTout = useMemo(
    () => [...ventesBoutique, ...ventesMagasin, ...remises].sort((a, b) => b.timestamp > a.timestamp ? 1 : -1),
    [ventesBoutique, ventesMagasin, remises]
  );

  const totalB = useMemo(() => ventesBoutique.reduce((s, v) => s + v.montant, 0), [ventesBoutique]);
  const totalM = useMemo(() => ventesMagasin.reduce((s, v) => s + v.montant, 0),  [ventesMagasin]);
  const totalRemises = useMemo(() => remises.reduce((s, v) => s + v.montant, 0), [remises]);
  const totalG = totalB + totalM + totalRemises;

  const beneficeB = useMemo(() => ventesBoutique.reduce((s, v) => s + (v.benefice || 0), 0), [ventesBoutique]);
  const beneficeM = useMemo(() => ventesMagasin.reduce((s, v) => s + (v.benefice || 0), 0),  [ventesMagasin]);
  const beneficeG = beneficeB + beneficeM + totalRemises;

  const ventesAffichees = source === 'boutique' ? ventesBoutique
                        : source === 'magasin'  ? ventesMagasin
                        : ventesTout;

  const couleurSource = source === 'boutique' ? '#0ea5e9'
                      : source === 'magasin'  ? '#f97316'
                      : '#00d4aa';

  useEffect(() => {
    const el = enteteTableauRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setHauteurEntete(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [chargement, pageDebloquee]);

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
      {/* Filtres — catégorie, produit, période, groupement sur une seule ligne.
          Au premier plan pour que les listes déroulantes passent au-dessus des en-têtes collants. */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14, position: 'relative', zIndex: 10 }}>
        <div className="card-body px-3 py-2">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div style={{ width: 230 }}>
              <AutocompleteFiltre options={toutesCategories} value={filtreCategorie}
                onChange={setFiltreCategorie} placeholder="Toutes catégories" />
            </div>
            <div style={{ width: 230 }}>
              <AutocompleteFiltre options={tousProduits} value={filtreProduit}
                onChange={setFiltreProduit} placeholder="Tous les produits" />
            </div>
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
            {/* Espace entre les raccourcis de période et le groupement */}
            <div style={{ flex: '1 0 2rem' }} />
            <div className="d-flex align-items-center gap-1">
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
            {filtresActifs && (
              <button className="btn btn-sm d-flex align-items-center gap-1 ms-auto"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                onClick={reinitialiserFiltres}>
                <FontAwesomeIcon icon={faFilter} style={{ fontSize: 'var(--txt-sm)' }} /> Réinitialiser
              </button>
            )}
          </div>
          {/* Date perso */}
          {periode === 'perso' && (
            <div className="d-flex gap-2 flex-wrap mt-2">
              <div className="input-group input-group-sm" style={{ maxWidth: 200 }}>
                <span className="input-group-text bg-body-secondary small">Du</span>
                <input type="date" className="form-control" value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)} />
              </div>
              <div className="input-group input-group-sm" style={{ maxWidth: 200 }}>
                <span className="input-group-text bg-body-secondary small">Au</span>
                <input type="date" className="form-control" value={dateFin}
                  onChange={e => setDateFin(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cartes résumé — chiffre d'affaires + bénéfice de la période, sélectionnables */}
      <div className="row g-2 mb-2">
        <div className="col-12 col-md-4">
          <CarteSource icon={faStore} label="Boutique" couleur="#0ea5e9" bg="#e0f2fe"
            total={formatMontant(totalB)} nbTx={ventesBoutique.length} benefice={formatMontant(beneficeB)}
            actif={source === 'boutique'} onClick={() => setSource(source === 'boutique' ? 'tout' : 'boutique')} />
        </div>
        <div className="col-12 col-md-4">
          <CarteSource icon={faWarehouse} label="Magasin direct" couleur="#f97316" bg="#fff7ed"
            total={formatMontant(totalM)} nbTx={ventesMagasin.length} benefice={formatMontant(beneficeM)}
            actif={source === 'magasin'} onClick={() => setSource(source === 'magasin' ? 'tout' : 'magasin')} />
        </div>
        <div className="col-12 col-md-4">
          <CarteSource icon={faGlobe} label="Global combiné" couleur="#00a881" bg="#d1faf3"
            total={formatMontant(totalG)} nbTx={ventesTout.length} benefice={formatMontant(beneficeG)}
            actif={source === 'tout'} onClick={() => setSource('tout')} />
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
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: '0' }}>
      {isMobile && (
        <div style={{ marginBottom: '0.75rem' }}>
          {filtresJSX}
        </div>
      )}
      {/* Tableau groupé */}
      {/* Pas d'overflow:hidden sur la carte : il casserait les en-têtes collants. */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div ref={enteteTableauRef} className="card-header border-0 px-4 py-3 d-flex align-items-center justify-content-between"
          style={{ background: 'var(--bs-secondary-bg)', position: 'sticky', top: 0, zIndex: 3, borderRadius: '14px 14px 0 0' }}>
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
            offsetSticky={hauteurEntete}
          />
        </div>
      </div>
      </div>{/* fin scrollable */}

    </div>
  );
};

export default MesFinances;
