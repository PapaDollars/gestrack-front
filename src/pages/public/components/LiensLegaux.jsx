// Liens vers les pages légales de la plateforme — pied des pages publiques (accueil,
// catalogues, boutiques protégées) et des pages légales elles-mêmes.
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, EMAIL_CONTACT, mailto } from '@/utils/url/frontend';

const LIENS = [
  { to: ROUTES.tarifs,          label: 'Tarifs' },
  { to: ROUTES.conditions,      label: 'Conditions d\'utilisation' },
  { to: ROUTES.confidentialite, label: 'Confidentialité' },
  { to: ROUTES.mentionsLegales, label: 'Mentions légales' },
];

const LiensLegaux = ({ clair = false, avecContact = true }) => {
  const couleur = clair ? 'rgba(255,255,255,0.65)' : '#64748b';
  return (
    <div className="d-flex flex-wrap justify-content-center column-gap-3 row-gap-1" style={{ fontSize: 12 }}>
      {LIENS.map(l => (
        <Link key={l.to} to={l.to} className="text-decoration-none" style={{ color: couleur }}>{l.label}</Link>
      ))}
      {avecContact && (
        <a href={mailto(EMAIL_CONTACT)} className="text-decoration-none" style={{ color: couleur }}>Contact</a>
      )}
    </div>
  );
};

export default LiensLegaux;
