// Recadrage du logo de l'entreprise avant envoi : choix de la forme (rond ou carré), puis
// déplacement + zoom dans un cadre de cette forme. L'image produite remplit exactement le
// cercle (ou le carré) où le logo est affiché : écran de chargement et pages vitrine.
// Sortie en PNG 400×400 : pour le rond, les coins hors du cercle restent transparents.
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheck, faSearchPlus, faCircle, faSquare } from '@fortawesome/free-solid-svg-icons';
import { ARRONDI_CARRE, rayonLogo } from '@/utils/marque';

const CADRE = 260;   // taille du cadre à l'écran (px)
const SORTIE = 400;  // taille de l'image envoyée (px)
const ZOOM_MAX = 4;

const FORMES = [
  { val: 'cercle', label: 'Rond',  icon: faCircle },
  { val: 'carre',  label: 'Carré', icon: faSquare },
];

const ModalRecadrageLogo = ({ fichier, formeInitiale = 'cercle', onValider, onAnnuler }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const [natTaille, setNatTaille] = useState(null); // { w, h }
  const [erreurChargement, setErreurChargement] = useState(false);
  const [forme, setForme] = useState(formeInitiale);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // coin haut-gauche de l'image dans le cadre
  const dragRef = useRef(null);

  // Création et révocation de l'URL dans le même effet (double montage de React.StrictMode)
  useEffect(() => {
    const url = URL.createObjectURL(fichier);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fichier]);

  // Zoom 1 = le logo entier tient dans le cadre (rien n'est coupé) ; au-delà, on agrandit
  const baseScale = natTaille ? Math.min(CADRE / natTaille.w, CADRE / natTaille.h) : 1;
  const scale = baseScale * zoom;

  // Image plus grande que le cadre : elle ne peut pas laisser de vide sur ce côté ;
  // plus petite : elle reste dans le cadre
  const contraindre = (x, y, s) => {
    if (!natTaille) return { x: 0, y: 0 };
    const borne = (v, taille) => (taille >= CADRE
      ? Math.min(0, Math.max(CADRE - taille, v))
      : Math.max(0, Math.min(CADRE - taille, v)));
    return { x: borne(x, natTaille.w * s), y: borne(y, natTaille.h * s) };
  };

  const onImgLoad = (e) => {
    const w = e.target.naturalWidth, h = e.target.naturalHeight;
    setNatTaille({ w, h });
    const s = Math.min(CADRE / w, CADRE / h);
    setPos({ x: (CADRE - w * s) / 2, y: (CADRE - h * s) / 2 });
  };

  const onZoomChange = (nouveauZoom) => {
    if (!natTaille) return;
    const nouvelleScale = baseScale * nouveauZoom;
    const c = CADRE / 2; // zoom depuis le centre du cadre
    const r = nouvelleScale / scale;
    setZoom(nouveauZoom);
    setPos(contraindre(c - (c - pos.x) * r, c - (c - pos.y) * r, nouvelleScale));
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
    canvas.width = SORTIE;
    canvas.height = SORTIE;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      // Découpe à la forme choisie, fond blanc derrière un logo transparent
      ctx.beginPath();
      if (forme === 'cercle') ctx.arc(SORTIE / 2, SORTIE / 2, SORTIE / 2, 0, Math.PI * 2);
      else if (ctx.roundRect) ctx.roundRect(0, 0, SORTIE, SORTIE, SORTIE * ARRONDI_CARRE);
      else ctx.rect(0, 0, SORTIE, SORTIE); // anciens navigateurs : coins arrondis par l'affichage
      ctx.clip();
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, SORTIE, SORTIE);
      const k = SORTIE / CADRE;
      ctx.drawImage(img, pos.x * k, pos.y * k, natTaille.w * scale * k, natTaille.h * scale * k);
      canvas.toBlob((blob) => {
        if (!blob) return;
        onValider(new File([blob], 'logo.png', { type: 'image/png' }), forme);
      }, 'image/png');
    };
    img.src = imgUrl;
  };

  const rayon = rayonLogo(forme);

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: CADRE + 48 }}>
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>Recadrer le logo</h6>
            <button type="button" className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onAnnuler}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            {/* Forme du logo */}
            <div className="d-flex gap-2 mb-3">
              {FORMES.map(f => (
                <button key={f.val} type="button" onClick={() => setForme(f.val)}
                  className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-2"
                  style={{
                    borderRadius: 10,
                    border: `2px solid ${forme === f.val ? '#00d4aa' : 'var(--bs-border-color)'}`,
                    background: forme === f.val ? 'rgba(0,212,170,0.1)' : 'transparent',
                    color: forme === f.val ? '#00a881' : 'var(--bs-secondary-color)',
                    fontWeight: forme === f.val ? 600 : 400,
                  }}>
                  <FontAwesomeIcon icon={f.icon} /> {f.label}
                </button>
              ))}
            </div>

            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{
                width: CADRE, height: CADRE, margin: '0 auto', overflow: 'hidden', position: 'relative',
                borderRadius: 12, background: '#fff', cursor: 'grab', touchAction: 'none',
              }}
            >
              {erreurChargement ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center px-3 text-muted"
                  style={{ fontSize: 13 }}>
                  Impossible de charger cette image.<br />Réessayez avec un autre fichier.
                </div>
              ) : imgUrl && (
                <img src={imgUrl} alt="À recadrer" draggable="false"
                  onLoad={onImgLoad} onError={() => setErreurChargement(true)}
                  style={{
                    position: 'absolute', left: pos.x, top: pos.y,
                    width: natTaille ? natTaille.w * scale : 'auto',
                    height: natTaille ? natTaille.h * scale : 'auto',
                    maxWidth: 'none', userSelect: 'none',
                  }} />
              )}
              {/* Partie gardée : la forme choisie ; le reste est assombri */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: rayon, pointerEvents: 'none',
                boxShadow: '0 0 0 400px rgba(15,32,39,0.6)', outline: '2px solid #00d4aa',
              }} />
            </div>

            <div className="d-flex align-items-center gap-2 mt-3">
              <FontAwesomeIcon icon={faSearchPlus} className="text-muted" style={{ fontSize: 13 }} />
              <input type="range" className="form-range" min="1" max={ZOOM_MAX} step="0.01"
                value={zoom} onChange={(e) => onZoomChange(parseFloat(e.target.value))} />
            </div>
            <small className="text-muted d-block text-center mt-1">Déplacez et zoomez pour placer le logo dans la forme</small>
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

export default ModalRecadrageLogo;
