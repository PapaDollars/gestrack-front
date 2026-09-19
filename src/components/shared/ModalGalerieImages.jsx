// Modal de sélection d'une image déjà importée dans la galerie (Paramètres → Images) —
// alternative à l'import par l'explorateur de fichiers, pour réutiliser une photo sur
// plusieurs produits sans la réimporter à chaque fois.
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faImages } from '@fortawesome/free-solid-svg-icons';
import { parametresAPI } from '@/services/api';

const ModalGalerieImages = ({ onChoisir, onFermer }) => {
  const [images, setImages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let annule = false;
    parametresAPI.getImages()
      .then(({ data }) => { if (!annule) setImages(data); })
      .catch(() => { if (!annule) setErreur(true); })
      .finally(() => { if (!annule) setChargement(false); });
    return () => { annule = true; };
  }, []);

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1075 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faImages} style={{ color: '#00d4aa' }} />
              Choisir depuis la galerie
            </h6>
            <button type="button" className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            {chargement ? (
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
                <p className="text-muted small mt-2 mb-0">Chargement des images...</p>
              </div>
            ) : erreur ? (
              <p className="text-muted text-center py-4 small">Erreur lors du chargement des images.</p>
            ) : images.length === 0 ? (
              <p className="text-muted text-center py-4 small">
                Aucune image dans la galerie pour l'instant — importez-en depuis Paramètres → Images.
              </p>
            ) : (
              <div className="row g-2" style={{ maxHeight: 560, overflowY: 'auto', overflowX: 'hidden' }}>
                {images.map(img => (
                  <div key={img.publicId} className="col-6 col-sm-4 col-lg-3">
                    <button type="button"
                      className="btn p-0 w-100 border-0"
                      style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => onChoisir({ url: img.url, publicId: img.publicId })}>
                      <img src={img.url} alt="" style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', display: 'block' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalGalerieImages;
