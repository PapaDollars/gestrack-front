// Page statistiques — vue analytique de GesTrack
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar, faSpinner, faUsers, faFileInvoiceDollar,
  faBox, faTrophy, faExclamationCircle, faBan
} from '@fortawesome/free-solid-svg-icons';
import { clientsAPI, dettesAPI, produitsAPI } from '@/services/api';
import { toast } from 'react-toastify';

const Statistiques = () => {
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const [clients, dettes, produits] = await Promise.all([
          clientsAPI.getAll(),
          dettesAPI.getAll(),
          produitsAPI.getAll(),
        ]);

        const c = clients.data;
        const d = dettes.data;
        const p = produits.data;

        // Calculer les statistiques
        const dettesEnCours = d.filter(x => x.statut === 'EN_COURS' || x.statut === 'EN_RETARD');
        const dettesSoldees = d.filter(x => x.statut === 'SOLDEE');
        const dettesEnRetard = d.filter(x => x.statut === 'EN_RETARD');
        const dettesAbandonnees = d.filter(x => x.statut === 'ABANDONNEE');

        const totalDettes = dettesEnCours.reduce((a, x) => a + x.montantActuel, 0);
        const totalSolde = dettesSoldees.reduce((a, x) => a + x.montantInitial, 0);
        const totalAbandonne = dettesAbandonnees.reduce((a, x) => a + (x.montantAbandonne || x.montantInitial), 0);

        // Top 5 clients avec le plus de dettes
        const detteParClient = {};
        dettesEnCours.forEach(x => {
          detteParClient[x.clientId] = (detteParClient[x.clientId] || 0) + x.montantActuel;
        });
        const topClients = Object.entries(detteParClient)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([clientId, montant]) => {
            const client = c.find(cl => cl.id === clientId);
            return { nom: client ? `${client.prenom} ${client.nom}` : 'Inconnu', montant };
          });

        // Répartition par profession
        const parProfession = {};
        c.forEach(cl => {
          parProfession[cl.profession] = (parProfession[cl.profession] || 0) + 1;
        });

        // Produits avec stock faible
        const stockFaible = p.filter(x => x.quantiteStock <= 5);

        setData({
          totalClients: c.length,
          totalProduits: p.length,
          totalDettes: dettesEnCours.length,
          dettesEnRetard: dettesEnRetard.length,
          dettesSoldees: dettesSoldees.length,
          dettesAbandonnees: dettesAbandonnees.length,
          montantTotal: totalDettes,
          montantSolde: totalSolde,
          montantAbandonne: totalAbandonne,
          topClients,
          parProfession,
          stockFaible,
        });
      } catch {
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const formatMontant = (m) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  if (chargement) return (
    <div className="text-center py-5">
      <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} />
    </div>
  );

  // Calcul du pourcentage max pour les barres
  const maxDette = data.topClients[0]?.montant || 1;
  const maxProfession = Math.max(...Object.values(data.parProfession || {}), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>

      {/* ── Titre fixe ── */}
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Statistiques</h4>
          <p className="text-muted small mb-0">Vue d'ensemble analytique</p>
        </div>
      </div>

      {/* ── Zone scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
      {/* Montants */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14, background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
            <div className="card-body p-4">
              <div className="small fw-semibold mb-1" style={{ color: '#92400e' }}>Dettes en cours</div>
              <div className="fw-bold fs-3" style={{ color: '#b45309' }}>{formatMontant(data.montantTotal)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
            <div className="card-body p-4">
              <div className="small fw-semibold mb-1" style={{ color: '#14532d' }}>Dettes récupérées</div>
              <div className="fw-bold fs-3" style={{ color: '#15803d' }}>{formatMontant(data.montantSolde)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14, background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' }}>
            <div className="card-body p-4">
              <div className="small fw-semibold mb-1 d-flex align-items-center gap-1" style={{ color: '#4b5563' }}>
                <FontAwesomeIcon icon={faBan} style={{ fontSize: 'var(--txt-base)' }} /> Dettes abandonnées
              </div>
              <div className="fw-bold fs-3" style={{ color: '#6b7280' }}>{formatMontant(data.montantAbandonne)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes résumé */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Clients', val: data.totalClients, icon: faUsers, couleur: '#00d4aa' },
          { label: 'Dettes en cours', val: data.totalDettes, icon: faFileInvoiceDollar, couleur: '#f59e0b' },
          { label: 'Dettes soldées', val: data.dettesSoldees, icon: faTrophy, couleur: '#16a34a' },
          { label: 'En retard', val: data.dettesEnRetard, icon: faExclamationCircle, couleur: '#ef4444' },
          { label: 'Abandonnées', val: data.dettesAbandonnees, icon: faBan, couleur: '#9ca3af' },
          { label: 'Produits', val: data.totalProduits, icon: faBox, couleur: '#6366f1' },
        ].map(({ label, val, icon, couleur }) => (
          <div key={label} className="col-6 col-md-4 col-xl-2-4">
            <div className="card border-0 shadow-sm text-center" style={{ borderRadius: 14 }}>
              <div className="card-body py-3">
                <FontAwesomeIcon icon={icon} style={{ color: couleur, fontSize: 'var(--txt-3xl)' }} className="mb-2 d-block mx-auto" />
                <div className="fw-bold fs-4" style={{ color: 'var(--bs-body-color)' }}>{val}</div>
                <div className="text-muted" style={{ fontSize: 'var(--txt-base)' }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>


      <div className="row g-3 mb-4">
        {/* Top 5 clients débiteurs */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
            <div className="card-header bg-transparent border-0 pt-4 px-4">
              <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faExclamationCircle} className="me-2 text-danger" />
                Top débiteurs
              </h6>
            </div>
            <div className="card-body px-4 pb-4">
              {data.topClients.length === 0 ? (
                <div className="text-muted small text-center py-3">Aucune dette en cours</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {data.topClients.map((client, i) => (
                    <div key={i}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{client.nom}</span>
                        <span className="small fw-bold text-danger">{formatMontant(client.montant)}</span>
                      </div>
                      <div className="progress" style={{ height: 8, borderRadius: 10 }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${(client.montant / maxDette) * 100}%`,
                            background: i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#f59e0b',
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clients par profession */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
            <div className="card-header bg-transparent border-0 pt-4 px-4">
              <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>
                <FontAwesomeIcon icon={faUsers} className="me-2" style={{ color: '#00d4aa' }} />
                Clients par profession
              </h6>
            </div>
            <div className="card-body px-4 pb-4">
              {Object.keys(data.parProfession).length === 0 ? (
                <div className="text-muted small text-center py-3">Aucun client</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {Object.entries(data.parProfession)
                    .sort((a, b) => b[1] - a[1])
                    .map(([prof, nb]) => (
                      <div key={prof}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{prof}</span>
                          <span className="badge rounded-pill" style={{ background: '#00d4aa20', color: '#00a881', fontSize: 'var(--txt-sm)' }}>
                            {nb} client{nb > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="progress" style={{ height: 8, borderRadius: 10 }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${(nb / maxProfession) * 100}%`,
                              background: '#00d4aa',
                              borderRadius: 10,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Produits en stock faible */}
      {data.stockFaible.length > 0 && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14, borderLeft: '4px solid #ef4444' }}>
          <div className="card-header bg-transparent border-0 pt-4 px-4">
            <h6 className="fw-semibold mb-0 text-danger">
              <FontAwesomeIcon icon={faBox} className="me-2" />
              Produits en stock faible ({data.stockFaible.length})
            </h6>
          </div>
          <div className="card-body px-4 pb-4">
            <div className="row g-2">
              {data.stockFaible.map((p) => (
                <div key={p.id} className="col-6 col-md-4 col-lg-3">
                  <div className="d-flex align-items-center justify-content-between p-2 rounded"
                    style={{ background: 'rgba(239,68,68,0.15)', fontSize: 'var(--txt-md)' }}>
                    <span className="fw-semibold text-truncate" style={{ color: '#991b1b' }}>{p.nom}</span>
                    <span className="badge bg-danger ms-2">{p.quantiteStock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>{/* fin scrollable */}
    </div>
  );
};

export default Statistiques;
