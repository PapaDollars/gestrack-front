// Filtrage des produits à exporter
import { passeFiltreStock } from '@/services/unites';
import { dansCategorie } from '@/utils/soldes';

// Produits d'une source (Tous / Boutique / Magasin)
export const filtrerParSource = (produits, source) => (produits || []).filter(p =>
  source === 'boutique' ? p._source === 'Boutique' : source === 'magasin' ? p._source === 'Magasin' : true);

// Produits correspondant à une source + un filtre stock + une catégorie (y compris les
// catégories « Soldes » et « Vente Flash », voir utils/soldes.js)
export const filtrerProduitsExport = (produits, source, stock, categorie) => filtrerParSource(produits, source)
  .filter(p => passeFiltreStock(p, stock) && (!categorie || dansCategorie(p, categorie)));
