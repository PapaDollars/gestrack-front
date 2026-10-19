// Mise en page commune des pages légales (conditions d'utilisation, confidentialité,
// mentions légales) : lisible sur téléphone, titres de sections, liens entre les pages.
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/utils/url/frontend';
import useTitrePage from '@/hooks/useTitrePage';
import LiensLegaux from '@/pages/public/components/LiensLegaux';
import { DERNIERE_MAJ_LEGALE } from '@/pages/public/constants';

export const Section = ({ titre, children }) => (
  <section>
    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f2027', marginTop: 28 }}>{titre}</h2>
    {children}
  </section>
);

const PageLegale = ({ titre, intro, children }) => {
  useTitrePage(`${titre} — GesTrack Business`);
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 24px', fontFamily: 'sans-serif', lineHeight: 1.7, color: '#334155', fontSize: 15 }}>
        <Link to={ROUTES.accueil} className="text-decoration-none small" style={{ color: '#00a881' }}>← GesTrack Business</Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f2027', margin: '12px 0 4px' }}>{titre}</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Dernière mise à jour : {DERNIERE_MAJ_LEGALE}</p>
        {intro && <p>{intro}</p>}
        {children}
        <hr style={{ margin: '36px 0 16px' }} />
        <LiensLegaux />
      </div>
    </div>
  );
};

export default PageLegale;
