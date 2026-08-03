// Modal formulaire fournisseur contact — création / modification
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { fournisseursContactsAPI, typesProduitAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';

const ModalFournisseurForm = ({ contact = null, onFermer, onSucces }) => {
  const [typesProduits, setTypesProduits] = useState([]);
  const [ajoutEnCours, setAjoutEnCours]   = useState(false);
  const [nouveauType, setNouveauType]     = useState('');
  const [ajoutCharg, setAjoutCharg]       = useState(false);
  const [envoi, setEnvoi]                 = useState(false);
  const inputTypeRef = useRef(null);
  const [form, setForm] = useState({
    nom:               contact?.nom               || '',
    telephone:         contact?.telephone          || '',
    telephoneWhatsapp: contact?.telephoneWhatsapp  || '',
    ville:             contact?.ville              || '',
    autresInfos:       contact?.autresInfos         || '',
    typesProduits:     contact?.typesProduits      || [],
  });

  useEffect(() => {
    typesProduitAPI.getAll()
      .then(({ data }) => setTypesProduits(data.map(t => t.nom)))
      .catch(() => {});
  }, []);

  useEffect(() => { if (ajoutEnCours) inputTypeRef.current?.focus(); }, [ajoutEnCours]);

  const toggleType = (t) => setForm(f => ({
    ...f,
    typesProduits: f.typesProduits.includes(t)
      ? f.typesProduits.filter(x => x !== t)
      : [...f.typesProduits, t],
  }));

  const confirmerNouveauType = async () => {
    const nom = nouveauType.trim();
    if (!nom) return;
    if (typesProduits.map(t => t.toLowerCase()).includes(nom.toLowerCase())) {
      toast.warning('Ce type existe déjà'); return;
    }
    setAjoutCharg(true);
    try {
      const reponse = await typesProduitAPI.ajouter(nom);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setTypesProduits(prev => [...prev, nom].sort((a, b) => a.localeCompare(b, 'fr')));
      setForm(f => ({ ...f, typesProduits: [...f.typesProduits, nom] }));
      setNouveauType(''); setAjoutEnCours(false);
    } catch { toast.error("Erreur lors de l'ajout"); }
    finally { setAjoutCharg(false); }
  };

  const soumettre = async (e) => {
    e.preventDefault();
    if (!form.nom) { toast.error('Le nom est requis'); return; }
    setEnvoi(true);
    try {
      const data = { ...form, typesProduits: JSON.stringify(form.typesProduits) };
      const reponse = contact
        ? await fournisseursContactsAPI.update(contact.id, data)
        : await fournisseursContactsAPI.create(data);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      toast.success(contact ? 'Fournisseur modifié' : 'Fournisseur ajouté');
      onSucces();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setEnvoi(false); }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--bs-body-color)' }}>
              {contact ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={soumettre} id="form-fournisseur">
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Nom complet *</label>
                <input className="form-control" required value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">Téléphone</label>
                  <input className="form-control" type="tel" value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-semibold text-muted">WhatsApp (optionnel)</label>
                  <input className="form-control" type="tel" value={form.telephoneWhatsapp}
                    onChange={e => setForm(f => ({ ...f, telephoneWhatsapp: e.target.value }))} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Ville</label>
                <input className="form-control" value={form.ville}
                  onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Autres informations</label>
                <textarea className="form-control" rows={2} value={form.autresInfos}
                  onChange={e => setForm(f => ({ ...f, autresInfos: e.target.value }))} />
              </div>
              <div className="mb-1">
                <label className="form-label small fw-semibold text-muted">Types de produits</label>
                <div className="d-flex flex-wrap gap-2 mb-2"
                  style={typesProduits.length > 20 ? { maxHeight: 110, overflowY: 'auto', padding: '4px 2px' } : {}}>
                  {typesProduits.map(t => (
                    <button key={t} type="button" className="btn btn-sm"
                      style={{ borderRadius: 20, fontSize: 'var(--txt-base)', background: form.typesProduits.includes(t) ? '#00d4aa' : '#f0f4f8', color: form.typesProduits.includes(t) ? '#fff' : '#203a43' }}
                      onClick={() => toggleType(t)}>{t}</button>
                  ))}
                </div>
                {ajoutEnCours ? (
                  <div className="d-flex align-items-center gap-1">
                    <input ref={inputTypeRef} type="text" className="form-control form-control-sm"
                      style={{ width: 130, borderRadius: 20, fontSize: 'var(--txt-base)' }}
                      placeholder="Nouveau type..."
                      value={nouveauType} onChange={e => setNouveauType(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); confirmerNouveauType(); }
                        if (e.key === 'Escape') { setAjoutEnCours(false); setNouveauType(''); }
                      }} />
                    <button type="button" className="btn btn-sm text-white"
                      style={{ background: '#00d4aa', borderRadius: 20 }}
                      disabled={ajoutCharg} onClick={confirmerNouveauType}>
                      {ajoutCharg ? <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 'var(--txt-sm)' }} /> : <FontAwesomeIcon icon={faCheck} style={{ fontSize: 'var(--txt-sm)' }} />}
                    </button>
                    <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 20 }}
                      onClick={() => { setAjoutEnCours(false); setNouveauType(''); }}>
                      <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-sm"
                    style={{ borderRadius: 20, background: '#f0f4f8', color: '#203a43', fontSize: 'var(--txt-base)' }}
                    onClick={() => setAjoutEnCours(true)}>
                    <FontAwesomeIcon icon={faPlus} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />Nouveau type
                  </button>
                )}
              </div>
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer} disabled={envoi}>Annuler</button>
            <button type="submit" form="form-fournisseur" className="btn text-white"
              style={{ background: '#00d4aa', borderRadius: 10 }} disabled={envoi}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : (contact ? 'Enregistrer' : 'Ajouter')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalFournisseurForm;
