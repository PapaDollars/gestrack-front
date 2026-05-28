import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const el = e.target;
      if (el === document || el === document.body || el === document.documentElement) return;
      if (el.scrollTop > 300) {
        scrollerRef.current = el;
        setVisible(true);
      } else if (scrollerRef.current === el) {
        setVisible(false);
      }
    };

    document.addEventListener('scroll', handler, true);
    return () => document.removeEventListener('scroll', handler, true);
  }, []);

  const scrollToTop = () => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Retour en haut"
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 1050,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: 'none',
        background: '#00d4aa',
        color: '#fff',
        boxShadow: '0 4px 16px rgba(0,212,170,0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <FontAwesomeIcon icon={faChevronUp} style={{ fontSize: 16 }} />
    </button>
  );
};

export default BackToTop;
