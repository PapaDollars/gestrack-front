// Paramètres › Images : images produits importées
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faLock, faImages, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { parametresAPI } from '@/services/api';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import { toast } from 'react-toastify';

// ── Section galerie d'images produits ─────────────────────────────────────────
// Ne liste que les images importées après l'ajout de cette galerie (étiquetées avec le
// compte à l'import) — les images déjà présentes en boutique/magasin fonctionnent toujours
// normalement, elles n'apparaissent simplement pas encore ici tant qu'elles ne sont pas
// remplacées par un nouvel import.
const SectionImages = () => {
  const [images, setImages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [aSupprimer, setASupprimer] = useState(null);
  const [enSuppression, setEnSuppression] = useState(false);
  const [enImport, setEnImport] = useState(false);
  const fileRef = useRef(null);

  // L'appel passe par l'API Cloudinary (réseau externe) — un blip DNS transitoire ne doit
  // pas afficher d'erreur immédiatement, on retente une fois avant de prévenir l'utilisateur.
  // `annule` évite aussi un double appel (StrictMode en dev) de se marcher dessus.
  useEffect(() => {
    let annule = false;
    const charger = (tentative = 0) => {
      parametresAPI.getImages()
        .then(({ data }) => {
          if (annule) return;
          setImages(data);
          setChargement(false);
        })
        .catch(() => {
          if (annule) return;
          if (tentative === 0) { setTimeout(() => charger(1), 800); return; }
          toast.error('Erreur lors du chargement des images');
          setChargement(false);
        });
    };
    setChargement(true);
    charger();
    return () => { annule = true; };
  }, []);

  const confirmerSuppression = async () => {
    setEnSuppression(true);
    try {
      await parametresAPI.supprimerImage(aSupprimer.publicId);
      toast.success('Image supprimée');
      setImages(imgs => imgs.filter(i => i.publicId !== aSupprimer.publicId));
      setASupprimer(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setEnSuppression(false);
    }
  };

  const formatTaille = (o) => o < 1024 * 1024 ? `${Math.round(o / 1024)} Ko` : `${(o / (1024 * 1024)).toFixed(1)} Mo`;

  const importerImages = async (e) => {
    const fichiers = Array.from(e.target.files || []);
    e.target.value = ''; // permet de resélectionner les mêmes fichiers ensuite
    if (fichiers.length === 0) return;
    setEnImport(true);
    try {
      const { data } = await parametresAPI.uploaderImages(fichiers);
      setImages(imgs => [
        ...data.map(img => ({ ...img, enUtilisation: false, creeLe: new Date().toISOString() })),
        ...imgs,
      ]);
      toast.success(`${data.length} image(s) importée(s)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'import des images');
    } finally {
      setEnImport(false);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-12">
        {/* Bouton d'import — hors de la carte, aligné à droite au-dessus */}
        <div className="d-flex justify-content-end mb-3">
          <button type="button" className="btn text-white d-flex align-items-center gap-2"
            style={{ background: '#00d4aa', borderRadius: 10 }}
            disabled={enImport}
            onClick={() => fileRef.current?.click()}>
            {enImport ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faUpload} />}
            Importer des images
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="d-none" onChange={importerImages} />
        </div>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faImages} style={{ color: '#00d4aa' }} />
              Images produits importées
            </h6>
            <p className="text-muted small mb-4">
              Les images encore utilisées sur une carte produit (boutique, magasin ou commande fournisseur)
              sont protégées — seules celles qui ne servent plus peuvent être supprimées, directement sur Cloudinary.
              Les images importées ici sont disponibles pour un produit sans être recadrées automatiquement — choisissez-les
              directement dans la galerie au moment de créer ou modifier un produit.
            </p>

            {chargement ? (
              <div className="text-center py-5">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
                <p className="text-muted small mt-2 mb-0">Chargement des images...</p>
              </div>
            ) : images.length === 0 ? (
              <p className="text-muted text-center py-4 small">Aucune image importée pour l'instant.</p>
            ) : (
              <div className="row g-3" style={{ maxHeight: 620, overflowY: 'auto', overflowX: 'hidden' }}>
                {images.map(img => (
                  <div key={img.publicId} className="col-6 col-sm-4 col-lg-3 col-xl-2">
                    <div className="position-relative" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--bs-border-color)' }}>
                      <img src={img.url} alt="" style={{ width: '100%', aspectRatio: '3 / 2', objectFit: 'cover', display: 'block' }} />
                      {img.enUtilisation ? (
                        <span className="badge position-absolute top-0 end-0 m-1"
                          style={{ background: 'rgba(22,163,74,0.9)', color: '#fff', fontSize: 10 }}
                          title="Encore utilisée par un produit ou une commande">
                          <FontAwesomeIcon icon={faLock} className="me-1" style={{ fontSize: 9 }} />
                          Utilisée
                        </span>
                      ) : (
                        <button
                          className="btn btn-sm position-absolute top-0 end-0 m-1 d-flex align-items-center justify-content-center"
                          style={{ width: 26, height: 26, padding: 0, background: 'rgba(239,68,68,0.9)', color: '#fff', borderRadius: '50%', border: 'none' }}
                          title="Supprimer cette image (Cloudinary)"
                          onClick={() => setASupprimer(img)}>
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />
                        </button>
                      )}
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: 11 }}>{formatTaille(img.tailleOctets)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {aSupprimer && (
        <ModalConfirmation
          message="Supprimer définitivement cette image de Cloudinary ? Elle n'est actuellement utilisée par aucun produit ni commande — cette action est irréversible."
          onConfirmer={confirmerSuppression}
          chargement={enSuppression}
          onAnnuler={() => setASupprimer(null)}
        />
      )}
    </div>
  );
};

export default SectionImages;
