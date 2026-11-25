import { useEffect } from 'react';

// Android (Chrome ≥ 108) : le clavier passe PAR-DESSUS la page au lieu de la réduire, et le
// navigateur fait glisser tout l'écran vers le haut pour montrer le champ touché — le haut des
// fenêtres (ex. « Client / Ajouter un produit » de la facture) sort alors de l'écran. L'option
// interactive-widget=resizes-content redonne l'ancien comportement : la page est réduite à la
// zone au-dessus du clavier, rien ne glisse. L'iPhone (Safari) ignore cette option et n'a pas
// le problème.
// Activée seulement pendant que le composant qui l'utilise est affiché, puis retirée.
const useClavierReduitPage = () => {
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return undefined;
    const origine = meta.getAttribute('content') || '';
    if (!/interactive-widget/.test(origine)) {
      meta.setAttribute('content', `${origine}, interactive-widget=resizes-content`);
    }
    return () => meta.setAttribute('content', origine);
  }, []);
};

export default useClavierReduitPage;
