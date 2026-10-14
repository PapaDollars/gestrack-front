// Contenu d'un ballo : en douzaines (« 1 ballo = 10 dz ») ou directement en pièces (« 1 ballo =
// 200 ps ») — certains ballos ne contiennent pas un nombre rond de douzaines.
// Se place à DROITE du champ du nombre, dans un input-group : « 1 ballo = [ 200 ] [dz | ps] ».
import React from 'react';

export const libelleBallo = (enPs, valeur) => {
  const n = parseInt(valeur);
  if (!n) return enPs
    ? 'Nombre de pièces dans un ballo (ex. 200 ps)'
    : 'Nombre de douzaines dans un ballo — choisissez « ps » si le ballo se compte en pièces (ex. 200 ps)';
  if (enPs) {
    const dz = Math.floor(n / 12);
    const ps = n % 12;
    return `1 ballo = ${n} ps${dz ? ` (${dz} dz${ps ? ` ${ps} ps` : ''})` : ''}`;
  }
  return `1 ballo = ${n} dz = ${n * 12} ps`;
};

// Préfixe du champ
export const PrefixeBallo = () => (
  <span className="input-group-text bg-body-secondary small text-nowrap">1 ballo =</span>
);

// Boutons d'unité « dz » / « ps » (celui choisi est en vert)
const ChoixContenuBallo = ({ enPs, onChange }) => (
  <>
    {[{ val: false, label: 'dz', titre: 'Le ballo se compte en douzaines' },
      { val: true,  label: 'ps', titre: 'Le ballo se compte en pièces (ex. 200 ps)' }].map(o => (
      <button key={o.label} type="button" title={o.titre} aria-pressed={enPs === o.val}
        className="btn fw-semibold"
        style={{
          minWidth: 44,
          background: enPs === o.val ? '#00d4aa' : 'var(--bs-secondary-bg)',
          color: enPs === o.val ? '#fff' : 'var(--bs-secondary-color)',
          border: '1px solid var(--bs-border-color)',
        }}
        onClick={() => enPs !== o.val && onChange(o.val)}>
        {o.label}
      </button>
    ))}
  </>
);

export default ChoixContenuBallo;
