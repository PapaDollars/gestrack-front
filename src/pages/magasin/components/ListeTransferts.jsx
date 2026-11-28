// Historique des transferts du Magasin (vers la Boutique et entre dépôts), affiché dans la
// fenêtre « Transférer ». Chargé seulement quand on l'affiche, 20 transferts à la fois
// (« Voir plus » pour les suivants).
import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faArrowRight, faStore, faWarehouse } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { magasinAPI } from '@/services/api';
import { dateHeure } from '@/pages/inventaire/utils';

const FILTRES = [['tous', 'Tous'], ['boutique', 'Vers la boutique'], ['depot', 'Entre dépôts']];

// depot : 'principal' | identifiant d'un dépôt | 'tous'
// nomLieu(cle) : nom à afficher pour 'principal', un dépôt ou 'boutique'
// avecDepots : le compte a plusieurs dépôts (sinon pas de filtre « Entre dépôts »)
const ListeTransferts = ({ depot, nomLieu, avecDepots }) => {
  const [liste, setListe] = useState(null);
  const [suite, setSuite] = useState(false);
  const [chargementSuite, setChargementSuite] = useState(false);
  const [filtre, setFiltre] = useState('tous');

  const charger = useCallback(async (apres = null) => {
    try {
      const { data } = await magasinAPI.transferts(depot, apres);
      setListe(l => (apres ? [...(l || []), ...data.transferts] : data.transferts));
      setSuite(!!data.suite);
    } catch {
      toast.error("Impossible de charger l'historique des transferts");
      setListe(l => l || []);
    }
  }, [depot]);

  useEffect(() => { charger(); }, [charger]);

  const voirPlus = async () => {
    setChargementSuite(true);
    await charger(liste[liste.length - 1]?.createdAt);
    setChargementSuite(false);
  };

  const affiches = (liste || []).filter(t => filtre === 'tous' || t.type === filtre);
  // Sens du transfert vu depuis le dépôt affiché
  const sens = (t) => (depot === 'tous' ? null : t.source === depot ? 'envoye' : 'recu');

  return (
    <div className="d-flex flex-column gap-2">
      {avecDepots && (
        // Filtres fixés en haut pendant que la liste défile
        <div className="d-flex align-items-center gap-2 flex-wrap py-2"
          style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bs-body-bg)' }}>
          <span className="text-muted d-none d-md-inline" style={{ fontSize: '0.875rem' }}>Afficher :</span>
          {FILTRES.map(([cle, libelle]) => (
            <button key={cle} type="button" className="btn btn-sm rounded-pill px-3"
              style={{
                border: `1px solid ${filtre === cle ? '#00a881' : 'var(--bs-border-color)'}`,
                background: filtre === cle ? 'rgba(0,212,170,0.12)' : 'transparent',
                color: filtre === cle ? '#00a881' : 'var(--bs-body-color)',
                fontWeight: filtre === cle ? 600 : 400,
              }}
              onClick={() => setFiltre(cle)}>
              {libelle}
            </button>
          ))}
        </div>
      )}

      {liste === null && <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} /></div>}
      {liste !== null && affiches.length === 0 && (
        <div className="text-center text-muted small py-4">Aucun transfert pour le moment.</div>
      )}

      {affiches.map(t => {
        const s = sens(t);
        const versBoutique = t.destination === 'boutique';
        return (
          <div key={t.id} className="rounded-3 p-3 d-flex flex-column gap-2 flex-shrink-0" style={{ background: 'var(--bs-secondary-bg)' }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-semibold small d-flex align-items-center gap-2 flex-wrap" style={{ color: 'var(--bs-body-color)' }}>
                {nomLieu(t.source)}
                <FontAwesomeIcon icon={faArrowRight} className="text-muted" />
                <span className="d-inline-flex align-items-center gap-1">
                  <FontAwesomeIcon icon={versBoutique ? faStore : faWarehouse} style={{ color: versBoutique ? '#2563eb' : '#00a881' }} />
                  {nomLieu(t.destination)}
                </span>
              </span>
              {s && (
                <span className="badge rounded-pill" style={s === 'envoye'
                  ? { background: '#fff7ed', color: '#c2410c' } : { background: '#dcfce7', color: '#15803d' }}>
                  {s === 'envoye' ? 'Envoyé' : 'Reçu'}
                </span>
              )}
              <span className="small text-muted ms-auto">{dateHeure(t.createdAt)}</span>
            </div>
            <div className="d-flex flex-column gap-1">
              {(t.lignes || []).map((l, i) => (
                <div key={`${l.produitId}-${i}`} className="d-flex align-items-baseline gap-2 small">
                  <span className="flex-grow-1" style={{ color: 'var(--bs-body-color)' }}>{l.nom}</span>
                  <span className="fw-semibold flex-shrink-0" style={{ color: 'var(--bs-body-color)' }}>{l.quantite} {l.unite}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {suite && (
        <button type="button" className="btn btn-sm btn-light align-self-center mt-1" disabled={chargementSuite} onClick={voirPlus}>
          {chargementSuite ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Voir plus'}
        </button>
      )}
    </div>
  );
};

export default ListeTransferts;
