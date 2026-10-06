// Badge du statut d'accès d'un compte
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { STATUTS_ACCES, joursRestants } from '@/pages/admin/utilisateurs/constants';

const BadgeAcces = ({ u }) => {
  const st = STATUTS_ACCES[u.statutAcces] || STATUTS_ACCES.null;
  const j = u.statutAcces === 'essai' ? joursRestants(u.dateLimiteAcces) : null;
  return (
    <span className="badge d-inline-flex align-items-center gap-1" style={{ background: st.bg, color: st.color, fontSize: 'var(--txt-xs)' }}>
      <FontAwesomeIcon icon={st.icon} />
      {st.label}{j !== null && (j > 0 ? ` · ${j} j` : ' · expiré')}
    </span>
  );
};

export default BadgeAcces;
