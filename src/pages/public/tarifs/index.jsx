// Page publique des tarifs : plans GesTrack Pro (A.1 / A.2 / A.3) pour 1 mois, 3 mois ou
// 1 an, version gratuite et essai. Choisir un plan affiche son récapitulatif et un e-mail
// prérempli à envoyer à l'administrateur pour l'activation.
// Plans, limites et prix viennent du serveur (backend services/plans.js — source unique).
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faCrown, faEnvelope, faCopy, faSpinner, faGift, faLock, faStar, faArrowLeft, faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { plansAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ROUTES, EMAIL_CONTACT, mailto } from '@/utils/url/frontend';
import useTitrePage from '@/hooks/useTitrePage';
import LiensLegaux from '@/pages/public/components/LiensLegaux';
import BackToTop from '@/components/common/BackToTop';

const fcfa = (n) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n || 0))} FCFA`;
const nombre = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);

// Fonctionnalités des plans Pro. `module` : peut être exclu d'un plan (champ `exclus` du plan,
// backend services/plans.js — ex. A.1 sans magasin ni catalogue)
const FONCTIONNALITES = [
  { t: 'Boutique (stock, ventes)' },
  { t: 'Magasin de réserve (stock de réserve et envoi vers la boutique)', module: 'magasin' },
  { t: 'Factures et PDF à partager' },
  { t: 'Clients et dettes, rappels' },
  { t: 'Fournisseurs et commandes' },
  { t: 'Mes finances, encaissements Espèces / OM / MTN' },
  { t: 'Vos produits visibles sur internet (une page à partager à vos clients, ouverte à tous ou avec un mot de passe)', module: 'catalogue' },
  { t: 'Exports et sauvegarde de vos données' },
];
const inclusDans = (p, f) => !f.module || !(p.exclus || []).includes(f.module);

const VERT = '#00d4aa';

const Tarifs = () => {
  useTitrePage('Tarifs — GesTrack Business');
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [duree, setDuree] = useState('1mois');
  const [choix, setChoix] = useState(null); // code du plan choisi
  const { utilisateur } = useAuth();
  const emailCompte = utilisateur?.email || '';

  useEffect(() => {
    plansAPI.get().then(({ data }) => setDonnees(data)).catch(() => setErreur(true));
  }, []);

  const contact = donnees?.contact || EMAIL_CONTACT;
  const plan = choix && donnees?.plans[choix];
  const prix = choix && donnees?.prix[choix]?.[duree];
  const libDuree = donnees?.durees[duree]?.libelle;

  // E-mail prérempli de demande d'activation
  const email = useMemo(() => {
    if (!plan) return null;
    const sujet = `Demande d'abonnement GesTrack Pro — Plan ${choix} ${plan.nom} (${libDuree})`;
    const corps = [
      'Bonjour,',
      '',
      'Je souhaite activer l\'abonnement suivant sur mon compte GesTrack :',
      '',
      `• Plan : ${choix} — ${plan.nom}`,
      `• Durée : ${libDuree}`,
      `• Prix : ${fcfa(prix)}`,
      `• Limites : ${nombre(plan.lectures)} lectures et ${nombre(plan.ecritures)} écritures par jour`,
      `• Compte GesTrack (adresse e-mail) : ${emailCompte || '[indiquez ici l\'adresse e-mail de votre compte]'}`,
      '',
      'Merci de m\'indiquer comment effectuer le paiement (Orange Money, MTN Mobile Money ou espèces).',
      '',
      'Cordialement,',
    ].join('\n');
    return { sujet, corps };
  }, [plan, choix, libDuree, prix, emailCompte]);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(`Objet : ${email.sujet}\n\n${email.corps}`);
      toast.success('Message copié — collez-le dans un e-mail à ' + contact);
    } catch { toast.error('Copie impossible : sélectionnez le texte à la main'); }
  };

  const choisir = (code) => {
    setChoix(code);
    setTimeout(() => document.getElementById('votre-choix')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* En-tête */}
      <div className="text-center text-white px-3 pt-5 pb-5" style={{ background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' }}>
        <Link to={ROUTES.accueil} className="text-decoration-none small d-inline-flex align-items-center gap-2 mb-3" style={{ color: VERT }}>
          <FontAwesomeIcon icon={faArrowLeft} /> GesTrack Business
        </Link>
        <h1 className="fw-bold mb-2" style={{ fontSize: 'clamp(26px, 5vw, 38px)' }}>Tarifs GesTrack Pro</h1>
        <p className="mb-4 mx-auto" style={{ maxWidth: 560, color: 'rgba(255,255,255,0.75)' }}>
          Choisissez selon l'activité de votre commerce : le plan A.1 couvre la boutique ; A.2 et A.3 ajoutent le magasin de réserve et la page internet de vos produits,
          puis envoyez votre demande à l'administrateur.
        </p>
        {/* Durée */}
        {donnees && (
          <div className="d-inline-flex flex-wrap justify-content-center gap-1 p-1 rounded-pill" style={{ background: 'rgba(255,255,255,0.1)' }}>
            {Object.entries(donnees.durees).map(([cle, d]) => (
              <button key={cle} type="button" className="btn btn-sm rounded-pill px-3"
                style={{ background: duree === cle ? VERT : 'transparent', color: '#fff', fontWeight: duree === cle ? 700 : 400 }}
                onClick={() => setDuree(cle)}>
                {d.libelle}{d.remise && <span className="ms-1 badge" style={{ background: duree === cle ? 'rgba(0,0,0,0.2)' : '#f59e0b', fontSize: 10 }}>{d.remise}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="container px-3" style={{ maxWidth: 1080, marginTop: -28 }}>
        {erreur && <div className="alert alert-warning">Impossible de charger les tarifs pour le moment. Contactez {contact}.</div>}
        {!donnees && !erreur && <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: VERT }} /></div>}

        {donnees && (
          <>
            {/* Plans */}
            <div className="row g-3">
              {Object.entries(donnees.plans).map(([code, p]) => {
                const total = donnees.prix[code][duree];
                const jours = donnees.durees[duree].jours;
                const parMois = Math.round(total / (jours / 30));
                const actif = choix === code;
                return (
                  <div key={code} className="col-12 col-md-4">
                    <div className="card h-100 border-0 shadow-sm position-relative" style={{
                      borderRadius: 18, outline: actif ? `3px solid ${VERT}` : p.recommande ? '2px solid #a7f3d0' : 'none',
                    }}>
                      {p.recommande && (
                        <span className="badge position-absolute top-0 start-50 translate-middle px-3 py-2" style={{ background: VERT, borderRadius: 20 }}>
                          <FontAwesomeIcon icon={faStar} className="me-1" /> Recommandé
                        </span>
                      )}
                      <div className="card-body p-4 d-flex flex-column">
                        <div className="small fw-bold" style={{ color: '#64748b' }}>Plan {code}</div>
                        <h4 className="fw-bold mb-1" style={{ color: '#0f2027' }}>{p.nom}</h4>
                        <div className="small text-muted mb-3">{p.pour}</div>
                        <div className="fw-bold" style={{ fontSize: 30, color: '#0f2027', lineHeight: 1.1 }}>{fcfa(total)}</div>
                        <div className="small text-muted mb-3">
                          pour {donnees.durees[duree].libelle}{duree !== '1mois' && <> · soit {fcfa(parMois)} / mois</>}
                        </div>
                        <div className="p-2 rounded-3 mb-3 small" style={{ background: '#f1f5f9', color: '#0f2027' }}>
                          <div><strong>{nombre(p.lectures)}</strong> lectures / jour</div>
                          <div><strong>{nombre(p.ecritures)}</strong> écritures / jour</div>
                        </div>
                        <ul className="list-unstyled small mb-4" style={{ color: '#334155' }}>
                          {FONCTIONNALITES.map(f => {
                            const ok = inclusDans(p, f);
                            return (
                              <li key={f.t} className="d-flex gap-2 mb-1" style={ok ? undefined : { color: '#94a3b8', textDecoration: 'line-through' }}>
                                <FontAwesomeIcon icon={ok ? faCheck : faTimes} className="mt-1 flex-shrink-0" style={{ color: ok ? VERT : '#cbd5e1' }} /> {f.t}
                              </li>
                            );
                          })}
                        </ul>
                        <button type="button" className="btn mt-auto fw-semibold"
                          style={{ background: actif || p.recommande ? VERT : '#0f2027', color: '#fff', borderRadius: 10 }}
                          onClick={() => choisir(code)}>
                          {actif ? <><FontAwesomeIcon icon={faCheck} /> Plan choisi</> : 'Choisir ce plan'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explication des limites */}
            <p className="small text-muted text-center mt-3 mb-4 mx-auto" style={{ maxWidth: 720 }}>
              Les limites comptent les opérations faites par votre compte chaque jour : une <strong>lecture</strong> par
              élément affiché (un produit, un client, une facture…), une <strong>écriture</strong> par élément enregistré
              ou modifié. Elles repartent de zéro chaque nuit à minuit.
            </p>

            {/* Votre choix + e-mail prérempli */}
            {plan && email && (
              <div id="votre-choix" className="card border-0 shadow-sm mb-4" style={{ borderRadius: 18, scrollMarginTop: 16 }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0f2027' }}>
                    <FontAwesomeIcon icon={faCrown} style={{ color: VERT }} /> Votre choix : plan {choix} {plan.nom} — {libDuree}
                  </h5>
                  <div className="row g-3">
                    <div className="col-12 col-lg-5">
                      <ul className="list-unstyled mb-3" style={{ color: '#334155' }}>
                        <li><strong>Prix :</strong> {fcfa(prix)}</li>
                        <li><strong>Durée :</strong> {libDuree} à partir de l'activation</li>
                        <li><strong>Limites :</strong> {nombre(plan.lectures)} lectures et {nombre(plan.ecritures)} écritures par jour</li>
                        <li><strong>Inclus :</strong> {plan.exclus?.length
                          ? `tout sauf ${FONCTIONNALITES.filter(f => !inclusDans(plan, f))
                            .map(f => f.t.split(' (')[0].toLowerCase()).join(' et ')}`
                          : 'toutes les pages et fonctionnalités'}</li>
                      </ul>
                      <ol className="small ps-3 mb-0" style={{ color: '#475569' }}>
                        <li>Envoyez le message ci-contre à <strong>{contact}</strong> ;</li>
                        <li>l'administrateur vous indique comment payer (Orange Money, MTN, espèces) ;</li>
                        <li>votre abonnement est activé dès réception du paiement.</li>
                      </ol>
                    </div>
                    <div className="col-12 col-lg-7">
                      <div className="small fw-semibold text-muted mb-1">Message prérempli</div>
                      <div className="p-3 rounded-3 small mb-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', color: '#0f2027' }}>
                        <strong>Objet : {email.sujet}</strong>{'\n\n'}{email.corps}
                      </div>
                      {!emailCompte && (
                        <div className="small mb-2" style={{ color: '#b45309' }}>
                          Pensez à indiquer l'adresse e-mail de votre compte GesTrack dans le message.
                        </div>
                      )}
                      <div className="d-flex flex-wrap gap-2 justify-content-end">
                        <button type="button" className="btn btn-light d-flex align-items-center gap-2" style={{ borderRadius: 10 }} onClick={copier}>
                          <FontAwesomeIcon icon={faCopy} /> Copier le message
                        </button>
                        <a href={mailto(contact, { sujet: email.sujet, corps: email.corps })}
                          className="btn text-white d-flex align-items-center gap-2" style={{ background: VERT, borderRadius: 10 }}>
                          <FontAwesomeIcon icon={faEnvelope} /> Envoyer la demande par e-mail
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Essai et version gratuite */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6">
                <div className="h-100 p-4 rounded-4" style={{ background: '#e0f2fe', color: '#075985' }}>
                  <h6 className="fw-bold d-flex align-items-center gap-2"><FontAwesomeIcon icon={faGift} /> Essai gratuit de {donnees.essai.jours} jours</h6>
                  <p className="small mb-0">
                    Toutes les fonctionnalités, avec les limites du plan {donnees.essai.plan}, pour découvrir GesTrack
                    avant de choisir. Activé par l'administrateur à la création du compte.
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="h-100 p-4 rounded-4" style={{ background: '#fef3c7', color: '#92400e' }}>
                  <h6 className="fw-bold d-flex align-items-center gap-2"><FontAwesomeIcon icon={faLock} /> Version gratuite</h6>
                  <p className="small mb-0">
                    {donnees.gratuit.modules.join(', ')} uniquement, jusqu'à {nombre(donnees.gratuit.lectures)} lectures
                    et {nombre(donnees.gratuit.ecritures)} écritures par jour. Vos données sont conservées : passez à la
                    version Pro à tout moment pour tout débloquer.
                  </p>
                </div>
              </div>
            </div>

            <p className="small text-muted text-center mb-4">
              Prix en francs CFA. Questions : <a href={mailto(contact)}>{contact}</a>
            </p>
          </>
        )}
        <div className="pb-4"><LiensLegaux /></div>
      </div>
      <BackToTop />
    </div>
  );
};

export default Tarifs;
