// Bouton de filtre (pilule) des listes à exporter
import React from 'react';

const BoutonFiltre = ({ actif, onClick, label }) => (
  <button type="button" className="btn btn-sm"
    style={{
      borderRadius: 20, padding: '2px 12px', fontSize: 'var(--txt-sm)',
      background: actif ? '#00d4aa' : 'var(--bs-secondary-bg)',
      color: actif ? '#fff' : 'var(--bs-body-color)',
      border: actif ? 'none' : '1px solid var(--bs-border-color)',
    }}
    onClick={onClick}>
    {label}
  </button>
);

export default BoutonFiltre;
