// Page de gestion des produits avec prix d'achat masqué par mot de passe
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faEye, faEyeSlash,
  faBox, faSpinner, faSearch, faPlusCircle, faMinusCircle
} from '@fortawesome/free-solid-svg-icons';
import { produitsAPI } from '@/services/api';
import { toast } from 'react-toastify';
import ModalProduit from '@/components/produits/ModalProduit';
import ModalStock from '@/components/produits/ModalStock';
import ModalMotDePasse from '@/components/produits/ModalMotDePasse';
import ModalConfirmation from '@/components/shared/ModalConfirmation';

const Produits = () => {
  const [produits, setProduits] = useState([]);
  const [filtres, setFiltres] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);
  const [prixAchatAutorises, setPrixAchatAutorises] = useState({});
  const [prixAchatData, setPrixAchatData] = useState({});
  const [modalProduit, setModalProduit] = useState(false);
  const [produitEdite, setProduitEdite] = useState(null);
  const [modalStock, setModalStock] = useState(null);
  const [modalMdp, setModalMdp] = useState(null);
  const [confirmSuppr, setConfirmSuppr] = useState(null);

  const chargerProduits = async () => {
    try {
      const { data } = await produitsAPI.getAll();
      setProduits(data);
      setFiltres(data);
    } catch {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { chargerProduits(); }, []);

  useEffect(() => {
    if (recherche) {
      setFiltres(produits.filter(p =>
        p.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
        p.categorie?.toLowerCase().includes(recherche.toLowerCase())
      ));
    } else {
      setFiltres(produits);
    }
  }, [recherche, produits]);

  // Demander le mot de passe pour voir le prix d'achat
  const demanderPrixAchat = (produit) => {
    setModalMdp(produit);
  };

  // Après vérification du mot de passe, charger le prix d'achat
  const onMdpValide = async (produit) => {
    try {
      const { data } = await produitsAPI.getPrixAchat(produit.id);
      setPrixAchatAutorises(prev => ({ ...prev, [produit.id]: true }));
      setPrixAchatData(prev => ({ ...prev, [produit.id]: data.prixAchat }));
    } catch {
      toast.error('Erreur lors du chargement du prix d\'achat');
    }
    setModalMdp(null);
  };

  const masquerPrixAchat = (produitId) => {
    setPrixAchatAutorises(prev => ({ ...prev, [produitId]: false }));
  };

  const supprimerProduit = async (id) => {
    try {
      await produitsAPI.delete(id);
      toast.success('Produit supprimé');
      chargerProduits();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
    setConfirmSuppr(null);
  };

  const formatMontant = (m) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);

  return (
    <div>
      {/* En-tête */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#203a43' }}>Produits</h4>
          <p className="text-muted small mb-0">{produits.length} produit(s)</p>
        </div>
        <button className="btn text-white d-flex align-items-center gap-2" style={{ background: '#00d4aa', borderRadius: 10 }}
          onClick={() => { setProduitEdite(null); setModalProduit(true); }}>
          <FontAwesomeIcon icon={faPlus} /> Nouveau produit
        </button>
      </div>

      {/* Recherche */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <FontAwesomeIcon icon={faSearch} className="text-muted" />
            </span>
            <input type="text" className="form-control border-start-0"
              placeholder="Rechercher un produit..."
              value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Grille produits */}
      {chargement ? (
        <div className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ color: '#00d4aa' }} /></div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FontAwesomeIcon icon={faBox} size="3x" className="mb-3 d-block" />
          Aucun produit enregistré
        </div>
      ) : (
        <div className="row g-3">
          {filtres.map((produit) => {
            const prixVisible = prixAchatAutorises[produit.id];
            const stockFaible = produit.quantiteStock <= 5;

            return (
              <div key={produit.id} className="col-12 col-sm-6 col-xl-4">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
                  {/* Image produit */}
                  {produit.image ? (
                    <img src={produit.image} alt={produit.nom} className="card-img-top object-fit-cover"
                      style={{ height: 180, borderRadius: '14px 14px 0 0' }} />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center"
                      style={{ height: 120, background: '#f0f4f8', borderRadius: '14px 14px 0 0' }}>
                      <FontAwesomeIcon icon={faBox} size="2x" className="text-muted" />
                    </div>
                  )}

                  <div className="card-body p-3">
                    {/* Nom et catégorie */}
                    <div className="d-flex align-items-start justify-content-between mb-2">
                      <div>
                        <div className="fw-semibold" style={{ color: '#203a43' }}>{produit.nom}</div>
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: 11 }}>{produit.categorie}</span>
                      </div>
                      {/* Stock */}
                      <span className={`badge ${stockFaible ? 'bg-danger' : 'bg-success'}`} style={{ fontSize: 11 }}>
                        {produit.quantiteStock} {produit.unite}
                      </span>
                    </div>

                    {/* Prix */}
                    <div className="d-flex flex-column gap-1 mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Prix de vente</span>
                        <span className="fw-bold" style={{ color: '#00a881' }}>{formatMontant(produit.prixVente)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Prix d'achat</span>
                        <div className="d-flex align-items-center gap-2">
                          {prixVisible ? (
                            <>
                              <span className="fw-bold" style={{ color: '#6366f1' }}>
                                {formatMontant(prixAchatData[produit.id])}
                              </span>
                              <button className="btn btn-link p-0" onClick={() => masquerPrixAchat(produit.id)}
                                title="Masquer le prix d'achat">
                                <FontAwesomeIcon icon={faEyeSlash} className="text-muted" style={{ fontSize: 13 }} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-muted" style={{ letterSpacing: 2 }}>••••••</span>
                              <button className="btn btn-link p-0" onClick={() => demanderPrixAchat(produit)}
                                title="Voir le prix d'achat">
                                <FontAwesomeIcon icon={faEye} className="text-muted" style={{ fontSize: 13 }} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alerte stock faible */}
                    {stockFaible && (
                      <div className="alert alert-danger py-1 px-2 mb-3 small" style={{ borderRadius: 8 }}>
                        ⚠ Stock faible !
                      </div>
                    )}

                    {/* Actions stock */}
                    <div className="d-flex gap-2 mb-2">
                      <button className="btn btn-sm flex-grow-1" style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 12 }}
                        onClick={() => setModalStock({ produit, type: 'AJOUT' })}>
                        <FontAwesomeIcon icon={faPlusCircle} className="me-1" />Entrée
                      </button>
                      <button className="btn btn-sm flex-grow-1" style={{ background: '#fff7ed', color: '#ea580c', fontSize: 12 }}
                        onClick={() => setModalStock({ produit, type: 'REDUCTION' })}>
                        <FontAwesomeIcon icon={faMinusCircle} className="me-1" />Sortie
                      </button>
                    </div>

                    {/* Actions CRUD */}
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm flex-grow-1" style={{ background: '#eff6ff', color: '#6366f1', fontSize: 12 }}
                        onClick={() => { setProduitEdite(produit); setModalProduit(true); }}>
                        <FontAwesomeIcon icon={faEdit} className="me-1" />Modifier
                      </button>
                      <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#ef4444' }}
                        onClick={() => setConfirmSuppr(produit)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modalProduit && (
        <ModalProduit
          produit={produitEdite}
          onFermer={() => setModalProduit(false)}
          onSucces={() => { setModalProduit(false); chargerProduits(); }}
        />
      )}
      {modalStock && (
        <ModalStock
          produit={modalStock.produit}
          type={modalStock.type}
          onFermer={() => setModalStock(null)}
          onSucces={() => { setModalStock(null); chargerProduits(); }}
        />
      )}
      {modalMdp && (
        <ModalMotDePasse
          produit={modalMdp}
          onValide={() => onMdpValide(modalMdp)}
          onFermer={() => setModalMdp(null)}
        />
      )}
      {confirmSuppr && (
        <ModalConfirmation
          message={`Supprimer le produit "${confirmSuppr.nom}" ? Cette action est irréversible.`}
          onConfirmer={() => supprimerProduit(confirmSuppr.id)}
          onAnnuler={() => setConfirmSuppr(null)}
        />
      )}
    </div>
  );
};

export default Produits;
