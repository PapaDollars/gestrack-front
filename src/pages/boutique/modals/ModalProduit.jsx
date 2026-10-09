// Modal formulaire produit
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { produitsAPI, estMisEnAttente } from '@/services/api';
import { toast } from 'react-toastify';
import FormNouveauProduit from '@/components/produits/FormNouveauProduit';
import ModalConfirmerSolde from '@/pages/boutique/modals/ModalConfirmerSolde';
import { decomposerStock, calculerStockEnPieces, psParUnite } from '@/services/unites';

const UNITES_STD = ['ps', 'dz', 'paq', 'crt', 'sac', 'ballo'];

// ============================
// Modal création/modification produit
// ============================
export const ModalProduit = ({ produit, api = null, onFermer, onSucces }) => {
  const [form, setForm] = useState({
    nom: '', description: '', prixVente: '', prixAchat: '', prixUnite: 'dz',
    categorie: '',
    unitePrincipale: 'dz', uniteCustom: '',
    dzParBallo: '', psParCrt: '', psParSac: '',
    stockNiveau1: '', stockNiveau2: '', stockNiveau3: '',
    enSolde: false,
  });
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [confirmerSolde, setConfirmerSolde] = useState(false);

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
        psParCrt: produit.psParCrt || '',
        psParSac: produit.psParSac || '',
        // Pré-rempli avec le stock actuel décomposé, pour pouvoir le corriger si besoin
        stockNiveau1: n1, stockNiveau2: n2, stockNiveau3: n3,
        enSolde: !!produit.enSolde,
      }));
      if (produit.image) setApercu(produit.image);
    }
  }, [produit]); // eslint-disable-line

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Produit en solde : prix d'achat facultatif (ses ventes ne comptent pas dans les bénéfices)
    if (!produit && !form.prixAchat && !form.enSolde) { toast.error('Le prix d\'achat est requis'); return; }
    if (!produit && !form.stockNiveau1) { toast.error('Le stock initial (niveau 1) est requis'); return; }
    if (isBallo && !form.dzParBallo) { toast.error('Indiquez le nombre de dz par ballo'); return; }

    const uniteFinale     = form.unitePrincipale === '__custom__' ? form.uniteCustom : form.unitePrincipale;
    // L'utilisateur saisit le prix dans l'unité de son choix (ps, dz, ballo...), pas
    // forcément l'unité principale — converti ici en prix par pièce, seule unité que le
    // reste du système (finances, etc.) comprend.
    const ratioFinal = psParUnite(form.prixUnite || uniteFinale, form);
    const prixVenteParPs = (parseFloat(form.prixVente) || 0) / ratioFinal;
    const prixAchatParPs = form.prixAchat ? parseFloat(form.prixAchat) / ratioFinal : '';

    setChargement(true);
    try {
      const formData = new FormData();
      formData.append('nom', form.nom);
      formData.append('description', form.description);
      formData.append('prixVente', prixVenteParPs);
      if (prixAchatParPs) formData.append('prixAchat', prixAchatParPs);
      formData.append('enSolde', form.enSolde ? 'true' : 'false');
      formData.append('categorie', form.categorie || '');
      formData.append('unitePrincipale', uniteFinale);
      if (form.dzParBallo) formData.append('dzParBallo', form.dzParBallo);
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

              {/* Produit en solde (ventes hors bénéfices) — cocher demande une confirmation */}
              <label className="d-flex align-items-center gap-2 mt-3 px-3 py-2 rounded-3"
                style={{ cursor: 'pointer', background: form.enSolde ? '#fef3c7' : 'var(--bs-secondary-bg)' }}>
                <input type="checkbox" style={{ accentColor: '#d97706' }}
                  checked={form.enSolde}
                  onChange={e => (e.target.checked
                    ? setConfirmerSolde(true)
                    : setForm(f => ({ ...f, enSolde: false })))} />
                <span className="fw-semibold" style={{ color: form.enSolde ? '#92400e' : 'var(--bs-body-color)' }}>
                  Produit en solde
                </span>
              </label>
              {confirmerSolde && (
                <ModalConfirmerSolde
                  nomProduit={form.nom}
                  onConfirmer={() => { setForm(f => ({ ...f, enSolde: true })); setConfirmerSolde(false); }}
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
