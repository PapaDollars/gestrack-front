// Question / réponse dépliable de la FAQ
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const FaqItem = ({ q, a }) => {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div
      className="card border-0 mb-2"
      style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <button
        className="btn d-flex align-items-center justify-content-between w-100 p-3 text-start fw-semibold"
        style={{ color: 'var(--bs-body-color)', fontSize: 15 }}
        onClick={() => setOuvert(!ouvert)}>
        {q}
        <FontAwesomeIcon icon={ouvert ? faChevronUp : faChevronDown} style={{ color: '#00d4aa', fontSize: 13, flexShrink: 0 }} />
      </button>
      {ouvert && (
        <div className="px-3 pb-3 text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
          {a}
        </div>
      )}
    </div>
  );
};

export default FaqItem;
