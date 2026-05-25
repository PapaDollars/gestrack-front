// Tableau de bord principal GesTrack
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faFileInvoiceDollar, faBox,
  faExclamationTriangle, faArrowRight, faSpinner,
  faStore, faWarehouse,
  faReceipt, faTruck, faCheckCircle,
  faBell, faBoxOpen,
} from '@fortawesome/free-solid-svg-icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { clientsAPI, dettesAPI, produitsAPI, magasinAPI, facturesAPI, fournisseursAPI } from '@/services/api';
import { fmtDH } from '@/utils/pdf';
import useIsMobile from '@/hooks/useIsMobile';
import { afficherStockDetails } from '@/services/unites';
import defaultProduit from '@/assets/img/defaultProduit.png';

// ── Carte statistique réutilisable ────────────────────────────────────────────
const CarteStatistique = ({ titre, valeur, icone, couleur, lien, chargement }) => (
  <Link to={lien} className="card border-0 shadow-sm h-100 text-decoration-none" style={{ borderRadius: 14 }}>
    <div className="card-body p-2 d-flex align-items-center gap-2">
      <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
        style={{ width: 30, height: 30, background: `${couleur}20` }}>
        <FontAwesomeIcon icon={icone} style={{ color: couleur, fontSize: 13 }} />
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)', lineHeight: 1.2 }}>{titre}</div>
        {chargement
          ? <FontAwesomeIcon icon={faSpinner} spin className="text-muted" style={{ fontSize: 12 }} />
          : <div className="fw-bold" style={{ color: 'var(--bs-body-color)', fontSize: 'var(--txt-xl)', lineHeight: 1.3 }}>{valeur}</div>}
      </div>
    </div>
  </Link>
);

