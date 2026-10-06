// Champ de recherche / sélection du client d'une facture
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

// ── Autocomplete client ───────────────────────────────────────────────────────
const RechercheClient = ({ clients, onSelect }) => {
  const [texte, setTexte] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  const filtres = useMemo(() => {
    if (!texte.trim()) return [];
    const t = texte.toLowerCase();
    return clients.filter(c =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(t) ||
      c.surnom?.toLowerCase().includes(t) ||
      c.telephone?.includes(t)
    ).slice(0, 8);
  }, [texte, clients]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOuvert(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="position-relative">
      <div className="input-group">
        <span className="input-group-text bg-body-secondary border-end-0">
          <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-md)' }} />
        </span>
        <input type="text" className="form-control border-start-0"
          placeholder="Nom, prénom, téléphone, surnom..."
          value={texte}
          autoFocus
          onChange={e => { setTexte(e.target.value); setOuvert(true); }}
          onFocus={() => setOuvert(true)} />
      </div>
      {ouvert && filtres.length > 0 && (
        <div className="position-absolute w-100 shadow-lg rounded-3 overflow-hidden z-3"
          style={{ top: '100%', left: 0, background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)', maxHeight: 260, overflowY: 'auto' }}>
          {filtres.map(c => (
            <div key={c.id} className="d-flex align-items-center gap-3 px-3 py-2"
              style={{ cursor: 'pointer', borderBottom: '1px solid var(--bs-border-color)', fontSize: 'var(--txt-md)' }}
              onMouseDown={() => { onSelect(c); setTexte(`${c.prenom} ${c.nom}`); setOuvert(false); }}>
              {c.photo
                ? <img src={c.photo} alt="" className="rounded-circle flex-shrink-0" style={{ width: 34, height: 34, objectFit: 'cover' }} />
                : <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold text-white"
                    style={{ width: 34, height: 34, background: '#00d4aa', fontSize: 'var(--txt-md)' }}>
                    {c.prenom?.[0]}{c.nom?.[0]}
                  </div>}
              <div>
                <div className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{c.prenom} {c.nom}</div>
                <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>{c.profession} · {c.telephone}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RechercheClient;
