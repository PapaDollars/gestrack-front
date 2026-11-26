// Saisie du comptage d'un produit, dans ses unités (ballo / dz / ps…), avec l'écart en direct
import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faBan, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { psParUnite, sousUnites } from '@/services/unites';
import { stockEnPs, formatPs, formatEcart } from '@/pages/inventaire/utils';
import useIsMobile from '@/hooks/useIsMobile';

const LIBELLES_UNITES = { ballo: 'Ballo', dz: 'Douzaines', ps: 'Pièces', paq: 'Paquets', crt: 'Cartons', sac: 'Sacs' };

// Répartit un nombre de pièces dans les unités proposées (de la plus grande à la plus petite)
const decomposer = (produit, unites, ps) => {
  let reste = ps;
  return unites.map((u) => {
    const ratio = psParUnite(u, produit);
    const n = Math.floor(reste / ratio);
    reste -= n * ratio;
    return n;
  });
};

const SaisieComptage = ({ produit, comptage, enCours, onEnregistrer, onIgnorer, onRetirer }) => {
  const isMobile = useIsMobile();
  const unites = useMemo(() => sousUnites(produit.unitePrincipale || produit.unite), [produit]);
  const [valeurs, setValeurs] = useState(() => (comptage?.statut === 'compte'
    ? decomposer(produit, unites, comptage.compte).map(String)
    : unites.map(() => '')));

  const saisi = valeurs.some(v => v !== '');
  const totalPs = valeurs.reduce((s, v, i) => s + (parseInt(v, 10) || 0) * psParUnite(unites[i], produit), 0);
  const attendu = stockEnPs(produit);
  const ecart = totalPs - attendu;

  const changer = (i, v) => setValeurs(prev => prev.map((x, j) => (j === i ? v.replace(/\D/g, '').slice(0, 7) : x)));

  // Saisie compacte, sur une ligne : champs par unité (unité accolée), stock et écart, boutons.
  // Sur téléphone, les éléments passent simplement à la ligne.
  const couleurEcart = ecart === 0 ? { background: '#dcfce7', color: '#15803d' }
    : ecart < 0 ? { background: '#fff7ed', color: '#c2410c' } : { background: '#eff6ff', color: '#1d4ed8' };
  return (
    <div className="d-flex align-items-center gap-2 flex-wrap pt-2 mt-2" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
      {unites.map((u, i) => (
        // Mobile : deux champs par ligne ; grand écran : largeur fixe
        <div key={u} className="input-group" style={{ width: isMobile ? 'calc(50% - 4px)' : 160 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*" enterKeyHint="done"
            className="form-control text-center fw-semibold" placeholder="0" aria-label={LIBELLES_UNITES[u] || u}
            style={{ fontSize: 16, height: 40 }}
            value={valeurs[i]} onChange={(e) => changer(i, e.target.value)} />
          <span className="input-group-text px-2" style={{ fontSize: 'var(--txt-sm)' }} title={LIBELLES_UNITES[u] || u}>{u}</span>
        </div>
      ))}

      <span className="small text-muted text-nowrap">Stock : <strong>{formatPs(produit, attendu)}</strong></span>
      {saisi && (
        <span className="badge rounded-pill text-nowrap" style={{ ...couleurEcart, fontSize: 12, padding: '6px 10px' }}>
          {ecart === 0 ? 'Conforme' : `Écart ${formatEcart(produit, ecart)}`}
        </span>
      )}

      <div className="d-flex gap-2 ms-auto">
        {comptage ? (
          <button type="button" className="btn btn-sm btn-light" style={{ minHeight: 40 }} disabled={enCours} onClick={onRetirer}
            title="Retirer le comptage">
            <FontAwesomeIcon icon={faRotateLeft} className="me-1" /> Retirer
          </button>
        ) : (
          <button type="button" className="btn btn-sm btn-light" style={{ minHeight: 40 }} disabled={enCours} onClick={onIgnorer}>
            <FontAwesomeIcon icon={faBan} className="me-1" /> Ignorer
          </button>
        )}
        <button type="button" className="btn btn-sm text-white fw-semibold px-3" style={{ minHeight: 40, background: '#00a881' }}
          disabled={enCours || !saisi} onClick={() => onEnregistrer(totalPs)}>
          {enCours ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faCheck} className="me-1" />Enregistrer</>}
        </button>
      </div>
    </div>
  );
};

export default SaisieComptage;
