// Aperçu rapide des infos d'un fournisseur (téléphone, WhatsApp, types de produits, notes)
// avec actions Modifier/Supprimer — utilisé depuis la liste des fournisseurs et depuis la
// page détail d'un fournisseur, pour ne jamais dupliquer ces infos à deux endroits.
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPhone, faEdit, faTrash, faNoteSticky } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp as faWhatsappBrand } from '@fortawesome/free-brands-svg-icons';

const ModalApercuFournisseur = ({ fournisseur, onFermer, onModifier, onSupprimer }) => {
  if (!fournisseur) return null;
  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1060 }}
      onClick={onFermer}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 380 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-content border-0 shadow" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', color: '#00a881', fontWeight: 700, fontSize: 'var(--txt-xl)' }}>
                {fournisseur.nom?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h6 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>{fournisseur.nom}</h6>
                {fournisseur.ville && <div className="text-muted small">{fournisseur.ville}</div>}
              </div>
            </div>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 py-3">
            {fournisseur.telephone && (
              <div className="d-flex align-items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faPhone} style={{ color: '#00d4aa', width: 16 }} />
                <a href={`tel:${fournisseur.telephone}`} className="text-decoration-none"
                  style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-md)' }}>
                  {fournisseur.telephone}
                </a>
              </div>
            )}
            {fournisseur.telephoneWhatsapp && (
              <div className="d-flex align-items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faWhatsappBrand} style={{ color: '#25d366', width: 16 }} />
                <a href={`https://wa.me/${fournisseur.telephoneWhatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer" className="text-decoration-none"
                  style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-md)' }}>
                  {fournisseur.telephoneWhatsapp} <span className="small text-muted">(WhatsApp)</span>
                </a>
              </div>
            )}
            {fournisseur.typesProduits?.length > 0 && (
              <div className="mt-3">
                <div className="small fw-semibold text-muted mb-2">Types de produits</div>
                <div className="d-flex flex-wrap gap-1">
                  {fournisseur.typesProduits.map(t => (
                    <span key={t} className="badge"
                      style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881', fontSize: 'var(--txt-xs)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {fournisseur.autresInfos && (
              <div className="mt-3">
                <div className="small fw-semibold text-muted mb-2 d-flex align-items-center gap-2">
                  <FontAwesomeIcon icon={faNoteSticky} style={{ color: '#6366f1' }} /> Autres informations
                </div>
                <div className="small" style={{ color: 'var(--bs-body-color)', whiteSpace: 'pre-wrap' }}>
                  {fournisseur.autresInfos}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-sm d-flex align-items-center gap-1" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: 8 }}
              onClick={onModifier}>
              <FontAwesomeIcon icon={faEdit} /> Modifier
            </button>
            <button className="btn btn-sm d-flex align-items-center gap-1" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 8 }}
              onClick={onSupprimer}>
              <FontAwesomeIcon icon={faTrash} /> Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalApercuFournisseur;
