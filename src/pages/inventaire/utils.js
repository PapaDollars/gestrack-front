// Inventaire — règles communes à la page de comptage et aux pages Boutique / Magasin
import { stockEnPs, afficherStockDetails } from '@/services/unites';

export const LIEUX = {
  boutique: { libelle: 'Boutique', prefixeQR: 'B' },
  magasin:  { libelle: 'Magasin',  prefixeQR: 'M' },
};

// Statuts d'un produit pendant l'inventaire, avec leurs couleurs (fond / texte)
export const STATUTS = {
  a_compter: { libelle: 'À compter', fond: '#475569', texte: '#ffffff', clair: '#f1f5f9', fonce: '#475569' },
  conforme:  { libelle: 'Conforme',  fond: '#16a34a', texte: '#ffffff', clair: '#dcfce7', fonce: '#15803d' },
  manquant:  { libelle: 'Manquant',  fond: '#ea580c', texte: '#ffffff', clair: '#fff7ed', fonce: '#c2410c' },
  surplus:   { libelle: 'En trop',   fond: '#2563eb', texte: '#ffffff', clair: '#eff6ff', fonce: '#1d4ed8' },
  ignore:    { libelle: 'Ignoré',    fond: '#94a3b8', texte: '#ffffff', clair: '#f1f5f9', fonce: '#64748b' },
};

// Le produit fait-il partie de cet inventaire ? (catégories choisies au lancement, ou tout)
export const dansPerimetre = (session, produit) => {
  const cats = session?.categories || [];
  return cats.length === 0 || cats.includes(produit.categorie);
};

export const comptageDe = (session, produitId) => session?.comptes?.[produitId] || null;

export const statutDe = (session, produitId) => {
  const c = comptageDe(session, produitId);
  if (!c) return 'a_compter';
  if (c.statut === 'ignore') return 'ignore';
  if (c.compte === c.theorique) return 'conforme';
  return c.compte < c.theorique ? 'manquant' : 'surplus';
};

export const ecartDe = (session, produitId) => {
  const c = comptageDe(session, produitId);
  return c && c.statut === 'compte' ? c.compte - c.theorique : 0;
};

// Quantité en pièces écrite dans les unités du produit (ex. « 3 dz 1 ps »)
export const formatPs = (produit, ps) => afficherStockDetails({ ...produit, stockEnPieces: Math.max(0, ps) });

// Écart signé, ex. « −3 ps », « +1 dz 2 ps »
export const formatEcart = (produit, ecart) => (ecart === 0 ? '0' : `${ecart > 0 ? '+' : '−'}${formatPs(produit, Math.abs(ecart))}`);

// Comptes de la session, sur les produits de son périmètre
export const progression = (session, produits) => {
  const concernes = produits.filter(p => dansPerimetre(session, p));
  const r = { total: concernes.length, faits: 0, conformes: 0, manquants: 0, surplus: 0, ignores: 0 };
  concernes.forEach(p => {
    const s = statutDe(session, p.id);
    if (s === 'a_compter') return;
    r.faits += 1;
    if (s === 'conforme') r.conformes += 1;
    else if (s === 'manquant') r.manquants += 1;
    else if (s === 'surplus') r.surplus += 1;
    else if (s === 'ignore') r.ignores += 1;
  });
  r.ecarts = r.manquants + r.surplus;
  r.pourcentage = r.total ? Math.round((r.faits / r.total) * 100) : 0;
  return r;
};

// Lignes du rapport (produits comptés ou ignorés), quantités dans les unités du produit
export const lignesRapport = (session, produits) => produits
  .filter(p => dansPerimetre(session, p) && comptageDe(session, p.id))
  .map((p) => {
    const c = comptageDe(session, p.id);
    const statut = statutDe(session, p.id);
    return {
      nom: p.nom, categorie: p.categorie || '', statut,
      attendu: formatPs(p, c.theorique),
      compte: c.statut === 'compte' ? formatPs(p, c.compte) : '—',
      ecart: c.statut === 'compte' ? formatEcart(p, c.compte - c.theorique) : '—',
    };
  })
  .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

export { stockEnPs };

// Contenu des étiquettes QR : « GT:B:<id> » (Boutique) ou « GT:M:<id> » (Magasin)
export const texteQR = (lieu, produitId) => `GT:${LIEUX[lieu].prefixeQR}:${produitId}`;
export const lireQR = (texte) => {
  const m = /^GT:([BM]):([A-Za-z0-9_-]{1,64})$/.exec(String(texte || '').trim());
  if (!m) return null;
  return { lieu: m[1] === 'B' ? 'boutique' : 'magasin', produitId: m[2] };
};

// Prénom de la personne qui compte, gardé sur ce téléphone
const CLE_COMPTEUR = 'gestrack_inventaire_compteur';
export const lireCompteur = () => { try { return localStorage.getItem(CLE_COMPTEUR) || ''; } catch { return ''; } };
export const memoriserCompteur = (nom) => { try { localStorage.setItem(CLE_COMPTEUR, nom); } catch { /* stockage indisponible */ } };

export const dateHeure = (iso) => (iso
  ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '');
