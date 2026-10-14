// Répartition d'un paiement : les trois moyens sur une ligne ; montants Orange Money et MTN
// saisis à la demande, le reste du total est compté automatiquement en espèces. Utilisé par les factures réglées et les sorties de stock.
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faMobile, faWallet, faCheck } from '@fortawesome/free-solid-svg-icons';

const fmt = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n || 0) + ' FCFA';

const nombre = (v) => Math.max(0, Math.round(parseFloat(v) || 0));

// Valeurs calculées à partir de la saisie — exportées pour valider avant l'envoi
export const calculerRepartition = (total, om, mtn) => {
  const t = Math.max(0, Math.round(total || 0));
  const o = nombre(om);
  const m = nombre(mtn);
  return { total: t, om: o, mtn: m, especes: t - o - m, depasse: o + m > t };
};

// Bouton d'un moyen (ligne des trois moyens)
const BoutonMoyen = ({ icon, court, long, couleur, bg, actif, montant, onClick }) => (
  <button type="button" aria-pressed={actif}
    className="btn btn-sm flex-grow-1 d-flex flex-column align-items-center justify-content-center px-1 py-1"
    style={{
      flexBasis: 0, minWidth: 0, borderRadius: 8, lineHeight: 1.2,
      background: actif ? bg : 'var(--bs-secondary-bg)',
      color: actif ? couleur : 'var(--bs-secondary-color)',
      border: `2px solid ${actif ? couleur : 'transparent'}`,
    }}
    onClick={onClick}>
    <span className="d-flex align-items-center gap-1 fw-semibold text-nowrap" style={{ fontSize: 'var(--txt-base)' }}>
      <FontAwesomeIcon icon={actif ? faCheck : icon} />
      <span className="d-sm-none">{court}</span>
      <span className="d-none d-sm-inline">{long}</span>
    </span>
    {actif && montant !== null && (
      <span className="fw-bold text-nowrap" style={{ fontSize: 'var(--txt-xs)' }}>{fmt(montant)}</span>
    )}
  </button>
);

// Champ de saisie d'un moyen activé
const ChampMoyen = ({ label, couleur, value, onChange, pleineLargeur }) => (
  <div className={pleineLargeur ? 'col-12' : 'col-6'}>
    <label className="form-label small fw-semibold mb-1 d-block text-truncate" style={{ color: couleur }}>Montant {label}</label>
    <div className="input-group input-group-sm">
      <input type="number" min="0" inputMode="numeric" className="form-control" placeholder="0" autoFocus
        style={{ borderColor: couleur }}
        value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="input-group-text">FCFA</span>
    </div>
  </div>
);

// Les trois moyens sur une ligne. Espèces est toujours utilisé pour le reste ; un clic sur
// OM ou MTN fait apparaître son champ de montant (nouveau clic : retiré). Un clic sur
// Espèces remet tout en espèces.
const RepartitionPaiement = ({ total, om, mtn, onChangeOm, onChangeMtn, titre = 'Paiement' }) => {
  const r = calculerRepartition(total, om, mtn);
  const [omActif, setOmActif]   = useState(() => r.om > 0);
  const [mtnActif, setMtnActif] = useState(() => r.mtn > 0);
  // Montants chargés après coup (modification d'une facture) : le champ s'affiche
  useEffect(() => { if (r.om > 0) setOmActif(true); }, [r.om > 0]); // eslint-disable-line
  useEffect(() => { if (r.mtn > 0) setMtnActif(true); }, [r.mtn > 0]); // eslint-disable-line

  const basculerOm  = () => { if (omActif) onChangeOm('');  setOmActif(a => !a); };
  const basculerMtn = () => { if (mtnActif) onChangeMtn(''); setMtnActif(a => !a); };
  const toutEspeces = () => { onChangeOm(''); onChangeMtn(''); setOmActif(false); setMtnActif(false); };

  return (
    <div>
      <div className="small fw-semibold text-muted mb-1">{titre}</div>
      <div className="d-flex gap-2 mb-2">
        <BoutonMoyen icon={faMoneyBillWave} court="Espèces" long="Espèces" couleur="#16a34a" bg="#dcfce7"
          actif={r.especes > 0 || (!omActif && !mtnActif)} montant={omActif || mtnActif ? Math.max(0, r.especes) : null}
          onClick={toutEspeces} />
        <BoutonMoyen icon={faMobile} court="OM" long="Orange Money" couleur="#ea580c" bg="#fff7ed"
          actif={omActif} montant={null} onClick={basculerOm} />
        <BoutonMoyen icon={faWallet} court="MTN" long="MTN Money" couleur="#ca8a04" bg="#fefce8"
          actif={mtnActif} montant={null} onClick={basculerMtn} />
      </div>

      {(omActif || mtnActif) && (
        <div className="row g-2 mb-2 align-items-end">
          {omActif && <ChampMoyen label="OM" couleur="#ea580c" value={om} onChange={onChangeOm} pleineLargeur={!mtnActif} />}
          {mtnActif && <ChampMoyen label="MTN" couleur="#ca8a04" value={mtn} onChange={onChangeMtn} pleineLargeur={!omActif} />}
        </div>
      )}

      {r.depasse ? (
        <div className="small px-2 py-1 rounded-2" style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
          Orange Money + MTN ({fmt(r.om + r.mtn)}) dépasse le total ({fmt(r.total)})
        </div>
      ) : (omActif || mtnActif) ? (
        <div className="d-flex justify-content-between align-items-center px-2 py-1 rounded-2"
          style={{ background: '#dcfce7', color: '#16a34a', fontSize: 'var(--txt-md)' }}>
          <span className="d-flex align-items-center gap-1"><FontAwesomeIcon icon={faMoneyBillWave} /> Espèces (le reste)</span>
          <strong>{fmt(r.especes)}</strong>
        </div>
      ) : (
        <div className="small text-muted">Tout en espèces. Cliquez sur OM ou MTN pour saisir une part.</div>
      )}
    </div>
  );
};

export default RepartitionPaiement;
