// Logo de la boutique dans l'en-tête des pages vitrine : le logo de l'entreprise (forfait
// payant, envoyé par le serveur dans « marque »), sinon l'icône de boutique habituelle.
// Le logo est déjà recadré à sa forme (rond ou carré) : il remplit toute la pastille.
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { imageOptimisee } from '@/utils/images';
import { rayonLogo } from '@/utils/marque';

const LogoBoutique = ({ logo, forme, taille = 32, tailleIcone = 20, couleurIcone = '#00d4aa' }) => (logo ? (
  <img src={imageOptimisee(logo, 200)} alt="" className="flex-shrink-0"
    style={{ width: taille, height: taille, borderRadius: rayonLogo(forme), objectFit: 'cover', background: '#fff' }} />
) : (
  <FontAwesomeIcon icon={faStore} style={{ color: couleurIcone, fontSize: tailleIcone }} />
));

export default LogoBoutique;
