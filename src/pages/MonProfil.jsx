import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faEdit, faSave, faTimes, faSpinner,
  faEnvelope, faPhone, faIdCard, faAt,
} from '@fortawesome/free-solid-svg-icons';
import { profilAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';

const MonProfil = () => {
  const [profil, setProfil]       = useState(null);
  const [form, setForm]           = useState({});
  const [edition, setEdition]     = useState(false);
  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);

  useEffect(() => {
    profilAPI.get()
      .then(({ data }) => { setProfil(data); setForm(data); })
      .catch(() => toast.error('Impossible de charger le profil'))
      .finally(() => setChargement(false));
  }, []);

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

  const initiales = profil
    ? `${profil.prenom?.[0] ?? ''}${profil.nom?.[0] ?? ''}`.toUpperCase()
    : '?';

  if (chargement) return (
    <div className="text-center py-5">
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faUser} style={{ color: '#00d4aa' }} />
            Mon compte
          </h4>
          <p className="text-muted small mb-0">Vos informations personnelles</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
      {/* Avatar + actions */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
        <div className="card-body p-4 d-flex align-items-center gap-4 flex-wrap">
          <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0"
            style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #00d4aa, #203a43)', fontSize: 'var(--txt-avatar)' }}>
            {initiales}
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold fs-5" style={{ color: 'var(--bs-body-color)' }}>
              {profil?.prenom} {profil?.nom}
            </div>
            {profil?.pseudo && (
              <div className="text-muted small">@{profil.pseudo}</div>
            )}
            <div className="text-muted small mt-1">
              <FontAwesomeIcon icon={faEnvelope} className="me-1" style={{ color: '#00d4aa' }} />
              {profil?.email}
            </div>
          </div>
          {!edition && (
            <button className="btn d-flex align-items-center gap-2"
              style={{ background: '#00d4aa', color: '#fff', borderRadius: 10 }}
              onClick={() => setEdition(true)}>
              <FontAwesomeIcon icon={faEdit} /> Modifier
            </button>
          )}
        </div>
      </div>

      {/* Formulaire */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              {/* Prénom */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-muted">Prénom *</label>
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary">
                    <FontAwesomeIcon icon={faIdCard} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                  </span>
                  <input type="text" className="form-control"
                    value={form.prenom ?? ''}
                    onChange={e => setForm({ ...form, prenom: e.target.value })}
                    disabled={!edition} required />
                </div>
              </div>

              {/* Nom */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-muted">Nom *</label>
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary">
                    <FontAwesomeIcon icon={faIdCard} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                  </span>
                  <input type="text" className="form-control"
                    value={form.nom ?? ''}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    disabled={!edition} required />
                </div>
              </div>

              {/* Pseudo */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-muted">Pseudo (optionnel)</label>
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary">
                    <FontAwesomeIcon icon={faAt} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                  </span>
                  <input type="text" className="form-control"
                    placeholder="pseudonyme"
                    value={form.pseudo ?? ''}
                    onChange={e => setForm({ ...form, pseudo: e.target.value })}
                    disabled={!edition} />
                </div>
              </div>

              {/* Téléphone */}
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold text-muted">Téléphone (optionnel)</label>
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary">
                    <FontAwesomeIcon icon={faPhone} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                  </span>
                  <input type="tel" className="form-control"
                    placeholder="+237 6XX XXX XXX"
                    value={form.telephone ?? ''}
                    onChange={e => setForm({ ...form, telephone: e.target.value })}
                    disabled={!edition} />
                </div>
              </div>

              {/* Email — lecture seule */}
              <div className="col-12">
                <label className="form-label small fw-semibold text-muted">
                  Adresse email <span className="badge bg-secondary ms-1" style={{ fontSize: 'var(--txt-xs)' }}>non modifiable</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-body-secondary">
                    <FontAwesomeIcon icon={faEnvelope} className="text-muted" style={{ fontSize: 'var(--txt-base)' }} />
                  </span>
                  <input type="email" className="form-control" value={profil?.email ?? ''} disabled />
                </div>
                <small className="text-muted">L'adresse email ne peut pas être modifiée.</small>
              </div>
            </div>

            {edition && (
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn text-white d-flex align-items-center gap-2"
                  style={{ background: '#00d4aa', borderRadius: 10 }} disabled={sauvegarde}>
                  {sauvegarde
                    ? <FontAwesomeIcon icon={faSpinner} spin />
                    : <FontAwesomeIcon icon={faSave} />}
                  Enregistrer
                </button>
                <button type="button" className="btn btn-light d-flex align-items-center gap-2"
                  style={{ borderRadius: 10 }} onClick={annuler}>
                  <FontAwesomeIcon icon={faTimes} /> Annuler
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      </div>{/* fin scrollable */}
    </div>
  );
};

export default MonProfil;