// ── Carte produit ─────────────────────────────────────────────────────────────
const CarteProduit = ({ produit, mobile }) => {
  const stockPs = produit.stockEnPieces ?? produit.quantiteStock ?? 0;
  const stockFaible = stockPs <= 0;

  if (mobile) {
    return (
      <div className="d-flex align-items-center gap-3 py-2 px-1"
        style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
        <div style={{ width: 54, height: 54, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--bs-secondary-bg)' }}>
          <img src={produit.image || defaultProduit} alt={produit.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = defaultProduit; }} />
        </div>
        <div className="flex-grow-1 overflow-hidden">
          <div className="fw-semibold text-truncate small" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
          <div className="fw-bold" style={{ color: '#00d4aa', fontSize: 'var(--txt-md)' }}>
            {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(produit.prixVente || 0)}
          </div>
        </div>
        <span className="badge flex-shrink-0" style={{ fontSize: 'var(--txt-xs)', background: stockFaible ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: stockFaible ? '#ef4444' : '#10b981' }}>
          {afficherStockDetails(produit)}
        </span>
      </div>
    );
  }

  return (
    <div className="card flex-shrink-0 shadow"
      style={{ width: 145, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--bs-border-color)', background: 'var(--bs-tertiary-bg)' }}>
      <div style={{ height: 90, overflow: 'hidden', background: 'var(--bs-secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={produit.image || defaultProduit} alt={produit.nom}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = defaultProduit; }} />
      </div>
      <div className="p-2">
        <div className="fw-semibold text-truncate small" style={{ color: 'var(--bs-body-color)' }}>{produit.nom}</div>
        <div className="fw-bold" style={{ color: '#00d4aa', fontSize: 'var(--txt-md)' }}>
          {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(produit.prixVente || 0)}
        </div>
        <span className="badge mt-1" style={{ fontSize: 'var(--txt-xs)', background: stockFaible ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: stockFaible ? '#ef4444' : '#10b981' }}>
          {afficherStockDetails(produit)}
        </span>
      </div>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const isMobile = useIsMobile();
  const [stats, setStats]                   = useState({ clients: 0, dettes: 0, produits: 0, magasin: 0, dettesEnRetard: 0, dettesSoldees: 0, dettesAbandonnees: 0, totalDettes: 0, montantSolde: 0, montantAbandonne: 0, factures: 0, fournisseurs: 0 });
  const [topClients, setTopClients]         = useState([]);
  const [parProfession, setParProfession]   = useState({});
  const [stockFaible, setStockFaible]             = useState([]);
  const [stockMagasinFaible, setStockMagasinFaible] = useState([]);
  const [dettesRecentes, setDettesRecentes]       = useState([]);
  const [produitsRecents, setProduitsRecents]     = useState([]);
  const [magasinRecents, setMagasinRecents]       = useState([]);
  const [facturesRecentes, setFacturesRecentes]   = useState([]);
  const [commandesEnCours, setCommandesEnCours]   = useState([]);
  const [livraisonsEnAttente, setLivraisonsEnAttente] = useState(0);
  const [chargement, setChargement]               = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const [clients, dettes, produits, magasin, factures, fournisseurs] = await Promise.all([
          clientsAPI.getAll(), dettesAPI.getAll(), produitsAPI.getAll(), magasinAPI.getAll(),
          facturesAPI.getAll(), fournisseursAPI.getAll(),
        ]);
        const c = clients.data;
        const d = dettes.data;
        const p = produits.data;
        const m = magasin.data;

        const dettesEnCours     = d.filter(x => x.statut === 'EN_COURS' || x.statut === 'EN_RETARD');
        const dettesEnRetard    = d.filter(x => x.statut === 'EN_RETARD');
        const dettesSoldees     = d.filter(x => x.statut === 'SOLDEE');
        const dettesAbandonnees = d.filter(x => x.statut === 'ABANDONNEE');

        const totalDettes     = dettesEnCours.reduce((a, x) => a + (x.montantActuel || 0), 0);
        const montantSolde    = dettesSoldees.reduce((a, x) => a + (x.montantInitial || 0), 0);
        const montantAbandonne = dettesAbandonnees.reduce((a, x) => a + (x.montantAbandonne || x.montantInitial || 0), 0);

        setStats({
          clients: c.length, dettes: dettesEnCours.length,
          produits: p.length, magasin: magasin.data.length,
          dettesEnRetard: dettesEnRetard.length,
          dettesSoldees: dettesSoldees.length, dettesAbandonnees: dettesAbandonnees.length,
          totalDettes, montantSolde, montantAbandonne,
          factures: factures.data.length,
          fournisseurs: fournisseurs.data.length,
        });

        // Top débiteurs
        const detteParClient = {};
        dettesEnCours.forEach(x => {
          detteParClient[x.clientId] = (detteParClient[x.clientId] || 0) + (x.montantActuel || 0);
        });
        const top = Object.entries(detteParClient)
          .sort((a, b) => b[1] - a[1])
          .map(([clientId, montant]) => {
            const cl = c.find(x => x.id === clientId);
            return { nom: cl ? `${cl.prenom || ''} ${cl.nom || ''}`.trim() : 'Inconnu', montant };
          });
        setTopClients(top);

        // Clients par profession
        const profMap = {};
        c.forEach(cl => {
          if (cl.profession) profMap[cl.profession] = (profMap[cl.profession] || 0) + 1;
        });
        setParProfession(profMap);

        // Stock faible boutique & magasin
        setStockFaible(p.filter(x => (x.stockEnPieces ?? x.quantiteStock ?? 0) <= 5));
        setStockMagasinFaible(m.filter(x => (x.stockEnPieces ?? x.quantiteStock ?? 0) <= 5));

        // Factures récentes (5 dernières, triées par date)
        const f = factures.data;
        setFacturesRecentes([...f].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5));

        // Commandes fournisseurs en cours (EN_ATTENTE ou EN_COURS)
        const fo = fournisseurs.data;
        const enCours = fo.filter(x => x.statut === 'EN_ATTENTE' || x.statut === 'EN_COURS')
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setCommandesEnCours(enCours);

        // Livraisons en attente de validation
        const nbEnAttente = fo.reduce((acc, cmd) => {
          const nonValidees = (cmd.livraisons || []).filter(l => !l.valide).length;
          return acc + nonValidees;
        }, 0);
        setLivraisonsEnAttente(nbEnAttente);

        // Récents
        setDettesRecentes(dettesEnCours.slice(0, 5));
        setProduitsRecents([...p].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4));
        setMagasinRecents([...m].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4));
      } catch (err) {
        console.error('Erreur chargement dashboard:', err);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const fmt = (m) => new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(m);
  const maxDette      = topClients[0]?.montant || 1;
  const maxProfession = Math.max(...Object.values(parProfession), 1);
  const totalCreeDettes = stats.totalDettes + stats.montantSolde + stats.montantAbandonne;
  const tauxRecouvrement = totalCreeDettes > 0 ? Math.round((stats.montantSolde / totalCreeDettes) * 100) : 0;

  const CarteStats = () => (
    <div className="row g-2 mb-3">
      <div className="col-6 col-md-3"><CarteStatistique titre="Total clients"      valeur={stats.clients}        icone={faUsers}              couleur="#00d4aa" lien="/clients"      chargement={chargement} /></div>
      <div className="col-6 col-md-3"><CarteStatistique titre="Dettes en cours"    valeur={stats.dettes}         icone={faFileInvoiceDollar}  couleur="#f59e0b" lien="/dettes"       chargement={chargement} /></div>
      <div className="col-6 col-md-3"><CarteStatistique titre="Produits boutique"  valeur={stats.produits}       icone={faStore}              couleur="#6366f1" lien="/produits"     chargement={chargement} /></div>
      <div className="col-6 col-md-3"><CarteStatistique titre="Produits magasin"   valeur={stats.magasin}        icone={faWarehouse}          couleur="#3b82f6" lien="/magasin"      chargement={chargement} /></div>
      <div className="col-6 col-md-3"><CarteStatistique titre="Dettes en retard"   valeur={stats.dettesEnRetard} icone={faExclamationTriangle} couleur="#ef4444" lien="/dettes"       chargement={chargement} /></div>
      <div className="col-6 col-md-3"><CarteStatistique titre="Dettes soldées"     valeur={stats.dettesSoldees}  icone={faCheckCircle}        couleur="#10b981" lien="/dettes"       chargement={chargement} /></div>
      <div className="col-6 col-md-3"><CarteStatistique titre="Factures"           valeur={stats.factures}       icone={faReceipt}            couleur="#0ea5e9" lien="/factures"     chargement={chargement} /></div>
      <div className="col-6 col-md-3"><CarteStatistique titre="Fournisseurs"       valeur={stats.fournisseurs}   icone={faTruck}              couleur="#f97316" lien="/fournisseurs" chargement={chargement} /></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 4rem)', overflow: 'hidden' }}>

      {/* ── Titre fixe ── */}
      <div style={{ flexShrink: 0 }}>
        <div className="mb-3">
          <h4 className="fw-bold mb-1" style={{ color: 'var(--bs-body-color)' }}>Tableau de bord</h4>
          <p className="text-muted small mb-0">Vue d'ensemble de GesTrack</p>
        </div>
      </div>

      {/* Cartes stats — fixe sur desktop */}
      {!isMobile && <div style={{ flexShrink: 0 }}><CarteStats /></div>}

      {/* ── Zone scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingTop: '0.5rem' }}>

        {/* Cartes stats — mobile dans le scroll */}
        {isMobile && <CarteStats />}

        {/* Alertes consolidées */}
        {!chargement && (stockFaible.length > 0 || stockMagasinFaible.length > 0 || stats.dettesEnRetard > 0 || livraisonsEnAttente > 0) && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14, border: '1px solid rgba(239,68,68,0.2) !important' }}>
            <div className="card-body p-3">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faBell} style={{ color: '#ef4444', fontSize: 15 }} />
                <span className="fw-semibold" style={{ color: 'var(--bs-body-color)' }}>Alertes</span>
                <span className="badge rounded-pill" style={{ background: '#ef4444', fontSize: 11 }}>
                  {[stockFaible.length > 0, stockMagasinFaible.length > 0, stats.dettesEnRetard > 0, livraisonsEnAttente > 0].filter(Boolean).length}
                </span>
              </div>
              <div className="row g-2">
                {stats.dettesEnRetard > 0 && (
                  <div className="col-6">
                    <Link to="/dettes" className="d-flex align-items-center gap-2 p-2 rounded-2 text-decoration-none h-100" style={{ background: 'rgba(239,68,68,0.08)' }}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.15)' }}>
                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444', fontSize: 12 }} />
                      </div>
                      <div className="min-w-0">
                        <div className="fw-semibold text-truncate" style={{ fontSize: 'var(--txt-sm)', color: '#ef4444' }}>{stats.dettesEnRetard} dette{stats.dettesEnRetard > 1 ? 's' : ''} en retard</div>
                        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>Clients à relancer</div>
                      </div>
                    </Link>
                  </div>
                )}
                {stockFaible.length > 0 && (
                  <div className="col-6">
                    <Link to="/produits" className="d-flex align-items-center gap-2 p-2 rounded-2 text-decoration-none h-100" style={{ background: 'rgba(245,158,11,0.08)' }}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 30, height: 30, background: 'rgba(245,158,11,0.15)' }}>
                        <FontAwesomeIcon icon={faStore} style={{ color: '#f59e0b', fontSize: 12 }} />
                      </div>
                      <div className="min-w-0">
                        <div className="fw-semibold text-truncate" style={{ fontSize: 'var(--txt-sm)', color: '#f59e0b' }}>{stockFaible.length} produit{stockFaible.length > 1 ? 's' : ''} stock faible</div>
                        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>Boutique · ≤ 5 unités</div>
                      </div>
                    </Link>
                  </div>
                )}
                {stockMagasinFaible.length > 0 && (
                  <div className="col-6">
                    <Link to="/magasin" className="d-flex align-items-center gap-2 p-2 rounded-2 text-decoration-none h-100" style={{ background: 'rgba(59,130,246,0.08)' }}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 30, height: 30, background: 'rgba(59,130,246,0.15)' }}>
                        <FontAwesomeIcon icon={faWarehouse} style={{ color: '#3b82f6', fontSize: 12 }} />
                      </div>
                      <div className="min-w-0">
                        <div className="fw-semibold text-truncate" style={{ fontSize: 'var(--txt-sm)', color: '#3b82f6' }}>{stockMagasinFaible.length} produit{stockMagasinFaible.length > 1 ? 's' : ''} stock faible</div>
                        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>Magasin · ≤ 5 unités</div>
                      </div>
                    </Link>
                  </div>
                )}
                {livraisonsEnAttente > 0 && (
                  <div className="col-6">
                    <Link to="/fournisseurs" className="d-flex align-items-center gap-2 p-2 rounded-2 text-decoration-none h-100" style={{ background: 'rgba(249,115,22,0.08)' }}>
                      <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 30, height: 30, background: 'rgba(249,115,22,0.15)' }}>
                        <FontAwesomeIcon icon={faTruck} style={{ color: '#f97316', fontSize: 12 }} />
                      </div>
                      <div className="min-w-0">
                        <div className="fw-semibold text-truncate" style={{ fontSize: 'var(--txt-sm)', color: '#f97316' }}>{livraisonsEnAttente} livraison{livraisonsEnAttente > 1 ? 's' : ''} en attente</div>
                        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>À valider</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Montants — donut + taux de recouvrement */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-body p-3">
            <div className="fw-semibold mb-3 small" style={{ color: 'var(--bs-body-color)' }}>Répartition des dettes</div>
            {chargement ? (
              <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} /></div>
            ) : (
              <div className="d-flex align-items-center gap-3 flex-wrap flex-sm-nowrap">
                {/* Donut */}
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'En cours',    value: stats.totalDettes    || 0.001 },
                          { name: 'Récupérées',  value: stats.montantSolde   || 0.001 },
                          { name: 'Abandonnées', value: stats.montantAbandonne || 0.001 },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={46} outerRadius={72}
                        paddingAngle={3} dataKey="value"
                      >
                        <Cell fill="#f59e0b" />
                        <Cell fill="#10b981" />
                        <Cell fill="#9ca3af" />
                      </Pie>
                      <Tooltip formatter={(v, n) => [fmt(v === 0.001 ? 0 : v), n]}
                        contentStyle={{ background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Légende + taux */}
                <div className="flex-grow-1 d-flex flex-column gap-2">
                  {[
                    { label: 'En cours',    value: stats.totalDettes,     color: '#f59e0b' },
                    { label: 'Récupérées',  value: stats.montantSolde,    color: '#10b981' },
                    { label: 'Abandonnées', value: stats.montantAbandonne, color: '#9ca3af' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 'var(--txt-sm)', color: 'var(--bs-secondary-color)' }}>{label}</span>
                      </div>
                      <span className="fw-semibold" style={{ fontSize: 'var(--txt-sm)', color }}>{fmt(value)}</span>
                    </div>
                  ))}
                  {/* Taux de recouvrement */}
                  <div className="mt-1 pt-2" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span style={{ fontSize: 'var(--txt-xs)', color: 'var(--bs-secondary-color)' }}>Taux de recouvrement</span>
                      <span className="fw-bold" style={{ fontSize: 'var(--txt-sm)', color: tauxRecouvrement >= 70 ? '#7c3aed' : tauxRecouvrement >= 40 ? '#d97706' : '#dc2626' }}>
                        {tauxRecouvrement}%
                      </span>
                    </div>
                    <div className="progress" style={{ height: 6, borderRadius: 6 }}>
                      <div className="progress-bar" style={{ width: `${tauxRecouvrement}%`, background: tauxRecouvrement >= 70 ? '#7c3aed' : tauxRecouvrement >= 40 ? '#d97706' : '#dc2626', borderRadius: 6, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Commandes fournisseurs — graphique livraison vs commandé */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
            <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faTruck} style={{ color: '#f97316' }} />
              Livraisons fournisseurs en cours
            </h6>
            <Link to="/fournisseurs" className="btn btn-sm text-decoration-none" style={{ color: '#f97316' }}>
              Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
            </Link>
          </div>
          <div className="card-body px-2 pb-3 pt-1">
            {chargement ? (
              <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#f97316' }} /></div>
            ) : commandesEnCours.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FontAwesomeIcon icon={faBoxOpen} size="2x" className="mb-2 d-block" />
                Aucune commande en cours
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={commandesEnCours.slice(0, 5).length * 52 + 20}>
                <BarChart
                  data={commandesEnCours.slice(0, 5).map(cmd => ({
                    nom: cmd.produitNom.length > 14 ? cmd.produitNom.slice(0, 13) + '…' : cmd.produitNom,
                    Commandé: cmd.quantiteCommandee || 0,
                    Livré:    cmd.quantiteLivree    || 0,
                  }))}
                  layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap="28%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nom" width={100} tick={{ fontSize: 11, fill: 'var(--bs-body-color)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bs-body-bg)', border: '1px solid var(--bs-border-color)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="Commandé" fill="rgba(249,115,22,0.2)" radius={[0, 4, 4, 0]} maxBarSize={14} />
                  <Bar dataKey="Livré"    fill="#f97316"              radius={[0, 4, 4, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {!chargement && commandesEnCours.length > 0 && (
              <div className="d-flex align-items-center gap-3 px-2 mt-1" style={{ fontSize: 'var(--txt-xs)', color: 'var(--bs-secondary-color)' }}>
                <span className="d-flex align-items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(249,115,22,0.25)', display: 'inline-block' }} /> Commandé</span>
                <span className="d-flex align-items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 3, background: '#f97316', display: 'inline-block' }} /> Livré</span>
              </div>
            )}
          </div>
        </div>


        {/* Factures récentes */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
            <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faReceipt} style={{ color: '#0ea5e9' }} />
              Factures récentes
            </h6>
            <Link to="/factures" className="btn btn-sm text-decoration-none" style={{ color: '#0ea5e9' }}>
              Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
            </Link>
          </div>
          <div className="card-body p-0">
            {chargement ? (
              <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#0ea5e9' }} /></div>
            ) : facturesRecentes.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FontAwesomeIcon icon={faReceipt} size="2x" className="mb-2 d-block" />
                Aucune facture
              </div>
            ) : isMobile ? (
              <div>
                {facturesRecentes.map((facture, i) => {
                  const payee = (facture.resteADoit || 0) === 0;
                  const client = `${facture.clientPrenom || ''} ${facture.clientNom || ''}`.trim() || '—';
                  return (
                    <div key={facture.id} className="d-flex align-items-center gap-3 px-3 py-2"
                      style={{ borderBottom: i < facturesRecentes.length - 1 ? '1px solid var(--bs-border-color)' : 'none' }}>
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold text-truncate" style={{ fontSize: 'var(--txt-sm)', color: 'var(--bs-body-color)' }}>{client}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: 'var(--txt-xs)' }}>{facture.numero}</div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div className="fw-bold" style={{ fontSize: 'var(--txt-sm)', color: '#0ea5e9' }}>{fmt(facture.montantTotal)}</div>
                        <span className="badge rounded-pill" style={{ fontSize: 10, background: payee ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: payee ? '#10b981' : '#d97706' }}>
                          {payee ? 'Payée' : `Reste ${fmt(facture.resteADoit)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: 'var(--txt-md)' }}>
                  <thead style={{ background: 'var(--bs-secondary-bg)' }}>
                    <tr>
                      <th className="fw-semibold text-muted border-0 ps-3" style={{ fontSize: 'var(--txt-sm)' }}>N°</th>
                      <th className="fw-semibold text-muted border-0" style={{ fontSize: 'var(--txt-sm)' }}>Client</th>
                      <th className="fw-semibold text-muted border-0" style={{ fontSize: 'var(--txt-sm)' }}>Total</th>
                      <th className="fw-semibold text-muted border-0" style={{ fontSize: 'var(--txt-sm)' }}>Statut</th>
                      <th className="fw-semibold text-muted border-0 d-none d-sm-table-cell" style={{ fontSize: 'var(--txt-sm)' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturesRecentes.map(facture => {
                      const payee = (facture.resteADoit || 0) === 0;
                      return (
                        <tr key={facture.id}>
                          <td className="ps-3 text-muted" style={{ fontSize: 'var(--txt-xs)', fontFamily: 'monospace' }}>{facture.numero}</td>
                          <td className="fw-semibold">{`${facture.clientPrenom || ''} ${facture.clientNom || ''}`.trim() || '—'}</td>
                          <td className="fw-bold" style={{ color: '#0ea5e9' }}>{fmt(facture.montantTotal)}</td>
                          <td>
                            <span className="badge rounded-pill" style={{ fontSize: 'var(--txt-xs)', background: payee ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: payee ? '#10b981' : '#d97706' }}>
                              {payee ? 'Payée' : `Reste ${fmt(facture.resteADoit)}`}
                            </span>
                          </td>
                          <td className="text-muted d-none d-sm-table-cell">{fmtDH(facture.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top débiteurs + Clients par profession */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-header bg-transparent border-0 pt-3 px-3 pb-2">
                <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2 text-danger" />
                  Top débiteurs
                </h6>
              </div>
              <div className="card-body px-3 pb-3">
                {chargement ? (
                  <div className="text-center py-3"><FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} /></div>
                ) : topClients.length === 0 ? (
                  <div className="text-muted small text-center py-3">Aucune dette en cours</div>
                ) : (
                  <div className="d-flex flex-column gap-3" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {topClients.map((cl, i) => (
                      <div key={i}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-semibold text-truncate me-2" style={{ color: 'var(--bs-body-color)' }}>{cl.nom}</span>
                          <span className="small fw-bold text-danger flex-shrink-0">{fmt(cl.montant)}</span>
                        </div>
                        <div className="progress" style={{ height: 6, borderRadius: 10 }}>
                          <div className="progress-bar" style={{ width: `${(cl.montant / maxDette) * 100}%`, background: i === 0 ? '#ef4444' : i === 1 ? '#f97316' : '#f59e0b', borderRadius: 10 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
              <div className="card-header bg-transparent border-0 pt-3 px-3 pb-2">
                <h6 className="fw-semibold mb-0" style={{ color: 'var(--bs-body-color)' }}>
                  <FontAwesomeIcon icon={faUsers} className="me-2" style={{ color: '#00d4aa' }} />
                  Clients par profession
                </h6>
              </div>
              <div className="card-body px-3 pb-3">
                {chargement ? (
                  <div className="text-center py-3"><FontAwesomeIcon icon={faSpinner} spin style={{ color: '#00d4aa' }} /></div>
                ) : Object.keys(parProfession).length === 0 ? (
                  <div className="text-muted small text-center py-3">Aucun client</div>
                ) : (
                  <div className="d-flex flex-column gap-3" style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {Object.entries(parProfession).sort((a, b) => b[1] - a[1]).map(([prof, nb]) => (
                      <div key={prof}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small fw-semibold text-truncate me-2" style={{ color: 'var(--bs-body-color)' }}>{prof || '—'}</span>
                          <span className="badge rounded-pill flex-shrink-0" style={{ background: '#00d4aa20', color: '#00a881', fontSize: 'var(--txt-sm)' }}>
                            {nb} client{nb > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="progress" style={{ height: 6, borderRadius: 10 }}>
                          <div className="progress-bar" style={{ width: `${(nb / maxProfession) * 100}%`, background: '#00d4aa', borderRadius: 10 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


         {/* Produits récents — Boutique */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
            <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faStore} style={{ color: '#00d4aa' }} />
              Produits récents — Boutique
            </h6>
            {!isMobile && (
              <Link to="/produits" className="btn btn-sm text-decoration-none" style={{ color: '#00d4aa' }}>
                Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
              </Link>
            )}
          </div>
          <div className="card-body px-3 pb-3 pt-2">
            {chargement ? (
              <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#00d4aa' }} /></div>
            ) : produitsRecents.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FontAwesomeIcon icon={faStore} size="2x" className="mb-2 d-block" />Aucun produit en boutique
              </div>
            ) : isMobile ? (
              <>
                <div>
                  {produitsRecents.map(p => <CarteProduit key={p.id} produit={p} mobile />)}
                </div>
                <Link to="/produits" className="btn btn-sm w-100 mt-3 text-decoration-none d-flex align-items-center justify-content-center gap-1"
                  style={{ color: '#00d4aa', border: '1px solid #00d4aa', borderRadius: 8 }}>
                  Voir tout <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </>
            ) : (
              <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                {produitsRecents.map(p => <div key={p.id} style={{ scrollSnapAlign: 'start' }}><CarteProduit produit={p} /></div>)}
              </div>
            )}
          </div>
        </div>

        {/* Produits récents — Magasin */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14 }}>
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-3 px-3">
            <h6 className="fw-semibold mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
              <FontAwesomeIcon icon={faWarehouse} style={{ color: '#3b82f6' }} />
              Produits récents — Magasin
            </h6>
            {!isMobile && (
              <Link to="/magasin" className="btn btn-sm text-decoration-none" style={{ color: '#3b82f6' }}>
                Voir tout <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
              </Link>
            )}
          </div>
          <div className="card-body px-3 pb-3 pt-2">
            {chargement ? (
              <div className="text-center py-4"><FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ color: '#3b82f6' }} /></div>
            ) : magasinRecents.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <FontAwesomeIcon icon={faWarehouse} size="2x" className="mb-2 d-block" />Aucun produit en magasin
              </div>
            ) : isMobile ? (
              <>
                <div>
                  {magasinRecents.map(p => <CarteProduit key={p.id} produit={p} mobile />)}
                </div>
                <Link to="/magasin" className="btn btn-sm w-100 mt-3 text-decoration-none d-flex align-items-center justify-content-center gap-1"
                  style={{ color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: 8 }}>
                  Voir tout <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </>
            ) : (
              <div className="d-flex gap-2 overflow-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                {magasinRecents.map(p => <div key={p.id} style={{ scrollSnapAlign: 'start' }}><CarteProduit produit={p} /></div>)}
              </div>
            )}
          </div>
        </div>

        {/* Stock faible */}
        {!chargement && stockFaible.length > 0 && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 14, borderLeft: '4px solid #ef4444' }}>
            <div className="card-header bg-transparent border-0 pt-3 px-3 pb-0">
              <h6 className="fw-semibold mb-0 text-danger" style={{ fontSize: 'var(--txt-lg)' }}>
                <FontAwesomeIcon icon={faBox} className="me-2" />
                Produits en stock faible ({stockFaible.length})
              </h6>
            </div>
            <div className="card-body px-3 pb-3">
              <div className="row g-2">
                {stockFaible.map(p => (
                  <div key={p.id} className="col-6 col-md-4 col-lg-3">
                    <div className="d-flex align-items-center justify-content-between p-2 rounded"
                      style={{ background: 'rgba(239,68,68,0.1)', fontSize: 'var(--txt-base)' }}>
                      <span className="fw-semibold text-truncate" style={{ color: '#991b1b' }}>{p.nom}</span>
                      <span className="badge bg-danger ms-1 flex-shrink-0">{p.quantiteStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>{/* fin scrollable */}
    </div>
  );
};

export default Dashboard;
