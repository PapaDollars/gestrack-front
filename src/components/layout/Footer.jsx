import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import pkg from '../../../package.json';
const VERSION = pkg.version;


const Footer = () => (
  <footer className="mt-auto pt-3 pb-2"
    style={{ borderTop: '1px solid var(--bs-border-color)', marginTop: '2rem' }}>
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2"
      style={{ fontSize: 'var(--txt-xs)', color: 'var(--bs-secondary-color)' }}>

      {/* Gauche : branding */}
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>GesTrack</span>
        <span className="" style={{ color: '#00d4aa', fontSize: 12 }}>
          suivi et controle
        </span>
        <span>·</span>
        <span>© 2026 Tous droits réservés</span>
      </div>

      {/* Droite : liens + sécurité */}
      <div className="d-flex align-items-center gap-3">
        <span className="d-flex align-items-center gap-1">
          <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#00d4aa', fontSize: 10 }} />
          Données sécurisées
        </span>
        <Link to="/guide" className="text-decoration-none" style={{ color: 'var(--bs-secondary-color)' }}>
          Aide
        </Link>
        <a href="mailto:gestrack.gt@gmail.com" className="text-decoration-none" style={{ color: 'var(--bs-secondary-color)' }}>
          Contact
        </a>
        <span className="d-flex align-items-center gap-1">
          Fait avec <FontAwesomeIcon icon={faHeart} style={{ color: '#ef4444', fontSize: 10 }} />
        </span>
      </div>

    </div>
  </footer>
);

export default Footer;
