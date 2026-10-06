import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faSpinner, faSearch, faLock, faGlobe, faTimes } from '@fortawesome/free-solid-svg-icons';
import { adminAPI } from '@/services/adminAPI';
import { toast } from 'react-toastify';

const AdminVitrines = () => {
  const [vitrines, setVitrines]   = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre]       = useState('toutes');

  useEffect(() => {
    adminAPI.getVitrines()
      .then(r => setVitrines(r.data))
      .catch(() => toast.error('Erreur chargement vitrines'))
      .finally(() => setChargement(false));
  }, []);

  const filtres = vitrines.filter(v => {
    if (filtre === 'actives' && !v.catalogueActif) return false;
    if (filtre === 'inactives' && v.catalogueActif) return false;
    if (recherche && !v.nomEntreprise.toLowerCase().includes(recherche.toLowerCase()) &&
        !v.slug.toLowerCase().includes(recherche.toLowerCase())) return false;
    return true;
  });

  if (chargement) return (
    <div className="d-flex align-items-center justify-content-center" style={{ height: '60vh' }}>
      <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32, color: '#00d4aa' }} />
    </div>
  );

  const nbActives = vitrines.filter(v => v.catalogueActif).length;

  return (
    <div className="admin-page">
      <div className="admin-entete">
      <div className="mb-4">
        <h4 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
          <FontAwesomeIcon icon={faStore} style={{ color: '#00d4aa' }} />
          Vitrines publiques
          <span className="badge bg-secondary" style={{ fontSize: 'var(--txt-base)' }}>{vitrines.length}</span>
        </h4>
        <p className="text-muted small mb-0">
          {nbActives} vitrine(s) active(s) sur {vitrines.length} configurée(s)
        </p>
      </div>

      {/* Filtres + recherche */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
        <div className="card-body p-3">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            {[
              { val: 'toutes', label: 'Toutes' },
              { val: 'actives', label: 'Actives' },
              { val: 'inactives', label: 'Inactives' },
            ].map(f => (
              <button key={f.val} type="button" className="btn btn-sm"
                style={{
                  borderRadius: 20, padding: '3px 14px',
                  background: filtre === f.val ? '#00d4aa' : 'var(--bs-secondary-bg)',
                  color: filtre === f.val ? '#fff' : 'var(--bs-body-color)',
                  border: filtre === f.val ? 'none' : '1px solid var(--bs-border-color)',
                }}
                onClick={() => setFiltre(f.val)}>{f.label}</button>
            ))}
            <div className="input-group ms-auto" style={{ maxWidth: 240 }}>
              <span className="input-group-text bg-body-secondary border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" style={{ fontSize: 'var(--txt-sm)' }} />
              </span>
              <input type="text" className="form-control border-start-0" placeholder="Rechercher..."
                value={recherche} onChange={e => setRecherche(e.target.value)} style={{ fontSize: 'var(--txt-base)' }} />
              {recherche && (
                <button type="button" className="btn btn-light border" onClick={() => setRecherche('')}>
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: 'var(--txt-sm)' }} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      </div>{/* fin zone fixe */}

      <div className="admin-contenu">
      {/* Grille vitrines */}
      {filtres.length === 0 ? (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body p-5 text-center">
            <FontAwesomeIcon icon={faStore} style={{ fontSize: 40, color: '#94a3b8', marginBottom: 12 }} />
            <p className="text-muted mb-0">Aucune vitrine trouvée</p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filtres.map(v => (
            <div key={v.uid} className="col-12 col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                      style={{ width: 44, height: 44, background: v.catalogueActif ? '#dcfce7' : '#f1f5f9' }}>
                      <FontAwesomeIcon icon={v.catalogueActif ? faGlobe : faStore}
                        style={{ color: v.catalogueActif ? '#16a34a' : '#94a3b8', fontSize: 'var(--txt-xl)' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-lg)' }}>
                        {v.nomEntreprise || '—'}
                      </div>
                      <div className="text-muted" style={{ fontSize: 'var(--txt-sm)' }}>/{v.slug}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge rounded-pill"
                      style={{ background: v.catalogueActif ? '#dcfce7' : '#f1f5f9',
                        color: v.catalogueActif ? '#16a34a' : '#64748b', fontSize: 'var(--txt-xs)' }}>
                      {v.catalogueActif ? '● Catalogue actif' : '○ Catalogue inactif'}
                    </span>
                    {v.hasMotDePasse && (
                      <span className="badge rounded-pill"
                        style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 'var(--txt-xs)' }}>
                        <FontAwesomeIcon icon={faLock} className="me-1" style={{ fontSize: 'var(--txt-xs)' }} />
                        Boutique protégée
                      </span>
                    )}
                    <span className="badge rounded-pill"
                      style={{ background: '#f0fdf4', color: '#166534', fontSize: 'var(--txt-xs)' }}>
                      {v.devise}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>{/* fin zone défilante */}
    </div>
  );
};

export default AdminVitrines;
