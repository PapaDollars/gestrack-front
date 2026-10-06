// Formulaire commun aux onglets qui enregistrent les paramètres (Apparence, Rappels) :
// envoie les valeurs de l'onglet au serveur (fusionnées avec l'existant) et affiche le bouton.
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';
import { parametresAPI, estMisEnAttente } from '@/services/api';
import { useParametres } from '@/context/ParametresContext';
import { toast } from 'react-toastify';

const FormulaireParametres = ({ valeurs, children }) => {
  const { setParametres } = useParametres();
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      const reponse = await parametresAPI.update(valeurs);
      if (estMisEnAttente(reponse)) return; // pas encore enregistré côté serveur
      setParametres(reponse.data);
      toast.success('Paramètres enregistrés');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-4">{children}</div>

      {/* Bouton enregistrer */}
      <div className="mt-4">
        <button
          type="submit"
          className="btn text-white d-flex align-items-center gap-2"
          style={{ background: '#00d4aa', borderRadius: 10 }}
          disabled={chargement}
        >
          {chargement
            ? <FontAwesomeIcon icon={faSpinner} spin />
            : <FontAwesomeIcon icon={faSave} />
          }
          Enregistrer les paramètres
        </button>
      </div>
    </form>
  );
};

export default FormulaireParametres;
