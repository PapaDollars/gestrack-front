// Question / réponse dépliable de la FAQ
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const FaqItem = ({ q, a }) => {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="border-bottom py-3">
      <button
        className="btn d-flex align-items-center justify-content-between w-100 p-0 text-start fw-semibold"
        style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}
        onClick={() => setOuvert(!ouvert)}>
        {q}
        <FontAwesomeIcon
          icon={ouvert ? faChevronUp : faChevronDown}
          style={{ color: '#00d4aa', fontSize: 'var(--txt-base)', flexShrink: 0, marginLeft: 8 }} />
      </button>
      {ouvert && (
        <p className="text-muted mt-2 mb-0" style={{ fontSize: 'var(--txt-md)', lineHeight: 1.6 }}>{a}</p>
      )}
    </div>
  );
};

export default FaqItem;
