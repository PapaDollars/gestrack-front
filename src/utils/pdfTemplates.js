import { imprimerDocument, fmt, fmtDate, badgeDette, badgeAction } from './pdf';

// ──────────────────────────────────────────────
// Rapport complet client (toutes ses dettes)
// ──────────────────────────────────────────────
export const imprimerRapportClient = (client, dettes) => {
  const actives    = dettes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD');
  const reglees    = dettes.filter(d => d.statut === 'SOLDEE');
  const abandons   = dettes.filter(d => d.statut === 'ABANDONNEE');
  const totalDu    = actives.reduce((s, d) => s + d.montantActuel, 0);
  const totalRegle = reglees.reduce((s, d) => s + d.montantInitial, 0);
  const totalAbandonne = abandons.reduce((s, d) => s + (d.montantAbandonne || d.montantInitial || 0), 0);

  const lignesDettes = dettes.map(d => `
    <tr>
      <td>${fmtDate(d.createdAt)}</td>
      <td>${d.description || '—'}</td>
      <td>${fmt(d.montantInitial)}</td>
      <td class="${d.statut === 'SOLDEE' ? 'montant-vert' : d.statut === 'ABANDONNEE' ? 'montant-grey' : 'montant-rouge'}">${fmt(d.montantActuel)}</td>
      <td>${badgeDette(d.statut)}</td>
      <td>${fmtDate(d.updatedAt)}</td>
    </tr>`).join('');

  const html = `
<div class="page">
  <div class="entete">
    <div>
      <div class="logo">Ges<span>Track</span></div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px">Suivi & Contrôle</div>
    </div>
    <div class="meta">
      <strong>Rapport Client</strong>
      Généré le ${fmtDate(new Date().toISOString())}
    </div>
  </div>

  <div class="section">
    <div class="section-titre">Informations client</div>
    <div class="client-grid">
      <div class="client-item"><span class="label">Nom complet</span><span class="val">${client.prenom} ${client.nom}</span></div>
      <div class="client-item"><span class="label">Profession</span><span class="val">${client.profession || '—'}</span></div>
      ${client.surnom ? `<div class="client-item"><span class="label">Surnom</span><span class="val">${client.surnom}</span></div>` : ''}
      <div class="client-item"><span class="label">Téléphone</span><span class="val">${client.telephone || '—'}</span></div>
      ${client.telephoneWhatsapp ? `<div class="client-item"><span class="label">WhatsApp</span><span class="val">${client.telephoneWhatsapp}</span></div>` : ''}
      ${client.age ? `<div class="client-item"><span class="label">Âge</span><span class="val">${client.age} ans</span></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-titre">Résumé financier</div>
    <div class="resume-grid">
      <div class="resume-card">
        <div class="montant montant-rouge">${fmt(totalDu)}</div>
        <div class="lib">Restant dû</div>
      </div>
      <div class="resume-card">
        <div class="montant montant-vert">${fmt(totalRegle)}</div>
        <div class="lib">Total réglé</div>
      </div>
      <div class="resume-card">
        <div class="montant montant-grey">${fmt(totalAbandonne)}</div>
        <div class="lib">Abandonné</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-titre">Liste des dettes (${dettes.length})</div>
    ${dettes.length === 0
      ? '<p style="color:#9ca3af;font-style:italic;font-size:12px">Aucune dette enregistrée</p>'
      : `<table>
          <thead><tr>
            <th>Date</th><th>Description</th><th>Initial</th><th>Actuel</th><th>Statut</th><th>Dernière maj.</th>
          </tr></thead>
          <tbody>${lignesDettes}</tbody>
         </table>`
    }
  </div>

  ${client.notes ? `
  <div class="section">
    <div class="section-titre">Notes</div>
    <p style="font-size:12px;color:#374151;white-space:pre-wrap">${client.notes}</p>
  </div>` : ''}

  <div class="pied">Document généré par GesTrack · ${new Date().toLocaleDateString('fr-FR')}</div>

  <div class="btn-imprimer">
    <button class="btn btn-secondary">✕ Fermer</button>
    <button class="btn btn-share">↗ Partager</button>
    <button class="btn btn-primary">⬇ Télécharger / Imprimer</button>
  </div>
</div>`;

  imprimerDocument(html, `Rapport — ${client.prenom} ${client.nom}`);
};


// ──────────────────────────────────────────────
// Facture d'une dette unique avec historique
// ──────────────────────────────────────────────
export const imprimerFactureDette = (client, dette, historique) => {
  const numFacture = `DT-${dette.id?.slice(-6).toUpperCase()}`;

  const moyen = {
    especes: 'Espèces', om: 'Orange Money', mtn: 'MTN Mobile Money',
  };

  const lignesHisto = (historique || []).map(h => `
    <div class="histo-item">
      <div>
        ${badgeAction(h.action)}
        ${h.montantConcerne != null
          ? `<strong style="color:${h.action === 'REDUCTION' ? '#16a34a' : h.action === 'AJOUT' ? '#ea580c' : '#374151'}">
              ${h.action === 'REDUCTION' ? '−' : h.action === 'AJOUT' ? '+' : ''}${fmt(h.montantConcerne)}
             </strong> &nbsp;`
          : ''}
        <span style="color:#6b7280">${h.details || ''}</span>
        ${h.moyenPaiement ? `&nbsp;<em style="color:#9ca3af;font-size:11px">(${moyen[h.moyenPaiement] || h.moyenPaiement})</em>` : ''}
      </div>
      <div style="color:#9ca3af;font-size:11px;white-space:nowrap">${fmtDate(h.timestamp)}</div>
    </div>`).join('');

  const totalPaye = (historique || [])
    .filter(h => h.action === 'REDUCTION')
    .reduce((s, h) => s + (h.montantConcerne || 0), 0);

  const html = `
<div class="page">
  <div class="entete">
    <div>
      <div class="logo">Ges<span>Track</span></div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px">Suivi & Contrôle</div>
    </div>
    <div class="meta">
      <strong>Facture de dette</strong>
      N° ${numFacture}<br>
      Créée le ${fmtDate(dette.createdAt)}
    </div>
  </div>

  <div class="section">
    <div class="section-titre">Client</div>
    <div class="client-grid">
      <div class="client-item"><span class="label">Nom complet</span><span class="val">${client.prenom} ${client.nom}</span></div>
      <div class="client-item"><span class="label">Profession</span><span class="val">${client.profession || '—'}</span></div>
      ${client.surnom ? `<div class="client-item"><span class="label">Surnom</span><span class="val">${client.surnom}</span></div>` : ''}
      <div class="client-item"><span class="label">Téléphone</span><span class="val">${client.telephone || '—'}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-titre">Détails de la dette</div>
    <div class="facture-ligne">
      <span style="color:#6b7280">Description</span>
      <span style="font-weight:600">${dette.description || 'Sans description'}</span>
    </div>
    <div class="facture-ligne">
      <span style="color:#6b7280">Date de création</span>
      <span>${fmtDate(dette.createdAt)}</span>
    </div>
    <div class="facture-ligne">
      <span style="color:#6b7280">Montant initial</span>
      <span style="font-weight:600">${fmt(dette.montantInitial)}</span>
    </div>
    <div class="facture-ligne">
      <span style="color:#6b7280">Total payé</span>
      <span class="montant-vert">${fmt(totalPaye)}</span>
    </div>
    <div class="facture-ligne">
      <span style="color:#6b7280">Statut</span>
      ${badgeDette(dette.statut)}
    </div>
    <div class="facture-total">
      <span class="lib">Montant restant dû</span>
      <span class="montant">${dette.statut === 'SOLDEE' ? '0 FCFA' : fmt(dette.montantActuel)}</span>
    </div>
  </div>

  ${historique?.length > 0 ? `
  <div class="section">
    <div class="section-titre">Historique des transactions (${historique.length})</div>
    ${lignesHisto}
  </div>` : ''}

  <div class="pied">Document généré par GesTrack · ${new Date().toLocaleDateString('fr-FR')} · N° ${numFacture}</div>

  <div class="btn-imprimer">
    <button class="btn btn-secondary">✕ Fermer</button>
    <button class="btn btn-share">↗ Partager</button>
    <button class="btn btn-primary">⬇ Télécharger / Imprimer</button>
  </div>
</div>`;

  imprimerDocument(html, `Facture ${numFacture} — ${client.prenom} ${client.nom}`);
};

const BTNS = `
  <div class="btn-imprimer">
    <button class="btn btn-secondary">✕ Fermer</button>
    <button class="btn btn-share">↗ Partager</button>
    <button class="btn btn-primary">⬇ Télécharger / Imprimer</button>
  </div>`;

const ENTETE_DOC = (titre, sousTitre) => `
<div class="entete">
  <div>
    <div class="logo">Ges<span>Track</span></div>
    <div style="font-size:11px;color:#6b7280;margin-top:4px">Suivi & Contrôle</div>
  </div>
  <div class="meta">
    <strong>${titre}</strong>
    ${sousTitre}<br>Généré le ${fmtDate(new Date().toISOString())}
  </div>
</div>`;

// ──────────────────────────────────────────────
// Rapport Mes Finances (ventes boutique + magasin)
// ──────────────────────────────────────────────
export const imprimerRapportFinances = (ventes, titrePeriode, groupement) => {
  const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const totalGeneral = ventes.reduce((s, v) => s + v.montant, 0);

  // Construire le tableau selon le niveau de détail
  let tableau = '';
  if (ventes.length === 0) {
    tableau = '<p style="color:#9ca3af;font-size:12px;font-style:italic">Aucune vente sur la période</p>';
  } else if (groupement === 'jour') {
    // ── Par jour : détails complets avec chaque vente ──
    const jours = {};
    ventes.forEach(v => {
      const cle = v.timestamp.split('T')[0];
      if (!jours[cle]) jours[cle] = { items: [], total: 0 };
      jours[cle].items.push(v);
      jours[cle].total += v.montant;
    });
    const lignes = Object.entries(jours).sort(([a],[b]) => b.localeCompare(a)).map(([cle, g]) => {
      const label = new Date(cle + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
      return `
        <tr style="background:#f3f4f6">
          <td colspan="3" style="font-weight:700;padding:8px 10px">${label}</td>
          <td style="font-weight:700;color:#00a881;padding:8px 10px;text-align:right">${fmt(g.total)}</td>
        </tr>
        ${g.items.map(v => `<tr>
          <td style="color:#9ca3af;font-size:11px;padding-left:20px">${v.produitNom || '—'}</td>
          <td style="color:#6b7280">${v.categorie || '—'}</td>
          <td style="text-align:right">${v.quantite ? `${v.quantite} ${v.unite || ''}` : '—'}</td>
          <td class="montant-vert" style="text-align:right">${fmt(v.montant)}</td>
        </tr>`).join('')}`;
    }).join('');
    tableau = `<table>
      <thead><tr><th>Produit</th><th>Catégorie</th><th style="text-align:right">Qté</th><th style="text-align:right">Montant</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr style="background:#0f2027;color:#fff"><td colspan="3" style="padding:8px 10px;font-weight:700">Total général</td>
        <td style="padding:8px 10px;font-weight:800;color:#00d4aa;text-align:right">${fmt(totalGeneral)}</td></tr></tfoot>
    </table>`;

  } else if (groupement === 'semaine') {
    // ── Par semaine : total de la semaine uniquement ──
    const semaines = {};
    ventes.forEach(v => {
      const d = new Date(v.timestamp);
      const lun = new Date(d);
      const j = lun.getDay() || 7;
      lun.setDate(d.getDate() - j + 1);
      const cle = lun.toISOString().split('T')[0];
      if (!semaines[cle]) semaines[cle] = { label: '', total: 0, nb: 0 };
      const dim = new Date(lun); dim.setDate(lun.getDate() + 6);
      semaines[cle].label = `Sem. du ${lun.getDate()}/${lun.getMonth()+1} au ${dim.getDate()}/${dim.getMonth()+1}/${dim.getFullYear()}`;
      semaines[cle].total += v.montant;
      semaines[cle].nb++;
    });
    const lignes = Object.entries(semaines).sort(([a],[b]) => b.localeCompare(a)).map(([, g]) => `
      <tr>
        <td style="font-weight:600">${g.label}</td>
        <td style="text-align:right;color:#6b7280">${g.nb} vente(s)</td>
        <td class="montant-vert" style="text-align:right;font-weight:700">${fmt(g.total)}</td>
      </tr>`).join('');
    tableau = `<table>
      <thead><tr><th>Semaine</th><th style="text-align:right">Nb. ventes</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr style="background:#0f2027;color:#fff"><td colspan="2" style="padding:8px 10px;font-weight:700">Total général</td>
        <td style="padding:8px 10px;font-weight:800;color:#00d4aa;text-align:right">${fmt(totalGeneral)}</td></tr></tfoot>
    </table>`;

  } else {
    // ── Par mois : total mensuel uniquement ──
    const mois = {};
    ventes.forEach(v => {
      const d = new Date(v.timestamp);
      const cle = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!mois[cle]) mois[cle] = { label: `${MOIS[d.getMonth()]} ${d.getFullYear()}`, total: 0, nb: 0 };
      mois[cle].total += v.montant;
      mois[cle].nb++;
    });
    const lignes = Object.entries(mois).sort(([a],[b]) => b.localeCompare(a)).map(([, g]) => `
      <tr>
        <td style="font-weight:600">${g.label}</td>
        <td style="text-align:right;color:#6b7280">${g.nb} vente(s)</td>
        <td class="montant-vert" style="text-align:right;font-weight:700">${fmt(g.total)}</td>
      </tr>`).join('');
    tableau = `<table>
      <thead><tr><th>Mois</th><th style="text-align:right">Nb. ventes</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr style="background:#0f2027;color:#fff"><td colspan="2" style="padding:8px 10px;font-weight:700">Total général</td>
        <td style="padding:8px 10px;font-weight:800;color:#00d4aa;text-align:right">${fmt(totalGeneral)}</td></tr></tfoot>
    </table>`;
  }

  const html = `<div class="page">
  ${ENTETE_DOC('Rapport Finances', titrePeriode)}
  <div class="section">
    <div class="resume-grid" style="grid-template-columns:1fr 1fr">
      <div class="resume-card"><div class="montant montant-vert">${fmt(totalGeneral)}</div><div class="lib">Total des ventes</div></div>
      <div class="resume-card"><div class="montant" style="color:#374151">${ventes.length}</div><div class="lib">Transactions</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-titre">${groupement === 'jour' ? 'Détail journalier' : groupement === 'semaine' ? 'Résumé hebdomadaire' : 'Résumé mensuel'}</div>
    ${tableau}
  </div>
  <div class="pied">GesTrack · ${new Date().toLocaleDateString('fr-FR')}</div>
  ${BTNS}
</div>`;

  imprimerDocument(html, `Finances — ${titrePeriode}`);
};


// ──────────────────────────────────────────────
// Rapport Mon Compte (transactions personnelles)
// ──────────────────────────────────────────────
// groupement : 'jour' | 'semaine' | 'mois' (défaut mois)
export const imprimerRapportCompte = (transactions, titreFiltre, groupement = 'mois') => {
  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const TYPES = { especes: 'Espèces', orange_money: 'Orange Money', mobile_money: 'Mobile Money' };
  const COLORS = { especes: '#16a34a', orange_money: '#ea580c', mobile_money: '#7c3aed' };

  const totalGlobal = transactions.reduce((s, t) => s + t.montant, 0);
  const totalParType = {};
  transactions.forEach(t => { totalParType[t.type] = (totalParType[t.type] || 0) + t.montant; });

  let tableau = '';
  if (transactions.length === 0) {
    tableau = '<p style="color:#9ca3af;font-size:12px;font-style:italic">Aucune transaction</p>';
  } else if (groupement === 'jour') {
    // ── Détail journalier complet ──
    const joursMap = {};
    transactions.forEach(t => {
      const j = t.date || '?';
      if (!joursMap[j]) joursMap[j] = [];
      joursMap[j].push(t);
    });
    const lignes = Object.entries(joursMap).sort(([a],[b]) => b.localeCompare(a)).map(([jour, ts]) => {
      const label = new Date(jour + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
      const totalJour = ts.reduce((s, t) => s + t.montant, 0);
      return `
        <tr style="background:#f3f4f6">
          <td colspan="3" style="font-weight:700;padding:8px 10px">${label}</td>
          <td style="font-weight:700;color:#00a881;padding:8px 10px;text-align:right">${fmt(totalJour)}</td>
        </tr>
        ${ts.map(t => `<tr>
          <td style="padding-left:20px;color:#9ca3af;font-size:11px">${t.note || '—'}</td>
          <td><span style="color:${COLORS[t.type]||'#374151'};font-weight:600;font-size:11px">${TYPES[t.type]||t.type}</span></td>
          <td style="font-size:11px;color:#6b7280">${t.periode === 'semaine' ? 'Semaine' : 'Jour'}</td>
          <td class="montant-vert" style="text-align:right">${fmt(t.montant)}</td>
        </tr>`).join('')}`;
    }).join('');
    tableau = `<table>
      <thead><tr><th>Note</th><th>Type</th><th>Période</th><th style="text-align:right">Montant</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr style="background:#0f2027;color:#fff"><td colspan="3" style="padding:8px 10px;font-weight:700">Total général</td>
        <td style="padding:8px 10px;font-weight:800;color:#00d4aa;text-align:right">${fmt(totalGlobal)}</td></tr></tfoot>
    </table>`;

  } else if (groupement === 'semaine') {
    // ── Résumé hebdomadaire ──
    const semMap = {};
    transactions.forEach(t => {
      const d = new Date((t.date || '?') + 'T12:00:00');
      const lun = new Date(d); const j = lun.getDay() || 7;
      lun.setDate(d.getDate() - j + 1);
      const cle = lun.toISOString().split('T')[0];
      if (!semMap[cle]) semMap[cle] = { label: '', total: 0, nb: 0 };
      const dim = new Date(lun); dim.setDate(lun.getDate() + 6);
      semMap[cle].label = `Sem. du ${lun.getDate()}/${lun.getMonth()+1} au ${dim.getDate()}/${dim.getMonth()+1}/${dim.getFullYear()}`;
      semMap[cle].total += t.montant;
      semMap[cle].nb++;
    });
    const lignes = Object.entries(semMap).sort(([a],[b]) => b.localeCompare(a)).map(([, g]) => `
      <tr>
        <td style="font-weight:600">${g.label}</td>
        <td style="text-align:right;color:#6b7280">${g.nb} entrée(s)</td>
        <td class="montant-vert" style="text-align:right;font-weight:700">${fmt(g.total)}</td>
      </tr>`).join('');
    tableau = `<table>
      <thead><tr><th>Semaine</th><th style="text-align:right">Nb</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr style="background:#0f2027;color:#fff"><td colspan="2" style="padding:8px 10px;font-weight:700">Total général</td>
        <td style="padding:8px 10px;font-weight:800;color:#00d4aa;text-align:right">${fmt(totalGlobal)}</td></tr></tfoot>
    </table>`;

  } else {
    // ── Résumé mensuel (défaut) ──
    const moisMap = {};
    transactions.forEach(t => {
      const mois = t.date?.substring(0, 7) || '?';
      if (!moisMap[mois]) moisMap[mois] = { total: 0, nb: 0 };
      moisMap[mois].total += t.montant;
      moisMap[mois].nb++;
    });
    const lignes = Object.entries(moisMap).sort(([a],[b]) => b.localeCompare(a)).map(([mois, g]) => {
      const [y, m] = mois.split('-');
      const label = m ? `${MOIS[parseInt(m)-1]} ${y}` : mois;
      return `<tr>
        <td style="font-weight:600">${label}</td>
        <td style="text-align:right;color:#6b7280">${g.nb} entrée(s)</td>
        <td class="montant-vert" style="text-align:right;font-weight:700">${fmt(g.total)}</td>
      </tr>`;
    }).join('');
    tableau = `<table>
      <thead><tr><th>Mois</th><th style="text-align:right">Nb</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr style="background:#0f2027;color:#fff"><td colspan="2" style="padding:8px 10px;font-weight:700">Total général</td>
        <td style="padding:8px 10px;font-weight:800;color:#00d4aa;text-align:right">${fmt(totalGlobal)}</td></tr></tfoot>
    </table>`;
  }

  const html = `<div class="page">
  ${ENTETE_DOC('Rapport Mon Compte', titreFiltre)}
  <div class="section">
    <div class="resume-grid">
      <div class="resume-card"><div class="montant montant-vert">${fmt(totalGlobal)}</div><div class="lib">Total</div></div>
      ${Object.entries(totalParType).map(([type, val]) =>
        `<div class="resume-card"><div class="montant" style="color:${COLORS[type]||'#374151'}">${fmt(val)}</div><div class="lib">${TYPES[type]||type}</div></div>`
      ).join('')}
    </div>
  </div>
  <div class="section">
    <div class="section-titre">${groupement === 'jour' ? 'Détail journalier' : groupement === 'semaine' ? 'Résumé hebdomadaire' : 'Résumé mensuel'} (${transactions.length} entrée(s))</div>
    ${tableau}
  </div>
  <div class="pied">GesTrack · ${new Date().toLocaleDateString('fr-FR')}</div>
  ${BTNS}
</div>`;

  imprimerDocument(html, `Mon Compte — ${titreFiltre}`);
};


// ──────────────────────────────────────────────
// Export liste clients (Paramètres)
// ──────────────────────────────────────────────
export const imprimerListeClients = (clients) => {
  const total = clients.reduce((s, c) => s + (c.totalDette || 0), 0);
  const lignes = clients.map(c => `
    <tr>
      <td><strong>${c.prenom} ${c.nom}</strong>${c.surnom ? `<br><em style="color:#9ca3af;font-size:11px">${c.surnom}</em>` : ''}</td>
      <td>${c.profession || '—'}</td>
      <td>${c.telephone || '—'}${c.telephoneWhatsapp ? `<br><span style="color:#25d366;font-size:11px">WA: ${c.telephoneWhatsapp}</span>` : ''}</td>
      <td class="${c.totalDette > 0 ? 'montant-rouge' : 'montant-vert'}" style="text-align:right">${fmt(c.totalDette || 0)}</td>
    </tr>`).join('');

  const html = `<div class="page">
  ${ENTETE_DOC('Liste des Clients', `${clients.length} client(s) sélectionné(s)`)}
  <div class="section">
    <div class="resume-grid" style="grid-template-columns:1fr 1fr">
      <div class="resume-card"><div class="montant" style="color:#374151">${clients.length}</div><div class="lib">Clients</div></div>
      <div class="resume-card"><div class="montant montant-rouge">${fmt(total)}</div><div class="lib">Total dû global</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-titre">Clients</div>
    <table>
      <thead><tr><th>Nom</th><th>Profession</th><th>Contact</th><th style="text-align:right">Total dû</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr style="background:#0f2027;color:#fff"><td colspan="3" style="padding:8px 10px;font-weight:700">Total général</td>
        <td style="padding:8px 10px;font-weight:800;color:#00d4aa;text-align:right">${fmt(total)}</td></tr></tfoot>
    </table>
  </div>
  <div class="pied">GesTrack · ${new Date().toLocaleDateString('fr-FR')}</div>
  ${BTNS}
</div>`;

  imprimerDocument(html, `Liste Clients — ${new Date().toLocaleDateString('fr-FR')}`);
};


// ──────────────────────────────────────────────
// Export liste produits (Paramètres)
// ──────────────────────────────────────────────
export const imprimerListeProduits = (produits) => {
  // Grouper par catégorie
  const parCategorie = {};
  produits.forEach(p => {
    const cat = p.categorie || 'Sans catégorie';
    if (!parCategorie[cat]) parCategorie[cat] = [];
    parCategorie[cat].push(p);
  });

  const sections = Object.entries(parCategorie).sort(([a],[b]) => a.localeCompare(b, 'fr')).map(([cat, items]) => `
    <tr style="background:#e8f5f3">
      <td colspan="4" style="font-weight:700;padding:8px 10px;color:#00a881">${cat} (${items.length})</td>
    </tr>
    ${items.map(p => {
      const stock = p.stockAffiche || `${p.quantiteStock ?? 0} ${p.unitePrincipale || 'ps'}`;
      const source = p._source ? `<span style="font-size:10px;color:#9ca3af"> — ${p._source}</span>` : '';
      return `<tr>
        <td><strong>${p.nom}</strong>${source}</td>
        <td class="montant-vert" style="text-align:right">${fmt(p.prixVente)}</td>
        <td style="text-align:right;color:#6366f1">${p.prixAchat ? fmt(p.prixAchat) : '—'}</td>
        <td style="text-align:right"><span class="${(p.stockEnPieces??0) <= 5 ? 'montant-rouge' : 'montant-vert'}">${stock}</span></td>
      </tr>`;
    }).join('')}`).join('');

  const html = `<div class="page">
  ${ENTETE_DOC('Liste des Produits', `${produits.length} produit(s) — ${Object.keys(parCategorie).length} catégorie(s)`)}
  <div class="section">
    <div class="section-titre">Produits par catégorie</div>
    <table>
      <thead><tr><th>Produit</th><th style="text-align:right">Prix vente</th><th style="text-align:right">Prix achat</th><th style="text-align:right">Stock</th></tr></thead>
      <tbody>${sections}</tbody>
    </table>
  </div>
  <div class="pied">GesTrack · ${new Date().toLocaleDateString('fr-FR')}</div>
  ${BTNS}
</div>`;

  imprimerDocument(html, `Liste Produits — ${new Date().toLocaleDateString('fr-FR')}`);
};
