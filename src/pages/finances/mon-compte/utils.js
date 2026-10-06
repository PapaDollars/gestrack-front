// Regroupement, filtrage et totaux des entrées du compte
import { MOIS_FR } from '@/pages/finances/mon-compte/constants';

const debutSemaine = (d) => {
  const j = new Date(d);
  const dow = j.getDay() || 7;
  j.setDate(j.getDate() - dow + 1);
  j.setHours(0, 0, 0, 0);
  return j;
};

export const cleGroupeCompte = (dateStr, groupement) => {
  if (!dateStr) return '';
  if (groupement === 'jour') return dateStr;
  if (groupement === 'semaine') {
    const lun = debutSemaine(new Date(dateStr + 'T00:00:00'));
    return lun.toISOString().split('T')[0];
  }
  return dateStr.substring(0, 7);
};

export const labelGroupeCompte = (cle, groupement) => {
  if (!cle) return '—';
  if (groupement === 'jour') {
    return new Date(cle + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (groupement === 'semaine') {
    const lun = new Date(cle + 'T00:00:00');
    const dim = new Date(lun); dim.setDate(lun.getDate() + 6);
    return `Semaine du ${lun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${dim.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return nomMois(cle);
};

export const filtrerParDate = (liste, periodeDate) => {
  if (!periodeDate) return liste;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (periodeDate === 'aujourd_hui') return liste.filter(t => t.date === today);
  if (periodeDate === 'semaine') {
    const lunStr = debutSemaine(now).toISOString().split('T')[0];
    return liste.filter(t => t.date >= lunStr);
  }
  if (periodeDate === 'mois') {
    const debutMois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return liste.filter(t => t.date?.startsWith(debutMois));
  }
  return liste;
};

export const nomMois = (moisStr) => {
  const [year, month] = moisStr.split('-');
  return `${MOIS_FR[parseInt(month) - 1]} ${year}`;
};

export const formatDate = (dateStr, periode) => {
  const d = new Date(dateStr + 'T00:00:00');
  if (periode === 'semaine') {
    const lun = new Date(d);
    const jour = d.getDay() || 7;
    lun.setDate(d.getDate() - jour + 1);
    const dim = new Date(lun);
    dim.setDate(lun.getDate() + 6);
    return `Sem. du ${lun.getDate()}/${lun.getMonth()+1} au ${dim.getDate()}/${dim.getMonth()+1}/${dim.getFullYear()}`;
  }
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export const totaux = (liste) => ({
  especes:      liste.filter(t => t.type === 'especes').reduce((s,t) => s + t.montant, 0),
  orange_money: liste.filter(t => t.type === 'orange_money').reduce((s,t) => s + t.montant, 0),
  mobile_money: liste.filter(t => t.type === 'mobile_money').reduce((s,t) => s + t.montant, 0),
  global:       liste.reduce((s,t) => s + t.montant, 0),
});
