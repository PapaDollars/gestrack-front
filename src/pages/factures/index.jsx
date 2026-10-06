// Page Factures — historique + modal création/modification
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSpinner, faSearch, faReceipt, faChevronLeft, faChevronRight, faTimes, faFilter } from '@fortawesome/free-solid-svg-icons';
import { clientsAPI, produitsAPI, magasinAPI, facturesAPI, estMisEnAttente, invalidateCache } from '@/services/api';
import { fmtDH } from '@/utils/pdf';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import ModalFacture from '@/pages/factures/modals/ModalFacture';
import ModalDetailFacture from '@/pages/factures/modals/ModalDetailFacture';
import ModalRemiseFacture from '@/pages/factures/modals/ModalRemiseFacture';

const PAR_PAGE = 50;

// ── Page principale ───────────────────────────────────────────────────────────
const Factures = () => {
  const { formatMontant } = useParametres();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clients, setClients]   = useState([]);
  const [produits, setProduits] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [montantMin, setMontantMin] = useState(0);
  const [montantMax, setMontantMax] = useState(null); // null = pas de plafond (suit le max des factures)

  const [modalForm, setModalForm]         = useState(null);
  const [factureDetail, setFactureDetail] = useState(null);
  const [modalRemise, setModalRemise]     = useState(null);
  const [confirmSuppr, setConfirmSuppr]   = useState(null);
  const [enSuppression, setEnSuppression] = useState(false);
  const [page, setPage] = useState(1);
  const scrollRef = useRef(null);

  const charger = async () => {
    try {
      const [cRes, bRes, mRes, fRes] = await Promise.all([
        clientsAPI.getAll(),
        produitsAPI.getAll(),
        magasinAPI.getAll(),
        facturesAPI.getAll(),
      ]);
      setClients(cRes.data);
      setProduits([
        ...bRes.data.map(p => ({ ...p, _source: 'boutique' })),
        ...mRes.data.map(p => ({ ...p, _source: 'magasin' })),
      ].sort((a, b) => a.nom?.localeCompare(b.nom, 'fr')));
      setFactures(fRes.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  // Ouvrir automatiquement la facture ciblée par ?id= (ex: depuis les dettes)
  useEffect(() => {
    const id = searchParams.get('id');
    if (!id || factures.length === 0) return;
    const f = factures.find(x => x.id === id);
    if (f) {
      setFactureDetail(f);
      setSearchParams({}, { replace: true }); // nettoyer l'URL
    }
  }, [searchParams, factures]); // eslint-disable-line

  const apresSucces = (data) => {
    setFactures(prev => {
      const idx = prev.findIndex(f => f.id === data.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = data; return n; }
      return [data, ...prev];
    });
    setModalForm(null);
    invalidateCache('produits', 'magasin');
    window.dispatchEvent(new CustomEvent('gestrack:stock-updated'));
  };

  const supprimer = async () => {
    if (!confirmSuppr) return;
    setEnSuppression(true);
    try {
      const reponse = await facturesAPI.delete(confirmSuppr.id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success('Facture supprimée');
      setFactures(prev => prev.filter(f => f.id !== confirmSuppr.id));
      setConfirmSuppr(null);
      invalidateCache('produits', 'magasin');
      window.dispatchEvent(new CustomEvent('gestrack:stock-updated'));
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setEnSuppression(false);
    }
  };

  const montantMaxPossible = useMemo(() => Math.max(0, ...factures.map(f => f.montantTotal || 0)), [factures]);
  const montantMaxEffectif = montantMax ?? montantMaxPossible;

  const facturesFiltrees = useMemo(() => {
    const t = recherche.toLowerCase().trim();
    return factures.filter(f => {
      if (t && !(
        f.numero?.toLowerCase().includes(t) ||
        `${f.clientPrenom} ${f.clientNom}`.toLowerCase().includes(t) ||
        f.clientTelephone?.includes(t)
      )) return false;
      const m = f.montantTotal || 0;
      return m >= montantMin && m <= montantMaxEffectif;
    });
  }, [factures, recherche, montantMin, montantMaxEffectif]);

  const filtresActifs = recherche || montantMin > 0 || (montantMax !== null && montantMax < montantMaxPossible);
  const reinitialiserFiltres = () => { setRecherche(''); setMontantMin(0); setMontantMax(null); setPage(1); };

  const totalPages   = Math.max(1, Math.ceil(facturesFiltrees.length / PAR_PAGE));
  const pageCourante = Math.min(page, totalPages);
  const facturesPag  = facturesFiltrees.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

  // Remonte la liste en haut à chaque changement de page — sinon le clic sur « suivant »,
  // fait tout en bas, laisse la vue sur le bas de la nouvelle page.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pageCourante]);

  if (chargement) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Titre fixe */}
      <div style={{ flexShrink: 0 }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faReceipt} className="me-2" style={{ color: '#00d4aa' }} />
              Factures
            </h4>
            <p className="text-muted small mb-0">{factures.length} facture(s) au total</p>
          </div>
          <button className="btn text-white d-flex align-items-center gap-2"
            style={{ background: '#00d4aa', borderRadius: 10 }}
            onClick={() => setModalForm('new')}>
            <FontAwesomeIcon icon={faPlus} /> Nouvelle facture
          </button>
        </div>

        {/* Barre de recherche + filtre montant */}
        {factures.length > 0 && (
          <div className="row g-2 align-items-end mb-2">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-body-secondary border-end-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
                </span>
                <input type="text" className="form-control border-start-0"
                  placeholder="Rechercher par N°, client, téléphone..."
                  value={recherche} onChange={e => { setRecherche(e.target.value); setPage(1); }} />
                {recherche && (
                  <button className="btn btn-light border" onClick={() => setRecherche('')}>
                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-base)' }} />
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
                    value={montantMin}
                    onChange={e => { setMontantMin(Math.min(+e.target.value, montantMaxEffectif)); setPage(1); }} />
                </div>
                <div className="col-6 col-md">
                  <label className="form-label small text-muted mb-0">Max : <strong>{formatMontant(montantMaxEffectif)}</strong></label>
                  <input type="range" className="form-range range-vert d-block" min={0} max={montantMaxPossible} step={1000}
                    style={{ '--vert-debut': `${montantMaxPossible ? montantMaxEffectif / montantMaxPossible * 100 : 100}%`, '--vert-fin': '100%' }}
                    value={montantMaxEffectif}
                    onChange={e => {
                      const v = Math.max(+e.target.value, montantMin);
                      setMontantMax(v >= montantMaxPossible ? null : v);
                      setPage(1);
                    }} />
                </div>
              </>
            )}
            {filtresActifs && (
              <div className="col-12 col-md-auto">
                <button className="btn d-flex align-items-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                  onClick={reinitialiserFiltres}>
                  <FontAwesomeIcon icon={faFilter} style={{ fontSize: 'var(--txt-sm)' }} /> Réinitialiser
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone scrollable — historique */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: '0.25rem' }}>
        {factures.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faReceipt} size="3x" className="mb-3 d-block" style={{ color: '#cbd5e1' }} />
            <p>Aucune facture créée pour le moment</p>
            <button className="btn text-white" style={{ background: '#00d4aa', borderRadius: 10 }}
              onClick={() => setModalForm('new')}>
              <FontAwesomeIcon icon={faPlus} className="me-2" /> Créer la première facture
            </button>
          </div>
        ) : (
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14, overflow: 'hidden', flex: '0 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Liste — seule partie qui défile, la pagination reste visible en bas */}
            <div ref={scrollRef} style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {facturesFiltrees.length === 0 && (
              <div className="text-center py-4 text-muted small">Aucune facture ne correspond aux filtres</div>
            )}
            {facturesPag.map((f, i) => (
              <div key={f.id}
                className="d-flex align-items-center gap-2 px-2 px-sm-4 py-2"
                style={{
                  borderBottom: i < facturesPag.length - 1 ? '1px solid var(--bs-border-color)' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => setFactureDetail(f)}>
                {/* Icône */}
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 34, height: 34, background: '#e8f5f3' }}>
                  <FontAwesomeIcon icon={faReceipt} style={{ color: '#00a881', fontSize: 'var(--txt-lg)' }} />
                </div>

                {/* Infos principales */}
                <div className="flex-grow-1 min-w-0">
                  {/* Numéro — toujours visible */}
                  <div className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>
                    {f.numero}
                    {/* Nom client — même ligne sur desktop */}
                    <span className="text-muted fw-normal ms-1 d-none d-sm-inline">
                      · {(f.clientPrenom || f.clientNom)
                          ? `${f.clientPrenom || ''} ${f.clientNom || ''}`.trim()
                          : 'Client non renseigné'}
                    </span>
                  </div>
                  {/* Nom client — ligne séparée sur mobile */}
                  <div className="text-muted d-sm-none text-truncate" style={{ fontSize: 'var(--txt-base)' }}>
                    {(f.clientPrenom || f.clientNom)
                      ? `${f.clientPrenom || ''} ${f.clientNom || ''}`.trim()
                      : 'Client non renseigné'}
                  </div>
                  {/* Sous-infos */}
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>
                      {(f.lignes || []).length} produit(s)
                    </span>
                    <span className="text-muted d-none d-sm-inline" style={{ fontSize: 'var(--txt-sm)' }}>
                      · {fmtDH(f.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Montant + statut */}
                <div className="text-end flex-shrink-0">
                  <div className="fw-bold" style={{ color: '#dc2626' }}>{formatMontant(f.montantTotal)}</div>
                  <div style={{ fontSize: 'var(--txt-sm)', color: f.resteADoit > 0 ? '#ea580c' : '#16a34a' }}>
                    {f.resteADoit > 0 ? `Reste : ${formatMontant(f.resteADoit)}` : '✓ Soldé'}
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between px-2 px-sm-4 py-2 border-top"
                style={{ flexShrink: 0 }}>
                <span className="text-muted small">Page {pageCourante}/{totalPages} · {facturesFiltrees.length}</span>
                <div className="d-flex gap-1">
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal création / modification */}
      {modalForm !== null && (
        <ModalFacture
          factureToEdit={modalForm === 'new' ? null : modalForm}
          clients={clients}
          produits={produits}
          onFermer={() => setModalForm(null)}
          onSucces={apresSucces}
        />
      )}

      {/* Modal détails */}
      {factureDetail && (
        <ModalDetailFacture
          facture={factureDetail}
          onFermer={() => setFactureDetail(null)}
          onModifier={(f) => setModalForm(f)}
          onSupprimer={(f) => setConfirmSuppr(f)}
          onAppliquerRemise={(f) => setModalRemise(f)}
          formatMontant={formatMontant}
        />
      )}

      {/* Modal remise (après coup, sur une facture existante) */}
      {modalRemise && (
        <ModalRemiseFacture
          facture={modalRemise}
          onFermer={() => setModalRemise(null)}
          onSucces={(data) => { apresSucces(data); setModalRemise(null); }}
          formatMontant={formatMontant}
        />
      )}

      {/* Confirmation suppression */}
      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer la facture ${confirmSuppr.numero} ?${confirmSuppr.detteId ? ' La dette associée sera également supprimée.' : ''} Cette action est irréversible.`}
          onConfirmer={supprimer}
          chargement={enSuppression}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
    </div>
  );
};

export default Factures;
