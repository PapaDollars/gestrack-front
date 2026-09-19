// Modal de recadrage d'image avant import — pan + zoom sur un cadre de ratio fixe,
// pour que l'utilisateur choisisse lui-même la partie de la photo gardée par les cartes
// produit (qui utilisent object-fit: cover et coupent sinon la photo au hasard).
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck, faSearchPlus } from '@fortawesome/free-solid-svg-icons';

const STAGE_W = 280;
const RATIO = 3 / 2;
const STAGE_H = Math.round(STAGE_W / RATIO);
const SORTIE_W = 800;
const SORTIE_H = Math.round(SORTIE_W / RATIO);

const ModalRecadrageImage = ({ fichier, onValider, onAnnuler }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const [natTaille, setNatTaille] = useState(null); // { w, h }
  const [erreurChargement, setErreurChargement] = useState(false);
  const [zoom, setZoom] = useState(1); // multiplicateur au-dessus de l'échelle "cover"
  const [pos, setPos] = useState({ x: 0, y: 0 }); // position du coin haut-gauche de l'image, en px, dans le repère du cadre
  const dragRef = useRef(null); // { startX, startY, origX, origY }

  // Création ET révocation de l'URL dans le même effet (plutôt qu'à l'initialisation du
  // useState, révoquée par un effet séparé) — sinon le double montage/démontage simulé par
  // React.StrictMode en développement révoque l'URL avant même qu'elle ait pu s'afficher.
  useEffect(() => {
    const url = URL.createObjectURL(fichier);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fichier]);

  const baseScale = natTaille ? Math.max(STAGE_W / natTaille.w, STAGE_H / natTaille.h) : 1;
  const scale = baseScale * zoom;

  const contraindre = (x, y, s) => {
    if (!natTaille) return { x: 0, y: 0 };
    const dw = natTaille.w * s;
    const dh = natTaille.h * s;
    return {
      x: Math.min(0, Math.max(STAGE_W - dw, x)),
      y: Math.min(0, Math.max(STAGE_H - dh, y)),
    };
  };

  const onImgLoad = (e) => {
    const w = e.target.naturalWidth, h = e.target.naturalHeight;
    setNatTaille({ w, h });
    const s = Math.max(STAGE_W / w, STAGE_H / h);
    setPos({ x: (STAGE_W - w * s) / 2, y: (STAGE_H - h * s) / 2 });
  };

  const onZoomChange = (nouveauZoom) => {
    if (!natTaille) return;
    const nouvelleScale = baseScale * nouveauZoom;
    // Zoome depuis le centre du cadre plutôt que depuis le coin haut-gauche
    const cx = STAGE_W / 2, cy = STAGE_H / 2;
    const ratioScale = nouvelleScale / scale;
    const nx = cx - (cx - pos.x) * ratioScale;
    const ny = cy - (cy - pos.y) * ratioScale;
    setZoom(nouveauZoom);
    setPos(contraindre(nx, ny, nouvelleScale));
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const { startX, startY, origX, origY } = dragRef.current;
    setPos(contraindre(origX + (e.clientX - startX), origY + (e.clientY - startY), scale));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const valider = () => {
    if (!natTaille) return;
    const canvas = document.createElement('canvas');
    canvas.width = SORTIE_W;
    canvas.height = SORTIE_H;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const cropX = -pos.x / scale;
      const cropY = -pos.y / scale;
      const cropW = STAGE_W / scale;
      const cropH = STAGE_H / scale;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, SORTIE_W, SORTIE_H);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const fichierRecadre = new File([blob], fichier.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
        onValider(fichierRecadre, URL.createObjectURL(blob));
      }, 'image/jpeg', 0.9);
    };
    img.src = imgUrl;
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: STAGE_W + 48 }}>
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>Cadrer la photo</h6>
            <button type="button" className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onAnnuler}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{
                width: STAGE_W, height: STAGE_H, margin: '0 auto',
                overflow: 'hidden', borderRadius: 12, position: 'relative',
                background: '#111', cursor: dragRef.current ? 'grabbing' : 'grab', touchAction: 'none',
              }}
            >
              {erreurChargement ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center px-3"
                  style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  Impossible de charger cette image.<br />Réessayez avec un autre fichier.
                </div>
              ) : imgUrl && (
                <img
                  src={imgUrl}
                  alt="À cadrer"
                  draggable="false"
                  onLoad={onImgLoad}
                  onError={() => setErreurChargement(true)}
                  style={{
                    position: 'absolute', left: pos.x, top: pos.y,
                    width: natTaille ? natTaille.w * scale : 'auto',
                    height: natTaille ? natTaille.h * scale : 'auto',
                    maxWidth: 'none', userSelect: 'none',
                  }}
                />
              )}
            </div>
            <div className="d-flex align-items-center gap-2 mt-3">
              <FontAwesomeIcon icon={faSearchPlus} className="text-muted" style={{ fontSize: 13 }} />
              <input type="range" className="form-range" min="1" max="3" step="0.01"
                value={zoom} onChange={(e) => onZoomChange(parseFloat(e.target.value))} />
            </div>
            <small className="text-muted d-block text-center mt-1">Déplacez et zoomez pour cadrer le produit</small>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button type="button" className="btn btn-light" onClick={onAnnuler}>Annuler</button>
            <button type="button" className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa' }}
              disabled={erreurChargement || !natTaille} onClick={valider}>
              <FontAwesomeIcon icon={faCheck} /> Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRecadrageImage;
