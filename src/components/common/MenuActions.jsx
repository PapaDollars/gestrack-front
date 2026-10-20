// Bouton « Actions » qui déplie ses boutons vers la droite, sur la même ligne (comme s'ils
// étaient affichés directement), et les replie au second clic. Les boutons sont rendus au
// même niveau que les autres boutons de la ligne : le conteneur parent (d-flex flex-wrap
// gap-2) les aligne exactement comme avant.
// Action : { libelle, icone, couleur, fond, onClick, visible?, disabled?, iconeSeule? }
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';

const MenuActions = ({ actions, libelle = 'Actions', disabled = false }) => {
  const [ouvert, setOuvert] = useState(false);
  const visibles = actions.filter(a => a.visible !== false);
  if (visibles.length === 0) return null;

  return (
    <>
      <button type="button" className="btn btn-sm d-flex align-items-center gap-1" aria-expanded={ouvert}
        style={{
          background: ouvert ? '#6366f1' : 'rgba(99,102,241,0.12)',
          color: ouvert ? '#fff' : '#6366f1', fontSize: 'var(--txt-base)',
        }}
        onClick={() => setOuvert(o => !o)}>
        {libelle} <FontAwesomeIcon icon={faEllipsisH} />
        <FontAwesomeIcon icon={ouvert ? faChevronLeft : faChevronRight} style={{ fontSize: 10 }} />
      </button>
      {ouvert && visibles.map(a => (
        <button key={a.libelle} type="button" className="btn btn-sm"
          title={a.iconeSeule ? a.libelle : undefined}
          disabled={disabled || a.disabled}
          style={{ background: a.fond, color: a.couleur, fontSize: 'var(--txt-base)' }}
          onClick={a.onClick}>
          {a.icone && <FontAwesomeIcon icon={a.icone} className={a.iconeSeule ? '' : 'me-1'} />}
          {!a.iconeSeule && a.libelle}
        </button>
      ))}
    </>
  );
};

export default MenuActions;
