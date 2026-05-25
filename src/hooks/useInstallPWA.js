import { useState, useEffect } from 'react';

const useInstallPWA = () => {
  const [promptEvent, setPromptEvent] = useState(null);
  const [estInstalle, setEstInstalle] = useState(false);

  useEffect(() => {
    // Déjà installée en mode standalone (lancée depuis l'écran d'accueil)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setEstInstalle(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setEstInstalle(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const installer = async () => {
    if (!promptEvent) return false;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') setEstInstalle(true);
    setPromptEvent(null);
    return outcome === 'accepted';
  };

  return { peutInstaller: !!promptEvent, estInstalle, installer };
};

export default useInstallPWA;
