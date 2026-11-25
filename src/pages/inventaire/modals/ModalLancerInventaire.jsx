// Lancer un inventaire : lieu (Boutique / Magasin), produits concernés (tout ou certaines
// catégories) et nom. Ouverte depuis les pages Boutique et Magasin.
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faSpinner, faTimes, faLock } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { inventairesAPI, produitsAPI, magasinAPI } from '@/services/api';
import { ROUTES } from '@/utils/url/frontend';
import { LIEUX } from '@/pages/inventaire/utils';

const nomParDefaut = (lieu) => {
  const mois = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return `Inventaire ${LIEUX[lieu].libelle} — ${mois}`;
};

const ModalLancerInventaire = ({ lieuInitial = 'boutique', magasinExclu = false, onFermer }) => {
  const navigate = useNavigate();
  const [lieu, setLieu] = useState(lieuInitial);
  const [produits, setProduits] = useState({ boutique: null, magasin: null });
  const [tout, setTout] = useState(true);
  const [categories, setCategories] = useState([]);
  const [nom, setNom] = useState(nomParDefaut(lieuInitial));
  const [nomModifie, setNomModifie] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  // Listes de produits (déjà en cache dans l'appli) : nombre de produits et catégories
  useEffect(() => {
    produitsAPI.getAll().then(r => setProduits(p => ({ ...p, boutique: r.data }))).catch(() => {});
    if (!magasinExclu) magasinAPI.getAll().then(r => setProduits(p => ({ ...p, magasin: r.data }))).catch(() => {});
  }, [magasinExclu]);

  const liste = produits[lieu] || [];
  const toutesCategories = useMemo(() => [...new Set(liste.map(p => p.categorie).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr')), [liste]);
  const nbConcernes = tout ? liste.length : liste.filter(p => categories.includes(p.categorie)).length;

  const choisirLieu = (l) => {
    if (l === 'magasin' && magasinExclu) return;
    setLieu(l); setCategories([]);
    if (!nomModifie) setNom(nomParDefaut(l));
  };
  const basculerCategorie = (c) => setCategories(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));

  const lancer = async () => {
    setEnvoi(true);
    try {
      await inventairesAPI.creer({ lieu, nom: nom.trim(), categories: tout ? [] : categories });
      navigate(ROUTES.inventaire(lieu));
    } catch (e) {
      // Inventaire déjà en cours sur ce lieu : on y va directement
      if (e.response?.status === 409) { navigate(ROUTES.inventaire(lieu)); return; }
      toast.error(e.response?.data?.message || "Impossible de lancer l'inventaire");
      setEnvoi(false);
    }
  };

  const carteLieu = (l) => {
    const actif = lieu === l;
    const bloque = l === 'magasin' && magasinExclu;
    return (
      <button type="button" key={l} onClick={() => choisirLieu(l)} disabled={bloque}
        className="btn d-flex flex-column align-items-center justify-content-center gap-1"
        style={{
          minHeight: 64, borderRadius: 14,
          border: actif ? '2px solid #00a881' : '1px solid var(--bs-border-color)',
          background: actif ? 'rgba(0,168,129,0.08)' : 'var(--bs-body-bg)',
          color: actif ? '#00806a' : 'var(--bs-body-color)',
        }}>
        <strong>{bloque && <FontAwesomeIcon icon={faLock} className="me-1" />}{LIEUX[l].libelle}</strong>
        <span className="small text-muted">{bloque ? 'Plan A.2 ou A.3' : produits[l] ? `${produits[l].length} produits` : '…'}</span>
      </button>
    );
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-1">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faClipboardCheck} className="me-2" style={{ color: '#00d4aa' }} />
                Lancer un inventaire
              </h5>
              <div className="small text-muted">Comptez vos produits sur place. Les ventes continuent pendant le comptage.</div>
            </div>
            <button type="button" className="btn btn-light btn-sm rounded-circle ms-auto align-self-start" aria-label="Fermer" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-body px-4 d-flex flex-column gap-4">
            <div>
              <div className="small fw-semibold text-muted mb-2">Où ?</div>
              <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {['boutique', 'magasin'].map(carteLieu)}
              </div>
            </div>

            <div>
              <div className="small fw-semibold text-muted mb-2">Quoi compter ?</div>
              <div className="d-flex flex-column gap-2">
                {[{ v: true, titre: 'Tous les produits', detail: 'Inventaire complet' },
                  { v: false, titre: 'Certaines catégories', detail: 'Un rayon à la fois' }].map(o => (
                  <label key={String(o.v)} className="d-flex align-items-center gap-3 rounded-3 px-3 py-2"
                    style={{ border: tout === o.v ? '2px solid #00a881' : '1px solid var(--bs-border-color)', cursor: 'pointer' }}>
                    <input type="radio" name="perimetre" checked={tout === o.v} onChange={() => setTout(o.v)}
                      style={{ width: 20, height: 20, accentColor: '#00a881' }} />
                    <span className="d-flex flex-column">
                      <strong style={{ color: 'var(--bs-body-color)' }}>{o.titre}</strong>
                      <span className="small text-muted">{o.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
              {!tout && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {toutesCategories.length === 0 && <span className="small text-muted">Aucune catégorie</span>}
                  {toutesCategories.map(c => {
                    const choisie = categories.includes(c);
                    return (
                      <button type="button" key={c} onClick={() => basculerCategorie(c)} aria-pressed={choisie}
                        className="btn btn-sm rounded-pill"
                        style={{ background: choisie ? '#00a881' : 'var(--bs-secondary-bg)', color: choisie ? '#fff' : 'var(--bs-body-color)' }}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="d-flex flex-column gap-1 small fw-semibold text-muted">
              Nom
              <input type="text" className="form-control" value={nom} maxLength={80}
                onChange={(e) => { setNom(e.target.value); setNomModifie(true); }} />
            </label>
          </div>

          <div className="modal-footer border-0 px-4 pb-4 d-flex gap-2">
            <button type="button" className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="button" className="btn text-white fw-semibold flex-grow-1" style={{ background: '#00a881', minHeight: 48 }}
              disabled={envoi || nbConcernes === 0 || !nom.trim()} onClick={lancer}>
              {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : `Commencer le comptage (${nbConcernes} produit${nbConcernes > 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalLancerInventaire;
