// Écarts de l'inventaire et validation : résumé, liste des écarts, valeur des pertes (code de
// l'application), rapport PDF, puis correction du stock des produits comptés
import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFilePdf, faLock, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { inventairesAPI, produitsAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import { imprimerRapportInventaire } from '@/utils/pdfTemplates';
import {
  LIEUX, STATUTS, dansPerimetre, statutDe, comptageDe, progression, formatPs, formatEcart, lignesRapport,
} from '@/pages/inventaire/utils';

const ModalValidation = ({ session, produits, onFermer, onValide }) => {
  const { formatMontant, parametres, setParametres } = useParametres();
  const totaux = useMemo(() => progression(session, produits), [session, produits]);
  const enEcart = useMemo(() => produits
    .filter(p => dansPerimetre(session, p) && ['manquant', 'surplus'].includes(statutDe(session, p.id)))
    .map(p => ({ p, c: comptageDe(session, p.id), statut: statutDe(session, p.id) }))
    .sort((a, b) => (a.c.compte - a.c.theorique) - (b.c.compte - b.c.theorique)), [session, produits]);
  const restants = totaux.total - totaux.faits;

  const [code, setCode] = useState('');
  const [saisieCode, setSaisieCode] = useState(false);
  const [valeurs, setValeurs] = useState(null);
  const [chargeValeur, setChargeValeur] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
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
      setParametres({ dernierInventaire: { ...(parametres.dernierInventaire || {}), [session.lieu]: data.valideAt || new Date().toISOString() } });
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
                <div className="d-flex justify-content-between flex-wrap gap-2">
                  <span><span className="small text-muted d-block">Valeur des pertes</span><strong style={{ color: '#c2410c' }}>{formatMontant(valeurs.valeurPertes)}</strong></span>
                  <span className="text-end"><span className="small text-muted d-block">Valeur en trop</span><strong style={{ color: '#1d4ed8' }}>{formatMontant(valeurs.valeurSurplus)}</strong></span>
                </div>
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

            <div className="fw-semibold small text-muted">{enEcart.length} produit{enEcart.length > 1 ? 's' : ''} avec un écart</div>
            {enEcart.length === 0 ? (
              <div className="small text-muted">Aucun écart pour le moment : tout ce qui a été compté correspond au stock.</div>
            ) : (
              <div className="d-flex flex-column rounded-3 overflow-hidden" style={{ border: '1px solid var(--bs-border-color)' }}>
                {enEcart.map(({ p, c, statut }) => (
                  <div key={p.id} className="d-flex align-items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{p.nom}</div>
                      <div className="small text-muted text-truncate">Attendu {formatPs(p, c.theorique)} · compté {formatPs(p, c.compte)}</div>
                    </div>
                    <span className="badge" style={{ background: STATUTS[statut].clair, color: STATUTS[statut].fonce, fontSize: 13 }}>
                      {formatEcart(p, c.compte - c.theorique)}
                    </span>
                  </div>
                ))}
              </div>
            )}

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
              {enEcart.length > 0 ? `Valider et corriger ${enEcart.length} stock${enEcart.length > 1 ? 's' : ''}` : "Valider l'inventaire"}
            </button>
          </div>
        </div>
      </div>

      {confirmer && (
        <ModalConfirmation
          message={enEcart.length > 0
            ? `Corriger le stock de ${enEcart.length} produit${enEcart.length > 1 ? 's' : ''} et clôturer l'inventaire ? Chaque correction apparaîtra dans l'historique du produit.`
            : "Clôturer l'inventaire ? Aucun stock ne sera modifié."}
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
