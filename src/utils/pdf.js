// Génère un aperçu et déclenche l'impression (Ctrl+P → Enregistrer PDF)
export const imprimerDocument = (html, titre = 'GesTrack', textePartage) => {
  const fenetre = window.open('', '_blank', 'width=900,height=700');
  if (!fenetre) return;
  fenetre.document.write(buildHTML(html, titre, textePartage ?? 'Document GesTrack'));
  fenetre.document.close();
};

const buildHTML = (html, titre, textePartage) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${titre}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 18px 22px; }

    /* En-tête */
    .entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00d4aa; padding-bottom: 8px; margin-bottom: 14px; }
    .logo { font-size: 17px; font-weight: 800; color: #0f2027; }
    .logo span { color: #00d4aa; }
    .meta { text-align: right; font-size: 10px; color: #6b7280; }
    .meta strong { display: block; font-size: 13px; color: #1a1a1a; margin-bottom: 2px; }

    /* Sections */
    .section { margin-bottom: 12px; }
    .section-titre { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }

    /* Client info */
    .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 12px; }
    .client-item { display: flex; flex-direction: column; }
    .client-item .label { font-size: 9px; color: #9ca3af; text-transform: uppercase; }
    .client-item .val { font-weight: 600; color: #1a1a1a; font-size: 11px; }

    /* Résumé */
    .resume-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .resume-card { background: #f9fafb; border-radius: 6px; padding: 7px; text-align: center; }
    .resume-card .montant { font-size: 14px; font-weight: 800; }
    .resume-card .lib { font-size: 9px; color: #6b7280; margin-top: 1px; }

    /* Tableau */
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    th { background: #f3f4f6; text-align: left; padding: 5px 7px; font-size: 9.5px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 5px 7px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 20px; font-size: 9px; font-weight: 600; }
    .badge-cours   { background: #fff3cd; color: #856404; }
    .badge-retard  { background: #f8d7da; color: #842029; }
    .badge-soldee  { background: #d1e7dd; color: #0f5132; }
    .badge-abandon { background: #f3f4f6; color: #6b7280; }
    .montant-rouge { color: #dc2626; font-weight: 700; }
    .montant-vert  { color: #16a34a; font-weight: 700; }
    .montant-grey  { color: #6b7280; font-weight: 600; }

    /* Facture */
    .facture-ligne { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
    .facture-total { background: #0f2027; color: #fff; border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
    .facture-total .lib { font-size: 11px; }
    .facture-total .montant { font-size: 16px; font-weight: 800; color: #00d4aa; }

    /* Historique */
    .histo-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; border-radius: 5px; margin-bottom: 3px; background: #f9fafb; font-size: 10.5px; }
    .histo-action { display: inline-block; padding: 1px 6px; border-radius: 20px; font-size: 9px; font-weight: 700; margin-right: 6px; }
    .action-paiement { background: #d1fae5; color: #065f46; }
    .action-ajout    { background: #fef3c7; color: #92400e; }
    .action-creation { background: #dbeafe; color: #1e40af; }
    .action-autre    { background: #f3f4f6; color: #374151; }

    /* Pied */
    .pied { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 9.5px; color: #9ca3af; text-align: center; }

    /* Boutons (masqués à l'impression) */
    .btn-imprimer { display: flex; gap: 10px; justify-content: center; padding: 14px 0; flex-wrap: wrap; }
    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary   { background: #00d4aa; color: #fff; }
    .btn-share     { background: #0f2027; color: #fff; }
    .btn-secondary { background: #f3f4f6; color: #374151; }

    @media print {
      .btn-imprimer { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${html}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    const titre = document.title;
    const textePartage = ${JSON.stringify(textePartage)};
    const optPdf = {
      margin: 5,
      filename: titre + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    let cachedBlob = null;

    // Numéro unique par document : A0001, A0002 ... Z9999, A0001 (cyclique)
    let numDoc = null;
    const getNumDoc = () => {
      if (numDoc) return numDoc;
      try {
        const n = parseInt(localStorage.getItem('gestrack_doc_num') || '0') + 1;
        localStorage.setItem('gestrack_doc_num', String(n));
        const l = String.fromCharCode(65 + Math.floor((n - 1) / 9999) % 26);
        const d = String((n - 1) % 9999 + 1).padStart(4, '0');
        numDoc = l + d;
      } catch { numDoc = 'A0001'; }
      return numDoc;
    };

    function telechargerBlob(blob) {
      const nomFichier = titre + '-' + getNumDoc() + '.pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = nomFichier;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // Pré-générer le PDF dès le chargement pour que le partage soit instantané
    window.addEventListener('load', async () => {
      if (typeof html2pdf === 'undefined') return;
      const btnShare = document.querySelector('.btn-share');
      const btnDownload = document.querySelector('.btn-primary');
      const texteShare = btnShare?.innerHTML;
      if (btnShare)   { btnShare.disabled = true;   btnShare.innerHTML = '⏳ Préparation…'; }
      if (btnDownload)  btnDownload.disabled = true;

      const btns = document.querySelector('.btn-imprimer');
      btns.style.display = 'none';
      try {
        cachedBlob = await html2pdf().set(optPdf).from(document.querySelector('.page')).outputPdf('blob');
      } catch(e) { console.error(e); }
      btns.style.display = '';

      if (btnShare)   { btnShare.disabled = false;  btnShare.innerHTML = texteShare; }
      if (btnDownload)  btnDownload.disabled = false;
    });

    document.querySelector('.btn-primary')?.addEventListener('click', () => {
      if (!cachedBlob) { window.print(); return; }
      telechargerBlob(cachedBlob);
    });

    document.querySelector('.btn-secondary')?.addEventListener('click', () => window.close());

    document.querySelector('.btn-share')?.addEventListener('click', async () => {
      if (!cachedBlob) return;
      const nomFichier = titre + '-' + getNumDoc() + '.pdf';
      const fichier = new File([cachedBlob], nomFichier, { type: 'application/pdf' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
          await navigator.share({ files: [fichier], title: nomFichier, text: textePartage });
        } else if (navigator.share) {
          await navigator.share({ title: nomFichier, text: textePartage + ' — ' + nomFichier });
        } else {
          telechargerBlob(cachedBlob);
        }
      } catch (err) {
        if (err.name !== 'AbortError') telechargerBlob(cachedBlob);
      }
    });
  </script>
</body>
</html>`;

// Formatte un montant FCFA
export const fmt = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n || 0);

// Formatte une date ISO en JJ-MM-AAAA (nom de fichier, partage)
export const fmtDateFichier = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  return `${jour}-${mois}-${d.getFullYear()}`;
};

// Formatte une date ISO avec heure (pour les documents PDF)
export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Formatte date + heure pour les composants React (format court)
export const fmtDH = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Badge HTML selon statut dette
export const badgeDette = (statut) => {
  const map = {
    EN_COURS:   ['badge-cours',   'En cours'],
    EN_RETARD:  ['badge-retard',  'En retard'],
    SOLDEE:     ['badge-soldee',  'Soldée'],
    ABANDONNEE: ['badge-abandon', 'Abandonnée'],
  };
  const [cls, label] = map[statut] || map.EN_COURS;
  return `<span class="badge ${cls}">${label}</span>`;
};

// Badge HTML selon action historique
export const badgeAction = (action) => {
  const map = {
    REDUCTION: ['action-paiement', 'Paiement'],
    AJOUT:     ['action-ajout',    'Ajout'],
    CREATION:  ['action-creation', 'Création'],
  };
  const [cls, label] = map[action] || ['action-autre', action];
  return `<span class="histo-action ${cls}">${label}</span>`;
};