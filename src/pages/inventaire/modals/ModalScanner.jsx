// Scanner l'étiquette QR d'un produit avec la caméra du téléphone pendant l'inventaire.
// Lecteur intégré du navigateur (BarcodeDetector, Chrome Android) ; sinon la bibliothèque jsQR,
// chargée seulement à ce moment-là (iPhone, autres navigateurs).
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faTimes, faTags } from '@fortawesome/free-solid-svg-icons';
import { lireQR } from '@/pages/inventaire/utils';

// onImprimerEtiquettes : imprimer la planche d'étiquettes (pour qui n'en a pas encore)
const ModalScanner = ({ onTrouve, onFermer, onImprimerEtiquettes }) => {
  const videoRef = useRef(null);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('Visez l’étiquette QR du produit');

  useEffect(() => {
    let flux = null;
    let arrete = false;
    let minuteur = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const demarrer = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErreur('La caméra n’est pas disponible sur cet appareil. Utilisez un téléphone pour scanner.');
        return;
      }
      try {
        flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      } catch {
        setErreur('Caméra introuvable ou refusée. Sur un téléphone, autorisez l’accès à la caméra pour ce site, puis réessayez.');
        return;
      }
      if (arrete) { flux.getTracks().forEach(t => t.stop()); return; }
      const video = videoRef.current;
      video.srcObject = flux;
      await video.play().catch(() => {});

      let lire;
      if ('BarcodeDetector' in window) {
        const detecteur = new window.BarcodeDetector({ formats: ['qr_code'] });
        lire = async () => (await detecteur.detect(video))[0]?.rawValue || null;
      } else {
        const { default: jsQR } = await import('jsqr');
        lire = async () => {
          const w = video.videoWidth; const h = video.videoHeight;
          if (!w || !h) return null;
          canvas.width = w; canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);
          return jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data || null;
        };
      }

      const boucle = async () => {
        if (arrete) return;
        try {
          const texte = await lire();
          if (texte) {
            const code = lireQR(texte);
            if (code) { onTrouve(code); return; }
            setMessage('Ce code n’est pas une étiquette GesTrack');
          }
        } catch { /* image pas encore prête */ }
        minuteur = setTimeout(boucle, 250);
      };
      boucle();
    };
    demarrer();

    return () => {
      arrete = true;
      clearTimeout(minuteur);
      if (flux) flux.getTracks().forEach(t => t.stop());
    };
  }, [onTrouve]);

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: '#0f2027', color: '#fff' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0"><FontAwesomeIcon icon={faQrcode} className="me-2" style={{ color: '#00d4aa' }} />Scanner un produit</h5>
            <button type="button" className="btn btn-sm rounded-circle ms-auto" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
              aria-label="Fermer" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4 pb-4 d-flex flex-column gap-3 align-items-center">
            {erreur ? (
              <div className="text-center py-5" style={{ color: '#fecaca' }}>{erreur}</div>
            ) : (
              <>
                <div className="position-relative w-100" style={{ maxWidth: 420, aspectRatio: '1 / 1', borderRadius: 16, overflow: 'hidden', background: '#000' }}>
                  <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* Cadre de visée */}
                  <div className="position-absolute" style={{ inset: '18%', border: '3px solid #00d4aa', borderRadius: 18, boxShadow: '0 0 0 2000px rgba(0,0,0,0.35)' }} />
                </div>
                <div className="small text-center" style={{ color: '#cbd5e1' }} role="status">{message}</div>
              </>
            )}
            {/* Où trouver les étiquettes */}
            <div className="w-100 rounded-3 p-3 small d-flex flex-column gap-2" style={{ background: 'rgba(255,255,255,0.07)', color: '#cbd5e1', maxWidth: 420 }}>
              <span>
                <strong style={{ color: '#fff' }}>Pas encore d'étiquettes ?</strong> Imprimez la planche, découpez chaque
                étiquette et collez-la sur le rayon ou le carton du produit. Ensuite, visez-la ici pour ouvrir le produit.
              </span>
              {onImprimerEtiquettes && (
                <button type="button" className="btn btn-sm align-self-start fw-semibold d-flex align-items-center gap-2"
                  style={{ background: '#00d4aa', color: '#0f2027', borderRadius: 10 }} onClick={onImprimerEtiquettes}>
                  <FontAwesomeIcon icon={faTags} /> Imprimer les étiquettes QR
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalScanner;
