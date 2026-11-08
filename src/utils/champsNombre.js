// Champs numériques (prix, quantités…) : dans le navigateur, faire tourner la molette de la
// souris au-dessus d'un champ nombre actif augmente ou diminue sa valeur — on croit faire
// défiler la page et on modifie un prix sans s'en rendre compte. Correction globale, pour
// tous les formulaires de l'application : le champ perd le focus dès que la molette tourne
// dessus, la valeur ne bouge plus et la page défile normalement.
export const bloquerMoletteSurChampsNombre = () => {
  document.addEventListener('wheel', (e) => {
    const champ = e.target;
    if (champ instanceof HTMLInputElement && champ.type === 'number' && document.activeElement === champ) {
      champ.blur();
    }
  }, { passive: true, capture: true });
};
