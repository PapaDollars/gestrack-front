// Page Factures — historique + modal création/modification
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faSpinner, faSearch, faUser, faReceipt,
  faChevronLeft, faChevronRight, faPrint, faEdit,
  faMoneyBillWave, faMobile, faWallet, faCheck, faTimes, faBoxOpen, faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { clientsAPI, produitsAPI, magasinAPI, facturesAPI, estMisEnAttente, invalidateCache } from '@/services/api';
import { imprimerFacture } from '@/utils/pdfTemplates';
import { fmtDH } from '@/utils/pdf';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalConfirmation from '@/components/shared/ModalConfirmation';

const PAR_PAGE = 50;

const MOYENS = [
  { val: 'especes', label: 'Espèces',      icon: faMoneyBillWave, color: '#16a34a', bg: '#dcfce7' },
  { val: 'om',      label: 'Orange Money', icon: faMobile,        color: '#ea580c', bg: '#fff7ed' },
  { val: 'mtn',     label: 'MTN Money',    icon: faWallet,        color: '#ca8a04', bg: '#fefce8' },
];

// ── Autocomplete client ───────────────────────────────────────────────────────
const RechercheClient = ({ clients, onSelect }) => {
  const [texte, setTexte] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  const filtres = useMemo(() => {
    if (!texte.trim()) return [];
    const t = texte.toLowerCase();
    return clients.filter(c =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(t) ||
      c.surnom?.toLowerCase().includes(t) ||
      c.telephone?.includes(t)
    ).slice(0, 8);
  }, [texte, clients]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOuvert(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="position-relative">
      <div className="input-group">
        <span className="input-group-text bg-body-secondary border-end-0">
          <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
        </span>
        <input type="text" className="form-control border-start-0"
          placeholder="Nom, prénom, téléphone, surnom..."
          value={texte}
          onChange={e => { setTexte(e.target.value); setOuvert(true); }}
          onFocus={() => setOuvert(true)} />
      </div>
      {ouvert && filtres.length > 0 && (
        <div className="position-absolute w-100 shadow-lg rounded-3 overflow-hidden z-3"
          style={{ top: '100%', left: 0, background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)', maxHeight: 260, overflowY: 'auto' }}>
          {filtres.map(c => (
            <div key={c.id} className="d-flex align-items-center gap-3 px-3 py-2"
              style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-md)' }}
              onMouseDown={() => { onSelect(c); setTexte(`${c.prenom} ${c.nom}`); setOuvert(false); }}>
              {c.photo
                ? <img src={c.photo} alt="" className="rounded-circle flex-shrink-0" style={{ width: 34, height: 34, objectFit: 'cover' }} />
                : <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
                    style={{ width: 34, height: 34, background: '#00d4aa', fontSize: 'var(--txt-md)' }}>
                    {c.prenom?.[0]}{c.nom?.[0]}
                  </div>}
              <div>
                <div className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{c.prenom} {c.nom}</div>
                <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>{c.profession} · {c.telephone}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Autocomplete produit — recherches séparées boutique / magasin ────────────
const ListeProduits = ({ produits, recherche, ouvert, onAjouter }) => {
  const filtres = useMemo(() => {
    const t = recherche.toLowerCase().trim();
    const liste = t ? produits.filter(p => p.nom?.toLowerCase().includes(t) || p.categorie?.toLowerCase().includes(t)) : produits;
    return liste.slice(0, 20);
  }, [recherche, produits]);

  if (!ouvert || filtres.length === 0) return null;

  return (
    <div className="rounded-2 border mt-1"
      style={{ maxHeight: 260, overflowY: 'auto', background: 'var(--bs-body-bg)' }}>
      {filtres.map(p => (
        <div key={p.id + p._source} className="d-flex align-items-center gap-2 px-2 py-2"
          style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-sm)' }}
          onMouseDown={() => onAjouter(p)}>
          {p.image
            ? <img src={p.image} alt="" className="rounded flex-shrink-0" style={{ width: 32, height: 32, objectFit: 'contain', background: '#f8fafc' }} />
            : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 32, height: 32, background: 'var(--bs-secondary-bg)' }}>
                <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 12 }} />
              </div>}
          <div className="flex-grow-1 min-w-0">
            <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
            <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>{p.categorie}</div>
          </div>
          <div className="fw-bold flex-shrink-0" style={{ color: '#00a881', fontSize: 'var(--txt-xs)', whiteSpace: 'nowrap' }}>
            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(p.prixVente || 0)}
          </div>
        </div>
      ))}
    </div>
  );
};

const RechercheProduit = ({ produits, onAjouter }) => {
  const [rechercheBoutique, setRechercheBoutique] = useState('');
  const [rechercheMagasin, setRechercheMagasin]   = useState('');
  const [dropOpenBoutique, setDropOpenBoutique]   = useState(false);
  const [dropOpenMagasin, setDropOpenMagasin]     = useState(false);
  const refBoutique = useRef(null);
  const refMagasin  = useRef(null);

  const produitsBoutique = useMemo(() => produits.filter(p => p._source === 'boutique'), [produits]);
  const produitsMagasin  = useMemo(() => produits.filter(p => p._source === 'magasin'),  [produits]);

  useEffect(() => {
    const h = (e) => {
      if (refBoutique.current && !refBoutique.current.contains(e.target)) setDropOpenBoutique(false);
      if (refMagasin.current  && !refMagasin.current.contains(e.target))  setDropOpenMagasin(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const choisir = (p, setRecherche, setOuvert) => {
    onAjouter(p);
    setRecherche('');
    setOuvert(false);
  };

  return (
    <div className="row g-2">
      <div className="col-6" ref={refBoutique}>
        <div className="input-group">
          <span className="input-group-text bg-body-secondary border-end-0">
            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
          </span>
          <input type="text" className="form-control border-start-0"
            placeholder="Boutique..."
            value={rechercheBoutique}
            onChange={e => { setRechercheBoutique(e.target.value); setDropOpenBoutique(true); }}
            onFocus={() => setDropOpenBoutique(true)} />
        </div>
        <ListeProduits produits={produitsBoutique} recherche={rechercheBoutique} ouvert={dropOpenBoutique}
          onAjouter={p => choisir(p, setRechercheBoutique, setDropOpenBoutique)} />
      </div>
      <div className="col-6" ref={refMagasin}>
        <div className="input-group">
          <span className="input-group-text bg-body-secondary border-end-0">
            <FontAwesomeIcon icon={faBoxOpen} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
          </span>
          <input type="text" className="form-control border-start-0"
            placeholder="Magasin..."
            value={rechercheMagasin}
            onChange={e => { setRechercheMagasin(e.target.value); setDropOpenMagasin(true); }}
            onFocus={() => setDropOpenMagasin(true)} />
        </div>
        <ListeProduits produits={produitsMagasin} recherche={rechercheMagasin} ouvert={dropOpenMagasin}
          onAjouter={p => choisir(p, setRechercheMagasin, setDropOpenMagasin)} />
      </div>
    </div>
  );
};

// ── Modal création / modification ─────────────────────────────────────────────
const ModalFacture = ({ factureToEdit = null, clients, produits, onFermer, onSucces }) => {
  const { formatMontant } = useParametres();

  const [client, setClient]           = useState(null);
  const [lignes, setLignes]           = useState([]);
  const [avecDette, setAvecDette]       = useState(false); // false = facture simple par défaut
  const [avance, setAvance]             = useState('');
  const [avanceActive, setAvanceActive] = useState(false);
  const [moyenPaiement, setMoyen]       = useState('especes');
  const [envoi, setEnvoi]               = useState(false);

  // Pré-remplir si modification
  useEffect(() => {
    if (!factureToEdit) return;
    const c = clients.find(x => x.id === factureToEdit.clientId) || null;
    setClient(c);
    setLignes((factureToEdit.lignes || []).map(l => ({ ...l, _cle: l.produitId + (l.source || '') })));
    setAvecDette(!!factureToEdit.detteId || factureToEdit.resteADoit > 0);
    setAvance(factureToEdit.avance > 0 ? String(factureToEdit.avance) : '');
    setAvanceActive(factureToEdit.avance > 0);
    setMoyen(factureToEdit.moyenPaiement || 'especes');
  }, [factureToEdit]); // eslint-disable-line

  const montantTotal = lignes.reduce((s, l) => s + l.sousTotal, 0);
  const avanceNum    = parseFloat(avance) || 0;
  const resteADoit   = Math.max(0, montantTotal - avanceNum);

  const ajouterProduit = (p) => {
    const cle = p.id + p._source;
    setLignes(prev => {
      const ex = prev.find(l => l._cle === cle);
      if (ex) return prev.map(l => l._cle === cle
        ? { ...l, quantite: l.quantite + 1, sousTotal: (l.quantite + 1) * l.prixUnitaire }
        : l);
      return [{
        _cle: cle, produitId: p.id, source: p._source,
        nom: p.nom, image: p.image || null,
        prixUnitaire: p.prixVente || 0, prixOriginal: p.prixVente || 0,
        quantite: 1, sousTotal: p.prixVente || 0,
      }, ...prev];
    });
  };

  const majQte = (cle, val) => {
    const q = val === '' ? '' : Math.max(1, parseInt(val) || 1);
    setLignes(prev => prev.map(l => l._cle === cle ? { ...l, quantite: q, sousTotal: (q === '' ? 0 : q * l.prixUnitaire) } : l));
  };

  const majPrix = (cle, val) => {
    const px = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setLignes(prev => prev.map(l => l._cle === cle ? { ...l, prixUnitaire: px, sousTotal: (px === '' ? 0 : l.quantite * px) } : l));
  };

  const soumettre = async () => {
    if (!client) { toast.error('Veuillez sélectionner un client'); return; }
    if (lignes.length === 0) { toast.error('Ajoutez au moins un produit'); return; }
    setEnvoi(true);
    try {
      const payload = {
        clientId: client?.id || null,
        clientNom: client?.nom || '',
        clientPrenom: client?.prenom || '',
        clientTelephone: client?.telephone || '',
        lignes: lignes.map(({ _cle, ...l }) => l),
        montantTotal,
        avance: avecDette ? avanceNum : 0,
        moyenPaiement: avecDette && avanceNum > 0 ? moyenPaiement : null,
        sansDette: !avecDette,
      };
      const r = factureToEdit
        ? await facturesAPI.update(factureToEdit.id, payload)
        : await facturesAPI.create(payload);
      if (estMisEnAttente(r)) return; // pas encore enregistré côté serveur
      const data = r.data;
      toast.success(factureToEdit
        ? 'Facture modifiée'
        : `Facture ${data.numero} créée${data.detteId ? ' · dette générée' : ''}`);
      onSucces(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-fullscreen-sm-down modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>

          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faReceipt} className="me-2" style={{ color: '#00d4aa' }} />
              {factureToEdit ? `Modifier ${factureToEdit.numero}` : 'Nouvelle facture'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-body px-4 d-flex flex-column gap-3" style={{ minHeight: '50vh' }}>

            {/* Client */}
            <div>
              <label className="form-label small fw-semibold text-muted mb-1">
                <FontAwesomeIcon icon={faUser} className="me-1" /> Client *
              </label>
              {client ? (
                <div className="d-flex align-items-center gap-3 p-2 rounded-2" style={{ background: 'var(--bs-secondary-bg)' }}>
                  {client.photo
                    ? <img src={client.photo} alt="" className="rounded-circle flex-shrink-0" style={{ width: 34, height: 34, objectFit: 'cover' }} />
                    : <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
                        style={{ width: 34, height: 34, background: '#00d4aa', fontSize: 'var(--txt-base)' }}>
                        {client.prenom?.[0]}{client.nom?.[0]}
                      </div>}
                  <div className="flex-grow-1">
                    <div className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>{client.prenom} {client.nom}</div>
                    <div className="text-muted small">{client.profession} · {client.telephone}</div>
                  </div>
                  <button className="btn btn-sm btn-light rounded-circle" onClick={() => setClient(null)}>
                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-xs)' }} />
                  </button>
                </div>
              ) : (
                <RechercheClient clients={clients} onSelect={setClient} />
              )}
            </div>

            {/* Recherche produit */}
            <div>
              <label className="form-label small fw-semibold text-muted mb-1">
                <FontAwesomeIcon icon={faBoxOpen} className="me-1" /> Ajouter un produit
              </label>
              <RechercheProduit produits={produits} onAjouter={ajouterProduit} />
            </div>

            {/* Lignes */}
            {lignes.length > 0 && (
              <div>
                <div className="small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: 1 }}>
                  Produits ({lignes.length})
                </div>
                <div className="d-flex flex-column gap-2">
                  {lignes.map(l => (
                    <div key={l._cle} className="p-3 rounded-3" style={{ background: 'var(--bs-secondary-bg)' }}>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {l.image
                          ? <img src={l.image} alt="" className="rounded flex-shrink-0" style={{ width: 38, height: 38, objectFit: 'contain' }} />
                          : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: 38, height: 38, background: '#e8f5f3' }}>
                              <FontAwesomeIcon icon={faBoxOpen} style={{ color: '#00a881', fontSize: 'var(--txt-lg)' }} />
                            </div>}
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-md)' }}>{l.nom}</div>
                          <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>{l.source === 'magasin' ? 'Magasin' : 'Boutique'}</div>
                        </div>
                        <button className="btn btn-sm flex-shrink-0"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 8 }}
                          onClick={() => setLignes(prev => prev.filter(x => x._cle !== l._cle))}>
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: 'var(--txt-sm)' }} />
                        </button>
                      </div>
                      <div className="row g-2 align-items-center">
                        {/* Quantité — champ libre */}
                        <div className="col-3 col-sm-auto">
                          <label className="form-label small text-muted mb-1">Qté</label>
                          <input type="number" min="1" className="form-control form-control-sm text-center"
                            style={{ minWidth: 60 }}
                            value={l.quantite}
                            onChange={e => majQte(l._cle, e.target.value)} />
                        </div>
                        {/* Prix unitaire */}
                        <div className="col">
                          <label className="form-label small text-muted mb-1">Prix unitaire</label>
                          <div className="input-group input-group-sm">
                            <input type="number" min="0" className="form-control"
                              value={l.prixUnitaire}
                              onChange={e => majPrix(l._cle, e.target.value)} />
                            <span className="input-group-text" style={{ fontSize: 'var(--txt-sm)' }}>FCFA</span>
                          </div>
                        </div>
                        {/* Sous-total */}
                        <div className="col-auto text-end">
                          <label className="form-label small text-muted mb-1">Sous-total</label>
                          <div className="fw-bold" style={{ color: '#dc2626', fontSize: 'var(--txt-lg)' }}>{formatMontant(l.sousTotal)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Récapitulatif */}
            {lignes.length > 0 && (
              <div className="p-3 rounded-3 border" style={{ borderColor: 'var(--bs-border-color)' }}>
                {/* Total */}
                <div className="d-flex justify-content-between align-items-center pb-2 mb-2"
                  style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
                  <span className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>Total</span>
                  <span className="fw-bold fs-5" style={{ color: '#dc2626' }}>{formatMontant(montantTotal)}</span>
                </div>

                {/* Case à cocher : créer une dette */}
                <label className="d-flex align-items-center gap-2 mb-0"
                  style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={avecDette}
                    onChange={e => {
                      setAvecDette(e.target.checked);
                      if (!e.target.checked) { setAvance(''); setAvanceActive(false); }
                    }} />
                  <span className="small fw-semibold" style={{ color: 'var(--bs-body-color)' }}>
                    Créer une dette pour le reste dû
                  </span>
                </label>

                {/* Section dette — visible uniquement si avecDette */}
                {avecDette && (
                  <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
                    {/* Avance optionnelle */}
                    {!avanceActive ? (
                      <button type="button" className="btn btn-sm w-100 mb-3"
                        style={{ background: 'var(--bs-secondary-bg)', color: 'var(--bs-secondary-color)', borderRadius: 8, border: '1.5px dashed var(--bs-border-color)' }}
                        onClick={() => setAvanceActive(true)}>
                        + Ajouter une avance
                      </button>
                    ) : (
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <label className="form-label small fw-semibold text-muted mb-0">Avance</label>
                          <button type="button" className="btn btn-sm p-0"
                            style={{ color: '#ef4444', fontSize: 'var(--txt-sm)', background: 'none', border: 'none' }}
                            onClick={() => { setAvanceActive(false); setAvance(''); }}>
                            Retirer
                          </button>
                        </div>
                        <div className="input-group">
                          <input type="number" min="0" className="form-control" placeholder="0"
                            autoFocus value={avance} onChange={e => setAvance(e.target.value)} />
                          <span className="input-group-text">FCFA</span>
                        </div>
                      </div>
                    )}

                    {/* Moyen de paiement si avance */}
                    {avanceNum > 0 && (
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted mb-1">Moyen de paiement</label>
                        <div className="d-flex gap-2">
                          {MOYENS.map(m => (
                            <button key={m.val} type="button"
                              className="btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                              style={{
                                background: moyenPaiement === m.val ? m.bg : 'var(--bs-secondary-bg)',
                                color: moyenPaiement === m.val ? m.color : 'var(--bs-secondary-color)',
                                border: `2px solid ${moyenPaiement === m.val ? m.color : 'transparent'}`,
                                borderRadius: 8, fontSize: 'var(--txt-base)',
                              }}
                              onClick={() => setMoyen(m.val)}>
                              <FontAwesomeIcon icon={m.icon} />
                              <span className="d-none d-sm-inline">{m.label}</span>
                              {moyenPaiement === m.val && <FontAwesomeIcon icon={faCheck} style={{ fontSize: 'var(--txt-xs)' }} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reste à payer */}
                    <div className="d-flex justify-content-between align-items-center p-2 rounded-2"
                      style={{ background: resteADoit > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(22,163,74,0.08)' }}>
                      <span className="fw-bold" style={{ color: resteADoit > 0 ? '#dc2626' : '#16a34a' }}>
                        {resteADoit > 0 ? 'Reste à payer' : 'Entièrement réglé'}
                      </span>
                      <span className="fw-bold" style={{ color: resteADoit > 0 ? '#dc2626' : '#16a34a', fontSize: 'var(--txt-2xl)' }}>
                        {formatMontant(resteADoit)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button className="btn text-white d-flex align-items-center gap-2"
              style={{ background: '#00d4aa', borderRadius: 10, minWidth: 160 }}
              disabled={envoi || lignes.length === 0}
              onClick={soumettre}>
              {envoi
                ? <FontAwesomeIcon icon={faSpinner} spin />
                : <><FontAwesomeIcon icon={factureToEdit ? faCheck : faReceipt} />
                    {factureToEdit ? 'Enregistrer' : 'Créer la facture'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Modal détails facture ─────────────────────────────────────────────────────
const ModalDetailFacture = ({ facture, onFermer, onModifier, onSupprimer, formatMontant }) => {
  const labelMoyen = facture.moyenPaiement === 'om' ? 'Orange Money'
                   : facture.moyenPaiement === 'mtn' ? 'MTN Money' : 'Espèces';
  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-fullscreen-sm-down modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <div>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{facture.numero}</h5>
              <div className="text-muted small">{fmtDH(facture.createdAt)}</div>
            </div>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            {/* Client */}
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ background: 'var(--bs-secondary-bg)' }}>
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 44, height: 44, background: '#00d4aa20' }}>
                <FontAwesomeIcon icon={faUser} style={{ color: '#00a881', fontSize: 'var(--txt-2xl)' }} />
              </div>
              <div>
                <div className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>
                  {facture.clientPrenom} {facture.clientNom || 'Client non renseigné'}
                </div>
                {facture.clientTelephone && <div className="text-muted small">{facture.clientTelephone}</div>}
              </div>
            </div>

            {/* Produits */}
            <div className="mb-4">
              <div className="small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: 1 }}>
                Produits ({(facture.lignes || []).length})
              </div>
              <div className="d-flex flex-column gap-2">
                {(facture.lignes || []).map((l, i) => (
                  <div key={i} className="d-flex align-items-center gap-3 p-2 rounded-2"
                    style={{ background: 'var(--bs-secondary-bg)', fontSize: 'var(--txt-md)' }}>
                    {l.image
                      ? <img src={l.image} alt="" className="rounded flex-shrink-0" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                      : <div className="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: 40, height: 40, background: '#e8f5f3' }}>
                          <FontAwesomeIcon icon={faBoxOpen} style={{ color: '#00a881' }} />
                        </div>}
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{l.nom}</div>
                      <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>
                        {l.quantite} × {formatMontant(l.prixUnitaire)}
                        {l.prixUnitaire !== l.prixOriginal && (
                          <span className="ms-1" style={{ color: '#6366f1' }}>(prix modifié)</span>
                        )}
                      </div>
                    </div>
                    <div className="fw-bold flex-shrink-0" style={{ color: '#dc2626' }}>{formatMontant(l.sousTotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="p-3 rounded-3" style={{ background: 'var(--bs-secondary-bg)' }}>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: 'var(--txt-lg)' }}>
                <span className="text-muted">Total</span>
                <span className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>{formatMontant(facture.montantTotal)}</span>
              </div>
              {facture.avance > 0 && (
                <div className="d-flex justify-content-between mb-2" style={{ fontSize: 'var(--txt-lg)' }}>
                  <span className="text-muted">Avance ({labelMoyen})</span>
                  <span className="fw-bold" style={{ color: '#16a34a' }}>− {formatMontant(facture.avance)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between pt-2"
                style={{ borderTop: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-xl)' }}>
                <span className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>
                  {facture.resteADoit > 0 ? 'Reste à payer' : 'Entièrement réglé'}
                </span>
                <span className="fw-bold" style={{ color: facture.resteADoit > 0 ? '#dc2626' : '#16a34a' }}>
                  {formatMontant(facture.resteADoit)}
                </span>
              </div>
              {facture.detteId && (
                <div className="mt-2 small p-2 rounded-2" style={{ background: '#fef3c7', color: '#92400e' }}>
                  ⚠ Dette de {formatMontant(facture.resteADoit)} associée à ce client
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer border-0 px-4 pb-4 gap-2 flex-wrap">
            <button className="btn btn-light" onClick={onFermer}>Fermer</button>
            <button className="btn d-flex align-items-center gap-2"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 10 }}
              onClick={() => { onFermer(); onModifier(facture); }}>
              <FontAwesomeIcon icon={faEdit} /> Modifier
            </button>
            <button className="btn d-flex align-items-center gap-2"
              style={{ background: '#e8f5f3', color: '#00a881', borderRadius: 10 }}
              onClick={() => imprimerFacture(facture)}>
              <FontAwesomeIcon icon={faPrint} /> Télécharger / Partager
            </button>
            <button className="btn d-flex align-items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 10 }}
              onClick={() => { onFermer(); onSupprimer(facture); }}>
              <FontAwesomeIcon icon={faTrash} /> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────
const Factures = () => {
  const { formatMontant } = useParametres();
  const [searchParams, setSearchParams] = useSearchParams();

  const [clients, setClients]   = useState([]);
  const [produits, setProduits] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');

  const [modalForm, setModalForm]         = useState(null);
  const [factureDetail, setFactureDetail] = useState(null);
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

  const facturesFiltrees = useMemo(() => {
    if (!recherche.trim()) return factures;
    const t = recherche.toLowerCase();
    return factures.filter(f =>
      f.numero?.toLowerCase().includes(t) ||
      `${f.clientPrenom} ${f.clientNom}`.toLowerCase().includes(t) ||
      f.clientTelephone?.includes(t)
    );
  }, [factures, recherche]);

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

        {/* Barre de recherche */}
        {factures.length > 0 && (
          <div className="d-flex gap-2 mb-1">
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
            {recherche && (
              <button className="btn d-flex align-items-center gap-1 flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                onClick={() => { setRecherche(''); setPage(1); }}>
                <FontAwesomeIcon icon={faFilter} style={{ fontSize: 'var(--txt-sm)' }} /> Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Zone scrollable — historique */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: '0.25rem' }}>
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
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14, overflow: 'hidden' }}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex align-items-center justify-content-between px-2 px-sm-4 py-2 border-top"
                style={{ background: 'var(--bs-secondary-bg)', flexShrink: 0 }}>
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
