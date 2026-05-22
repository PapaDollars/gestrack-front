// Tableau de bord principal GesTrack
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faFileInvoiceDollar, faBox,
  faExclamationTriangle, faArrowRight, faSpinner,
  faStore, faWarehouse, faExclamationCircle,
  faBan,
} from '@fortawesome/free-solid-svg-icons';
import { clientsAPI, dettesAPI, produitsAPI, magasinAPI } from '@/services/api';
import { fmtDH } from '@/utils/pdf';
import useIsMobile from '@/hooks/useIsMobile';
import { afficherStockDetails } from '@/services/unites';
import defaultProduit from '@/assets/img/defaultProduit.png';

// ── Carte statistique réutilisable ────────────────────────────────────────────
const CarteStatistique = ({ titre, valeur, icone, couleur, lien, chargement }) => (
  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
    <div className="card-body d-flex align-items-center gap-2 p-3">
      <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
        style={{ width: 42, height: 42, background: `${couleur}20` }}>
        <FontAwesomeIcon icon={icone} style={{ color: couleur, fontSize: 'var(--txt-2xl)' }} />
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-sm)' }}>{titre}</div>
        {chargement
          ? <FontAwesomeIcon icon={faSpinner} spin className="text-muted mt-1" />
          : <div className="fw-bold fs-5" style={{ color: 'var(--bs-body-color)' }}>{valeur}</div>}
      </div>
      <Link to={lien} className="btn btn-sm btn-light flex-shrink-0">
        <FontAwesomeIcon icon={faArrowRight} />
      </Link>
    </div>
  </div>
);

