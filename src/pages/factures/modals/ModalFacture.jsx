// Modal : création / modification d'une facture
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faUser, faReceipt, faCheck, faTimes, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { facturesAPI, estMisEnAttente } from '@/services/api';
import { sousUnites, psParUnite } from '@/services/unites';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import { MOYENS } from '@/pages/factures/constants';
import RechercheClient from '@/pages/factures/components/RechercheClient';
import RechercheProduit from '@/pages/factures/components/RechercheProduit';

// ── Modal création / modification ─────────────────────────────────────────────
const ModalFacture = ({ factureToEdit = null, clients, produits, onFermer, onSucces }) => {
  const { formatMontant } = useParametres();

  const [client, setClient]           = useState(null);
  const [lignes, setLignes]           = useState([]);
  const [avecDette, setAvecDette]       = useState(false); // false = facture simple par défaut
  const [avance, setAvance]             = useState('');
  const [avanceActive, setAvanceActive] = useState(false);
  const [moyenPaiement, setMoyen]       = useState('especes');
  const [remise, setRemise]             = useState('');
  const [remiseActive, setRemiseActive] = useState(false);
  const [remiseMotif, setRemiseMotif]   = useState('');
  const [envoi, setEnvoi]               = useState(false);
  const [confirmDoublon, setConfirmDoublon] = useState(null); // { message, payload }
  const [confirmRupture, setConfirmRupture] = useState(null); // { message, lignesInsuffisantes, payload }

  // Pré-remplir si modification
  useEffect(() => {
    if (!factureToEdit) return;
    const c = clients.find(x => x.id === factureToEdit.clientId) || null;
    setClient(c);
    // Anciennes factures (créées avant le choix d'unité) : quantite était toujours en
    // pièces — on le retrouve ici en absence de unite/quantitePs explicites.
    setLignes((factureToEdit.lignes || []).map(l => {
      const produit = produits.find(p => p.id === l.produitId && p._source === l.source) || null;
      const unite = l.unite || 'ps';
      return {
        ...l, _cle: l.produitId + (l.source || ''), _produit: produit,
        unite, uniteOptions: sousUnites(produit?.unitePrincipale || produit?.unite || unite),
        quantitePs: l.quantitePs ?? l.quantite,
      };
    }));
    // Case « Créer une dette » cochée seulement si la facture a réellement une dette ou une
    // avance — pas sur son ancien « reste » : les factures simples étaient enregistrées avec un
    // reste égal à leur total, et les modifier aurait créé une dette par erreur.
    setAvecDette(!!factureToEdit.detteId || factureToEdit.avance > 0);
    setAvance(factureToEdit.avance > 0 ? String(factureToEdit.avance) : '');
    setAvanceActive(factureToEdit.avance > 0);
    setMoyen(factureToEdit.moyenPaiement || 'especes');
    setRemise(factureToEdit.remise > 0 ? String(factureToEdit.remise) : '');
    setRemiseActive(factureToEdit.remise > 0);
    setRemiseMotif(factureToEdit.remiseMotif || '');
  }, [factureToEdit]); // eslint-disable-line

  // Sous-total des produits — la remise ne touche jamais aux lignes/au stock, elle ne
  // réduit que le total final facturé (et donc le bénéfice global, pas le prix du produit).
  const sousTotal    = lignes.reduce((s, l) => s + l.sousTotal, 0);
  const remiseNum    = Math.min(sousTotal, Math.max(0, parseFloat(remise) || 0));
  const montantTotal = Math.max(0, sousTotal - remiseNum);
  const avanceNum    = parseFloat(avance) || 0;
  const resteADoit   = Math.max(0, montantTotal - avanceNum);

  // quantite/prixUnitaire sont toujours exprimés dans l'unité choisie (l.unite) — c'est ce
  // qui s'affiche et s'imprime sur la facture. quantitePs (toujours en pièces) est calculé en
  // parallèle et c'est lui seul qu'utilise le serveur pour vérifier/retirer le stock réel.
  const ajouterProduit = (p) => {
    const cle = p.id + p._source;
    setLignes(prev => {
      const ex = prev.find(l => l._cle === cle);
      if (ex) {
        const q = ex.quantite + 1;
        return prev.map(l => l._cle === cle
          ? { ...l, quantite: q, quantitePs: q * psParUnite(l.unite, l._produit), sousTotal: q * l.prixUnitaire }
          : l);
      }
      // Par défaut en pièces — une vente est très majoritairement au détail (quelques
      // unités), pas par ballo/douzaine ; l'unité principale du produit ne sert qu'au
      // stock, pas au mode de vente habituel. Les autres unités restent choisissables.
      const uniteParDefaut = 'ps';
      const ratio = psParUnite(uniteParDefaut, p);
      const prixUnitaire = (p.prixVente || 0) * ratio;
      return [{
        _cle: cle, _produit: p, produitId: p.id, source: p._source,
        nom: p.nom, image: p.image || null,
        unite: uniteParDefaut, uniteOptions: sousUnites(p.unitePrincipale || p.unite || 'ps'),
        prixUnitaire, prixOriginal: prixUnitaire,
        quantite: 1, quantitePs: ratio, sousTotal: prixUnitaire,
      }, ...prev];
    });
  };

  const majQte = (cle, val) => {
    const q = val === '' ? '' : Math.max(1, parseInt(val) || 1);
    setLignes(prev => prev.map(l => l._cle === cle
      ? { ...l, quantite: q, quantitePs: q === '' ? 0 : q * psParUnite(l.unite, l._produit), sousTotal: (q === '' ? 0 : q * l.prixUnitaire) }
      : l));
  };

  const majPrix = (cle, val) => {
    const px = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setLignes(prev => prev.map(l => l._cle === cle ? { ...l, prixUnitaire: px, sousTotal: (px === '' ? 0 : l.quantite * px) } : l));
  };

  // Changer d'unité recalcule le prix par défaut (prix de vente de base × ratio de la
  // nouvelle unité) et la quantité en pièces — la quantité saisie, elle, reste telle quelle.
  const majUnite = (cle, nouvelleUnite) => {
    setLignes(prev => prev.map(l => {
      if (l._cle !== cle) return l;
      const ratio = psParUnite(nouvelleUnite, l._produit);
      const prixParPiece = l._produit?.prixVente || 0;
      const prixUnitaire = prixParPiece * ratio;
      const q = l.quantite === '' ? '' : l.quantite;
      return {
        ...l, unite: nouvelleUnite,
        prixUnitaire, prixOriginal: prixUnitaire,
        quantitePs: q === '' ? 0 : q * ratio,
        sousTotal: q === '' ? 0 : q * prixUnitaire,
      };
    }));
  };

  // Envoi effectif — séparé de soumettre() pour être réutilisable telle quelle quand on
  // confirme vouloir créer une facture malgré l'avertissement de doublon potentiel.
  const envoyerFacture = async (payload) => {
    const r = factureToEdit
      ? await facturesAPI.update(factureToEdit.id, payload)
      : await facturesAPI.create(payload);
    if (estMisEnAttente(r)) return; // pas encore enregistré côté serveur
    const data = r.data;
    toast.success(factureToEdit
      ? 'Facture modifiée'
      : `Facture ${data.numero} créée${data.detteId ? ' · dette générée' : ''}`);
    onSucces(data);
  };

  const soumettre = async () => {
    if (!client) { toast.error('Veuillez sélectionner un client'); return; }
    if (lignes.length === 0) { toast.error('Ajoutez au moins un produit'); return; }
    const payload = {
      clientId: client?.id || null,
      clientNom: client?.nom || '',
      clientPrenom: client?.prenom || '',
      clientTelephone: client?.telephone || '',
      lignes: lignes.map(({ _cle, _produit, uniteOptions, ...l }) => l),
      montantTotal,
      remise: remiseNum,
      remiseMotif: remiseNum > 0 ? remiseMotif : '',
      avance: avecDette ? avanceNum : 0,
      moyenPaiement: avecDette && avanceNum > 0 ? moyenPaiement : null,
      sansDette: !avecDette,
    };
    setEnvoi(true);
    try {
      await envoyerFacture(payload);
    } catch (err) {
      // La création (pas la modification) vérifie côté serveur qu'une facture identique n'a
      // pas déjà été enregistrée dans les 30 dernières secondes — on redemande confirmation
      // au lieu de bloquer, au cas où une seconde vente identique serait vraiment voulue.
      if (!factureToEdit && err.response?.status === 409 && err.response?.data?.doublonPotentiel) {
        setConfirmDoublon({ message: err.response.data.message, payload });
      } else if (err.response?.status === 409 && err.response?.data?.ruptureStock) {
        const lignesInsuffisantes = err.response.data.lignesInsuffisantes || [];
        const liste = lignesInsuffisantes
          .map(l => `${l.nom} (${l.stockDisponible} disponible${l.stockDisponible > 1 ? 's' : ''}, ${l.quantiteDemandee} demandé${l.quantiteDemandee > 1 ? 's' : ''})`)
          .join(', ');
        setConfirmRupture({
          message: `Stock insuffisant pour : ${liste}. Voulez-vous enregistrer la facture sans ces produits ?`,
          lignesInsuffisantes, payload,
        });
      } else {
        toast.error(err.response?.data?.message || 'Erreur');
      }
    } finally {
      setEnvoi(false);
    }
  };

  const confirmerMalgreDoublon = async () => {
    if (!confirmDoublon) return;
    setEnvoi(true);
    try {
      await envoyerFacture({ ...confirmDoublon.payload, confirmerDoublon: true });
      setConfirmDoublon(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setEnvoi(false);
    }
  };

  // Enregistre la facture en retirant les produits en rupture de stock signalés par le
  // serveur — le sous-total/total est recalculé sur les lignes restantes.
  const confirmerSansRupture = async () => {
    if (!confirmRupture) return;
    const exclues = new Set(confirmRupture.lignesInsuffisantes.map(l => `${l.produitId}__${l.source}`));
    const lignesRestantes = confirmRupture.payload.lignes.filter(l => !exclues.has(`${l.produitId}__${l.source}`));
    if (lignesRestantes.length === 0) {
      toast.error('Tous les produits de cette facture sont en rupture de stock.');
      setConfirmRupture(null);
      return;
    }
    const sousTotalRestant = lignesRestantes.reduce((s, l) => s + l.sousTotal, 0);
    const remiseAjustee = Math.min(sousTotalRestant, confirmRupture.payload.remise || 0);
    const nouveauPayload = {
      ...confirmRupture.payload,
      lignes: lignesRestantes,
      montantTotal: Math.max(0, sousTotalRestant - remiseAjustee),
      remise: remiseAjustee,
    };
    setEnvoi(true);
    try {
      await envoyerFacture(nouveauPayload);
      setLignes(prev => prev.filter(l => !exclues.has(l._cle)));
      setConfirmRupture(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
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
                          <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
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
                        {/* Unité — même produit vendable en pièce, douzaine, ballo... */}
                        <div className="col-3 col-sm-auto">
                          <label className="form-label small text-muted mb-1">Unité</label>
                          <select className="form-select form-select-sm" style={{ minWidth: 70 }}
                            value={l.unite} onChange={e => majUnite(l._cle, e.target.value)}>
                            {(l.uniteOptions || ['ps']).map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
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

                {/* Remise — optionnelle, réduit uniquement le total facturé (pas le prix des
                    produits ni le stock) ; le manque à gagner sort du bénéfice, pas de la vente */}
                {!remiseActive ? (
                  <button type="button" className="btn btn-sm w-100 mb-2"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', borderRadius: 8, border: '1.5px dashed #f59e0b' }}
                    onClick={() => setRemiseActive(true)}>
                    − Appliquer une remise
                  </button>
                ) : (
                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Sous-total</span>
                      <span className="small">{formatMontant(sousTotal)}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label small fw-semibold text-muted mb-0">Remise</label>
                      <button type="button" className="btn btn-sm p-0"
                        style={{ color: '#ef4444', fontSize: 'var(--txt-sm)', background: 'none', border: 'none' }}
                        onClick={() => { setRemiseActive(false); setRemise(''); setRemiseMotif(''); }}>
                        Retirer
                      </button>
                    </div>
                    <div className="input-group input-group-sm mb-2">
                      <input type="number" min="0" max={sousTotal} className="form-control" placeholder="0"
                        autoFocus value={remise} onChange={e => setRemise(e.target.value)} />
                      <span className="input-group-text">FCFA</span>
                    </div>
                    <input type="text" className="form-control form-control-sm" placeholder="Motif (optionnel)"
                      value={remiseMotif} onChange={e => setRemiseMotif(e.target.value)} />
                  </div>
                )}

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

                {/* Modification : décocher retire la dette déjà créée (si aucun paiement) */}
                {factureToEdit?.detteId && !avecDette && (
                  <div className="small mt-2 px-2 py-1 rounded" style={{ background: '#fef3c7', color: '#92400e' }}>
                    La dette liée à cette facture sera supprimée à l'enregistrement
                    (impossible si des paiements y ont déjà été enregistrés).
                  </div>
                )}

                {/* Section dette — visible uniquement si avecDette */}
                {avecDette && (
                  <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
                    {/* Avance optionnelle */}
                    {!avanceActive ? (
                      <button type="button" className="btn btn-sm w-100 mb-3"
                        style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a', borderRadius: 8, border: '1.5px dashed #16a34a' }}
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

    {confirmDoublon && (
      <ModalConfirmation
        message={confirmDoublon.message}
        onConfirmer={confirmerMalgreDoublon}
        chargement={envoi}
        onAnnuler={() => setConfirmDoublon(null)}
        labelConfirmer="Oui, créer quand même"
      />
    )}

    {confirmRupture && (
      <ModalConfirmation
        message={confirmRupture.message}
        onConfirmer={confirmerSansRupture}
        chargement={envoi}
        onAnnuler={() => setConfirmRupture(null)}
        labelConfirmer="Oui, enregistrer sans ces produits"
      />
    )}
    </>
  );
};

export default ModalFacture;
