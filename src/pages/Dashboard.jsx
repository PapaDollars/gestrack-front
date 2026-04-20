// Tableau de bord principal GesTrack
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faFileInvoiceDollar, faBox,
  faExclamationTriangle, faArrowRight, faSpinner,
  faStore, faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { clientsAPI, dettesAPI, produitsAPI, magasinAPI } from '@/services/api';
import { afficherStockDetails } from '@/services/unites';
import defaultProduit from '@/assets/img/defaultProduit.png';

// Carte statistique réutilisable
const CarteStatistique = ({ titre, valeur, icone, couleur, lien, chargement }) => (
  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
    <div className="card-body d-flex align-items-center gap-3 p-4">
      <div
        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
        style={{ width: 56, height: 56, background: `${couleur}20` }}
      >
        <FontAwesomeIcon icon={icone} style={{ color: couleur, fontSize: 22 }} />
      </div>
      <div className="flex-grow-1">
        <div className="text-muted small">{titre}</div>
        {chargement
          ? <FontAwesomeIcon icon={faSpinner} spin className="text-muted mt-1" />
          : <div className="fw-bold fs-4" style={{ color: 'var(--bs-body-color)' }}>{valeur}</div>
        }
      </div>
      <Link to={lien} className="btn btn-sm btn-light">
        <FontAwesomeIcon icon={faArrowRight} />
      </Link>
    </div>
  </div>
);

