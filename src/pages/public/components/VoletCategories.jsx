// Volet qui monte du bas : toutes les catégories en tuiles, avec leur nombre de produits
import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// categories : [{ nom, nombre, style?, icone? }] — style/icone pour Soldes et Vente Flash
const VoletCategories = ({ ouvert, categories, actif, onChoisir, onFermer }) => {
  // Bouton « retour » du téléphone pas géré : la croix, le fond et le choix ferment le volet
  useEffect(() => {
    if (!ouvert) return undefined;
    const surTouche = (e) => { if (e.key === 'Escape') onFermer(); };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [ouvert, onFermer]);

  return (
    <>
      <div onClick={onFermer}
        style={{
          position: 'fixed', inset: 0, zIndex: 1055, background: 'rgba(15,23,42,0.45)',
          opacity: ouvert ? 1 : 0, visibility: ouvert ? 'visible' : 'hidden', transition: 'opacity .2s',
        }} />
      <div role="dialog" aria-label="Catégories" aria-hidden={!ouvert}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1056,
          maxWidth: 600, margin: '0 auto', maxHeight: '75vh',
          background: '#fff', borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          transform: ouvert ? 'none' : 'translateY(105%)', transition: 'transform .25s ease',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="d-flex justify-content-center pt-2">
          <span style={{ width: 40, height: 4, borderRadius: 4, background: '#cbd5e1' }} />
        </div>
        <div className="d-flex align-items-center justify-content-between px-3 pt-2 pb-2">
          <h6 className="fw-bold mb-0" style={{ color: '#1e293b' }}>Catégories</h6>
          <button type="button" className="btn btn-light btn-sm rounded-circle" aria-label="Fermer" onClick={onFermer}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="px-3 pb-3" style={{ overflowY: 'auto' }}>
          <div className="row g-2">
            {categories.map(c => {
              const choisie = c.nom === actif;
              return (
                <div key={c.nom} className="col-6">
                  <button type="button" onClick={() => onChoisir(c.nom)}
                    className="btn w-100 d-flex align-items-center justify-content-between gap-2 text-start px-3 py-3"
                    style={{
                      borderRadius: 12,
                      background: choisie ? '#00a881' : (c.style?.background || '#f1f5f9'),
                      color: choisie ? '#fff' : (c.style?.color || '#1e293b'),
                      border: 'none', fontWeight: 600, fontSize: 14,
                    }}>
                    <span className="text-truncate">
                      {c.icone && <FontAwesomeIcon icon={c.icone} className="me-1" />}
                      {c.nom}
                    </span>
                    <span className="flex-shrink-0" style={{ fontSize: 12, opacity: 0.75 }}>{c.nombre}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default VoletCategories;
