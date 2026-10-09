// Paramètres › Factures : conditions de vente imprimées en bas des factures
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBold, faItalic } from '@fortawesome/free-solid-svg-icons';
import { useParametres } from '@/context/ParametresContext';
import FormulaireParametres from '@/pages/parametres/components/FormulaireParametres';
import {
  CONDITIONS_VENTE_DEFAUT, POLICES_CONDITIONS, STYLE_CONDITIONS_DEFAUT, styleConditions,
} from '@/utils/factures';

const LONGUEUR_MAX = 600;

const Factures = () => {
  const { parametres } = useParametres();
  const [form, setForm] = useState({ conditionsVente: CONDITIONS_VENTE_DEFAUT, conditionsVenteStyle: STYLE_CONDITIONS_DEFAUT });

  useEffect(() => {
    setForm({
      conditionsVente: parametres.conditionsVente ?? CONDITIONS_VENTE_DEFAUT,
      conditionsVenteStyle: { ...STYLE_CONDITIONS_DEFAUT, ...(parametres.conditionsVenteStyle || {}) },
    });
  }, [parametres]);

  const texte = form.conditionsVente || '';
  const style = form.conditionsVenteStyle;
  const setTexte = (t) => setForm(f => ({ ...f, conditionsVente: t }));
  const setStyle = (maj) => setForm(f => ({ ...f, conditionsVenteStyle: { ...f.conditionsVenteStyle, ...maj } }));

  // Bouton bascule (gras / italique)
  const Bascule = ({ actif, onClick, icon, titre }) => (
    <button type="button" title={titre} onClick={onClick}
      className="btn btn-sm d-flex align-items-center justify-content-center"
      style={{ width: 34, height: 31, borderRadius: 8,
        background: actif ? '#00d4aa' : 'var(--bs-secondary-bg)', color: actif ? '#fff' : 'var(--bs-body-color)' }}>
      <FontAwesomeIcon icon={icon} />
    </button>
  );

  return (
    <FormulaireParametres valeurs={form}>
      <div className="col-12">
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body p-4">
            <h6 className="fw-semibold mb-1" style={{ color: 'var(--bs-body-color)' }}>Conditions de vente</h6>
            <p className="text-muted small mb-3">
              Texte affiché en bas de chaque facture (à l'écran et à l'impression).
              Laissez vide pour ne rien afficher.
            </p>
            {/* Mise en forme : gras, italique, police */}
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <Bascule titre="Gras" icon={faBold} actif={style.gras} onClick={() => setStyle({ gras: !style.gras })} />
              <Bascule titre="Italique" icon={faItalic} actif={style.italique} onClick={() => setStyle({ italique: !style.italique })} />
              <select className="form-select form-select-sm" style={{ width: 'auto' }}
                value={style.police} onChange={(e) => setStyle({ police: e.target.value })}>
                {Object.entries(POLICES_CONDITIONS).map(([cle, p]) => (
                  <option key={cle} value={cle} style={{ fontFamily: p.famille }}>{p.label}</option>
                ))}
              </select>
            </div>
            <textarea className="form-control" rows={3} maxLength={LONGUEUR_MAX}
              style={styleConditions(style)}
              placeholder="Ex. : Les marchandises vendues ne sont ni reprises, ni échangées."
              value={texte}
              onChange={(e) => setTexte(e.target.value)} />
            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-light" onClick={() => setTexte(CONDITIONS_VENTE_DEFAUT)}>
                  Afficher le texte par défaut
                </button>
                <button type="button" style={{ backgroundColor: '#faffd0', borderColor: 'var(--bs-warning)', color: 'var(--bs-body-color)' }}  className="btn btn-sm btn-warning" onClick={() => setTexte('')}>
                  Masquer l'affichage du texte par défaut
                </button>
              </div>
              <small className="text-muted">{texte.length} / {LONGUEUR_MAX}</small>
            </div>

            {/* Aperçu tel qu'il apparaîtra sur la facture */}
            <div className="small fw-semibold text-muted mt-4 mb-2">Aperçu</div>
            {texte.trim() ? (
              <div className="text-center px-3 py-2 rounded-3"
                style={{ border: '1px dashed #9ca3af', fontSize: 'var(--txt-sm)', color: 'var(--bs-body-color)', whiteSpace: 'pre-line', ...styleConditions(style) }}>
                {texte.trim()}
              </div>
            ) : (
              <div className="text-muted small fst-italic">Aucune mention ne sera affichée sur les factures.</div>
            )}
          </div>
        </div>
      </div>
    </FormulaireParametres>
  );
};

export default Factures;
