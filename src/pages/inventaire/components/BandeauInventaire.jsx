// Bandeau « Inventaire en cours » des pages Boutique et Magasin : progression et accès au comptage
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { ROUTES } from '@/utils/url/frontend';
import { progression } from '@/pages/inventaire/utils';

// depot : dépôt du Magasin (null = Dépôt principal)
const BandeauInventaire = ({ session, produits, lieu, depot = null }) => {
  const t = useMemo(() => progression(session, produits), [session, produits]);
  return (
    <Link to={ROUTES.inventaire(lieu, depot)} className="d-flex flex-column gap-2 rounded-4 p-3 mb-3 text-decoration-none flex-shrink-0"
      style={{ background: '#0f2027', color: '#fff' }}>
      <span className="d-flex align-items-center gap-3">
        <span className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{ width: 38, height: 38, background: 'rgba(0,212,170,0.18)', color: '#00d4aa' }}>
          <FontAwesomeIcon icon={faClipboardCheck} />
        </span>
        <span className="d-flex flex-column flex-grow-1 min-w-0">
          <strong>Inventaire en cours</strong>
          <span className="small text-truncate" style={{ color: '#cbd5e1' }}>
            {t.faits} / {t.total} comptés · {t.ecarts} écart{t.ecarts > 1 ? 's' : ''}
          </span>
        </span>
        <span className="fw-semibold rounded-3 px-3 py-2 flex-shrink-0" style={{ background: '#00d4aa', color: '#0f2027', fontSize: 14 }}>Continuer</span>
      </span>
      <span style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', display: 'block' }}>
        <span style={{ width: `${t.pourcentage}%`, height: '100%', borderRadius: 6, background: '#00d4aa', display: 'block' }} />
      </span>
    </Link>
  );
};

export default BandeauInventaire;
