// Filtre à saisie libre avec autocomplétion — remplace un <select> classique. La recherche est
// un bonus : la liste complète (avec scroll) reste toujours accessible tant qu'on n'a rien tapé,
// y compris après avoir déjà sélectionné une valeur (la sélection précédente ne doit jamais
// masquer le reste de la liste quand on rouvre le champ).
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

// styleOption(option) / iconeOption(option) (facultatifs) : style et icône propres à une option
// saisieLibre : on peut aussi taper une valeur absente de la liste (ex. un nouveau prénom) — la
// valeur suit la saisie, la liste propose celles qui correspondent
// icone / ariaLabel / maxLength (facultatifs) : icône du champ (loupe par défaut), libellé, longueur
// onSupprimerOption(option) (facultatif) : bouton × sur chaque ligne de la liste pour retirer l'option
const AutocompleteFiltre = ({
  options, value, onChange, placeholder = 'Rechercher...', styleOption, iconeOption,
  saisieLibre = false, icone = faSearch, ariaLabel, maxLength, onSupprimerOption,
}) => {
  const [texte, setTexte] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOuvert(false); setTexte(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Tant qu'on n'a rien tapé (à l'ouverture ou après une sélection précédente), on liste
  // tout — la recherche ne fait que réduire cette liste complète, elle ne la remplace jamais.
  // Saisie libre : on filtre sur la valeur tapée, sauf si elle correspond déjà exactement à une
  // option (le champ rouvert propose alors toute la liste)
  const recherche = saisieLibre
    ? (options.some(o => o.toLowerCase() === (value || '').trim().toLowerCase()) ? '' : (value || ''))
    : texte;
  const filtres = recherche.trim()
    ? options.filter(o => o.toLowerCase().includes(recherche.trim().toLowerCase()))
    : options;

  const ouvrir = () => { setTexte(''); setOuvert(true); };

  const choisir = (o) => { onChange(o); setTexte(''); setOuvert(false); };

  const effacer = () => { onChange(''); setTexte(''); setOuvert(false); };

  return (
    <div ref={ref} className="position-relative">
      <div className="input-group">
        <span className="input-group-text bg-body-secondary border-end-0">
          <FontAwesomeIcon icon={icone} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
        </span>
        <input type="text" className="form-control border-start-0"
          placeholder={ouvert && !saisieLibre ? 'Rechercher...' : placeholder}
          aria-label={ariaLabel} maxLength={maxLength}
          value={saisieLibre ? (value || '') : (ouvert ? texte : (value || ''))}
          onChange={e => {
            if (saisieLibre) onChange(e.target.value); else setTexte(e.target.value);
            setOuvert(true);
          }}
          onFocus={ouvrir} />
        {value && (
          <button type="button" className="btn btn-light border" onClick={effacer}>
            <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
          </button>
        )}
      </div>
      {ouvert && filtres.length > 0 && (
        <div className="position-absolute w-100 shadow-lg rounded-2 z-3"
          style={{ top: '100%', left: 0, marginTop: 2, maxHeight: 240, overflowY: 'auto', background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)' }}>
          {filtres.map(o => (
            <div key={o} className="px-3 py-2 d-flex align-items-center gap-2"
              style={{
                cursor: 'pointer', fontSize: 'var(--txt-md)', borderBottom: '1px solid var(--bs-border-color)',
                background: o === value ? 'rgba(0,212,170,0.12)' : 'transparent',
                color: o === value ? '#00a881' : 'var(--bs-body-color)',
                fontWeight: o === value ? 600 : 400,
                ...styleOption?.(o),
              }}
              onMouseDown={() => choisir(o)}>
              {iconeOption?.(o) && <FontAwesomeIcon icon={iconeOption(o)} />}
              <span className="flex-grow-1 text-truncate">{o}</span>
              {onSupprimerOption && (
                <button type="button" className="btn btn-sm p-0 px-2 flex-shrink-0" aria-label={`Retirer ${o} de la liste`}
                  title="Retirer de la liste" style={{ color: '#dc2626', lineHeight: 1.6 }}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onSupprimerOption(o); }}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {ouvert && !saisieLibre && texte.trim() && filtres.length === 0 && (
        <div className="position-absolute w-100 shadow-lg rounded-2 z-3 px-3 py-2 text-muted small fst-italic"
          style={{ top: '100%', left: 0, marginTop: 2, background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)' }}>
          Aucun résultat
        </div>
      )}
    </div>
  );
};

export default AutocompleteFiltre;