// ── Carte produit ─────────────────────────────────────────────────────────────
const CarteProduit = ({ produit, mobile }) => {
  const stockPs = produit.stockEnPieces ?? produit.quantiteStock ?? 0;
  const stockFaible = stockPs <= 0;

  if (mobile) {
    return (
      <div className="d-flex align-items-center gap-3 py-2 px-1"
        style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
        <div style={{ width: 54, height: 54, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--bs-secondary-bg)' }}>
          <img src={produit.image || defaultProduit} alt={produit.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = defaultProduit; }} />
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-semibold text-truncate small" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
          <div className="fw-bold" style={{ color: '#00d4aa', fontSize: 'var(--txt-md)' }}>
            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(produit.prixVente || 0)}
          </div>
        </div>
        <span className="badge flex-shrink-0" style={{ fontSize: 'var(--txt-xs)', background: stockFaible ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: stockFaible ? '#ef4444' : '#10b981' }}>
          {afficherStockDetails(produit)}
        </span>
      </div>
    );
  }

  return (
    <div className="card flex-shrink-0 shadow"
      style={{ width: 145, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--bs-border-color)', background: 'var(--bs-tertiary-bg)' }}>
      <div style={{ height: 90, overflow: 'hidden', background: 'var(--bs-secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={produit.image || defaultProduit} alt={produit.nom}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = defaultProduit; }} />
      </div>
      <div className="p-2">
        <div className="fw-semibold text-truncate small" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
        <div className="fw-bold" style={{ color: '#00d4aa', fontSize: 'var(--txt-md)' }}>
          {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(produit.prixVente || 0)}
        </div>
        <span className="badge mt-1" style={{ fontSize: 'var(--txt-xs)', background: stockFaible ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: stockFaible ? '#ef4444' : '#10b981' }}>
          {afficherStockDetails(produit)}
        </span>
      </div>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const isMobile = useIsMobile();
  const [stats, setStats]                   = useState({ clients: 0, dettes: 0, produits: 0, dettesEnRetard: 0, dettesSoldees: 0, dettesAbandonnees: 0, totalDettes: 0, montantSolde: 0, montantAbandonne: 0 });
  const [topClients, setTopClients]         = useState([]);
  const [parProfession, setParProfession]   = useState({});
  const [stockFaible, setStockFaible]       = useState([]);
  const [dettesRecentes, setDettesRecentes] = useState([]);
  const [produitsRecents, setProduitsRecents] = useState([]);
  const [magasinRecents, setMagasinRecents] = useState([]);
  const [chargement, setChargement]         = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const [clients, dettes, produits, magasin] = await Promise.all([
          clientsAPI.getAll(), dettesAPI.getAll(), produitsAPI.getAll(), magasinAPI.getAll(),
        ]);
        const c = clients.data;
        const d = dettes.data;
        const p = produits.data;
        const m = magasin.data;

        const dettesEnCours     = d.filter(x => x.statut === 'EN_COURS' || x.statut === 'EN_RETARD');
        const dettesEnRetard    = d.filter(x => x.statut === 'EN_RETARD');
        const dettesSoldees     = d.filter(x => x.statut === 'SOLDEE');
        const dettesAbandonnees = d.filter(x => x.statut === 'ABANDONNEE');

        const totalDettes     = dettesEnCours.reduce((a, x) => a + (x.montantActuel || 0), 0);
        const montantSolde    = dettesSoldees.reduce((a, x) => a + (x.montantInitial || 0), 0);
        const montantAbandonne = dettesAbandonnees.reduce((a, x) => a + (x.montantAbandonne || x.montantInitial || 0), 0);

        setStats({
          clients: c.length, dettes: dettesEnCours.length,
          produits: p.length, dettesEnRetard: dettesEnRetard.length,
          dettesSoldees: dettesSoldees.length, dettesAbandonnees: dettesAbandonnees.length,
          totalDettes, montantSolde, montantAbandonne,
        });

        // Top débiteurs
        const detteParClient = {};
        dettesEnCours.forEach(x => {
          detteParClient[x.clientId] = (detteParClient[x.clientId] || 0) + (x.montantActuel || 0);
        });
        const top = Object.entries(detteParClient)
          .sort((a, b) => b[1] - a[1])
          .map(([clientId, montant]) => {
            const cl = c.find(x => x.id === clientId);
            return { nom: cl ? `${cl.prenom || ''} ${cl.nom || ''}`.trim() : 'Inconnu', montant };
          });
        setTopClients(top);

        // Clients par profession
        const profMap = {};
        c.forEach(cl => {
          if (cl.profession) profMap[cl.profession] = (profMap[cl.profession] || 0) + 1;
        });
        setParProfession(profMap);

        // Stock faible (boutique)
        setStockFaible(p.filter(x => (x.quantiteStock || 0) <= 5));

        // Récents
        setDettesRecentes(dettesEnCours.slice(0, 5));
        setProduitsRecents([...p].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4));
        setMagasinRecents([...m].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4));
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const fmt = (m) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);
  const maxDette      = topClients[0]?.montant || 1;
  const maxProfession = Math.max(...Object.values(parProfession), 1);

  const CarteStats = () => (
    <div className="row g-3 mb-3">
      <div className="col-6 col-xl-3"><CarteStatistique titre="Total clients" valeur={stats.clients} icone={faUsers} couleur="#00d4aa" lien="/clients" chargement={chargement} /></div>
      <div className="col-6 col-xl-3"><CarteStatistique titre="Dettes en cours" valeur={stats.dettes} icone={faFileInvoiceDollar} couleur="#f59e0b" lien="/dettes" chargement={chargement} /></div>
      <div className="col-6 col-xl-3"><CarteStatistique titre="Produits boutique" valeur={stats.produits} icone={faBox} couleur="#6366f1" lien="/produits" chargement={chargement} /></div>
      <div className="col-6 col-xl-3"><CarteStatistique titre="Dettes en retard" valeur={stats.dettesEnRetard} icone={faExclamationTriangle} couleur="#ef4444" lien="/dettes" chargement={chargement} /></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>

      {/* ── Titre fixe ── */}
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Tableau de bord</h4>
          <p className="text-muted small mb-0">Vue d'ensemble de GesTrack</p>
        </div>
      </div>

      {/* Cartes stats — fixe sur desktop */}
      {!isMobile && <div style={{ flexShrink: 0 }}><CarteStats /></div>}

      {/* ── Zone scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: '0.5rem' }}>

        {/* Cartes stats — mobile dans le scroll */}
        {isMobile && <CarteStats />}

        {/* Montants */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14, background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
              <div className="card-body p-3">
                <div className="small fw-semibold mb-1" style={{ color: '#92400e' }}>Dettes en cours</div>
                <div className="fw-bold" style={{ color: '#b45309', fontSize: 'clamp(16px, 4vw, 26px)' }}>{chargement ? '...' : fmt(stats.totalDettes)}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14, background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
              <div className="card-body p-3">
                <div className="small fw-semibold mb-1" style={{ color: '#14532d' }}>Dettes récupérées</div>
                <div className="fw-bold" style={{ color: '#15803d', fontSize: 'clamp(16px, 4vw, 26px)' }}>{chargement ? '...' : fmt(stats.montantSolde)}</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14, background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' }}>
              <div className="card-body p-3">
                <div className="small fw-semibold mb-1 d-flex align-items-center gap-1" style={{ color: '#4b5563' }}>
                  <FontAwesomeIcon icon={faBan} style={{ fontSize: 'var(--txt-base)' }} /> Dettes abandonnées
                </div>
                <div className="fw-bold" style={{ color: '#6b7280', fontSize: 'clamp(16px, 4vw, 26px)' }}>{chargement ? '...' : fmt(stats.montantAbandonne)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dettes récentes */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
            <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>Dettes récentes</h6>
            <Link to="/dettes" className="btn btn-sm text-decoration-none" style={{ color: '#00d4aa' }}>
              Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
            </Link>
          </div>
          <div className="card-body p-0">
            {chargement ? (
              <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#00d4aa' }} /></div>
            ) : dettesRecentes.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FontAwesomeIcon icon={faFileInvoiceDollar} size="2x" className="mb-2 d-block" />
                Aucune dette en cours
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: 'var(--txt-md)' }}>
                  <thead style={{ background: 'var(--bs-secondary-bg)' }}>
                    <tr>
                      <th className="fw-semibold text-muted border-0 ps-3" style={{ fontSize: 'var(--txt-sm)' }}>Client</th>
                      <th className="fw-semibold text-muted border-0" style={{ fontSize: 'var(--txt-sm)' }}>Montant</th>
                      <th className="fw-semibold text-muted border-0" style={{ fontSize: 'var(--txt-sm)' }}>Statut</th>
                      <th className="fw-semibold text-muted border-0 d-none d-sm-table-cell" style={{ fontSize: 'var(--txt-sm)' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dettesRecentes.map(dette => (
                      <tr key={dette.id}>
                        <td className="fw-semibold ps-3">{dette.clientNom}</td>
                        <td className="fw-bold" style={{ color: '#ef4444' }}>{fmt(dette.montantActuel)}</td>
                        <td>
                          <span className={`badge rounded-pill ${dette.statut === 'EN_RETARD' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: 'var(--txt-xs)' }}>
                            {dette.statut === 'EN_RETARD' ? 'En retard' : 'En cours'}
                          </span>
                        </td>
                        <td className="text-muted d-none d-sm-table-cell">{fmtDH(dette.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

         {/* Produits récents — Boutique */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
            <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faStore} style={{ color: '#00d4aa' }} />
              Produits récents — Boutique
            </h6>
            {!isMobile && (
              <Link to="/produits" className="btn btn-sm text-decoration-none" style={{ color: '#00d4aa' }}>
                Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
              </Link>
            )}
          </div>
          <div className="card-body px-3 pb-3 pt-2">
            {chargement ? (
              <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#00d4aa' }} /></div>
            ) : produitsRecents.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FontAwesomeIcon icon={faStore} size="2x" className="mb-2 d-block" />Aucun produit en boutique
              </div>
            ) : isMobile ? (
              <>
                <div>
                  {produitsRecents.map(p => <CarteProduit key={p.id} produit={p} mobile />)}
                </div>
                <Link to="/produits" className="btn btn-sm w-100 mt-3 text-decoration-none d-flex align-items-center justify-content-center gap-1"
                  style={{ color: '#00d4aa', border: '1px solid #00d4aa', borderRadius: 8 }}>
                  Voir tout <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </>
            ) : (
              <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                {produitsRecents.map(p => <div key={p.id} style={{ scrollSnapAlign: 'start' }}><CarteProduit produit={p} /></div>)}
              </div>
            )}
          </div>
        </div>

        {/* Produits récents — Magasin */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
            <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faWarehouse} style={{ color: '#3b82f6' }} />
              Produits récents — Magasin
            </h6>
            {!isMobile && (
              <Link to="/magasin" className="btn btn-sm text-decoration-none" style={{ color: '#3b82f6' }}>
                Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
              </Link>
            )}
          </div>
          <div className="card-body px-3 pb-3 pt-2">
            {chargement ? (
              <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#3b82f6' }} /></div>
            ) : magasinRecents.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FontAwesomeIcon icon={faWarehouse} size="2x" className="mb-2 d-block" />Aucun produit en magasin
              </div>
            ) : isMobile ? (
              <>
                <div>
                  {magasinRecents.map(p => <CarteProduit key={p.id} produit={p} mobile />)}
                </div>
                <Link to="/magasin" className="btn btn-sm w-100 mt-3 text-decoration-none d-flex align-items-center justify-content-center gap-1"
                  style={{ color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: 8 }}>
                  Voir tout <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </>
            ) : (
              <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                {magasinRecents.map(p => <div key={p.id} style={{ scrollSnapAlign: 'start' }}><CarteProduit produit={p} /></div>)}
              </div>
            )}
          </div>
        </div>

        {/* Top débiteurs + Clients par profession */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-header bg-transparent border-0 pt-3 px-3 pb-2">
                <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>
                  <FontAwesomeIcon icon={faExclamationCircle} className="me-2 text-danger" />
                  Top débiteurs
                </h6>
              </div>
              <div className="card-body px-3 pb-3">
                {chargement ? (
                  <div className="text-center py-3"><FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} /></div>
                ) : topClients.length === 0 ? (
                  <div className="text-muted small text-center py-3">Aucune dette en cours</div>
                ) : (
                  <div className="d-flex flex-column gap-3" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {topClients.map((cl, i) => (
                      <div key={i}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-semibold text-truncate me-2" style={{ color: 'var(--bs-body-color)' }}>{cl.nom}</span>
                          <span className="small fw-bold text-danger flex-shrink-0">{fmt(cl.montant)}</span>
                        </div>
                        <div className="progress" style={{ height: 6, borderRadius: 10 }}>
                          <div className="progress-bar" style={{ width: `${(cl.montant / maxDette) * 100}%`, background: i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#f59e0b', borderRadius: 10 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-header bg-transparent border-0 pt-3 px-3 pb-2">
                <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>
                  <FontAwesomeIcon icon={faUsers} className="me-2" style={{ color: '#00d4aa' }} />
                  Clients par profession
                </h6>
              </div>
              <div className="card-body px-3 pb-3">
                {chargement ? (
                  <div className="text-center py-3"><FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} /></div>
                ) : Object.keys(parProfession).length === 0 ? (
                  <div className="text-muted small text-center py-3">Aucun client</div>
                ) : (
                  <div className="d-flex flex-column gap-3" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {Object.entries(parProfession).sort((a, b) => b[1] - a[1]).map(([prof, nb]) => (
                      <div key={prof}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-semibold text-truncate me-2" style={{ color: 'var(--bs-body-color)' }}>{prof || '—'}</span>
                          <span className="badge rounded-pill flex-shrink-0" style={{ background: '#00d4aa20', color: '#00a881', fontSize: 'var(--txt-sm)' }}>
                            {nb} client{nb > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="progress" style={{ height: 6, borderRadius: 10 }}>
                          <div className="progress-bar" style={{ width: `${(nb / maxProfession) * 100}%`, background: '#00d4aa', borderRadius: 10 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stock faible */}
        {!chargement && stockFaible.length > 0 && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14, borderLeft: '4px solid #ef4444' }}>
            <div className="card-header bg-transparent border-0 pt-3 px-3 pb-0">
              <h6 className="fw-semibold mb-0 text-danger" style={{ fontSize: 'var(--txt-lg)' }}>
                <FontAwesomeIcon icon={faBox} className="me-2" />
                Produits en stock faible ({stockFaible.length})
              </h6>
            </div>
            <div className="card-body px-3 pb-3">
              <div className="row g-2">
                {stockFaible.map(p => (
                  <div key={p.id} className="col-6 col-md-4 col-lg-3">
                    <div className="d-flex align-items-center justify-content-between p-2 rounded"
                      style={{ background: 'rgba(239,68,68,0.1)', fontSize: 'var(--txt-base)' }}>
                      <span className="fw-semibold text-truncate" style={{ color: '#991b1b' }}>{p.nom}</span>
                      <span className="badge bg-danger ms-1 flex-shrink-0">{p.quantiteStock}</span>
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

export default Dashboard;
