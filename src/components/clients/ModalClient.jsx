// Modal de création et modification d'un client
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faCamera, faUser, faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { clientsAPI, typesProduitAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';

const ModalClient = ({ client, professions = [], onFermer, onSucces }) => {
  const [form, setForm] = useState({
    nom: '', prenom: '', surnom: '', age: '', telephone: '',
    telephoneWhatsapp: '', profession: '', typeProduits: [], notes: '',
  });
  const [photo, setPhoto] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);

  // Types de produits dynamiques
  const [typesProduits, setTypesProduits] = useState([]);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [nouveauType, setNouveauType] = useState('');
  const [ajoutChargement, setAjoutChargement] = useState(false);
  const inputNouveauRef = useRef(null);

  // Charger les types depuis l'API au montage
  useEffect(() => {
    typesProduitAPI.getAll()
      .then(({ data }) => setTypesProduits(data.map(t => t.nom)))
      .catch(() => toast.error('Erreur lors du chargement des types de produits'));
  }, []);

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

  // Focus automatique sur le champ nouveau type
  useEffect(() => {
    if (ajoutEnCours) inputNouveauRef.current?.focus();
  }, [ajoutEnCours]);

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

  const handleTypeProduit = (type) => {
    setForm(prev => ({
      ...prev,
      typeProduits: prev.typeProduits.includes(type)
        ? prev.typeProduits.filter(t => t !== type)
        : [...prev.typeProduits, type],
    }));
  };

  // Sauvegarder un nouveau type dans la BDD et l'ajouter localement
  const confirmerNouveauType = async () => {
    const nom = nouveauType.trim();
    if (!nom) return;

    if (typesProduits.map(t => t.toLowerCase()).includes(nom.toLowerCase())) {
      toast.warning('Ce type existe déjà');
      return;
    }

    setAjoutChargement(true);
    try {
      const reponse = await typesProduitAPI.ajouter(nom);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setTypesProduits(prev => [...prev, nom].sort((a, b) => a.localeCompare(b, 'fr')));
      setForm(prev => ({ ...prev, typeProduits: [...prev.typeProduits, nom] }));
      setNouveauType('');
      setAjoutEnCours(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'ajout du type");
    } finally {
      setAjoutChargement(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
                  <label className="form-label small fw-semibold text-muted">Profession *</label>
                  {professions.length > 0 && (
                    <select
                      className="form-select mb-2"
                      size={6}
                      value={professions.includes(form.profession) ? form.profession : '__autre__'}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        profession: e.target.value === '__autre__' ? '' : e.target.value,
                      }))}
                    >
                      {professions.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="__autre__">— Nouvelle profession —</option>
                    </select>
                  )}
                  {(!professions.includes(form.profession)) && (
                    <input
                      name="profession"
                      className="form-control"
                      value={form.profession}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Commerçant, Fonctionnaire..."
                    />
                  )}
                </div>


              </div>


              {/* Types de produits */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Types de produits</label>
                {/* Chips — scrollables si plus de 20 types */}
                <div
                  className="d-flex flex-wrap gap-2 mb-2"
                  style={typesProduits.length > 20
                    ? { maxHeight: 110, overflowY: 'auto', padding: '4px 2px' }
                    : {}}
                >
                  {typesProduits.map(type => (
                    <button
                      key={type}
                      type="button"
                      className="btn btn-sm"
                      style={{
                        borderRadius: 20,
                        background: form.typeProduits.includes(type) ? '#00d4aa' : '#f0f4f8',
                        color: form.typeProduits.includes(type) ? '#fff' : '#203a43',
                        border: 'none',
                        fontSize: 12,
                      }}
                      onClick={() => handleTypeProduit(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {/* Ajout d'un nouveau type — toujours visible hors du scroll */}
                {ajoutEnCours ? (
                  <div className="d-flex align-items-center gap-1">
                    <input
                      ref={inputNouveauRef}
                      type="text"
                      className="form-control form-control-sm"
                      style={{ width: 130, borderRadius: 20, fontSize: 12 }}
                      placeholder="Nouveau type..."
                      value={nouveauType}
                      onChange={(e) => setNouveauType(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); confirmerNouveauType(); }
                        if (e.key === 'Escape') { setAjoutEnCours(false); setNouveauType(''); }
                      }}
                    />
                    <button type="button" className="btn btn-sm"
                      style={{ borderRadius: 20, background: '#00d4aa', color: '#fff', fontSize: 12 }}
                      onClick={confirmerNouveauType} disabled={ajoutChargement}>
                      {ajoutChargement
                        ? <FontAwesomeIcon icon={faSpinner} spin />
                        : <FontAwesomeIcon icon={faCheck} />}
                    </button>
                    <button type="button" className="btn btn-sm"
                      style={{ borderRadius: 20, background: 'var(--bs-secondary-bg)', color: 'var(--bs-body-color)', fontSize: 12 }}
                      onClick={() => { setAjoutEnCours(false); setNouveauType(''); }}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-sm"
                    style={{ borderRadius: 20, background: '#e8f5f3', color: '#00a881', border: '1.5px dashed #00d4aa', fontSize: 12 }}
                    onClick={() => setAjoutEnCours(true)}>
                    <FontAwesomeIcon icon={faPlus} className="me-1" />Nouveau type
                  </button>
                )}
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
