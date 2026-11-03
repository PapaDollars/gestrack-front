// Paramètres › Site vitrine : logo de l'entreprise — affiché sur les pages vitrine (écran de
// chargement et en-tête, à la place de l'icône de boutique), avec un forfait payant.
// Envoyé dès qu'il est choisi, sans passer par « Enregistrer la vitrine ».
import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faUpload, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { parametresAPI, estMisEnAttente } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import ModalConfirmation from '@/components/common/ModalConfirmation';
import { imageOptimisee } from '@/utils/images';
import { rayonLogo } from '@/utils/marque';
import ModalRecadrageLogo from '@/pages/parametres/vitrine/modals/ModalRecadrageLogo';

const TAILLE_MAX_MO = 3; // même limite que le serveur (config/cloudinary.js)

const LogoEntreprise = () => {
  const { parametres, setParametres } = useParametres();
  const logo = parametres.logoEntreprise || null;
  const forme = parametres.formeLogo === 'carre' ? 'carre' : 'cercle';
  const champFichier = useRef(null);
  const [envoi, setEnvoi] = useState(false);
  const [confirmerRetrait, setConfirmerRetrait] = useState(false);
  // Image choisie, en attente de recadrage (fenêtre ouverte tant qu'elle est définie)
  const [aRecadrer, setARecadrer] = useState(null);

  const ouvrirChoix = () => champFichier.current?.click();

  const choisirFichier = (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = ''; // permet de choisir à nouveau le même fichier
    if (!fichier) return;
    if (!fichier.type.startsWith('image/')) { toast.error('Choisissez une image (PNG, JPG ou WEBP)'); return; }
    if (fichier.size > TAILLE_MAX_MO * 1024 * 1024) { toast.error(`Image trop lourde (${TAILLE_MAX_MO} Mo maximum)`); return; }
    setARecadrer(fichier);
  };

  // Logo recadré à la forme choisie (rond ou carré) : envoyé au serveur
  const envoyer = async (fichierRecadre, formeChoisie) => {
    setARecadrer(null);
    setEnvoi(true);
    try {
      const reponse = await parametresAPI.uploaderLogo(fichierRecadre, formeChoisie);
      if (estMisEnAttente(reponse)) return;
      setParametres({ logoEntreprise: reponse.data.logoEntreprise, formeLogo: reponse.data.formeLogo });
      toast.success('Logo enregistré');
    } catch {
      toast.error('Le logo n\'a pas pu être envoyé. Vérifiez votre connexion et réessayez.');
    } finally { setEnvoi(false); }
  };

  const retirer = async () => {
    setEnvoi(true);
    try {
      const reponse = await parametresAPI.supprimerLogo();
      if (estMisEnAttente(reponse)) return;
      setParametres({ logoEntreprise: null });
      toast.success('Logo retiré');
    } catch {
      toast.error('Le logo n\'a pas pu être retiré. Réessayez.');
    } finally { setEnvoi(false); setConfirmerRetrait(false); }
  };

  return (
    // Une seule rangée : le cercle du logo, puis à sa droite le titre, la taille maximale et les boutons
    <div className="d-flex align-items-center gap-3">
      {/* Clic sur le cercle = même action que le bouton « Ajouter / Changer le logo » */}
      <button type="button" disabled={envoi} onClick={ouvrirChoix}
        title={logo ? 'Changer le logo' : 'Ajouter un logo'} aria-label={logo ? 'Changer le logo' : 'Ajouter un logo'}
        className="d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden p-0"
        style={{ width: 80, height: 80, borderRadius: logo ? rayonLogo(forme) : '50%', background: '#fff', border: '1px solid var(--bs-border-color)', cursor: envoi ? 'wait' : 'pointer' }}>
        {/* Logo déjà recadré à sa forme : il remplit toute la pastille */}
        <img src={logo ? imageOptimisee(logo, 200) : '/logo192.png'} alt=""
          style={logo
            ? { width: '100%', height: '100%', objectFit: 'cover' }
            : { width: '80%', height: '80%', objectFit: 'contain', opacity: 0.35 }} />
      </button>
      <div style={{ minWidth: 0 }}>
        <div className="d-flex align-items-baseline flex-wrap column-gap-2 mb-2">
          <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>Logo de l'entreprise</h6>
          <small className="text-muted">Image {TAILLE_MAX_MO} Mo maximum.</small>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {logo && (
            <button type="button" className="btn btn-sm d-flex align-items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626' }}
              disabled={envoi} onClick={() => setConfirmerRetrait(true)}>
              <FontAwesomeIcon icon={faTrash} /> Retirer
            </button>
          )}
          <button type="button" className="btn btn-sm d-flex align-items-center gap-2"
            style={{ background: 'rgba(0,212,170,0.12)', color: '#00a881' }}
            disabled={envoi} onClick={ouvrirChoix}>
            <FontAwesomeIcon icon={envoi ? faSpinner : faUpload} spin={envoi} />
            {logo ? 'Changer le logo' : 'Ajouter un logo'}
          </button>
          <input ref={champFichier} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={choisirFichier} />
        </div>
      </div>

      {aRecadrer && (
        <ModalRecadrageLogo fichier={aRecadrer} formeInitiale={forme}
          onValider={envoyer} onAnnuler={() => setARecadrer(null)} />
      )}

      {confirmerRetrait && (
        <ModalConfirmation message="Retirer le logo de l'entreprise ? L'écran de chargement et vos pages produits reprendront l'icône par défaut."
          labelConfirmer="Retirer" chargement={envoi}
          onConfirmer={retirer} onAnnuler={() => setConfirmerRetrait(false)} />
      )}
    </div>
  );
};

// Rappel affiché en bas de la carte « Nom de l'entreprise » pour un compte sans forfait payant
export const AvisForfaitPayant = () => (
  <div className="small mt-3 d-flex align-items-start gap-2 p-2 rounded-2"
    style={{ background: 'rgba(217,119,6,0.1)', color: '#b45309' }}>
    <FontAwesomeIcon icon={faCircleInfo} className="mt-1" />
    <span>
      Le nom et le logo de l'entreprise s'affichent sur vos pages produits (ouverte à tous et avec mot de
      passe) : sur l'écran de chargement et en haut de la page. Ils n'apparaissent que si vous passez à un
      forfait payant.
    </span>
  </div>
);

export default LogoEntreprise;
