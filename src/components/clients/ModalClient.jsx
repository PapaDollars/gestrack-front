// Modal de création et modification d'un client
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faCamera, faUser } from '@fortawesome/free-solid-svg-icons';
import { clientsAPI } from '../../services/api';
import { toast } from 'react-toastify';

// Types de produits disponibles
const TYPES_PRODUITS = ['Alimentaire', 'Électronique', 'Vêtements', 'Mobilier', 'Médicaments', 'Cosmétiques', 'Agriculture', 'Construction', 'Autre'];

const ModalClient = ({ client, onFermer, onSucces }) => {
  const [form, setForm] = useState({
    nom: '', prenom: '', age: '', telephone: '',
    telephoneWhatsapp: '', profession: '', typeProduits: [], notes: '',
  });
  const [photo, setPhoto] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);

  // Remplir le formulaire si modification
  useEffect(() => {
    if (client) {
      setForm({
        nom: client.nom || '',
        prenom: client.prenom || '',
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

  const handleTypeProduit = (type) => {
    setForm(prev => ({
      ...prev,
      typeProduits: prev.typeProduits.includes(type)
        ? prev.typeProduits.filter(t => t !== type)
        : [...prev.typeProduits, type],
    }));
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
        <div className="modal-content border-0" style={{ borderRadius: 16 }}>

          {/* En-tête */}
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h5 className="modal-title fw-semibold" style={{ color: '#203a43' }}>
              {client ? 'Modifier le client' : 'Nouveau client'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle" onClick={onFermer}>
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
                  <label className="form-label small fw-semibold text-muted">Nom *</label>
                  <input name="nom" className="form-control" value={form.nom} onChange={handleChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Prénom *</label>
                  <input name="prenom" className="form-control" value={form.prenom} onChange={handleChange} required />
                </div>
              </div>

              {/* Âge et Profession */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Âge (optionnel)</label>
                  <input name="age" type="number" min="1" max="120" className="form-control" value={form.age} onChange={handleChange} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Profession *</label>
                  <input name="profession" className="form-control" value={form.profession} onChange={handleChange} required placeholder="Ex: Commerçant, Fonctionnaire..." />
                </div>
              </div>

              {/* Téléphones */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Téléphone *</label>
                  <input name="telephone" type="tel" className="form-control" value={form.telephone} onChange={handleChange} required placeholder="6XXXXXXXX" />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">WhatsApp (optionnel)</label>
                  <input name="telephoneWhatsapp" type="tel" className="form-control" value={form.telephoneWhatsapp} onChange={handleChange} placeholder="6XXXXXXXX" />
                </div>
              </div>

              {/* Types de produits */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Types de produits</label>
                <div className="d-flex flex-wrap gap-2">
                  {TYPES_PRODUITS.map(type => (
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
