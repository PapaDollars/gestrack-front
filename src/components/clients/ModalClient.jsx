// Modal de création et modification d'un client
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faCamera, faUser, faPlus, faCheck, faSearch } from '@fortawesome/free-solid-svg-icons';
import { clientsAPI } from '@/services/api';
import { toast } from 'react-toastify';
import SelecteurTypesProduits from '@/components/shared/SelecteurTypesProduits';

const ModalClient = ({ client, professions = [], onFermer, onSucces }) => {
  const [form, setForm] = useState({
    nom: '', prenom: '', surnom: '', age: '', telephone: '',
    telephoneWhatsapp: '', profession: '', typeProduits: [], notes: '',
  });
  const [photo, setPhoto] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);

  // Profession — recherche + ajout d'une nouvelle profession (toujours accessible, même en recherche)
  const [rechercheProfession, setRechercheProfession] = useState('');
  const [ajoutProfessionEnCours, setAjoutProfessionEnCours] = useState(false);
  const [nouvelleProfession, setNouvelleProfession] = useState('');
  const inputProfessionRef = useRef(null);

  useEffect(() => { if (ajoutProfessionEnCours) inputProfessionRef.current?.focus(); }, [ajoutProfessionEnCours]);

  const professionsAffichees = rechercheProfession.trim()
    ? professions.filter(p => p.toLowerCase().includes(rechercheProfession.trim().toLowerCase()))
    : professions;

  const choisirProfession = (p) => {
    setForm(prev => ({ ...prev, profession: p }));
    setAjoutProfessionEnCours(false);
  };

  const confirmerNouvelleProfession = () => {
    const nom = nouvelleProfession.trim();
    if (!nom) return;
    setForm(prev => ({ ...prev, profession: nom }));
    setNouvelleProfession('');
    setAjoutProfessionEnCours(false);
  };

  // Remplir le formulaire si modification
  useEffect(() => {
    if (client) {
      setForm({
        nom: client.nom || '',
        prenom: client.prenom || '',
        surnom: client.surnom || '',
        age: client.age || '',
        telephone: client.telephone || '',
        telephoneWhatsapp: client.telephoneWhatsapp || '',
        profession: client.profession || '',
        typeProduits: client.typeProduits || [],
        notes: client.notes || '',
      });
      if (client.photo) setApercu(client.photo);
    }
  }, [client]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoto = (e) => {
    const fichier = e.target.files[0];
    if (fichier) {
      setPhoto(fichier);
      setApercu(URL.createObjectURL(fichier));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.profession) { toast.error('La profession est requise'); return; }
    setChargement(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'typeProduits') {
          formData.append(key, JSON.stringify(val));
        } else {
          formData.append(key, val);
        }
      });
      if (photo) formData.append('photo', photo);

      if (client) {
        await clientsAPI.update(client.id, formData);
        toast.success('Client mis à jour avec succès');
      } else {
        await clientsAPI.create(formData);
        toast.success('Client créé avec succès');
      }
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>

          {/* En-tête */}
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h5 className="modal-title fw-semibold" style={{ color: 'var(--bs-body-color)' }}>
              {client ? 'Modifier le client' : 'Nouveau client'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-body px-4">
            <form onSubmit={handleSubmit} id="form-client">

              {/* Photo de profil */}
              <div className="text-center mb-4">
                <label htmlFor="photo-upload" className="cursor-pointer" style={{ cursor: 'pointer' }}>
                  <div className="position-relative d-inline-block">
                    {apercu ? (
                      <img src={apercu} alt="Aperçu" className="rounded-circle object-fit-cover"
                        style={{ width: 90, height: 90 }} />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: 90, height: 90, background: '#e8f5f3' }}>
                        <FontAwesomeIcon icon={faUser} style={{ color: '#00d4aa', fontSize: 32 }} />
                      </div>
                    )}
                    <div className="position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: 28, height: 28, background: '#00d4aa', color: '#fff' }}>
                      <FontAwesomeIcon icon={faCamera} style={{ fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="text-muted small mt-2">Photo (optionnel)</div>
                </label>
                <input type="file" id="photo-upload" accept="image/*" onChange={handlePhoto} className="d-none" />
              </div>

              {/* Nom et Prénom */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Prénom *</label>
                  <input name="prenom" className="form-control" value={form.prenom} onChange={handleChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Nom *</label>
                  <input name="nom" className="form-control" value={form.nom} onChange={handleChange} required />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6 mb-3">
                  
                  {/* Surnom */}
                  <label className="form-label small fw-semibold text-muted">Surnom (optionnel)</label>
                  <input name="surnom" className="form-control" value={form.surnom} onChange={handleChange} placeholder="Ex: Mami Bello, Tonton Albert..." />
                </div>
                <div className="col-6">

                  {/* Âge et Profession */}
                  <label className="form-label small fw-semibold text-muted">Âge (optionnel)</label>
                  <input name="age" type="number" min="1" max="120" className="form-control" value={form.age} onChange={handleChange} />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <div className="row g-3 mb-3">
                    <div className="col-12">

                      {/* Téléphones */}
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted">Téléphone *</label>
                        <input name="telephone" type="tel" className="form-control" value={form.telephone} onChange={handleChange} required placeholder="6XXXXXXXX" />
                      </div>
                      <div className="">
                        <label className="form-label small fw-semibold text-muted">WhatsApp (optionnel)</label>
                        <input name="telephoneWhatsapp" type="tel" className="form-control" value={form.telephoneWhatsapp} onChange={handleChange} placeholder="6XXXXXXXX" />
                      </div>

                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="d-flex align-items-center justify-content-start gap-2 mb-1 flex-wrap">
                    <label className="form-label small fw-semibold text-muted mb-0">Profession *</label>
                    {professions.length > 0 && (
                      <div className="input-group input-group-sm" style={{ maxWidth: 150 }}>
                        <span className="input-group-text bg-body-secondary border-end-0">
                          <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 11 }} />
                        </span>
                        <input type="text" className="form-control border-start-0" placeholder="Rechercher..."
                          value={rechercheProfession} onChange={e => setRechercheProfession(e.target.value)} />
                      </div>
                    )}
                  </div>
                  {form.profession && (
                    <div className="d-flex align-items-center justify-content-between px-2 py-1 rounded-2 mb-1"
                      style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid #00d4aa' }}>
                      <span className="fw-semibold" style={{ color: '#00a881', fontSize: 13 }}>{form.profession}</span>
                      <button type="button" className="btn btn-sm p-0 flex-shrink-0"
                        style={{ width: 20, height: 20, color: '#00a881' }}
                        onClick={() => setForm(prev => ({ ...prev, profession: '' }))}>
                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: 11 }} />
                      </button>
                    </div>
                  )}
                  {professions.length > 0 && (
                    <>
                      <div className="rounded-2 border mb-2"
                        style={{ maxHeight: 140, overflowY: 'auto', background: 'var(--bs-body-bg)' }}>
                        {professionsAffichees.length === 0 && (
                          <div className="text-muted small fst-italic px-2 py-2">Aucun résultat</div>
                        )}
                        {professionsAffichees.map(p => (
                          <div key={p} onClick={() => choisirProfession(p)}
                            className="px-2 py-1"
                            style={{
                              cursor: 'pointer', fontSize: 13,
                              background: form.profession === p ? 'rgba(0,212,170,0.12)' : 'transparent',
                              color: form.profession === p ? '#00a881' : 'var(--bs-body-color)',
                              fontWeight: form.profession === p ? 600 : 400,
                            }}>
                            {p}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {/* Nouvelle profession — bouton compact, toujours accessible même en recherche */}
                  {ajoutProfessionEnCours ? (
                    <div className="d-flex align-items-center gap-1">
                      <input ref={inputProfessionRef} type="text" className="form-control form-control-sm"
                        style={{ borderRadius: 20, fontSize: 12 }}
                        placeholder="Nouvelle profession..."
                        value={nouvelleProfession} onChange={e => setNouvelleProfession(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); confirmerNouvelleProfession(); }
                          if (e.key === 'Escape') { setAjoutProfessionEnCours(false); setNouvelleProfession(''); }
                        }} />
                      <button type="button" className="btn btn-sm flex-shrink-0"
                        style={{ borderRadius: 20, background: '#00d4aa', color: '#fff' }}
                        onClick={confirmerNouvelleProfession}>
                        <FontAwesomeIcon icon={faCheck} style={{ fontSize: 11 }} />
                      </button>
                      <button type="button" className="btn btn-sm flex-shrink-0"
                        style={{ borderRadius: 20, background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)' }}
                        onClick={() => { setAjoutProfessionEnCours(false); setNouvelleProfession(''); }}>
                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: 11 }} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-sm"
                      style={{ borderRadius: 20, background: '#e8f5f3', color: '#00a881', border: '1.5px dashed #00d4aa', fontSize: 12 }}
                      onClick={() => setAjoutProfessionEnCours(true)}>
                      <FontAwesomeIcon icon={faPlus} className="me-1" style={{ fontSize: 10 }} />
                      Nouvelle profession
                    </button>
                  )}
                  {!form.profession && (
                    <div className="text-danger" style={{ fontSize: 11 }}>Profession requise</div>
                  )}
                </div>


              </div>


              {/* Types de produits */}
              <div className="mb-3">
                <SelecteurTypesProduits
                  value={form.typeProduits}
                  onChange={typeProduits => setForm(prev => ({ ...prev, typeProduits }))}
                  multiple
                />
              </div>

              {/* Notes */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Notes (optionnel)</label>
                <textarea name="notes" rows={3} className="form-control" value={form.notes} onChange={handleChange} placeholder="Informations supplémentaires..." />
              </div>
            </form>
          </div>

          {/* Pied */}
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={chargement}>Annuler</button>
            <button
              type="submit"
              form="form-client"
              className="btn text-white"
              style={{ background: '#00d4aa', minWidth: 120 }}
              disabled={chargement}
            >
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (client ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalClient;
