// Saisie du comptage d'un produit, dans ses unités (ballo / dz / ps…), avec l'écart en direct
import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faBan, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { psParUnite, sousUnites } from '@/services/unites';
import { stockEnPs, formatPs, formatEcart } from '@/pages/inventaire/utils';

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
  const unites = useMemo(() => sousUnites(produit.unitePrincipale || produit.unite), [produit]);
  const [valeurs, setValeurs] = useState(() => (comptage?.statut === 'compte'
    ? decomposer(produit, unites, comptage.compte).map(String)
    : unites.map(() => '')));

  const saisi = valeurs.some(v => v !== '');
  const totalPs = valeurs.reduce((s, v, i) => s + (parseInt(v, 10) || 0) * psParUnite(unites[i], produit), 0);
  const attendu = stockEnPs(produit);
  const ecart = totalPs - attendu;

  const changer = (i, v) => setValeurs(prev => prev.map((x, j) => (j === i ? v.replace(/\D/g, '').slice(0, 7) : x)));

  return (
    <div className="d-flex flex-column gap-3 pt-3">
      <div className="d-grid gap-2" style={{ gridTemplateColumns: `repeat(${unites.length}, minmax(0, 1fr))` }}>
        {unites.map((u, i) => (
          <label key={u} className="d-flex flex-column gap-1 small text-muted">
            {LIBELLES_UNITES[u] || u}
            <input type="text" inputMode="numeric" pattern="[0-9]*" enterKeyHint="done"
              className="form-control text-center" placeholder="0"
              style={{ height: 48, fontSize: 20, fontWeight: 600 }}
              value={valeurs[i]} onChange={(e) => changer(i, e.target.value)} />
          </label>
        ))}
      </div>

      {saisi && (
        <div className="d-flex align-items-center justify-content-between rounded-3 px-3 py-2 small"
          style={ecart === 0
            ? { background: '#dcfce7', color: '#15803d' }
            : ecart < 0 ? { background: '#fff7ed', color: '#c2410c' } : { background: '#eff6ff', color: '#1d4ed8' }}>
          <span>Compté : {formatPs(produit, totalPs)}</span>
          <strong>{ecart === 0 ? 'Conforme' : `Écart : ${formatEcart(produit, ecart)}`}</strong>
        </div>
      )}
      <div className="small text-muted">Stock enregistré : <strong>{formatPs(produit, attendu)}</strong></div>

      <div className="d-flex gap-2 flex-wrap">
        {comptage ? (
          <button type="button" className="btn btn-light" style={{ minHeight: 46 }} disabled={enCours} onClick={onRetirer}>
            <FontAwesomeIcon icon={faRotateLeft} className="me-1" /> Retirer le comptage
          </button>
        ) : (
          <button type="button" className="btn btn-light" style={{ minHeight: 46 }} disabled={enCours} onClick={onIgnorer}>
            <FontAwesomeIcon icon={faBan} className="me-1" /> Ignorer
          </button>
        )}
        <button type="button" className="btn text-white flex-grow-1 fw-semibold" style={{ minHeight: 46, background: '#00a881' }}
          disabled={enCours || !saisi} onClick={() => onEnregistrer(totalPs)}>
          {enCours ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faCheck} className="me-2" />Enregistrer le comptage</>}
        </button>
      </div>
    </div>
  );
};

export default SaisieComptage;
