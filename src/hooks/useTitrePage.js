// Titre de l'onglet du navigateur (et des favoris / de l'historique) pour la page affichée.
// Rétabli au titre général en quittant la page.
import { useEffect } from 'react';

export const TITRE_APP = 'GesTrack Business';

const useTitrePage = (titre) => {
  useEffect(() => {
    if (!titre) return undefined;
    document.title = titre;
    return () => { document.title = TITRE_APP; };
  }, [titre]);
};

export default useTitrePage;
