import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey,
  faUser, faEdit, faSave, faTimes, faSpinner, faEnvelope,
  faPhone, faIdCard, faAt, faShieldAlt, faCalendarAlt, faClock,
  faCheckCircle, faExclamationTriangle, faLock,
} from '@fortawesome/free-solid-svg-icons';
import { profilAPI, estMisEnAttente } from '@/services/api';
import { auth } from '@/services/firebase';
import { toast } from 'react-toastify';
import Champ from '@/pages/profil/components/Champ';
import Info from '@/pages/profil/components/Info';
import ModalMotDePasse from '@/pages/profil/modals/ModalMotDePasse';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtDateHeure = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? '—' : d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const MonProfil = () => {
  const [profil, setProfil]       = useState(null);
  const [form, setForm]           = useState({});
  const [edition, setEdition]     = useState(false);
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const prenomRef = useRef(null);
  const [modalMdp, setModalMdp]   = useState(false);
  const utilisateurAuth = auth.currentUser;

  useEffect(() => {
    profilAPI.get()
      .then(({ data }) => { setProfil(data); setForm(data); })
      .catch(() => toast.error('Impossible de charger le profil'))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => {
    if (edition) prenomRef.current?.focus();
  }, [edition]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.prenom?.trim() || !form.nom?.trim())
      return toast.error('Prénom et nom sont obligatoires');
    setSauvegarde(true);
    try {
      const reponse = await profilAPI.update({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        pseudo: form.pseudo?.trim() || null,
        telephone: form.telephone?.trim() || null,
      });
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      const { data } = reponse;
      setProfil(data);
      setForm(data);
      setEdition(false);
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSauvegarde(false);
    }
  };

  const annuler = () => { setForm(profil); setEdition(false); };

  if (chargement) return (
    <div className="text-center py-5">
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  // Le serveur doit renvoyer le compte réellement connecté : sinon on le signale clairement
  // au lieu d'afficher (et de laisser modifier) le profil d'un autre compte.
  const compteDifferent = profil && utilisateurAuth && profil.uid && profil.uid !== utilisateurAuth.uid;

  const nomComplet = `${profil?.prenom || ''} ${profil?.nom || ''}`.trim()
    || utilisateurAuth?.displayName || profil?.email?.split('@')[0] || 'Mon compte';
  const initiales = nomComplet.split(/\s+/).slice(0, 2).map(m => m[0]).join('').toUpperCase() || '?';
  const emailVerifie = utilisateurAuth?.emailVerified;
  const derniereConnexion = utilisateurAuth?.metadata?.lastSignInTime;

  const inputProps = (champ, extra = {}) => ({
    className: 'form-control border-start-0',
    value: form[champ] ?? '',
    onChange: e => setForm({ ...form, [champ]: e.target.value }),
    disabled: !edition,
    style: edition ? undefined : { background: 'var(--bs-body-bg)' },
    ...extra,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faUser} style={{ color: '#00d4aa' }} />
            Mon profil
          </h4>
          <p className="text-muted small mb-0">Vos informations personnelles et l'état de votre compte</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingBottom: '1rem' }}>

        {compteDifferent && (
          <div className="alert alert-warning d-flex align-items-start gap-2 mb-3" style={{ borderRadius: 12 }}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="mt-1" />
            <div className="small">
              Le serveur n'a pas reconnu votre session : les informations ci-dessous ne correspondent pas
              à votre compte ({utilisateurAuth.email}). Rechargez la page ou reconnectez-vous.
            </div>
          </div>
        )}

        {/* ── Bandeau d'identité ── */}
        <div className="card border-0 shadow-sm mb-3 overflow-hidden" style={{ borderRadius: 16 }}>
          <div style={{ height: 96, background: 'linear-gradient(120deg, #0f2027 0%, #203a43 55%, #00a881 130%)' }} />
          <div className="card-body px-4 pb-3 pt-2">
            {/* Seul l'avatar chevauche le bandeau ; nom et badges restent sous le bandeau, sur fond clair */}
            <div className="d-flex align-items-end gap-3 flex-wrap">
              <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0 shadow position-relative"
                style={{ width: 88, height: 88, marginTop: -52, background: 'linear-gradient(135deg, #00d4aa, #203a43)', fontSize: 30, border: '4px solid var(--bs-body-bg)' }}>
                {initiales}
              </div>
              <div className="flex-grow-1 min-w-0 pb-1">
                <div className="fw-bold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-2xl)' }}>
                  {nomComplet}
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                  {profil?.pseudo && <span className="text-muted small">@{profil.pseudo}</span>}
                  <span className="badge rounded-pill d-inline-flex align-items-center gap-1"
                    style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881', fontSize: 'var(--txt-sm)' }}>
                    <FontAwesomeIcon icon={faEnvelope} /> {profil?.email || utilisateurAuth?.email}
                  </span>
                  {emailVerifie !== undefined && (
                    <span className="badge rounded-pill d-inline-flex align-items-center gap-1"
                      style={{ background: emailVerifie ? '#dcfce7' : '#fef3c7', color: emailVerifie ? '#166534' : '#92400e', fontSize: 'var(--txt-sm)' }}>
                      <FontAwesomeIcon icon={emailVerifie ? faCheckCircle : faExclamationTriangle} />
                      {emailVerifie ? 'Email vérifié' : 'Email non vérifié'}
                    </span>
                  )}
                </div>
              </div>
              {!edition && !compteDifferent && (
                <button className="btn text-white d-flex align-items-center gap-2 mb-1"
                  style={{ background: '#00d4aa', borderRadius: 10 }}
                  onClick={() => setEdition(true)}>
                  <FontAwesomeIcon icon={faEdit} /> Modifier le profil
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row g-3">
          {/* ── Formulaire ── */}
          <div className="col-12 col-lg-8">
            <form onSubmit={handleSubmit} className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>Informations personnelles</h6>
                  {edition && (
                    <span className="badge rounded-pill" style={{ background: '#fef3c7', color: '#92400e' }}>Mode édition</span>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <Champ label="Prénom *" icon={faIdCard}>
                      <input type="text" ref={prenomRef} required {...inputProps('prenom')} />
                    </Champ>
                  </div>
                  <div className="col-12 col-md-6">
                    <Champ label="Nom *" icon={faIdCard}>
                      <input type="text" required {...inputProps('nom')} />
                    </Champ>
                  </div>
                  <div className="col-12 col-md-6">
                    <Champ label="Pseudo" icon={faAt} aide="Optionnel — affiché sous votre nom">
                      <input type="text" placeholder={edition ? 'pseudonyme' : '—'} {...inputProps('pseudo')} />
                    </Champ>
                  </div>
                  <div className="col-12 col-md-6">
                    <Champ label="Téléphone" icon={faPhone} aide="Optionnel">
                      <input type="tel" placeholder={edition ? '+237 6XX XXX XXX' : '—'} {...inputProps('telephone')} />
                    </Champ>
                  </div>
                  <div className="col-12">
                    <Champ label="Adresse email" icon={faEnvelope} aide="L'adresse email sert à la connexion et ne peut pas être modifiée.">
                      <input type="email" className="form-control border-start-0" value={profil?.email ?? ''} disabled
                        style={{ background: 'var(--bs-body-bg)' }} />
                      <span className="input-group-text bg-body-secondary">
                        <FontAwesomeIcon icon={faLock} className="text-muted" style={{ fontSize: 'var(--txt-sm)' }} />
                      </span>
                    </Champ>
                  </div>
                </div>

                {edition && (
                  <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-light d-flex align-items-center gap-2"
                      style={{ borderRadius: 10 }} onClick={annuler} disabled={sauvegarde}>
                      <FontAwesomeIcon icon={faTimes} /> Annuler
                    </button>
                    <button type="submit" className="btn text-white d-flex align-items-center gap-2"
                      style={{ background: '#00d4aa', borderRadius: 10 }} disabled={sauvegarde}>
                      {sauvegarde ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                      Enregistrer
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* ── Compte & sécurité ── */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
              <div className="card-body p-4">
                <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
                  <FontAwesomeIcon icon={faShieldAlt} style={{ color: '#00d4aa' }} />
                  Compte & sécurité
                </h6>
                <Info icon={faCalendarAlt} label="Membre depuis" valeur={fmtDate(profil?.createdAt || utilisateurAuth?.metadata?.creationTime)} couleur="#0ea5e9" />
                <Info icon={faClock} label="Dernière connexion" valeur={fmtDateHeure(derniereConnexion)} couleur="#6366f1" />
                <Info icon={faEdit} label="Profil modifié le" valeur={fmtDateHeure(profil?.updatedAt)} couleur="#f97316" />
                <Info icon={emailVerifie ? faCheckCircle : faExclamationTriangle} label="Statut de l'email"
                  valeur={emailVerifie ? 'Vérifié' : 'Non vérifié'} couleur={emailVerifie ? '#16a34a' : '#d97706'} />

                {/* Mot de passe — modification après confirmation de l'email par code */}
                <button className="btn w-100 mt-3 d-flex align-items-center justify-content-center gap-2"
                  style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881', borderRadius: 10 }}
                  onClick={() => setModalMdp(true)} disabled={compteDifferent}>
                  <FontAwesomeIcon icon={faKey} /> Changer le mot de passe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {modalMdp && (
        <ModalMotDePasse email={profil?.email || utilisateurAuth?.email} onFermer={() => setModalMdp(false)} />
      )}
    </div>
  );
};

export default MonProfil;
