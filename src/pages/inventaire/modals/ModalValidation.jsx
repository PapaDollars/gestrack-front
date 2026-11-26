// Écarts de l'inventaire et validation : résumé, liste des écarts, valeur des pertes (code de
// l'application), rapport PDF, puis correction du stock des produits comptés
import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFilePdf, faLock, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { inventairesAPI, produitsAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import AutocompleteFiltre from '@/components/common/AutocompleteFiltre';
import { imprimerRapportInventaire } from '@/utils/pdfTemplates';
import {
  LIEUX, STATUTS, dansPerimetre, statutDe, comptageDe, progression, formatPs, formatEcart, lignesRapport,
} from '@/pages/inventaire/utils';

// onRecompter(produitId) : fermer et rouvrir ce produit pour le compter à nouveau
// onCorrige(produitId, comptage) : un produit vient d'être corrigé seul (« Corriger maintenant »)
const ModalValidation = ({ session, produits, onFermer, onValide, onRecompter, onCorrige }) => {
  const { formatMontant, parametres, setParametres } = useParametres();
  const totaux = useMemo(() => progression(session, produits), [session, produits]);
  const enEcart = useMemo(() => produits
    .filter(p => dansPerimetre(session, p) && ['manquant', 'surplus'].includes(statutDe(session, p.id)))
    .map(p => ({ p, c: comptageDe(session, p.id), statut: statutDe(session, p.id) }))
    .sort((a, b) => (a.c.compte - a.c.theorique) - (b.c.compte - b.c.theorique)), [session, produits]);
  const restants = totaux.total - totaux.faits;
  // Filtre par catégorie : la liste des écarts et la valeur des pertes de cette catégorie
  const [categorie, setCategorie] = useState('');
  const categories = useMemo(() => [...new Set(enEcart.map(e => e.p.categorie || 'Sans catégorie'))]
    .sort((a, b) => a.localeCompare(b, 'fr')), [enEcart]);
  const ecartsAffiches = categorie ? enEcart.filter(e => (e.p.categorie || 'Sans catégorie') === categorie) : enEcart;

  const [code, setCode] = useState('');
  const [saisieCode, setSaisieCode] = useState(false);
  const [valeurs, setValeurs] = useState(null);
  // Valeurs (prix d'achat) de toutes les catégories ou d'une seule
  const valeursDe = (cat) => (!valeurs ? null : cat
    ? (valeurs.parCategorie?.[cat] || { valeurPertes: 0, valeurSurplus: 0 })
    : valeurs);
  const valeursAffichees = valeursDe(categorie);
  const [chargeValeur, setChargeValeur] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  // « Corriger maintenant » : produit à corriger seul (confirmation), puis envoi en cours
  const [aCorriger, setACorriger] = useState(null);
  const [correction, setCorrection] = useState(false);
  const restantsACorriger = enEcart.filter(e => !e.c.applique).length;
  const corrigerUn = async () => {
    setCorrection(true);
    try {
      const { data } = await inventairesAPI.corriger(session.id, aCorriger.id);
      toast.success(`« ${aCorriger.nom} » validé : stock corrigé`);
      onCorrige?.(aCorriger.id, data.comptage);
      setACorriger(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la correction');
    } finally { setCorrection(false); }
  };
  const [envoi, setEnvoi] = useState(false);

  const voirValeur = async (e) => {
    e.preventDefault();
    setChargeValeur(true);
    try {
      await produitsAPI.verifierMdp(code);
      const { data } = await inventairesAPI.valeur(session.id);
      setValeurs(data);
      setSaisieCode(false);
    } catch (err) {
      toast.error(err.response?.status === 403 ? 'Code incorrect' : (err.response?.data?.message || 'Erreur'));
    } finally { setChargeValeur(false); }
  };

  const rapport = () => imprimerRapportInventaire(
    { nom: session.nom, lieu: LIEUX[session.lieu].libelle, statut: session.statut, createdAt: session.createdAt, valideAt: session.valideAt },
    lignesRapport(session, produits), totaux, valeurs,
  );

  const valider = async () => {
    setEnvoi(true);
    try {
      const { data } = await inventairesAPI.valider(session.id);
      toast.success(`Inventaire validé : ${data.resume?.ajustes || 0} stock(s) corrigé(s)`);
      // Date du dernier inventaire : l'alerte du tableau de bord disparaît tout de suite
      setParametres({ dernierInventaire: { ...(parametres.dernierInventaire || {}), [session.lieu === 'magasin' && session.depotId ? `depot_${session.depotId}` : session.lieu]: data.valideAt || new Date().toISOString() } });
      onValide(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la validation");
      setEnvoi(false);
      setConfirmer(false);
    }
  };

  const carte = (libelle, valeur, couleur) => (
    <div className="rounded-3 p-2 px-3" style={{ background: 'var(--bs-secondary-bg)' }}>
      <div className="small text-muted">{libelle}</div>
      <div className="fw-bold" style={{ fontSize: 20, color: couleur }}>{valeur}</div>
    </div>
  );

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Écarts de l'inventaire</h5>
              <div className="small text-muted">{LIEUX[session.lieu].libelle} · {totaux.faits} / {totaux.total} comptés</div>
            </div>
            <button type="button" className="btn btn-light btn-sm rounded-circle ms-auto align-self-start" aria-label="Fermer" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-body px-4 d-flex flex-column gap-3">
            <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {carte('Conformes', totaux.conformes, '#15803d')}
              {carte('Manquants', totaux.manquants, '#c2410c')}
              {carte('En trop', totaux.surplus, '#1d4ed8')}
            </div>

            {/* Valeur des pertes : code de l'application (prix d'achat) */}
            <div className="rounded-3 p-3 d-flex flex-column gap-2" style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.25)' }}>
              {valeurs ? (
                <>
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <span><span className="small text-muted d-block">Valeur des pertes{categorie ? ` · ${categorie}` : ''}</span><strong style={{ color: '#c2410c' }}>{formatMontant(valeursAffichees.valeurPertes)}</strong></span>
                    <span className="text-end"><span className="small text-muted d-block">Valeur en trop</span><strong style={{ color: '#1d4ed8' }}>{formatMontant(valeursAffichees.valeurSurplus)}</strong></span>
                  </div>
                  {/* Pertes par catégorie (toutes catégories affichées) */}
                  {!categorie && Object.keys(valeurs.parCategorie || {}).length > 1 && (
                    <div className="d-flex flex-column gap-1 small pt-1" style={{ borderTop: '1px solid rgba(234,88,12,0.25)' }}>
                      {Object.entries(valeurs.parCategorie)
                        .sort((a, b) => b[1].valeurPertes - a[1].valeurPertes)
                        .map(([cat, v]) => (
                          <button type="button" key={cat} className="btn btn-sm p-0 d-flex justify-content-between text-start"
                            style={{ color: 'var(--bs-body-color)' }} onClick={() => setCategorie(cat)} title="Voir les écarts de cette catégorie">
                            <span className="text-truncate">{cat}</span>
                            <span className="fw-semibold" style={{ color: '#c2410c' }}>{formatMontant(v.valeurPertes)}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              ) : saisieCode ? (
                <form className="d-flex gap-2" onSubmit={voirValeur}>
                  <input type="password" className="form-control" placeholder="Code de l'application" autoFocus required
                    autoComplete="one-time-code" name="code-application" value={code} onChange={(e) => setCode(e.target.value)} />
                  <button type="submit" className="btn text-white" style={{ background: '#ea580c' }} disabled={chargeValeur}>
                    {chargeValeur ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Voir'}
                  </button>
                </form>
              ) : (
                <button type="button" className="btn btn-sm align-self-start" style={{ background: '#fff', color: '#c2410c' }} onClick={() => setSaisieCode(true)}>
                  <FontAwesomeIcon icon={faLock} className="me-1" /> Voir la valeur des pertes (prix d'achat)
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="fw-semibold small text-muted flex-grow-1">
                {ecartsAffiches.length} produit{ecartsAffiches.length > 1 ? 's' : ''} avec un écart
              </div>
              {categories.length > 1 && (
                <div style={{ width: 230, maxWidth: '100%' }}>
                  <AutocompleteFiltre options={categories} value={categorie} onChange={setCategorie} placeholder="Catégories" />
                </div>
              )}
            </div>
            {enEcart.length === 0 ? (
              <div className="small text-muted">Aucun écart pour le moment : tout ce qui a été compté correspond au stock.</div>
            ) : (
              <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: '1px solid var(--bs-border-color)' }}>
                {ecartsAffiches.map(({ p, c, statut }) => (
                  <div key={p.id} className="d-flex align-items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                      <div className="small text-muted text-truncate">
                        Attendu {formatPs(p, c.theorique)} · compté {formatPs(p, c.compte)}{c.par ? <> · par <strong>{c.par}</strong></> : ''}
                      </div>
                    </div>
                    <span className="badge" style={{ background: STATUTS[statut].clair, color: STATUTS[statut].fonce, fontSize: 13 }}>
                      {formatEcart(p, c.compte - c.theorique)}
                    </span>
                    {c.applique ? (
                      <span className="badge flex-shrink-0" style={{ background: '#dcfce7', color: '#15803d', fontSize: 12 }}>Validé ✓</span>
                    ) : (
                      <div className="d-flex gap-1 flex-shrink-0 flex-wrap justify-content-end">
                        {onRecompter && (
                          <button type="button" className="btn btn-sm btn-light" onClick={() => onRecompter(p.id)}
                            title="Rouvrir ce produit et le compter à nouveau">
                            Recompter
                          </button>
                        )}
                        <button type="button" className="btn btn-sm text-white" style={{ background: '#00a881' }}
                          onClick={() => setACorriger(p)} title="Valider ce seul produit : son stock est corrigé tout de suite, l'inventaire reste ouvert">
                          Valider
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="small text-muted">
              Un comptage faux ? Touchez <strong>Recompter</strong> : le nouveau comptage remplace l'ancien.
              {' '}<strong>Valider</strong> sur une ligne corrige le stock de ce seul produit tout de suite : l'inventaire reste ouvert pour les autres.
            </div>

            {restants > 0 && (
              <div className="small rounded-3 p-2 px-3" style={{ background: 'var(--bs-secondary-bg)' }}>
                <strong>{restants} produit{restants > 1 ? 's' : ''} pas encore compté{restants > 1 ? 's' : ''}</strong> : leur stock ne sera pas modifié.
              </div>
            )}
          </div>

          <div className="modal-footer border-0 px-4 pb-4 d-flex flex-column align-items-stretch gap-2">
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-light flex-grow-1" onClick={rapport}>
                <FontAwesomeIcon icon={faFilePdf} className="me-1" /> Rapport PDF
              </button>
              <button type="button" className="btn btn-light flex-grow-1" onClick={onFermer}>Continuer à compter</button>
            </div>
            <button type="button" className="btn text-white fw-semibold" style={{ background: '#00a881', minHeight: 50 }}
              disabled={totaux.faits === 0} onClick={() => setConfirmer(true)}>
              <FontAwesomeIcon icon={faCheck} className="me-2" />
              {restantsACorriger > 0 ? `Valider et corriger ${restantsACorriger} stock${restantsACorriger > 1 ? 's' : ''}` : "Valider et clôturer l'inventaire"}
            </button>
          </div>
        </div>
      </div>

      {aCorriger && (
        <ModalConfirmation
          message={`Valider « ${aCorriger.nom} » ? Son stock est corrigé tout de suite. L'inventaire reste ouvert pour les autres produits, et la correction apparaîtra dans l'historique du produit.`}
          labelConfirmer="Valider"
          chargement={correction}
          onConfirmer={corrigerUn}
          onAnnuler={() => setACorriger(null)}
        />
      )}
      {confirmer && (
        <ModalConfirmation
          message={restantsACorriger > 0
            ? `Corriger le stock de ${restantsACorriger} produit${restantsACorriger > 1 ? 's' : ''} et clôturer l'inventaire ? Chaque correction apparaîtra dans l'historique du produit.`
            : "Clôturer l'inventaire ? Aucun autre stock ne sera modifié."}
          labelConfirmer="Valider"
          chargement={envoi}
          onConfirmer={valider}
          onAnnuler={() => setConfirmer(false)}
        />
      )}
    </div>
  );
};

export default ModalValidation;
