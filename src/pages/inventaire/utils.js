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
      par: c.par || '',
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
// Retenu pour un inventaire précis, le temps qu'il dure : effacé quand il est validé ou annulé
// (le suivant repart d'un champ vide)
const cleCompteur = (sessionId) => `gestrack_inventaire_compteur_${sessionId}`;
export const lireCompteur = (sessionId) => {
  if (!sessionId) return '';
  try { return localStorage.getItem(cleCompteur(sessionId)) || ''; } catch { return ''; }
};
export const memoriserCompteur = (sessionId, nom) => {
  if (!sessionId) return;
  try {
    if (nom) localStorage.setItem(cleCompteur(sessionId), nom);
    else localStorage.removeItem(cleCompteur(sessionId));
  } catch { /* stockage indisponible */ }
};
export const oublierCompteur = (sessionId) => {
  try {
    if (sessionId) localStorage.removeItem(cleCompteur(sessionId));
    localStorage.removeItem('gestrack_inventaire_compteur'); // ancienne clé commune à tous les inventaires
  } catch { /* stockage indisponible */ }
};

export const dateHeure = (iso) => (iso
  ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '');

// ── Prénoms proposés dans « Qui compte ? » (sur ce téléphone, d'un inventaire à l'autre) ──
// prénoms enregistrés + prénoms retirés de la liste par l'utilisateur (personne qui ne fait plus
// les inventaires) ; un prénom retiré puis réutilisé revient dans la liste.
const CLE_PRENOMS = 'gestrack_inventaire_prenoms';
const CLE_PRENOMS_RETIRES = 'gestrack_inventaire_prenoms_retires';
const lireListe = (cle) => { try { const v = JSON.parse(localStorage.getItem(cle) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const ecrireListe = (cle, liste) => { try { localStorage.setItem(cle, JSON.stringify(liste)); } catch { /* stockage indisponible */ } };
const memeNom = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const lirePrenoms = () => ({ enregistres: lireListe(CLE_PRENOMS), retires: lireListe(CLE_PRENOMS_RETIRES) });

// Après un comptage enregistré avec ce prénom : il rejoint la liste (et n'est plus « retiré »)
export const retenirPrenom = (nom) => {
  const n = String(nom || '').trim();
  if (!n) return;
  const enregistres = lireListe(CLE_PRENOMS).filter(x => !memeNom(x, n));
  ecrireListe(CLE_PRENOMS, [n, ...enregistres].slice(0, 30));
  ecrireListe(CLE_PRENOMS_RETIRES, lireListe(CLE_PRENOMS_RETIRES).filter(x => !memeNom(x, n)));
};

export const retirerPrenom = (nom) => {
  const n = String(nom || '').trim();
  if (!n) return;
  ecrireListe(CLE_PRENOMS, lireListe(CLE_PRENOMS).filter(x => !memeNom(x, n)));
  ecrireListe(CLE_PRENOMS_RETIRES, [n, ...lireListe(CLE_PRENOMS_RETIRES).filter(x => !memeNom(x, n))].slice(0, 50));
};

