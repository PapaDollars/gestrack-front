// Paramètres › Dépôts : plusieurs magasins de réserve (plan A.3). Le Dépôt principal (le
// Magasin historique) existe toujours ; on ajoute ici les autres dépôts.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWarehouse, faPlus, faLock, faPen, faBoxArchive, faBoxOpen, faTrash, faLocationDot, faUser,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { depotsAPI } from '@/services/api';
import { ROUTES } from '@/utils/url/frontend';
import useDepots from '@/hooks/useDepots';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import ModalDepot from '@/pages/parametres/depots/modals/ModalDepot';

// 5 dépôts au total : le principal + 4 autres (même limite que le serveur)
const MAX_DEPOTS_TOTAL = 5;

const SectionDepots = ({ acces }) => {
  const { depots, autorise, charge, recharger, principal: infosPrincipal, nomPrincipal } = useDepots(acces);
  const [edition, setEdition] = useState(null); // null | 'nouveau' | 'principal' | dépôt
  const [confirmer, setConfirmer] = useState(null); // { depot, action: 'archiver' | 'supprimer' }
  const [envoi, setEnvoi] = useState(false);
  // Dépôts actifs, principal compris
  const nbDepots = 1 + depots.filter(d => !d.archive).length;
  const limiteAtteinte = nbDepots >= MAX_DEPOTS_TOTAL;

  const agir = async () => {
    const { depot, action } = confirmer;
    setEnvoi(true);
    try {
      if (action === 'supprimer') await depotsAPI.supprimer(depot.id);
      else await depotsAPI.update(depot.id, { archive: action === 'archiver' });
      toast.success(action === 'supprimer' ? 'Dépôt supprimé' : action === 'archiver' ? 'Dépôt archivé' : 'Dépôt réactivé');
      await recharger();
      setConfirmer(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setEnvoi(false); }
  };

  if (!autorise && charge && depots.length === 0) {
    return (
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-4 text-center">
          <FontAwesomeIcon icon={faLock} size="2x" className="mb-3" style={{ color: '#d97706' }} />
          <h6 className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>Plusieurs dépôts : plan A.3</h6>
          <p className="text-muted small mb-3">
            Répartissez votre stock de réserve entre plusieurs magasins (dépôts), avec les transferts entre dépôts,
            l'inventaire et les alertes de stock par dépôt.
          </p>
          <Link to={ROUTES.tarifs} className="btn text-white" style={{ background: '#00d4aa', borderRadius: 10 }}>Voir les tarifs</Link>
        </div>
      </div>
    );
  }

  // Dépôt principal : mêmes infos que les autres, gardées dans les paramètres du compte
  const carte = (dRecu, principal = false) => {
    const d = principal ? { ...infosPrincipal, nom: nomPrincipal } : dRecu;
    return (
    <div key={d?.id || 'principal'} className="col-12 col-md-6">
      <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, opacity: d?.archive ? 0.6 : 1 }}>
        <div className="card-body p-3 d-flex flex-column gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
              style={{ width: 38, height: 38, background: 'rgba(0,212,170,0.12)', color: '#00a881' }}>
              <FontAwesomeIcon icon={faWarehouse} />
            </span>
            <div className="flex-grow-1 min-w-0">
              <div className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{d.nom}</div>
              <div className="small text-muted">{principal ? 'Dépôt principal · votre Magasin d\'origine' : d.archive ? 'Archivé' : 'Actif'}</div>
            </div>
          </div>
          {(d.adresse || d.responsable) && (
            <div className="small text-muted d-flex flex-column gap-1">
              {d.adresse && <span><FontAwesomeIcon icon={faLocationDot} className="me-2" />{d.adresse}</span>}
              {d.responsable && <span><FontAwesomeIcon icon={faUser} className="me-2" />{d.responsable}</span>}
            </div>
          )}
          {principal && autorise && (
            <div className="d-flex mt-auto pt-1">
              <button type="button" className="btn btn-sm ms-auto" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}
                onClick={() => setEdition('principal')}>
                <FontAwesomeIcon icon={faPen} className="me-1" />Modifier
              </button>
            </div>
          )}
          {!principal && autorise && (
            <div className="d-flex gap-2 flex-wrap mt-auto pt-1">
              <button type="button" className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}
                onClick={() => setConfirmer({ depot: d, action: 'supprimer' })}>
                <FontAwesomeIcon icon={faTrash} className="me-1" />Supprimer
              </button>
              <button type="button" className="btn btn-sm btn-light"
                onClick={() => setConfirmer({ depot: d, action: d.archive ? 'reactiver' : 'archiver' })}>
                <FontAwesomeIcon icon={d.archive ? faBoxOpen : faBoxArchive} className="me-1" />{d.archive ? 'Réactiver' : 'Archiver'}
              </button>
              <button type="button" className="btn btn-sm ms-auto" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}
                onClick={() => setEdition(d)}>
                <FontAwesomeIcon icon={faPen} className="me-1" />Modifier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  };

  const messages = {
    supprimer: 'Supprimer ce dépôt ? C’est possible seulement s’il ne contient aucun produit.',
    archiver: 'Archiver ce dépôt ? Il disparaît de la page Magasin. Possible seulement s’il ne contient plus de stock.',
    reactiver: 'Réactiver ce dépôt ? Il réapparaît dans la page Magasin.',
  };

  return (
    <div className="d-flex flex-column gap-3">
      <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
        <div className="card-body p-4 d-flex align-items-center gap-3 flex-wrap">
          <div className="flex-grow-1">
            <h6 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Vos dépôts</h6>
            <div className="small text-muted">
              Chaque dépôt a son propre stock. Le nom, le prix et la photo d'un produit restent les mêmes dans tous les dépôts.
              Choisissez le dépôt en haut de la page Magasin.
            </div>
          </div>
          {autorise && (
            <div className="d-flex flex-column align-items-end gap-1">
              <button type="button" className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa', borderRadius: 10 }}
                disabled={limiteAtteinte} onClick={() => setEdition('nouveau')}>
                <FontAwesomeIcon icon={faPlus} /> Nouveau dépôt
              </button>
              <span className="small text-muted">
                {nbDepots} / {MAX_DEPOTS_TOTAL} dépôts{limiteAtteinte ? ' · maximum atteint' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="row g-3">
        {carte(null, true)}
        {depots.map(d => carte(d))}
      </div>

      {edition && (
        <ModalDepot
          depot={edition === 'principal' ? { nom: (infosPrincipal.nom || ''), adresse: infosPrincipal.adresse, responsable: infosPrincipal.responsable }
            : edition === 'nouveau' ? null : edition}
          principal={edition === 'principal'} onFermer={() => setEdition(null)}
          onSucces={async () => { setEdition(null); await recharger(); }} />
      )}
      {confirmer && (
        <ModalConfirmation
          message={messages[confirmer.action]}
          labelConfirmer={confirmer.action === 'supprimer' ? 'Supprimer' : confirmer.action === 'archiver' ? 'Archiver' : 'Réactiver'}
          chargement={envoi}
          onConfirmer={agir}
          onAnnuler={() => setConfirmer(null)}
        />
      )}
    </div>
  );
};

export default SectionDepots;
