// Affiché quand une page n'a pas pu être téléchargée (réseau coupé ou trop faible).
const PageIndisponible = () => (
  <div className="d-flex flex-column justify-content-center align-items-center text-center gap-3 p-4"
    style={{ minHeight: '50vh' }}>
    <p className="text-muted mb-0">Cette page n'a pas pu s'ouvrir. Vérifiez votre connexion internet.</p>
    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
      Réessayer
    </button>
  </div>
);

export default PageIndisponible;
