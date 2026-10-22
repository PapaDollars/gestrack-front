// Activation d'un compte par l'administrateur, au choix :
//   a. essai gratuit de 15 jours (toutes les pages) ;
//   b. version gratuite limitée (Clients, Dettes, Boutique — 1 000 lectures / 250 écritures par jour) ;
//   c. version Pro : plan A.1 / A.2 / A.3 pour 1 mois, 3 mois ou 1 an.
// Plans et prix : GET /api/plans (backend services/plans.js).
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faGift, faLock, faCrown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { plansAPI } from '@/services/api';

const fcfa = (n) => `${new Intl.NumberFormat('fr-FR').format(n || 0)} FCFA`;
const nombre = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

const ModalActiverCompte = ({ utilisateur, enCours, onActiver, onFermer }) => {
  const [donnees, setDonnees] = useState(null);
  const [type, setType] = useState('essai');
  const [plan, setPlan] = useState('A.2');
  const [duree, setDuree] = useState('1mois');

  useEffect(() => { plansAPI.get().then(({ data }) => setDonnees(data)).catch(() => {}); }, []);

  const Option = ({ val, icone, couleur, titre, texte }) => (
    <label className="d-flex gap-3 p-3 rounded-3 mb-2" style={{
      cursor: 'pointer', border: `2px solid ${type === val ? couleur : 'var(--bs-border-color)'}`,
      background: type === val ? `${couleur}12` : 'transparent',
    }}>
      <input type="radio" className="form-check-input mt-1" checked={type === val} onChange={() => setType(val)} />
      <div>
        <div className="fw-semibold d-flex align-items-center gap-2" style={{ color: couleur }}>
          <FontAwesomeIcon icon={icone} /> {titre}
        </div>
        <div className="small text-muted">{texte}</div>
      </div>
    </label>
  );

  const valider = () => {
    if (type === 'pro') onActiver('approuver', { plan, duree });
    else onActiver(type);
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
      onClick={(e) => e.target === e.currentTarget && !enCours && onFermer()}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 520 }}>
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-1">
            <div className="min-w-0">
              <h5 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>Activer le compte</h5>
              <div className="small text-muted text-truncate">{utilisateur.email}</div>
            </div>
            <button className="btn btn-light btn-sm rounded-circle ms-auto flex-shrink-0" onClick={onFermer} disabled={enCours}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <Option val="essai" icone={faGift} couleur="#0369a1" titre={`Essai gratuit de ${donnees?.essai.jours || 15} jours`}
              texte={`Toutes les pages, avec les limites du plan ${donnees?.essai.plan || 'A.1'}. Ensuite, le compte est bloqué jusqu'à l'abonnement.`} />
            <Option val="limite" icone={faLock} couleur="#d97706" titre="Version gratuite limitée"
              texte={`${donnees?.gratuit.modules.join(', ') || 'Clients, Dettes, Boutique'} uniquement — ${nombre(donnees?.gratuit.lectures || 1000)} lectures et ${nombre(donnees?.gratuit.ecritures || 200)} écritures par jour. Les autres pages proposent de passer à la version Pro.`} />
            <Option val="pro" icone={faCrown} couleur="#16a34a" titre="Version Pro (abonnement payé)"
              texte="Toutes les pages, avec les limites du plan choisi, jusqu'à la fin de la durée. Ensuite, retour à la version gratuite." />

            {type === 'pro' && donnees && (
              <div className="p-3 rounded-3" style={{ background: 'var(--bs-secondary-bg)' }}>
                <div className="small fw-semibold text-muted mb-1">Plan</div>
                <div className="d-flex flex-column gap-1 mb-3">
                  {Object.entries(donnees.plans).map(([code, p]) => (
                    <label key={code} className="d-flex align-items-center gap-2 small" style={{ cursor: 'pointer', color: 'var(--bs-body-color)' }}>
                      <input type="radio" className="form-check-input m-0" checked={plan === code} onChange={() => setPlan(code)} />
                      <strong>{code} {p.nom}</strong>
                      <span className="text-muted">— {nombre(p.lectures)} lect. / {nombre(p.ecritures)} écr. par jour</span>
                    </label>
                  ))}
                </div>
                <div className="small fw-semibold text-muted mb-1">Durée</div>
                <div className="d-flex gap-2 flex-wrap">
                  {Object.entries(donnees.durees).map(([cle, d]) => (
                    <button key={cle} type="button" className="btn btn-sm"
                      style={{ background: duree === cle ? '#16a34a' : 'var(--bs-body-bg)', color: duree === cle ? '#fff' : 'var(--bs-body-color)', border: '1px solid var(--bs-border-color)' }}
                      onClick={() => setDuree(cle)}>
                      {d.libelle} · {fcfa(donnees.prix[plan][cle])}
                    </button>
                  ))}
                </div>
                <div className="small text-muted mt-2">
                  Si un abonnement Pro est déjà en cours, la durée s'ajoute à sa date de fin.
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={enCours}>Annuler</button>
            <button className="btn text-white d-flex align-items-center gap-2" style={{ background: '#16a34a' }}
              disabled={enCours || (type === 'pro' && !donnees)} onClick={valider}>
              {enCours ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />} Activer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalActiverCompte;
