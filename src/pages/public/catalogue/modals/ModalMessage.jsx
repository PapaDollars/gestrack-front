// Modal : message / réservation envoyé au vendeur
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'react-toastify';
import { vitrineAPI, estMisEnAttente } from '@/services/api';
import defaultProduit from '@/assets/img/defaultProduit.png';

// ── Modal message — réservation d'un produit (ctx.produit) ou contact général (ctx.general) ──
// N'envoie jamais de vrai message WhatsApp : le style reprend juste l'affordance reconnaissable
// d'un bouton de contact — le message est stocké côté serveur et lu par la boutique dans son
// menu "Messages" (voir routes/messages.js côté backend).
const ModalMessage = ({ ctx, slug, onFermer }) => {
  const produit = ctx?.produit || null;
  const [message, setMessage]   = useState('');
  const [nom, setNom]           = useState('');
  const [telephone, setTelephone] = useState('');
  const [envoi, setEnvoi]       = useState(false);
  const [envoye, setEnvoye]     = useState(false);

  useEffect(() => {
    if (!ctx) return;
    setMessage(produit ? `Bonjour, je souhaite réserver le produit "${produit.nom}".` : '');
    setNom('');
    setTelephone('');
    setEnvoye(false);
  }, [ctx]); // eslint-disable-line

  if (!ctx) return null;

  const soumettre = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const telephonePropre = telephone.replace(/\D/g, '');
    if (!/^6\d{8}$/.test(telephonePropre)) {
      toast.error('Numéro invalide — format attendu : 6XX XXX XXX (9 chiffres)');
      return;
    }
    setEnvoi(true);
    try {
      const reponse = await vitrineAPI.envoyerMessage(slug, {
        produitId:  produit?.id  || null,
        produitNom: produit?.nom || '',
        message, nom, telephone: telephonePropre,
      });
      if (estMisEnAttente(reponse)) { setEnvoye(true); return; }
      setEnvoye(true);
    } catch {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1060, padding: 16 }}
      onClick={onFermer}>
      <div className="bg-white rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: 420 }}
        onClick={e => e.stopPropagation()}>
        <div className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0" style={{ color: '#1e293b' }}>
              {produit ? 'Réserver ce produit' : 'Contacter la boutique'}
            </h6>
            <button onClick={onFermer} className="btn btn-sm btn-light rounded-circle">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {envoye ? (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faCheckCircle} size="2x" style={{ color: '#25d366' }} className="mb-3" />
              <p className="mb-0" style={{ color: '#334155' }}>Votre message a été envoyé à la boutique.</p>
              <p className="mb-0 small text-muted mt-1">Vous serez recontacté(e) dans les 24h qui suivent.</p>
              <button className="btn btn-sm mt-3 text-white" style={{ background: '#00d4aa' }} onClick={onFermer}>
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={soumettre}>
              {produit && (
                <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded-3" style={{ background: '#f8fafc' }}>
                  <img src={produit.image || defaultProduit} alt=""
                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />
                  <span className="small fw-semibold" style={{ color: '#1e293b' }}>{produit.nom}</span>
                </div>
              )}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Votre message</label>
                <textarea className="form-control" rows={3} required autoFocus
                  value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Votre nom *</label>
                <input className="form-control" required
                  value={nom} onChange={e => setNom(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Votre téléphone / WhatsApp *</label>
                <input type="tel" className="form-control" required inputMode="numeric" placeholder="Ex: 6XX XXX XXX"
                  value={telephone} onChange={e => setTelephone(e.target.value)} />
              </div>
              <button type="submit" disabled={envoi}
                className="btn w-100 text-white d-flex align-items-center justify-content-center gap-2"
                style={{ background: '#25d366', borderRadius: 10 }}>
                {envoi ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faWhatsapp} />}
                Envoyer le message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalMessage;
