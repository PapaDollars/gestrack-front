// Sections du tableau de bord affichées dans la zone qui défile, et leur ordre choisi dans
// Paramètres › Apparences (champ `ordreTableauBord` des paramètres). Le serveur garde la même
// liste d'identifiants (controllers/parametresController.js).
import {
  faBell, faChartPie, faTruck, faReceipt, faUsers, faStore, faBoxOpen,
} from '@fortawesome/free-solid-svg-icons';

export const SECTIONS_TABLEAU_BORD = [
  { id: 'alertes',         label: 'Alertes',                                  icone: faBell },
  { id: 'repartition',     label: 'Répartition des dettes',                   icone: faChartPie },
  { id: 'livraisons',      label: 'Livraisons fournisseurs en cours',         icone: faTruck },
  { id: 'factures',        label: 'Factures récentes',                        icone: faReceipt },
  { id: 'clients',         label: 'Top débiteurs et clients par profession',  icone: faUsers },
  { id: 'produitsRecents', label: 'Produits récents (boutique et magasin)',   icone: faStore },
  { id: 'stockFaible',     label: 'Stock faible (boutique et magasin)',       icone: faBoxOpen },
];

const IDS = SECTIONS_TABLEAU_BORD.map(s => s.id);

// Ordre enregistré, nettoyé : identifiants inconnus ou en double retirés, sections manquantes
// (ex. ajoutées après l'enregistrement) remises à la fin dans l'ordre par défaut
export const ordreSections = (ordre) => {
  const valides = Array.isArray(ordre) ? ordre.filter((id, i) => IDS.includes(id) && ordre.indexOf(id) === i) : [];
  return [...valides, ...IDS.filter(id => !valides.includes(id))];
};
