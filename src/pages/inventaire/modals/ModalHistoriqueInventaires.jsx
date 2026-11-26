// Inventaires passés d'un lieu : date, résumé et rapport PDF de chacun
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faFilePdf, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { inventairesAPI } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { imprimerRapportInventaire } from '@/utils/pdfTemplates';
import { LIEUX, dateHeure, lignesRapport, progression } from '@/pages/inventaire/utils';

const ModalHistoriqueInventaires = ({ lieu, depot = null, produits, onFermer }) => {
  const { formatMontant } = useParametres();
  const [liste, setListe] = useState(null);
  const [pdfEnCours, setPdfEnCours] = useState(null);

  useEffect(() => {
    inventairesAPI.liste(lieu, depot)
      .then(({ data }) => setListe(data.filter(i => i.statut === 'valide')))
      .catch(() => { toast.error("Impossible de charger l'historique"); setListe([]); });
  }, [lieu, depot]);

  const pdf = async (inv) => {
    setPdfEnCours(inv.id);
    try {
      const { data: session } = await inventairesAPI.get(inv.id);
      const r = session.resume || {};
      imprimerRapportInventaire(
        { nom: session.nom, lieu: LIEUX[lieu].libelle, statut: session.statut, createdAt: session.createdAt, valideAt: session.valideAt },
        lignesRapport(session, produits),
        { ...progression(session, produits), conformes: r.conformes ?? 0, manquants: r.manquants ?? 0, surplus: r.enTrop ?? 0 },
        r.valeursMasquees ? null : { valeurPertes: r.valeurPertes, valeurSurplus: r.valeurSurplus },
      );
    } catch {
      toast.error('Impossible de préparer le rapport');
    } finally { setPdfEnCours(null); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faClockRotateLeft} className="me-2" style={{ color: '#00d4aa' }} />
              Inventaires passés — {LIEUX[lieu].libelle}
            </h5>
            <button type="button" className="btn btn-light btn-sm rounded-circle ms-auto" aria-label="Fermer" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 pb-4 d-flex flex-column gap-2">
            {liste === null && <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} /></div>}
            {liste?.length === 0 && <div className="text-center text-muted py-4">Aucun inventaire validé pour le moment.</div>}
            {liste?.map(inv => {
              const r = inv.resume || {};
              return (
                <div key={inv.id} className="rounded-3 p-3 d-flex flex-column gap-2" style={{ background: 'var(--bs-secondary-bg)' }}>
                  <div className="d-flex align-items-start gap-2">
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{inv.nom}</div>
                      <div className="small text-muted">Validé le {dateHeure(inv.valideAt)}</div>
                    </div>
                    <button type="button" className="btn btn-sm btn-light flex-shrink-0" disabled={pdfEnCours === inv.id} onClick={() => pdf(inv)}>
                      {pdfEnCours === inv.id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faFilePdf} className="me-1" />PDF</>}
                    </button>
                  </div>
                  <div className="d-flex flex-wrap gap-2 small">
                    <span className="badge" style={{ background: '#dcfce7', color: '#15803d' }}>{r.conformes ?? 0} conformes</span>
                    <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>{r.manquants ?? 0} manquants</span>
                    <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{r.enTrop ?? 0} en trop</span>
                    <span className="badge" style={{ background: 'var(--bs-body-bg)', color: 'var(--bs-body-color)' }}>{r.ajustes ?? 0} stock(s) corrigé(s)</span>
                    {!r.valeursMasquees && r.valeurPertes > 0 && (
                      <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>Pertes : {formatMontant(r.valeurPertes)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalHistoriqueInventaires;
