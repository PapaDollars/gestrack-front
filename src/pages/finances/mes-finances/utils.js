// Filtrage et regroupement des ventes par période

// ── Helpers ──────────────────────────────────────────────────────────────────
const debutSemaine = (d) => {
  const j = new Date(d);
  const dow = j.getDay() || 7;
  j.setDate(j.getDate() - dow + 1);
  j.setHours(0,0,0,0);
  return j;
};

export const cleGroupe = (timestamp, groupement) => {
  const d = new Date(timestamp);
  if (groupement === 'jour')    return d.toISOString().split('T')[0];
  if (groupement === 'semaine') {
    const lun = debutSemaine(d);
    return lun.toISOString().split('T')[0];
  }
  return d.toISOString().substring(0, 7); // mois
};

export const labelGroupe = (cle, groupement) => {
  if (groupement === 'jour') {
    return new Date(cle + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (groupement === 'semaine') {
    const lun = new Date(cle + 'T00:00:00');
    const dim = new Date(lun); dim.setDate(lun.getDate() + 6);
    return `Semaine du ${lun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${dim.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  const [y, m] = cle.split('-');
  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${MOIS[parseInt(m)-1]} ${y}`;
};

export const filtrerParPeriode = (entrees, periode, dateDebut, dateFin) => {
  const maintenant = new Date();
  const today = maintenant.toISOString().split('T')[0];
  return entrees.filter(e => {
    if (!e.timestamp) return false;
    const ts = e.timestamp;
    if (periode === 'aujourd_hui') return ts >= today + 'T00:00:00' && ts <= today + 'T23:59:59';
    if (periode === 'semaine') {
      const lun = debutSemaine(maintenant);
      return new Date(ts) >= lun;
    }
    if (periode === 'mois') {
      const debut = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1).toISOString();
      return ts >= debut;
    }
    if (periode === '3mois') {
      const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 2, 1).toISOString();
      return ts >= debut;
    }
    if (periode === 'annee') {
      return ts.startsWith(maintenant.getFullYear().toString());
    }
    if (periode === 'perso') {
      if (dateDebut && ts < dateDebut + 'T00:00:00') return false;
      if (dateFin   && ts > dateFin   + 'T23:59:59') return false;
      return true;
    }
    return true;
  });
};
