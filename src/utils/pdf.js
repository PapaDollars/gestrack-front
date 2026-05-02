// Génère un aperçu et déclenche l'impression (Ctrl+P → Enregistrer PDF)
export const imprimerDocument = (html, titre = 'GesTrack') => {
  const fenetre = window.open('', '_blank', 'width=900,height=700');
  if (!fenetre) return;
  fenetre.document.write(buildHTML(html, titre));
  fenetre.document.close();
};

const buildHTML = (html, titre) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${titre}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px; }

    /* En-tête */
    .entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00d4aa; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 800; color: #0f2027; }
    .logo span { color: #00d4aa; }
    .meta { text-align: right; font-size: 11px; color: #6b7280; }
    .meta strong { display: block; font-size: 15px; color: #1a1a1a; margin-bottom: 4px; }

    /* Sections */
    .section { margin-bottom: 20px; }
    .section-titre { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }

    /* Client info */
    .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .client-item { display: flex; flex-direction: column; }
    .client-item .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; }
    .client-item .val { font-weight: 600; color: #1a1a1a; }

    /* Résumé */
    .resume-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .resume-card { background: #f9fafb; border-radius: 8px; padding: 12px; text-align: center; }
    .resume-card .montant { font-size: 18px; font-weight: 800; }
    .resume-card .lib { font-size: 11px; color: #6b7280; margin-top: 2px; }

    /* Tableau */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
    .badge-cours   { background: #fff3cd; color: #856404; }
    .badge-retard  { background: #f8d7da; color: #842029; }
    .badge-soldee  { background: #d1e7dd; color: #0f5132; }
    .badge-abandon { background: #f3f4f6; color: #6b7280; }
    .montant-rouge { color: #dc2626; font-weight: 700; }
    .montant-vert  { color: #16a34a; font-weight: 700; }
    .montant-grey  { color: #6b7280; font-weight: 600; }

    /* Facture */
    .facture-ligne { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .facture-total { background: #0f2027; color: #fff; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
    .facture-total .lib { font-size: 13px; }
    .facture-total .montant { font-size: 20px; font-weight: 800; color: #00d4aa; }

    /* Historique */
    .histo-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-radius: 6px; margin-bottom: 5px; background: #f9fafb; font-size: 12px; }
    .histo-action { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; margin-right: 8px; }
    .action-paiement { background: #d1fae5; color: #065f46; }
    .action-ajout    { background: #fef3c7; color: #92400e; }
    .action-creation { background: #dbeafe; color: #1e40af; }
    .action-autre    { background: #f3f4f6; color: #374151; }

    /* Pied */
    .pied { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }

    /* Boutons (masqués à l'impression) */
    .btn-imprimer { display: flex; gap: 10px; justify-content: center; padding: 16px 0; flex-wrap: wrap; }
    .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
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
    const optPdf = {
      margin: 8,
      filename: titre + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    async function genererBlob() {
      const btns = document.querySelector('.btn-imprimer');
      btns.style.display = 'none';
      try {
        const blob = await html2pdf().set(optPdf).from(document.querySelector('.page')).outputPdf('blob');
        return blob;
      } finally {
        btns.style.display = '';
      }
    }

    async function telechargerPdf() {
      if (typeof html2pdf === 'undefined') { window.print(); return; }
      const btns = document.querySelector('.btn-imprimer');
      btns.style.display = 'none';
      try {
        await html2pdf().set(optPdf).from(document.querySelector('.page')).save();
      } finally {
        btns.style.display = '';
      }
    }

    document.querySelector('.btn-primary')?.addEventListener('click', telechargerPdf);
    document.querySelector('.btn-secondary')?.addEventListener('click', () => window.close());

    document.querySelector('.btn-share')?.addEventListener('click', async () => {
      if (typeof html2pdf === 'undefined') {
        alert('Le module PDF n\\'est pas disponible. Vérifiez votre connexion.');
        return;
      }
      try {
        const blob = await genererBlob();
        const fichier = new File([blob], titre + '.pdf', { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
          await navigator.share({ files: [fichier], title: titre, text: 'Document GesTrack' });
        } else if (navigator.share) {
          await navigator.share({ title: titre, text: 'Document GesTrack — ' + titre });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = titre + '.pdf';
          document.body.appendChild(a); a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          try {
            const blob = await genererBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = titre + '.pdf';
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) { console.error(e); }
        }
      }
    });
  </script>
</body>
</html>`;

// Formatte un montant FCFA
export const fmt = (n) =>
  new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n || 0);

// Formatte une date ISO
export const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
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
