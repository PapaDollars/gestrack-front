// Modal formulaire produit
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { produitsAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import FormNouveauProduit from '@/components/produits/FormNouveauProduit';
import ModalConfirmerSolde from '@/pages/boutique/modals/ModalConfirmerSolde';
import ModalConfirmerVenteFlash from '@/pages/boutique/modals/ModalConfirmerVenteFlash';
import { decomposerStock, calculerStockEnPieces, psParUnite } from '@/services/unites';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

// ============================
// Modal création/modification produit
// ============================
// Prix pratiqué avant la promotion — barré sur la carte du produit
const ChampPrixAvant = ({ unite, value, onChange }) => (
  <div className="mt-2">
    <label className="form-label small fw-semibold text-muted mb-1">Prix d'avant (par {unite}) — sera barré</label>
    <div className="input-group">
      <input type="number" min="0" step="any" className="form-control" placeholder="Ex: 5000"
        value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="input-group-text">FCFA</span>
    </div>
  </div>
);

// sansPromotions : fiche ouverte depuis le magasin — les promotions se gèrent depuis la boutique
// seulement. Les cases sont cachées et l'enregistrement retire celles restées sur le produit.
export const ModalProduit = ({ produit, api = null, sansPromotions = false, onFermer, onSucces }) => {
  const [form, setForm] = useState({
    nom: '', description: '', prixVente: '', prixAchat: '', prixUnite: 'dz',
    categorie: '',
    unitePrincipale: 'dz', uniteCustom: '',
    dzParBallo: '', psParBallo: '', balloEnPs: false, psParCrt: '', psParSac: '',
    stockNiveau1: '', stockNiveau2: '', stockNiveau3: '',
    enSolde: false, prixAvantSolde: '',
    venteFlash: false, prixAvantFlash: '',
  });
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [confirmerSolde, setConfirmerSolde] = useState(false);
  const [confirmerFlash, setConfirmerFlash] = useState(false);

  const unite   = form.uniteCustom || form.unitePrincipale;
  const isBallo = unite === 'ballo';

  useEffect(() => {
    if (produit) {
      const uniteP = produit.unitePrincipale || produit.unite || 'dz';
      const stockActuel = produit.stockEnPieces ?? 0;
      const { n1, n2, n3 } = decomposerStock(uniteP, produit, stockActuel);
      // Le prix est enregistré par pièce en base — affiché ici converti dans l'unité
      // principale du produit, pour correspondre à ce que le vendeur a en tête.
      const ratioP = psParUnite(uniteP, produit);
      setForm(prev => ({
        ...prev,
        nom: produit.nom || '',
        description: produit.description || '',
        prixVente: produit.prixVente ? produit.prixVente * ratioP : '',
        prixAchat: '',
        prixUnite: uniteP,
        categorie: produit.categorie || '',
        unitePrincipale: UNITES_STD.includes(uniteP) ? uniteP : '__custom__',
        uniteCustom: UNITES_STD.includes(uniteP) ? '' : uniteP,
        dzParBallo: produit.dzParBallo || '',
        psParBallo: produit.psParBallo || '',
        balloEnPs: !!produit.psParBallo,
        psParCrt: produit.psParCrt || '',
        psParSac: produit.psParSac || '',
        // Pré-rempli avec le stock actuel décomposé, pour pouvoir le corriger si besoin
        stockNiveau1: n1, stockNiveau2: n2, stockNiveau3: n3,
        // Soldes OU Vente Flash : un ancien produit avec les deux garde la Vente Flash
        ...(!sansPromotions && {
        enSolde: !!produit.enSolde && !produit.venteFlash,
        prixAvantSolde: produit.prixAvantSolde && !produit.venteFlash ? produit.prixAvantSolde * ratioP : '',
        venteFlash: !!produit.venteFlash,
        prixAvantFlash: produit.prixAvantFlash ? produit.prixAvantFlash * ratioP : '',
        }),
      }));
      if (produit.image) setApercu(produit.image);
    }
  }, [produit]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Produit en solde : prix d'achat facultatif (ses ventes ne comptent pas dans les bénéfices)
    if (!produit && !form.prixAchat && !form.enSolde) { toast.error('Le prix d\'achat est requis'); return; }
    if (!produit && !form.stockNiveau1) { toast.error('Le stock initial (niveau 1) est requis'); return; }
    if (isBallo && !(form.balloEnPs ? form.psParBallo : form.dzParBallo)) {
      toast.error(form.balloEnPs ? 'Indiquez le nombre de pièces par ballo' : 'Indiquez le nombre de dz par ballo'); return;
    }

    const uniteFinale     = form.unitePrincipale === '__custom__' ? form.uniteCustom : form.unitePrincipale;
    // L'utilisateur saisit le prix dans l'unité de son choix (ps, dz, ballo...), pas
    // forcément l'unité principale — converti ici en prix par pièce, seule unité que le
    // reste du système (finances, etc.) comprend.
    const ratioFinal = psParUnite(form.prixUnite || uniteFinale, form);
    const prixVenteParPs = (parseFloat(form.prixVente) || 0) / ratioFinal;
    const prixAchatParPs = form.prixAchat ? parseFloat(form.prixAchat) / ratioFinal : '';
    // Prix d'avant (barré) : saisi dans la même unité que le prix de vente, et forcément plus élevé
    const prixVenteSaisi = parseFloat(form.prixVente) || 0;
    if ((form.enSolde && form.prixAvantSolde && parseFloat(form.prixAvantSolde) <= prixVenteSaisi)
      || (form.venteFlash && form.prixAvantFlash && parseFloat(form.prixAvantFlash) <= prixVenteSaisi)) {
      toast.error('Le prix d\'avant doit être plus élevé que le prix de vente actuel'); return;
    }

    setChargement(true);
    try {
      const formData = new FormData();
      formData.append('nom', form.nom);
      formData.append('description', form.description);
      formData.append('prixVente', prixVenteParPs);
      if (prixAchatParPs) formData.append('prixAchat', prixAchatParPs);
      formData.append('enSolde', form.enSolde ? 'true' : 'false');
      formData.append('prixAvantSolde', form.enSolde && form.prixAvantSolde ? parseFloat(form.prixAvantSolde) / ratioFinal : 0);
      formData.append('venteFlash', form.venteFlash ? 'true' : 'false');
      formData.append('prixAvantFlash', form.venteFlash && form.prixAvantFlash ? parseFloat(form.prixAvantFlash) / ratioFinal : 0);
      formData.append('categorie', form.categorie || '');
      formData.append('unitePrincipale', uniteFinale);
      // Ballo en pièces ou en douzaines : un seul des deux est envoyé (le serveur efface l'autre)
      if (form.balloEnPs && form.psParBallo) formData.append('psParBallo', form.psParBallo);
      else if (form.dzParBallo) formData.append('dzParBallo', form.dzParBallo);
      if (form.psParCrt)   formData.append('psParCrt',   form.psParCrt);
      if (form.psParSac)   formData.append('psParSac',   form.psParSac);
      if (!produit) {
        formData.append('stockNiveau1', form.stockNiveau1 || 0);
        formData.append('stockNiveau2', form.stockNiveau2 || 0);
        formData.append('stockNiveau3', form.stockNiveau3 || 0);
      }
      if (image) formData.append('image', image);

      const apiToUse = api || produitsAPI;
      if (produit) {
        await apiToUse.update(produit.id, formData);

        // Le stock a pu être corrigé depuis ce formulaire (niveaux pré-remplis puis modifiés) —
        // on l'applique via l'ajustement d'inventaire, journalisé, plutôt qu'en silence.
        const nouveauStockEnPieces = calculerStockEnPieces(uniteFinale, form, form.stockNiveau1, form.stockNiveau2, form.stockNiveau3);
        if (nouveauStockEnPieces !== (produit.stockEnPieces ?? 0)) {
          const reponseAjust = await apiToUse.ajusterStock(produit.id, {
            quantite: nouveauStockEnPieces, unite: 'ps', motif: 'Ajustement via modification du produit',
          });
          if (estMisEnAttente(reponseAjust)) { onSucces(); return; }
        }
        toast.success('Produit mis à jour');
      } else {
        await apiToUse.create(formData);
        toast.success('Produit créé');
      }
      onSucces();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0" style={{ borderRadius: 16, background: 'var(--bs-body-bg)' }}>
          <div className="modal-header border-0 px-4 pt-4 pb-0">
            <h5 className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>{produit ? 'Modifier le produit' : 'Nouveau produit'}</h5>
            <button className="btn btn-light btn-sm rounded-circle ms-auto" onClick={onFermer}><FontAwesomeIcon icon={faTimes} /></button>
          </div>
          <div className="modal-body px-4">
            <form onSubmit={handleSubmit} id="form-produit">
              <FormNouveauProduit
                form={form} setForm={setForm}
                image={image} setImage={setImage}
                apercu={apercu} setApercu={setApercu}
                avecPrixAchat={true}
                avecStockInitial={true}
                estModification={!!produit}
              />

              {/* Soldes (ventes hors bénéfices) et Vente Flash — cocher demande une confirmation.
                  Une fois actif : champ du prix d'avant, barré sur la carte */}
              {!sansPromotions && (
              <div className="row g-2 mt-2">
                <div className="col-12 col-md-6">
                  <label className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 mb-0"
                    style={{ cursor: 'pointer', background: form.enSolde ? '#fef3c7' : 'var(--bs-secondary-bg)' }}>
                    <input type="checkbox" style={{ accentColor: '#d97706' }}
                      checked={form.enSolde}
                      onChange={e => (e.target.checked
                        ? setConfirmerSolde(true)
                        : setForm(f => ({ ...f, enSolde: false, prixAvantSolde: '' })))} />
                    <span className="fw-semibold" style={{ color: form.enSolde ? '#92400e' : 'var(--bs-body-color)' }}>
                      Produit en solde
                    </span>
                  </label>
                  {form.enSolde && (
                    <ChampPrixAvant unite={form.prixUnite} value={form.prixAvantSolde}
                      onChange={(v) => setForm(f => ({ ...f, prixAvantSolde: v }))} />
                  )}
                </div>
                <div className="col-12 col-md-6">
                  <label className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 mb-0"
                    style={{ cursor: 'pointer', background: form.venteFlash ? '#fee2e2' : 'var(--bs-secondary-bg)' }}>
                    <input type="checkbox" style={{ accentColor: '#dc2626' }}
                      checked={form.venteFlash}
                      onChange={e => (e.target.checked
                        ? setConfirmerFlash(true)
                        : setForm(f => ({ ...f, venteFlash: false, prixAvantFlash: '' })))} />
                    <span className="fw-semibold" style={{ color: form.venteFlash ? '#991b1b' : 'var(--bs-body-color)' }}>
                      Vente Flash
                    </span>
                  </label>
                  {form.venteFlash && (
                    <ChampPrixAvant unite={form.prixUnite} value={form.prixAvantFlash}
                      onChange={(v) => setForm(f => ({ ...f, prixAvantFlash: v }))} />
                  )}
                </div>
              </div>
              )}
              {confirmerFlash && (
                <ModalConfirmerVenteFlash
                  nomProduit={form.nom}
                  onConfirmer={() => { setForm(f => ({ ...f, venteFlash: true, enSolde: false, prixAvantSolde: '' })); setConfirmerFlash(false); }}
                  onAnnuler={() => setConfirmerFlash(false)}
                />
              )}
              {confirmerSolde && (
                <ModalConfirmerSolde
                  nomProduit={form.nom}
                  onConfirmer={() => { setForm(f => ({ ...f, enSolde: true, venteFlash: false, prixAvantFlash: '' })); setConfirmerSolde(false); }}
                  onAnnuler={() => setConfirmerSolde(false)}
                />
              )}
            </form>
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button className="btn btn-light" onClick={onFermer}>Annuler</button>
            <button type="submit" form="form-produit" className="btn text-white" style={{ background: '#00d4aa' }} disabled={chargement}>
              {chargement ? <FontAwesomeIcon icon={faSpinner} spin /> : (produit ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalProduit;
