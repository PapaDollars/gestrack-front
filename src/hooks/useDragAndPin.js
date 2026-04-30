import { useState, useRef } from 'react';

const useDragAndPin = (storageKey) => {
  const [ordre, setOrdre] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${storageKey}_ordre`)) || []; }
    catch { return []; }
  });
  const [epingles, setEpingles] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`${storageKey}_epingles`)) || []); }
    catch { return new Set(); }
  });
  const [dragSur, setDragSur] = useState(null);
  const dragIdRef = useRef(null);

  // Trie : épinglés d'abord, puis ordre drag-and-drop, puis nouvelles entrées à la fin
  const appliquerOrdre = (items) => {
    const trier = (list) => [...list].sort((a, b) => {
      const ia = ordre.indexOf(a.id), ib = ordre.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return [
      ...trier(items.filter(i => epingles.has(i.id))),
      ...trier(items.filter(i => !epingles.has(i.id))),
    ];
  };

  const epingler = (id) => {
    setEpingles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(`${storageKey}_epingles`, JSON.stringify([...next]));
      return next;
    });
  };

  const onDragStart = (e, id) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const onDragOver = (e, id) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragSur(id);
  };

  const onDragLeave = () => setDragSur(null);
  const onDragEnd  = () => { dragIdRef.current = null; setDragSur(null); };

  const onDrop = (e, targetId, visibleItems) => {
    e.preventDefault();
    setDragSur(null);
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) return;

    const ordreCourant = appliquerOrdre(visibleItems).map(i => i.id);
    const from = ordreCourant.indexOf(sourceId);
    const to   = ordreCourant.indexOf(targetId);
    if (from === -1 || to === -1) return;

    const nouvelOrdre = [...ordreCourant];
    nouvelOrdre.splice(from, 1);
    nouvelOrdre.splice(to, 0, sourceId);

    setOrdre(nouvelOrdre);
    localStorage.setItem(`${storageKey}_ordre`, JSON.stringify(nouvelOrdre));
    dragIdRef.current = null;
  };

  return { appliquerOrdre, epingles, epingler, dragSur, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd };
};

export default useDragAndPin;
