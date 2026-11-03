// Pages chargées à la demande : le téléphone ne télécharge au démarrage que le socle de
// l'application et la page ouverte, au lieu de toutes les pages d'un coup.
import { lazy } from 'react';
import PageIndisponible from '@/components/common/PageIndisponible';

// Après un déploiement, un téléphone resté sur l'ancienne version cherche des fichiers qui
// n'existent plus : un seul rechargement suffit à récupérer la nouvelle version.
const CLE_RECHARGEMENT = 'gestrack_rechargement_version';
const dejaRecharge = () => {
  try { return !!sessionStorage.getItem(CLE_RECHARGEMENT); } catch { return true; }
};
const memoriserRechargement = (actif) => {
  try {
    if (actif) sessionStorage.setItem(CLE_RECHARGEMENT, '1');
    else sessionStorage.removeItem(CLE_RECHARGEMENT);
  } catch { /* stockage indisponible */ }
};

export const pageDifferee = (importer) => lazy(() => importer()
  .then((module) => {
    memoriserRechargement(false);
    return module;
  })
  .catch(() => {
    if (navigator.onLine && !dejaRecharge()) {
      memoriserRechargement(true);
      window.location.reload();
      return new Promise(() => {}); // la page se recharge : rien à afficher d'ici là
    }
    return { default: PageIndisponible };
  }));

// Pages de gestion : préchargées une fois connecté, pour rester accessibles si le réseau
// coupe pendant le travail (les actions sont alors mises en file d'attente, voir syncQueue).
const pagesApplication = [];
export const pageApplication = (importer) => {
  pagesApplication.push(importer);
  return pageDifferee(importer);
};

export const prechargerPagesApplication = async () => {
  for (const importer of pagesApplication) {
    try { await importer(); } catch { return; } // réseau coupé : inutile d'insister
  }
};
