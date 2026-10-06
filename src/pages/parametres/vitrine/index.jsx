// Paramètres › Vitrine : liens publics (catalogue, boutique)
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave, faStore, faEye, faEyeSlash, faCopy, faCheck, faLock, faEdit } from '@fortawesome/free-solid-svg-icons';
import { parametresAPI, estMisEnAttente } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';
import ModalPrixCatalogue from '@/pages/parametres/vitrine/modals/ModalPrixCatalogue';
import { ROUTES, urlAbsolue } from '@/utils/url/frontend';

// ── Section vitrine (liens publics) ─────────────────────────────────────────
const slugify = (str) => (str || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SectionVitrine = () => {
  const { parametres, setParametres, chargement: chargementParametres } = useParametres();
  const [formV, setFormV] = useState({ nomEntreprise: '', motDePasseVitrine: '', catalogueActif: false });
  const [hasMotDePasse, setHasMotDePasse] = useState(false);
  const [montrerMdp, setMontrerMdp]       = useState(false);
  const [chargement, setChargement]       = useState(false);
  const [copie, setCopie]                 = useState('');
  const [erreurSlug, setErreurSlug]       = useState('');
  const [modalPrix, setModalPrix]         = useState(false);
  const slug    = slugify(formV.nomEntreprise);

  useEffect(() => {
    setFormV({
      nomEntreprise:     parametres.nomEntreprise  || '',
      motDePasseVitrine: '',
      catalogueActif:    parametres.catalogueActif || false,
    });
    setHasMotDePasse(parametres.hasMotDePasseVitrine || false);
  }, [parametres]);

  const copier = (url, key) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopie(key);
      setTimeout(() => setCopie(''), 2000);
    });
  };

  const sauvegarder = async () => {
    setErreurSlug('');
    setChargement(true);
    try {
      const reponse = await parametresAPI.update({
        nomEntreprise:     formV.nomEntreprise,
        motDePasseVitrine: formV.motDePasseVitrine,
        catalogueActif:    formV.catalogueActif,
      });
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      const { data } = reponse;
      setParametres(data);
      setHasMotDePasse(data.hasMotDePasseVitrine);
      setFormV(f => ({ ...f, motDePasseVitrine: '' }));
      toast.success('Vitrine mise à jour');
    } catch (err) {
      if (err.response?.data?.code === 'SLUG_TAKEN') {
        setErreurSlug('Ce nom d\'entreprise est déjà utilisé, choisissez un autre.');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally { setChargement(false); }
  };

  const lienCatalogue  = slug ? urlAbsolue(ROUTES.catalogue(slug)) : '';
  const lienBoutique   = slug ? urlAbsolue(ROUTES.boutiquePublique(slug)) : '';
  const boutiqueActive = !!(slug && (hasMotDePasse || formV.motDePasseVitrine));

  const BoutonCopier = ({ urlKey, url }) => (
    <button className="btn btn-sm flex-shrink-0"
      style={{ background: copie === urlKey ? '#dcfce7' : 'var(--bs-secondary-bg)', color: copie === urlKey ? '#16a34a' : 'var(--bs-body-color)' }}
      onClick={() => copier(url, urlKey)}>
      <FontAwesomeIcon icon={copie === urlKey ? faCheck : faCopy} />
    </button>
  );

  // Tant que les vrais paramètres du compte ne sont pas encore arrivés, ce formulaire ne doit
  // ni afficher les valeurs par défaut (vide/désactivé) comme si c'était l'état réel, ni
  // permettre "Enregistrer" — ça écraserait sinon nomEntreprise/catalogueActif déjà configurés
  // avec des valeurs vides et casserait les deux liens publics.
  if (chargementParametres) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#00d4aa' }} />
      </div>
    );
  }

  return (
    <div className="row g-4">

      {/* ── Nom de l'entreprise — commun aux deux liens ── */}
      <div className="col-12">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>
              Nom de l'entreprise
            </h6>
            <small className="text-muted d-block mb-3">
              Utilisé dans l'URL des deux liens. Si vous le modifiez, les deux URLs changent automatiquement.
            </small>
            <input className="form-control" placeholder="Ex: Boutique Daniel" autoFocus
              value={formV.nomEntreprise}
              onChange={e => setFormV(f => ({ ...f, nomEntreprise: e.target.value }))} />
            {slug && (
              <div className="mt-2 small d-flex flex-column gap-1" style={{ color: '#6b7280' }}>
                <span><FontAwesomeIcon icon={faStore} className="me-1" style={{ color: '#00d4aa' }} />
                  {urlAbsolue(ROUTES.catalogue(''))}<strong style={{ color: '#00a881' }}>{slug}</strong>
                </span>
                <span><FontAwesomeIcon icon={faLock} className="me-1" style={{ color: '#6366f1' }} />
                  {urlAbsolue(ROUTES.boutiquePublique(''))}<strong style={{ color: '#6366f1' }}>{slug}</strong>
                </span>
              </div>
            )}
            {erreurSlug && <div className="text-danger small mt-1">{erreurSlug}</div>}
          </div>
        </div>
      </div>

      {/* ── Catalogue public + Boutique protégée côte à côte ── */}
      <div className="col-12 col-md-6">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
              <div>
                <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>
                  <FontAwesomeIcon icon={faStore} className="me-2" style={{ color: '#00d4aa' }} />
                  Catalogue public
                </h6>
              </div>
              <div className="form-check form-switch flex-shrink-0">
                <input className="form-check-input" type="checkbox" id="catalogueActif"
                  checked={formV.catalogueActif}
                  onChange={e => setFormV(f => ({ ...f, catalogueActif: e.target.checked }))} />
              </div>
            </div>
            <ul className="mb-0 small text-muted ps-3" style={{ lineHeight: 1.8 }}>
              <li>Accessible par <strong>quiconque</strong> possède le lien</li>
              <li>Affiche les <strong>produits de la boutique</strong> avec photo, nom et catégorie</li>
              <li>Les <strong>stocks</strong> ne sont <strong>pas visibles</strong></li>
            </ul>
            {formV.catalogueActif && (
              <div className="d-flex align-items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
                <span className="small" style={{ color: 'var(--bs-body-color)' }}>Afficher le prix au public</span>
                <button type="button" className="btn btn-sm flex-shrink-0"
                  style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881', borderRadius: 8 }}
                  onClick={() => setModalPrix(true)}>
                  <FontAwesomeIcon icon={faEdit} className="me-1" /> sélectionner les produits
                </button>
              </div>
            )}
            {formV.catalogueActif && lienCatalogue ? (
              <div className="mt-3">
                <div className="small fw-semibold text-muted mb-1">Votre lien :</div>
                <div className="d-flex align-items-center gap-2">
                  <code className="flex-grow-1 p-2 rounded" style={{ background: 'var(--bs-secondary-bg)', fontSize: 'var(--txt-sm)', wordBreak: 'break-all' }}>
                    {lienCatalogue}
                  </code>
                  <BoutonCopier urlKey="cat" url={lienCatalogue} />
                </div>
              </div>
            ) : formV.catalogueActif && !slug ? (
              <div className="mt-2 small text-muted">
                Définissez d'abord le nom de l'entreprise ci-dessus.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="col-12 col-md-6">
        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faLock} className="me-2" style={{ color: '#6366f1' }} />
              Boutique protégée
            </h6>
            <ul className="mb-3 small text-muted ps-3" style={{ lineHeight: 1.8 }}>
              <li>Accessible uniquement avec un <strong>mot de passe</strong></li>
              <li>Affiche le <strong>stock boutique</strong> et le <strong>stock magasin</strong></li>
              <li>Le <strong>prix de vente</strong> est visible</li>
            </ul>
            <label className="form-label small fw-semibold text-muted">
              Mot de passe
              {hasMotDePasse && (
                <span className="fw-normal ms-2" style={{ color: '#16a34a', fontSize: 'var(--txt-sm)' }}>
                  (déjà défini)
                </span>
              )}
            </label>
            <div className="input-group mb-3">
              <input type={montrerMdp ? 'text' : 'password'} className="form-control"
                placeholder={hasMotDePasse ? 'laisser vide pour ne pas changer le mot de passe' : 'Choisir un mot de passe...'}
                value={formV.motDePasseVitrine}
                onChange={e => setFormV(f => ({ ...f, motDePasseVitrine: e.target.value }))} />
              <button type="button" className="btn btn-outline-secondary"
                onClick={() => setMontrerMdp(v => !v)}>
                <FontAwesomeIcon icon={montrerMdp ? faEyeSlash : faEye} style={{ fontSize: 'var(--txt-md)' }} />
              </button>
            </div>
            {boutiqueActive ? (
              <div>
                <div className="small fw-semibold text-muted mb-1">Votre lien :</div>
                <div className="d-flex align-items-center gap-2">
                  <code className="flex-grow-1 p-2 rounded" style={{ background: 'var(--bs-secondary-bg)', fontSize: 'var(--txt-sm)', wordBreak: 'break-all' }}>
                    {lienBoutique}
                  </code>
                  <BoutonCopier urlKey="bout" url={lienBoutique} />
                </div>
              </div>
            ) : (
              <div className="small text-muted">
                {!slug
                  ? 'Définissez d\'abord le nom de l\'entreprise.'
                  : 'Ajoutez un mot de passe pour activer ce lien.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-12 pb-4 d-flex justify-content-end">
        <button className="btn text-white d-flex align-items-center gap-2"
          style={{ background: '#00d4aa', borderRadius: 10 }}
          disabled={chargement} onClick={sauvegarder}>
          {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
          Enregistrer la vitrine
        </button>
      </div>

      {modalPrix && <ModalPrixCatalogue onFermer={() => setModalPrix(false)} />}
    </div>
  );
};

export default SectionVitrine;