// Carte produit pour les sections récents
const CarteProduit = ({ produit }) => {
  const stockPs = produit.stockEnPieces ?? ((produit.quantiteStock || 0));
  const stockFaible = stockPs <= 0;
  return (
    <div
      className="card flex-shrink-0 shadow"
      style={{ width: 180, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--bs-border-color)', background: 'var(--bs-tertiary-bg)' }}>
      <div style={{ height: 100, overflow: 'hidden', background: 'var(--bs-secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={produit.image || defaultProduit}
          alt={produit.nom}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.src = defaultProduit; }}
        />
      </div>
      <div className="p-2">
        <div className="fw-semibold text-truncate small" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
        <div className="fw-bold" style={{ color: '#00d4aa', fontSize: 13 }}>
          {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(produit.prixVente || 0)}
        </div>
        <span className="badge mt-1" style={{ fontSize: 10, background: stockFaible ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: stockFaible ? '#ef4444' : '#10b981' }}>
          {afficherStockDetails(produit)}
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ clients: 0, dettes: 0, produits: 0, dettesEnRetard: 0, totalDettes: 0 });
  const [dettesRecentes, setDettesRecentes] = useState([]);
  const [produitsRecents, setProduitsRecents] = useState([]);
  const [magasinRecents, setMagasinRecents] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        const [clients, dettes, produits, magasin] = await Promise.all([
          clientsAPI.getAll(),
          dettesAPI.getAll(),
          produitsAPI.getAll(),
          magasinAPI.getAll(),
        ]);

        const dettesEnCours = dettes.data.filter(d => d.statut !== 'SOLDEE');
        const dettesEnRetard = dettes.data.filter(d => d.statut === 'EN_RETARD');
        const totalDettes = dettesEnCours.reduce((acc, d) => acc + (d.montantActuel || 0), 0);

        setStats({
          clients: clients.data.length,
          dettes: dettesEnCours.length,
          produits: produits.data.length,
          dettesEnRetard: dettesEnRetard.length,
          totalDettes,
        });

        // Les 5 dettes les plus récentes non soldées
        setDettesRecentes(dettesEnCours.slice(0, 5));

        // Les 4 produits boutique les plus récents
        const sortedProduits = [...produits.data].sort((a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setProduitsRecents(sortedProduits.slice(0, 4));

        // Les 4 produits magasin les plus récents
        const sortedMagasin = [...magasin.data].sort((a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        setMagasinRecents(sortedMagasin.slice(0, 4));
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setChargement(false);
      }
    };

    chargerDonnees();
  }, []);

  const formatMontant = (montant) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(montant);

  return (
    <div>
      {/* En-tête */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Tableau de bord</h4>
        <p className="text-muted small mb-0">Vue d'ensemble de GesTrack</p>
      </div>

      {/* Cartes statistiques */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <CarteStatistique titre="Total clients" valeur={stats.clients} icone={faUsers} couleur="#00d4aa" lien="/clients" chargement={chargement} />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <CarteStatistique titre="Dettes en cours" valeur={stats.dettes} icone={faFileInvoiceDollar} couleur="#f59e0b" lien="/dettes" chargement={chargement} />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <CarteStatistique titre="Produits" valeur={stats.produits} icone={faBox} couleur="#6366f1" lien="/produits" chargement={chargement} />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <CarteStatistique titre="Dettes en retard" valeur={stats.dettesEnRetard} icone={faExclamationTriangle} couleur="#ef4444" lien="/dettes" chargement={chargement} />
        </div>
      </div>

      {/* Total des dettes */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14, background: 'linear-gradient(135deg, #0f2027, #203a43)' }}>
        <div className="card-body p-4 text-white">
          <div className="small text-white-50 mb-1">Montant total des dettes en cours</div>
          <div className="fw-bold" style={{ fontSize: 32 }}>
            {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : formatMontant(stats.totalDettes)}
          </div>
        </div>
      </div>

      {/* Dettes récentes */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
        <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-4">
          <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>Dettes récentes</h6>
          <Link to="/dettes" className="btn btn-sm text-decoration-none" style={{ color: '#00d4aa' }}>
            Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
          </Link>
        </div>
        <div className="card-body px-4 pb-4">
          {chargement ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#00d4aa' }} />
            </div>
          ) : dettesRecentes.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FontAwesomeIcon icon={faFileInvoiceDollar} size="2x" className="mb-2 d-block" />
              Aucune dette en cours
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th className="fw-semibold small text-muted border-0">Client</th>
                    <th className="fw-semibold small text-muted border-0">Montant</th>
                    <th className="fw-semibold small text-muted border-0">Statut</th>
                    <th className="fw-semibold small text-muted border-0">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dettesRecentes.map((dette) => (
                    <tr key={dette.id}>
                      <td className="fw-semibold small">{dette.clientNom}</td>
                      <td className="fw-bold" style={{ color: '#ef4444' }}>{formatMontant(dette.montantActuel)}</td>
                      <td>
                        <span className={`badge rounded-pill ${dette.statut === 'EN_RETARD' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: 11 }}>
                          {dette.statut === 'EN_RETARD' ? 'En retard' : 'En cours'}
                        </span>
                      </td>
                      <td className="text-muted small">{new Date(dette.createdAt).toLocaleDateString('fr-FR')}</td>
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
        <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-4">
          <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faStore} style={{ color: '#00d4aa' }} />
            Produits récents — Boutique
          </h6>
          <Link to="/produits" className="btn btn-sm text-decoration-none" style={{ color: '#00d4aa' }}>
            Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
          </Link>
        </div>
        <div className="card-body px-4 pb-4">
          {chargement ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#00d4aa' }} />
            </div>
          ) : produitsRecents.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FontAwesomeIcon icon={faStore} size="2x" className="mb-2 d-block" />
              Aucun produit en boutique
            </div>
          ) : (
            <div className="d-flex gap-3 overflow-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
              {produitsRecents.map((p) => (
                <div key={p.id} style={{ scrollSnapAlign: 'start' }}>
                  <CarteProduit produit={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Produits récents — Magasin */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-4">
          <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
            <FontAwesomeIcon icon={faWarehouse} style={{ color: '#3b82f6' }} />
            Produits récents — Magasin
          </h6>
          <Link to="/magasin" className="btn btn-sm text-decoration-none" style={{ color: '#3b82f6' }}>
            Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
          </Link>
        </div>
        <div className="card-body px-4 pb-4">
          {chargement ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#3b82f6' }} />
            </div>
          ) : magasinRecents.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FontAwesomeIcon icon={faWarehouse} size="2x" className="mb-2 d-block" />
              Aucun produit en magasin
            </div>
          ) : (
            <div className="d-flex gap-3 overflow-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
              {magasinRecents.map((p) => (
                <div key={p.id} style={{ scrollSnapAlign: 'start' }}>
                  <CarteProduit produit={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
