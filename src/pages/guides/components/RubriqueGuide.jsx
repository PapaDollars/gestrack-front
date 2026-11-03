// Une rubrique du guide (une page de l'application), dépliable : à quoi ça sert, comment faire,
// bon à savoir. ouvert : imposé (ex. pendant une recherche), sinon géré par la rubrique.
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faLightbulb } from '@fortawesome/free-solid-svg-icons';

const RubriqueGuide = ({ rubrique, ouvert: ouvertImpose }) => {
  const [ouvertLocal, setOuvertLocal] = useState(false);
  const ouvert = ouvertImpose ?? ouvertLocal;
  const { icon, color, titre, a_quoi_ca_sert, etapes, astuces } = rubrique;

  return (
    <div className="border rounded-3 mb-2" style={{ borderColor: 'var(--bs-border-color)' }}>
      <button type="button" onClick={() => setOuvertLocal(!ouvert)}
        className="btn d-flex align-items-center gap-3 w-100 p-3 text-start">
        <span className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
          style={{ width: 38, height: 38, background: `${color}18` }}>
          <FontAwesomeIcon icon={icon} style={{ color, fontSize: 16 }} />
        </span>
        <span className="flex-grow-1 min-w-0">
          <span className="d-block fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{titre}</span>
          <span className="d-block text-muted small">{a_quoi_ca_sert}</span>
        </span>
        <FontAwesomeIcon icon={ouvert ? faChevronUp : faChevronDown} className="flex-shrink-0" style={{ color: '#00d4aa' }} />
      </button>

      {ouvert && (
        <div className="px-3 pb-3" style={{ fontSize: 'var(--txt-md)', lineHeight: 1.6 }}>
          <div className="fw-semibold small text-uppercase text-muted mb-2" style={{ letterSpacing: 0.5 }}>Comment faire</div>
          <ol className="ps-3 mb-3" style={{ color: 'var(--bs-body-color)' }}>
            {etapes.map(e => <li key={e} className="mb-1">{e}</li>)}
          </ol>
          {astuces?.length > 0 && (
            <div className="rounded-3 p-3" style={{ background: 'rgba(0,212,170,0.08)' }}>
              <div className="fw-semibold small mb-1 d-flex align-items-center gap-2" style={{ color: '#00a881' }}>
                <FontAwesomeIcon icon={faLightbulb} /> Bon à savoir
              </div>
              <ul className="ps-3 mb-0 text-muted">
                {astuces.map(a => <li key={a} className="mb-1">{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RubriqueGuide;
