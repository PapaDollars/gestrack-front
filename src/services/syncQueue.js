// File d'attente pour les opérations hors ligne — stockées dans localStorage
const CLE = 'gestrack_sync_queue';

export const getQueue = () => {
  try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch { return []; }
};

const sauvegarder = (q) => localStorage.setItem(CLE, JSON.stringify(q));

export const enqueue = (config) => {
  const q = getQueue();
  q.push({
    id: Date.now() + Math.random(),
    method: config.method,
    url: config.url,
    data: config.data,
    timestamp: new Date().toISOString(),
  });
  sauvegarder(q);
};

export const processerQueue = async (axiosInstance) => {
  const q = getQueue();
  if (q.length === 0) return { synced: 0, failed: 0 };

  const echecs = [];
  let synced = 0;

  for (const op of q) {
    try {
      await axiosInstance({ method: op.method, url: op.url, data: op.data });
      synced++;
    } catch {
      echecs.push(op);
    }
  }

  sauvegarder(echecs);
  return { synced, failed: echecs.length };
};

export const nbEnAttente = () => getQueue().length;
export const viderQueue  = () => localStorage.removeItem(CLE);
