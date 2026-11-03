// Écran d'attente — même rendu que celui de public/index.html (styles définis là-bas), pour
// que le passage du démarrage à la page ne provoque aucun clignotement.
// enPage : à l'intérieur d'une page (menu visible), sinon plein écran.
// Pages vitrine d'une boutique au forfait payant : nom et logo de l'entreprise (rond ou carré,
// il remplit toute la forme) ; partout ailleurs : GesTrack (voir utils/marque.js).
import { marqueEcranChargement } from '@/utils/marque';

const EcranChargement = ({ enPage = false }) => {
  const marque = marqueEcranChargement();
  const classeLogo = marque?.logo
    ? ` ed-logo--marque${marque.forme === 'carre' ? ' ed-logo--carre' : ''}`
    : '';

  return (
    <div className={`ecran-demarrage${enPage ? ' ecran-demarrage--page' : ''}`}>
      <div className="ed-groupe">
        <div className="ed-anneau"><div className={`ed-logo${classeLogo}`}><img src={marque?.logo || '/logo192.png'} alt="" /></div></div>
        <div className="ed-titre">{marque?.nom || 'GesTrack Business'}</div>
      </div>
      <div className="ed-barre"><i /></div>
    </div>
  );
};

export default EcranChargement;
