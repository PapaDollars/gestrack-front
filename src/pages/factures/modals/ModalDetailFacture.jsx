// Modal : détail d'une facture
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUser, faPrint, faEdit, faPercent, faTimes, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { imprimerFacture } from '@/utils/pdfTemplates';
import { fmtDH } from '@/utils/pdf';
import { resteAPayer, styleConditions } from '@/utils/factures';
import { useParametres } from '@/context/ParametresContext';

// ── Modal détails facture ─────────────────────────────────────────────────────
const ModalDetailFacture = ({ facture, onFermer, onModifier, onSupprimer, onAppliquerRemise, formatMontant }) => {
  const labelMoyen = facture.moyenPaiement === 'om' ? 'Orange Money'
                   : facture.moyenPaiement === 'mtn' ? 'MTN Money' : 'Espèces';
  const [choixImpression, setChoixImpression] = useState(false);
  const [choixRemise, setChoixRemise] = useState(false);
  const [choixPhotos, setChoixPhotos] = useState(false);
  // Conditions de vente affichées en bas de la facture (vide = rien)
  const { parametres } = useParametres();
  const conditionsVente = parametres.conditionsVente || '';
  const conditionsStyle = parametres.conditionsVenteStyle;

  const declencherImpression = () => {
    setChoixRemise(false);
    setChoixPhotos(false);
    setChoixImpression(true);
  };

  const confirmerImpression = () => {
    setChoixImpression(false);
    imprimerFacture(facture, choixRemise, choixPhotos, conditionsVente, conditionsStyle);
  };

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
                        {l.quantite}{l.unite && l.unite !== 'ps' ? ` ${l.unite}` : ''} × {formatMontant(l.prixUnitaire)}
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
              {facture.remise > 0 && (
                <>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-muted">Sous-total produits</span>
                    <span>{formatMontant((facture.lignes || []).reduce((s, l) => s + (l.sousTotal || 0), 0))}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 small">
                    <span className="text-muted">Remise{facture.remiseMotif ? ` (${facture.remiseMotif})` : ''}</span>
                    <span className="fw-semibold" style={{ color: '#ef4444' }}>− {formatMontant(facture.remise)}</span>
                  </div>
                </>
              )}
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
                  {resteAPayer(facture) > 0 ? 'Reste à payer' : 'Entièrement réglé'}
                </span>
                <span className="fw-bold" style={{ color: resteAPayer(facture) > 0 ? '#dc2626' : '#16a34a' }}>
                  {formatMontant(resteAPayer(facture))}
                </span>
              </div>
              {facture.detteId && (
                <div className="mt-2 small p-2 rounded-2" style={{ background: '#fef3c7', color: '#92400e' }}>
                  ⚠ Dette de {formatMontant(facture.resteADoit)} associée à ce client
                </div>
              )}
            </div>

            {/* Conditions de vente (Paramètres › Factures) — rien si le texte est vide */}
            {conditionsVente.trim() && (
              <div className="mt-3 text-center px-3 py-2 rounded-3"
                style={{ border: '1px dashed #9ca3af', fontSize: 'var(--txt-sm)', color: 'var(--bs-body-color)', whiteSpace: 'pre-line', ...styleConditions(conditionsStyle) }}>
                {conditionsVente.trim()}
              </div>
            )}
          </div>
          <div className="modal-footer border-0 px-4 pb-4 gap-2 flex-wrap">
            <button className="btn btn-light" onClick={onFermer}>Fermer</button>
            <button className="btn d-flex align-items-center gap-2"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 10 }}
              onClick={() => { onFermer(); onModifier(facture); }}>
              <FontAwesomeIcon icon={faEdit} /> Modifier
            </button>
            <button className="btn d-flex align-items-center gap-2"
              style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: 10 }}
              onClick={() => { onFermer(); onAppliquerRemise(facture); }}>
              <FontAwesomeIcon icon={faPercent} /> {facture.remise > 0 ? 'Modifier la remise' : 'Remise'}
            </button>
            <button className="btn d-flex align-items-center gap-2"
              style={{ background: '#e8f5f3', color: '#00a881', borderRadius: 10 }}
              onClick={declencherImpression}>
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

      {/* Options d'affichage avant impression — remise (si applicable) et photos produits */}
      {choixImpression && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
              <div className="modal-body p-4">
                <p className="fw-semibold text-center mb-3" style={{ color: 'var(--bs-body-color)' }}>
                  Options d'impression
                </p>
                {facture.remise > 0 && (
                  <div className="mb-3">
                    <div className="small text-muted mb-1">
                      Afficher la remise ({formatMontant(facture.remise)}) ?
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn flex-grow-1"
                        style={{ background: !choixRemise ? '#00d4aa' : 'var(--bs-secondary-bg)',
                                 color: !choixRemise ? '#fff' : 'var(--bs-body-color)', borderRadius: 8 }}
                        onClick={() => setChoixRemise(false)}>
                        Non
                      </button>
                      <button type="button" className="btn flex-grow-1"
                        style={{ background: choixRemise ? '#00d4aa' : 'var(--bs-secondary-bg)',
                                 color: choixRemise ? '#fff' : 'var(--bs-body-color)', borderRadius: 8 }}
                        onClick={() => setChoixRemise(true)}>
                        Oui
                      </button>
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <div className="small text-muted mb-1">
                    Afficher les photos des produits (à côté du nom) ?
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn flex-grow-1"
                      style={{ background: !choixPhotos ? '#00d4aa' : 'var(--bs-secondary-bg)',
                               color: !choixPhotos ? '#fff' : 'var(--bs-body-color)', borderRadius: 8 }}
                      onClick={() => setChoixPhotos(false)}>
                      Non
                    </button>
                    <button type="button" className="btn flex-grow-1"
                      style={{ background: choixPhotos ? '#00d4aa' : 'var(--bs-secondary-bg)',
                               color: choixPhotos ? '#fff' : 'var(--bs-body-color)', borderRadius: 8 }}
                      onClick={() => setChoixPhotos(true)}>
                      Oui
                    </button>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-light flex-grow-1" onClick={() => setChoixImpression(false)}>
                    Annuler
                  </button>
                  <button className="btn text-white flex-grow-1" style={{ background: '#00d4aa' }}
                    onClick={confirmerImpression}>
                    Imprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalDetailFacture;
