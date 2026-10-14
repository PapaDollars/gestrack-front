// Encaissements par moyen de paiement (Espèces / Orange Money / MTN) sur la période choisie :
// argent enregistré dans l'application (factures réglées, avances, remboursements de dettes,
// ventes directes) comparé aux montants saisis à la main dans Finances › Mon Compte.
// Lecture seule : rien n'est ajouté dans Mon Compte.
import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faMobile, faWallet, faChevronDown, faChevronUp, faCheckCircle,
  faExclamationTriangle, faScaleBalanced, faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';

const MOYENS = [
  { cle: 'especes', compte: 'especes',      label: 'Espèces',      icon: faMoneyBillWave, couleur: '#16a34a', bg: '#dcfce7' },
  { cle: 'om',      compte: 'orange_money', label: 'Orange Money', icon: faMobile,        couleur: '#ea580c', bg: '#fff7ed' },
  { cle: 'mtn',     compte: 'mobile_money', label: 'MTN Money',    icon: faWallet,        couleur: '#ca8a04', bg: '#fefce8' },
];

const ORIGINES = [
  { cle: 'facture', label: 'Factures réglées' },
  { cle: 'avance',  label: 'Avances sur factures' },
  { cle: 'dette',   label: 'Remboursements de dettes' },
  { cle: 'vente',   label: 'Ventes directes (sorties de stock)' },
];

const Ligne = ({ label, valeur, fort, couleur }) => (
  <div className="d-flex justify-content-between gap-2" style={{ fontSize: 'var(--txt-md)' }}>
    <span className={fort ? 'fw-semibold' : 'text-muted'} style={fort ? { color: 'var(--bs-body-color)' } : undefined}>{label}</span>
    <span className={fort ? 'fw-bold' : 'fw-semibold'} style={{ color: couleur || 'var(--bs-body-color)', whiteSpace: 'nowrap' }}>{valeur}</span>
  </div>
);

const TableauEncaissements = ({ encaissements, saisies, formatMontant }) => {
  const [ouvert, setOuvert] = useState(true);

  const totaux = useMemo(() => {
    const t = { nonPrecise: 0 };
    MOYENS.forEach(m => {
      t[m.cle] = {
        enregistre: 0,
        parOrigine: Object.fromEntries(ORIGINES.map(o => [o.cle, 0])),
        saisi: saisies.filter(s => s.type === m.compte).reduce((a, s) => a + (s.montant || 0), 0),
      };
    });
    encaissements.forEach(e => {
      MOYENS.forEach(m => {
        if (e[m.cle] > 0) {
          t[m.cle].enregistre += e[m.cle];
          t[m.cle].parOrigine[e.origine] = (t[m.cle].parOrigine[e.origine] || 0) + e[m.cle];
        }
      });
      t.nonPrecise += e.nonPrecise || 0;
    });
    return t;
  }, [encaissements, saisies]);

  const totalEnregistre = MOYENS.reduce((a, m) => a + totaux[m.cle].enregistre, 0);
  const totalSaisi = MOYENS.reduce((a, m) => a + totaux[m.cle].saisi, 0);

  return (
    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
      <button type="button" className="card-header border-0 px-3 px-md-4 py-3 d-flex align-items-center gap-2 w-100 text-start"
        style={{ background: 'var(--bs-secondary-bg)', borderRadius: ouvert ? '14px 14px 0 0' : 14 }}
        onClick={() => setOuvert(o => !o)}>
        <FontAwesomeIcon icon={faScaleBalanced} style={{ color: '#00a881' }} />
        <span className="fw-semibold flex-grow-1 min-w-0" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
          Encaissements par moyen de paiement
        </span>
        <span className="badge d-none d-sm-inline" style={{ background: '#00a881', fontSize: 'var(--txt-base)' }}>
          {formatMontant(totalEnregistre + totaux.nonPrecise)}
        </span>
        <FontAwesomeIcon icon={ouvert ? faChevronUp : faChevronDown} className="text-muted" />
      </button>

      {ouvert && (
        <div className="card-body p-2 p-md-3">
          <p className="text-muted small mb-2 px-1">
            <strong>Enregistré</strong> : ce que l'application a reçu d'après vos factures, avances, remboursements de dettes et ventes directes.{' '}
            <strong>Saisi</strong> : vos montants de Finances › Mon Compte. Un écart signale une vente non enregistrée ou une erreur de saisie.
          </p>

          <div className="row g-2">
            {MOYENS.map(m => {
              const t = totaux[m.cle];
              const ecart = t.saisi - t.enregistre;
              return (
                <div key={m.cle} className="col-12 col-md-4">
                  <div className="h-100 p-3 rounded-3" style={{ border: `1.5px solid ${m.couleur}33` }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: 30, height: 30, background: m.bg, color: m.couleur }}>
                        <FontAwesomeIcon icon={m.icon} style={{ fontSize: 13 }} />
                      </span>
                      <span className="fw-semibold" style={{ color: m.couleur }}>{m.label}</span>
                    </div>

                    <Ligne label="Enregistré" valeur={formatMontant(t.enregistre)} fort couleur={m.couleur} />
                    <div className="ps-2 my-1" style={{ borderLeft: `2px solid ${m.couleur}33` }}>
                      {ORIGINES.filter(o => t.parOrigine[o.cle] > 0).map(o => (
                        <Ligne key={o.cle} label={o.label} valeur={formatMontant(t.parOrigine[o.cle])} />
                      ))}
                      {t.enregistre === 0 && <div className="small text-muted">Aucun encaissement</div>}
                    </div>
                    <Ligne label="Saisi (Mon Compte)" valeur={formatMontant(t.saisi)} fort />

                    <div className="d-flex justify-content-between align-items-center gap-2 mt-2 px-2 py-1 rounded-2"
                      style={{
                        background: ecart === 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
                        color: ecart === 0 ? '#16a34a' : '#dc2626', fontSize: 'var(--txt-md)',
                      }}>
                      <span className="d-flex align-items-center gap-1">
                        <FontAwesomeIcon icon={ecart === 0 ? faCheckCircle : faExclamationTriangle} />
                        {ecart === 0 ? 'Concorde' : ecart > 0 ? 'Saisi en plus' : 'Saisi en moins'}
                      </span>
                      <strong style={{ whiteSpace: 'nowrap' }}>
                        {ecart > 0 ? '+' : ecart < 0 ? '−' : ''}{formatMontant(Math.abs(ecart))}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="d-flex flex-wrap justify-content-between gap-2 mt-2 px-1" style={{ fontSize: 'var(--txt-md)' }}>
            <span className="text-muted">
              Total enregistré : <strong style={{ color: 'var(--bs-body-color)' }}>{formatMontant(totalEnregistre)}</strong>
              {' · '}Total saisi : <strong style={{ color: 'var(--bs-body-color)' }}>{formatMontant(totalSaisi)}</strong>
            </span>
          </div>

          {totaux.nonPrecise > 0 && (
            <div className="d-flex gap-2 mt-2 p-2 rounded-2 small" style={{ background: 'rgba(245,158,11,0.1)', color: '#92400e' }}>
              <FontAwesomeIcon icon={faQuestionCircle} className="mt-1 flex-shrink-0" />
              <span>
                <strong>{formatMontant(totaux.nonPrecise)}</strong> encaissés sans moyen de paiement précisé
                (factures et ventes enregistrées avant l'ajout du choix Espèces / OM / MTN) — non répartis ci-dessus.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableauEncaissements;
