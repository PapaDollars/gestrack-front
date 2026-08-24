import { imprimerDocument, fmt, fmtDate, fmtDateFichier, badgeDette, badgeAction } from './pdf';

const aujourdhui = () => fmtDateFichier(new Date().toISOString());

// Libellé d'une entrée : journée complète ou plage de semaine (identique à l'écran)
const libelleEntree = (dateStr, periode) => {
  if (!dateStr || dateStr === '?') return '—';
  const d = new Date(dateStr + 'T12:00:00');
  if (periode === 'semaine') {
    const lun = new Date(d);
    const jour = d.getDay() || 7;
    lun.setDate(d.getDate() - jour + 1);
    const dim = new Date(lun);
    dim.setDate(lun.getDate() + 6);
    return `Sem. du ${lun.getDate()}/${lun.getMonth() + 1} au ${dim.getDate()}/${dim.getMonth() + 1}/${dim.getFullYear()}`;
  }
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

// ──────────────────────────────────────────────
// Facture client (produits + avance + reste)
// ──────────────────────────────────────────────
export const imprimerFacture = (facture) => {
  const labelMoyen = facture.moyenPaiement === 'om' ? 'Orange Money'
                   : facture.moyenPaiement === 'mtn' ? 'MTN Mobile Money'
                   : 'Espèces';

  const lignesHTML = (facture.lignes || []).map(l => `
    <tr>
      <td style="display:flex;align-items:center;gap:8px">
        ${l.image ? `<img src="${l.image}" style="width:30px;height:30px;object-fit:contain;border-radius:4px;flex-shrink:0">` : ''}
        <span>${l.nom}</span>
      </td>
      <td style="text-align:center">${l.quantite}</td>
      <td>${fmt(l.prixUnitaire)}</td>
      <td class="montant-rouge fw-bold">${fmt(l.sousTotal)}</td>
    </tr>`).join('');

  const html = `
<div class="page">
  <div class="entete">
    <div>
      <div class="logo">Ges<span>Track</span></div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px">Suivi & Contrôle</div>
    </div>
    <div class="meta">
      <strong>FACTURE ${facture.numero}</strong>
      Émise le ${fmtDate(facture.createdAt)}
    </div>
  </div>

  <div class="section">
    <div class="section-titre">Client</div>
    <div class="client-grid">
      <div class="client-item"><span class="label">Nom</span><span class="val">${facture.clientPrenom} ${facture.clientNom}</span></div>
      ${facture.clientTelephone ? `<div class="client-item"><span class="label">Téléphone</span><span class="val">${facture.clientTelephone}</span></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-titre">Produits (${(facture.lignes || []).length})</div>
    <table>
      <thead><tr>
        <th>Produit</th><th style="text-align:center">Qté</th><th>Prix unitaire</th><th>Sous-total</th>
      </tr></thead>
      <tbody>${lignesHTML}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="facture-ligne"><span>Total produits</span><span class="fw-bold">${fmt(facture.montantTotal)}</span></div>
    ${facture.avance > 0 ? `
    <div class="facture-ligne">
      <span>Avance (${labelMoyen})</span>
      <span class="montant-vert">− ${fmt(facture.avance)}</span>
    </div>` : ''}
    <div class="facture-total">
      <span class="lib">${facture.resteADoit > 0 ? 'Reste à payer' : 'Entièrement réglé'}</span>
      <span class="montant">${fmt(facture.resteADoit)}</span>
    </div>
    ${facture.detteId ? `<div style="margin-top:12px;padding:8px 12px;background:#fef3c7;border-radius:8px;font-size:12px;color:#92400e">
      ⚠ Une dette de ${fmt(facture.resteADoit)} a été créée automatiquement pour ce client.
    </div>` : ''}
  </div>

  <div class="pied">Document généré par GesTrack · ${new Date().toLocaleDateString('fr-FR')}</div>

  <div class="btn-imprimer">
    <button class="btn btn-secondary">✕ Fermer</button>
    <button class="btn btn-share">↗ Partager</button>
    <button class="btn btn-primary">⬇ Télécharger / Imprimer</button>
  </div>
</div>`;

  imprimerDocument(
    html,
    `Facture ${facture.numero}`,
    `facture du ${fmtDateFichier(facture.createdAt)}`,
  );
};

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

  imprimerDocument(
    html,
    `Rapport — ${client.prenom} ${client.nom}`,
    `rapport client de ${client.prenom} ${client.nom} du ${aujourdhui()}`,
  );
};


// ──────────────────────────────────────────────
// Toutes les dettes d'un client (sans totaux réglé/abandonné)
// ──────────────────────────────────────────────
export const imprimerToutesDettesClient = (client, dettes) => {
  const actives = dettes.filter(d => d.statut === 'EN_COURS' || d.statut === 'EN_RETARD');
  const totalDu = actives.reduce((s, d) => s + d.montantActuel, 0);

  const lignesDettes = dettes.map(d => `
    <tr>
      <td>${fmtDate(d.createdAt)}</td>
      <td>${d.description || '—'}</td>
      <td>${fmt(d.montantInitial)}</td>
      <td class="${d.statut === 'SOLDEE' ? 'montant-vert' : d.statut === 'ABANDONNEE' ? 'montant-grey' : 'montant-rouge'}">${
        d.statut === 'ABANDONNEE' ? fmt(d.montantAbandonne || d.montantInitial) : fmt(d.montantActuel)
      }</td>
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
      <strong>Dettes du client</strong>
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
    </div>
  </div>

  <div class="section">
    <div class="section-titre">Résumé</div>
    <div class="resume-grid" style="grid-template-columns:1fr 1fr">
      <div class="resume-card">
        <div class="montant montant-rouge">${fmt(totalDu)}</div>
        <div class="lib">Restant dû</div>
      </div>
      <div class="resume-card">
        <div class="montant" style="color:#374151">${dettes.length}</div>
        <div class="lib">Dette(s) au total</div>
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

  <div class="pied">Document généré par GesTrack · ${new Date().toLocaleDateString('fr-FR')}</div>

  <div class="btn-imprimer">
    <button class="btn btn-secondary">✕ Fermer</button>
    <button class="btn btn-share">↗ Partager</button>
    <button class="btn btn-primary">⬇ Télécharger / Imprimer</button>
  </div>
</div>`;

  imprimerDocument(
    html,
    `Dettes — ${client.prenom} ${client.nom}`,
    `dettes de ${client.prenom} ${client.nom} du ${aujourdhui()}`,
  );
};


// ──────────────────────────────────────────────
// Facture d'une dette unique avec historique
// ──────────────────────────────────────────────
export const imprimerFactureDette = (client, dette, historique) => {
  const numFacture = `DT-${dette.id?.slice(-6).toUpperCase()}`;

  const moyen = {
    especes: 'Espèces', om: 'Orange Money', mtn: 'MTN Mobile Money',
  };

  const histoFiltre = (historique || []).filter(h => h.action !== 'RAPPEL_AUTOMATIQUE');

  const lignesHisto = histoFiltre.map(h => `
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

  ${histoFiltre.length > 0 ? `
  <div class="section">
    <div class="section-titre">Historique des transactions (${histoFiltre.length})</div>
    ${lignesHisto}
  </div>` : ''}

  <div class="pied">Document généré par GesTrack · ${new Date().toLocaleDateString('fr-FR')} · N° ${numFacture}</div>

  <div class="btn-imprimer">
    <button class="btn btn-secondary">✕ Fermer</button>
    <button class="btn btn-share">↗ Partager</button>
    <button class="btn btn-primary">⬇ Télécharger / Imprimer</button>
  </div>
</div>`;

  imprimerDocument(
    html,
    `Facture ${numFacture} — ${client.prenom} ${client.nom}`,
    `facture de dette du ${fmtDateFichier(dette.createdAt)}`,
  );
};

const BTNS = `
  <div class="btn-imprimer">
    <button class="btn btn-secondary">✕ Fermer</button>
    <button class="btn btn-share">↗ Partager</button>
    <button class="btn btn-primary">⬇ Télécharger / Imprimer</button>
  </div>`;

const ENTETE_DOC = (titre, sousTitre, centre = '') => `
<div class="entete">
  <div>
    <div class="logo">Ges<span>Track</span></div>
    <div style="font-size:11px;color:#6b7280;margin-top:4px">Suivi & Contrôle</div>
  </div>
  ${centre ? `<div style="flex:1;text-align:center;padding:0 10px">
    <div style="font-size:15px;font-weight:800;color:#0f2027;text-transform:uppercase;letter-spacing:1px">${centre}</div>
  </div>` : ''}
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

  imprimerDocument(
    html,
    `Finances — ${titrePeriode}`,
    `rapport finances ${titrePeriode.toLowerCase()} du ${aujourdhui()}`,
  );
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

  // ── Libellé « Mois Année » affiché au centre de l'en-tête ──
  const libelleMois = (cle) => {
    const [y, m] = cle.split('-');
    return m ? `${MOIS[parseInt(m) - 1]} ${y}` : cle;
  };
  const moisPresents = [...new Set(transactions.map(t => t.date?.substring(0, 7)).filter(Boolean))].sort();
  const centreEntete =
    moisPresents.length === 0 ? ''
    : moisPresents.length === 1 ? libelleMois(moisPresents[0])
    : `${libelleMois(moisPresents[0])} — ${libelleMois(moisPresents[moisPresents.length - 1])}`;

  let tableau = '';
  if (transactions.length === 0) {
    tableau = '<p style="color:#9ca3af;font-size:12px;font-style:italic">Aucune transaction</p>';

  } else if (groupement === 'jour') {
    // ── Détail journalier complet (du 1er vers la fin du mois) ──
    // Clé = date + période : une entrée « semaine » garde ainsi sa plage de dates
    const joursMap = {};
    transactions.forEach(t => {
      const cle = `${t.date || '?'}|${t.periode === 'semaine' ? 'semaine' : 'jour'}`;
      if (!joursMap[cle]) joursMap[cle] = [];
      joursMap[cle].push(t);
    });
    const lignes = Object.entries(joursMap).sort(([a], [b]) => a.localeCompare(b)).map(([cle, ts]) => {
      const [jour, periode] = cle.split('|');
      const label = libelleEntree(jour, periode);
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
    // ── Résumé hebdomadaire (de la 1re à la dernière semaine) ──
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
    const lignes = Object.entries(semMap).sort(([a],[b]) => a.localeCompare(b)).map(([, g]) => `
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
    // ── Résumé mensuel (du plus ancien au plus récent) ──
    const moisMap = {};
    transactions.forEach(t => {
      const mois = t.date?.substring(0, 7) || '?';
      if (!moisMap[mois]) moisMap[mois] = { total: 0, nb: 0 };
      moisMap[mois].total += t.montant;
      moisMap[mois].nb++;
    });
    const lignes = Object.entries(moisMap).sort(([a],[b]) => a.localeCompare(b)).map(([mois, g]) => `
      <tr>
        <td style="font-weight:600">${libelleMois(mois)}</td>
        <td style="text-align:right;color:#6b7280">${g.nb} entrée(s)</td>
        <td class="montant-vert" style="text-align:right;font-weight:700">${fmt(g.total)}</td>
      </tr>`).join('');
    tableau = `<table>
      <thead><tr><th>Mois</th><th style="text-align:right">Nb</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${lignes}</tbody>
      <tfoot><tr style="background:#0f2027;color:#fff"><td colspan="2" style="padding:8px 10px;font-weight:700">Total général</td>
        <td style="padding:8px 10px;font-weight:800;color:#00d4aa;text-align:right">${fmt(totalGlobal)}</td></tr></tfoot>
    </table>`;
  }

  const html = `<div class="page">
  ${ENTETE_DOC('Rapport Mon Compte', titreFiltre, centreEntete)}
  <div class="section">
    <div class="resume-grid" style="grid-template-columns:repeat(4,1fr)">
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

  imprimerDocument(
    html,
    `Mon Compte — ${titreFiltre}`,
    `rapport mon compte ${titreFiltre.toLowerCase()} du ${aujourdhui()}`,
  );
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

  imprimerDocument(
    html,
    `Liste Clients — ${new Date().toLocaleDateString('fr-FR')}`,
    `liste clients du ${aujourdhui()}`,
  );
};


// ──────────────────────────────────────────────
// Export liste produits (Paramètres)
// ──────────────────────────────────────────────
export const imprimerListeProduits = (produits) => {
  // Regrouper d'abord par source (Boutique / Magasin) pour ne jamais mélanger les deux
  // stocks dans une même liste — facilite la lecture et les révisions d'inventaire.
  const parSource = { Boutique: [], Magasin: [] };
  produits.forEach(p => { (parSource[p._source] || (parSource[p._source] = [])).push(p); });

  const nbCategories = new Set(produits.map(p => p.categorie || 'Sans catégorie')).size;

  const tableauSource = (items) => {
    const parCategorie = {};
    items.forEach(p => {
      const cat = p.categorie || 'Sans catégorie';
      if (!parCategorie[cat]) parCategorie[cat] = [];
      parCategorie[cat].push(p);
    });
    const sections = Object.entries(parCategorie).sort(([a], [b]) => a.localeCompare(b, 'fr')).map(([cat, prods]) => `
      <tr style="background:#e8f5f3">
        <td colspan="4" style="font-weight:700;padding:8px 10px;color:#00a881">${cat} (${prods.length})</td>
      </tr>
      ${prods.map(p => {
        const stock = p.stockAffiche || `${p.quantiteStock ?? 0} ${p.unitePrincipale || 'ps'}`;
        return `<tr>
          <td><strong>${p.nom}</strong></td>
          <td class="montant-vert" style="text-align:right">${fmt(p.prixVente)}</td>
          <td style="text-align:right;color:#6366f1">${p.prixAchat ? fmt(p.prixAchat) : '—'}</td>
          <td style="text-align:right"><span class="${(p.stockEnPieces??0) <= 5 ? 'montant-rouge' : 'montant-vert'}">${stock}</span></td>
        </tr>`;
      }).join('')}`).join('');

    return `<table>
      <thead><tr><th>Produit</th><th style="text-align:right">Prix vente</th><th style="text-align:right">Prix achat</th><th style="text-align:right">Stock</th></tr></thead>
      <tbody>${sections}</tbody>
    </table>`;
  };

  const sectionsSources = ['Boutique', 'Magasin']
    .filter(src => parSource[src]?.length > 0)
    .map(src => `
      <div class="section">
        <div class="section-titre">${src} — ${parSource[src].length} produit(s)</div>
        ${tableauSource(parSource[src])}
      </div>
    `).join('');

  const html = `<div class="page">
  ${ENTETE_DOC('Liste des Produits', `${produits.length} produit(s) — ${nbCategories} catégorie(s)`)}
  ${sectionsSources}
  <div class="pied">GesTrack · ${new Date().toLocaleDateString('fr-FR')}</div>
  ${BTNS}
</div>`;

  imprimerDocument(
    html,
    `Liste Produits — ${new Date().toLocaleDateString('fr-FR')}`,
    `liste produits du ${aujourdhui()}`,
  );
};
