// Modal : toutes les commandes fournisseurs en cours (en attente ou partiellement livrées),
// tous fournisseurs confondus. Un clic sur une commande ouvre la fiche de son fournisseur.
import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearch, faBoxOpen, faTruck } from '@fortawesome/free-solid-svg-icons';
import { fmtDH } from '@/utils/pdf';

const STATUTS = {
  EN_ATTENTE: { label: 'En attente',         bg: 'var(--bs-secondary-bg)', color: 'var(--bs-secondary-color)' },
  EN_COURS:   { label: 'Livraison partielle', bg: 'rgba(14,165,233,0.12)', color: '#0284c7' },
};

const ModalCommandesEnCours = ({ commandes, onOuvrirFournisseur, onFermer }) => {
  const [recherche, setRecherche] = useState('');

  const liste = useMemo(() => {
    const t = recherche.toLowerCase().trim();
    return commandes
      .filter(c => !t
        || c.produitNom?.toLowerCase().includes(t)
        || c.nomFournisseur?.toLowerCase().includes(t))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [commandes, recherche]);

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-2">
            <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faTruck} style={{ color: '#f97316' }} />
              Commandes en cours
              <span className="badge rounded-pill" style={{ background: 'rgba(249,115,22,0.12)', color: '#ea580c', fontSize: 'var(--txt-sm)' }}>
                {commandes.length}
              </span>
            </h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="px-4 pb-2">
            <div className="input-group">
              <span className="input-group-text bg-body-secondary border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" />
              </span>
              <input className="form-control border-start-0" placeholder="Produit ou fournisseur..."
                value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            </div>
          </div>

          <div className="modal-body px-4 pt-2 pb-4">
            {liste.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FontAwesomeIcon icon={faBoxOpen} size="2x" className="mb-2 d-block" />
                {commandes.length === 0 ? 'Aucune commande en cours' : 'Aucune commande ne correspond'}
              </div>
            ) : liste.map((cmd, i) => {
              const commandee = cmd.quantiteCommandee || 0;
              const livree    = Math.min(cmd.quantiteLivree || 0, commandee || Infinity);
              const pct       = commandee > 0 ? Math.round((livree / commandee) * 100) : 0;
              const st        = STATUTS[cmd.statut] || STATUTS.EN_ATTENTE;
              return (
                <button key={cmd.id} type="button"
                  className="btn w-100 text-start d-flex align-items-center gap-3 px-0 py-2"
                  style={{ borderRadius: 0, borderBottom: i < liste.length - 1 ? '1px solid var(--bs-border-color)' : 'none' }}
                  onClick={() => onOuvrirFournisseur(cmd.fournisseurId)}>
                  <div className="rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center overflow-hidden"
                    style={{ width: 42, height: 42, background: 'rgba(249,115,22,0.1)' }}>
                    {cmd.imageUrl
                      ? <img src={cmd.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <FontAwesomeIcon icon={faBoxOpen} style={{ color: '#f97316' }} />}
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className="fw-semibold text-truncate" style={{ color: 'var(--bs-body-color)' }}>{cmd.produitNom}</span>
                      <span className="badge rounded-pill flex-shrink-0" style={{ background: st.bg, color: st.color, fontSize: 'var(--txt-xs)' }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-sm)' }}>
                      {cmd.nomFournisseur || 'Fournisseur'} · commandé le {fmtDH(cmd.createdAt).split(' ')[0]}
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <div className="progress flex-grow-1" style={{ height: 6, borderRadius: 10, background: 'rgba(249,115,22,0.15)' }}>
                        <div className="progress-bar" style={{ width: `${pct}%`, background: '#f97316', borderRadius: 10 }} />
                      </div>
                      <span className="fw-semibold flex-shrink-0 text-end" style={{ fontSize: 'var(--txt-sm)', color: '#ea580c', minWidth: 110 }}>
                        {livree} / {commandee} {cmd.unite || ''} · {pct}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCommandesEnCours;
