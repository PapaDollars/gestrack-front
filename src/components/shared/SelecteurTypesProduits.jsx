// Sélecteur de types de produits (chips) — réutilisé pour la fiche fournisseur (choix multiple)
// et la catégorie/type d'un produit (choix unique), pour éviter de dupliquer ce bloc partout.
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faTimes, faSpinner, faTrash, faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import { typesProduitAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import ModalConfirmation from '@/components/shared/ModalConfirmation';

const SelecteurTypesProduits = ({ value, onChange, multiple = false, label = 'Types de produits' }) => {
  const [types, setTypes]                 = useState([]); // [{id, nom}]
  const [chargementTypes, setChargementTypes] = useState(true);
  const [ajoutEnCours, setAjoutEnCours]    = useState(false);
  const [nouveauType, setNouveauType]      = useState('');
  const [ajoutCharg, setAjoutCharg]        = useState(false);
  const [menuOuvert, setMenuOuvert]        = useState(null); // id du type dont le menu contextuel est ouvert
  const [confirmSuppr, setConfirmSuppr]    = useState(null); // {id, nom}
  const [enSuppression, setEnSuppression]  = useState(false);
  const [rechercheType, setRechercheType]  = useState('');
  const [typeEnEdition, setTypeEnEdition]  = useState(null); // {id, nom} en cours de renommage
  const [nomEdition, setNomEdition]        = useState('');
  const [editionCharg, setEditionCharg]    = useState(false);
  const inputTypeRef = useRef(null);
  const inputEditionRef = useRef(null);
  const conteneurRef  = useRef(null);
  const menuRef = useRef(null); // menu contextuel actuellement ouvert

  // Toutes les catégories commencent par une majuscule, même saisies en minuscule.
  const capitaliser = (s) => s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  const charger = () => {
    setChargementTypes(true);
    typesProduitAPI.getAll()
      .then(({ data }) => setTypes(data.map(t => ({ id: t.id, nom: t.nom })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))))
      .catch(() => {})
      .finally(() => setChargementTypes(false));
  };
  useEffect(() => { charger(); }, []);

  useEffect(() => { if (ajoutEnCours) inputTypeRef.current?.focus(); }, [ajoutEnCours]);
  useEffect(() => { if (typeEnEdition) inputEditionRef.current?.focus(); }, [typeEnEdition]);

  useEffect(() => {
    const h = (e) => { if (conteneurRef.current && !conteneurRef.current.contains(e.target)) setMenuOuvert(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Le menu contextuel (Modifier/Supprimer) peut s'ouvrir sur une puce en bas de la zone
  // défilante des types — sans ça, il resterait coupé/invisible sous le bord de la zone.
  useEffect(() => {
    if (menuOuvert && menuRef.current) {
      menuRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [menuOuvert]);

  const estSelectionne = (nom) => multiple ? (value || []).includes(nom) : value === nom;

  const typesAffiches = rechercheType.trim()
    ? types.filter(t => t.nom.toLowerCase().includes(rechercheType.trim().toLowerCase()))
    : types;

  const toggleType = (nom) => {
    if (multiple) {
      const arr = value || [];
      onChange(arr.includes(nom) ? arr.filter(x => x !== nom) : [...arr, nom]);
    } else {
      onChange(value === nom ? '' : nom);
    }
  };

  const confirmerNouveauType = async () => {
    const nom = capitaliser(nouveauType.trim());
    if (!nom) return;
    if (types.map(t => t.nom.toLowerCase()).includes(nom.toLowerCase())) {
      toast.warning('Ce type existe déjà'); return;
    }
    setAjoutCharg(true);
    try {
      const reponse = await typesProduitAPI.ajouter(nom);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      const nouveauTypeCree = reponse.data;
      setTypes(prev => [...prev, nouveauTypeCree].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')));
      toggleType(nouveauTypeCree.nom);
      setNouveauType(''); setAjoutEnCours(false);
    } catch { toast.error("Erreur lors de l'ajout"); }
    finally { setAjoutCharg(false); }
  };

  const confirmerModification = async () => {
    if (!typeEnEdition) return;
    const nom = capitaliser(nomEdition.trim());
    if (!nom) return;
    if (types.some(t => t.id !== typeEnEdition.id && t.nom.toLowerCase() === nom.toLowerCase())) {
      toast.warning('Ce type existe déjà'); return;
    }
    setEditionCharg(true);
    try {
      const reponse = await typesProduitAPI.modifier(typeEnEdition.id, nom);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      const typeModifie = reponse.data;
      setTypes(prev => prev.map(t => t.id === typeModifie.id ? typeModifie : t).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')));
      // L'ancien nom pouvait être sélectionné dans le formulaire courant — on le fait suivre
      // le renommage pour que la sélection reste cohérente avec la liste affichée.
      const ancienNom = typeEnEdition.nom;
      if (multiple) {
        if ((value || []).includes(ancienNom)) {
          onChange((value || []).map(x => x === ancienNom ? typeModifie.nom : x));
        }
      } else if (value === ancienNom) {
        onChange(typeModifie.nom);
      }
      toast.success('Type modifié');
      setTypeEnEdition(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur lors de la modification'); }
    finally { setEditionCharg(false); }
  };

  const supprimerType = async () => {
    if (!confirmSuppr) return;
    setEnSuppression(true);
    try {
      const reponse = await typesProduitAPI.supprimer(confirmSuppr.id);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setTypes(prev => prev.filter(t => t.id !== confirmSuppr.id));
      if (multiple) onChange((value || []).filter(x => x !== confirmSuppr.nom));
      else if (value === confirmSuppr.nom) onChange('');
      toast.success('Type supprimé');
      setConfirmSuppr(null);
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setEnSuppression(false); }
  };

  return (
    <div className="mb-1" ref={conteneurRef}>
      <div className="d-flex align-items-center justify-content-start gap-2 mb-1 flex-wrap">
        {label && <label className="form-label small fw-semibold text-muted mb-0">{label}</label>}
        {types.length > 8 && (
          <div className="input-group input-group-sm" style={{ maxWidth: 150 }}>
            <span className="input-group-text bg-body-secondary border-end-0">
              <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 9 }} />
            </span>
            <input type="text" className="form-control border-start-0" placeholder="Chercher un type..." style={{ fontSize: 'var(--txt-sm)' }}
              value={rechercheType} onChange={e => setRechercheType(e.target.value)} />
          </div>
        )}
      </div>
      <div className="d-flex flex-wrap gap-2 mb-2"
        style={types.length > 20 ? { maxHeight: 110, overflowY: 'auto', padding: '4px 2px' } : {}}>
        {chargementTypes ? (
          <div className="text-muted small py-1">
            <FontAwesomeIcon icon={faSpinner} spin className="me-2" />Chargement des types...
          </div>
        ) : typesAffiches.length === 0 && (
          <div className="text-muted small fst-italic py-1">Aucun type ne correspond à "{rechercheType}"</div>
        )}
        {typesAffiches.map(t => (
          <div key={t.id} className="position-relative">
            {typeEnEdition?.id === t.id ? (
              <div className="d-flex align-items-center gap-1">
                <input ref={inputEditionRef} type="text" className="form-control form-control-sm"
                  style={{ width: 130, borderRadius: 20, fontSize: 'var(--txt-base)' }}
                  value={nomEdition} onChange={e => setNomEdition(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); confirmerModification(); }
                    if (e.key === 'Escape') setTypeEnEdition(null);
                  }} />
                <button type="button" className="btn btn-sm text-white"
                  style={{ background: '#00d4aa', borderRadius: 20 }}
                  disabled={editionCharg} onClick={confirmerModification}>
                  {editionCharg ? <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 'var(--txt-sm)' }} /> : <FontAwesomeIcon icon={faCheck} style={{ fontSize: 'var(--txt-sm)' }} />}
                </button>
                <button type="button" className="btn btn-sm btn-light" style={{ borderRadius: 20 }}
                  onClick={() => setTypeEnEdition(null)}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-sm"
                style={{ borderRadius: 20, fontSize: 'var(--txt-base)', background: estSelectionne(t.nom) ? '#00d4aa' : '#f0f4f8', color: estSelectionne(t.nom) ? '#fff' : '#203a43' }}
                onClick={() => toggleType(t.nom)}
                onContextMenu={e => { e.preventDefault(); setMenuOuvert(menuOuvert === t.id ? null : t.id); }}>
                {t.nom}
              </button>
            )}
            {menuOuvert === t.id && (
              <div ref={menuRef} className="position-absolute shadow-lg rounded-2 overflow-hidden z-3"
                style={{ top: '100%', left: 0, marginTop: 2, background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)', minWidth: 130 }}>
                <button type="button" className="btn btn-sm w-100 text-start d-flex align-items-center gap-2"
                  style={{ color: '#6366f1', borderRadius: 0 }}
                  onClick={() => { setTypeEnEdition(t); setNomEdition(t.nom); setMenuOuvert(null); }}>
                  <FontAwesomeIcon icon={faEdit} style={{ fontSize: 11 }} /> Modifier
                </button>
                <button type="button" className="btn btn-sm w-100 text-start d-flex align-items-center gap-2"
                  style={{ color: '#ef4444', borderRadius: 0 }}
                  onClick={() => { setConfirmSuppr(t); setMenuOuvert(null); }}>
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} /> Supprimer
                </button>
              </div>
            )}
          </div>
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
      <div className="text-muted mt-1" style={{ fontSize: 'var(--txt-xs)' }}>Clic droit sur un type pour le modifier ou le supprimer</div>

      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer le type "${confirmSuppr.nom}" ? Il ne sera plus proposé dans les listes, mais les fiches qui l'utilisent déjà le conservent.`}
          onConfirmer={supprimerType}
          chargement={enSuppression}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
    </div>
  );
};

export default SelecteurTypesProduits;
