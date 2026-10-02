// Politique de confidentialité — page publique requise pour la fiche Google Play du
// catalogue (Magasin Coup Doeil). Décrit uniquement ce que CETTE page (le catalogue public)
// collecte réellement, pas l'application GesTrack dans son ensemble.
import React from 'react';

const PolitiqueConfidentialite = () => (
  <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif', lineHeight: 1.7, color: '#334155' }}>
    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f2027', marginBottom: 4 }}>
      Politique de confidentialité
    </h1>
    <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>
      Catalogue Magasin Coup Doeil — dernière mise à jour : octobre 2026
    </p>

    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f2027', marginTop: 28 }}>Ce que nous collectons</h2>
    <p>
      En consultant ce catalogue, un identifiant anonyme est créé et conservé sur votre appareil
      (aucun compte, aucune inscription). Il sert uniquement à afficher les rubriques
      « Pour vous », « Historique » et « Populaire » du catalogue, en comptant les produits que
      vous consultez. Cet identifiant n'est jamais relié à votre nom, votre numéro ou toute autre
      information personnelle.
    </p>
    <p>
      Si vous utilisez le formulaire de réservation ou de contact, nous recevons votre nom, votre
      numéro de téléphone et le message saisi, afin que la boutique puisse vous recontacter. Ces
      informations sont transmises uniquement à la boutique concernée.
    </p>

    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f2027', marginTop: 28 }}>Ce que nous ne faisons pas</h2>
    <p>
      Nous ne vendons et ne partageons aucune donnée avec des tiers à des fins publicitaires. Il
      n'y a pas de publicité ni de traqueur publicitaire sur cette page.
    </p>

    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f2027', marginTop: 28 }}>Hébergement</h2>
    <p>
      Les données sont hébergées sur Firebase (Google Cloud), avec chiffrement en transit.
    </p>

    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f2027', marginTop: 28 }}>Contact</h2>
    <p>
      Pour toute question sur cette politique ou pour demander la suppression de vos données
      (ex: un message de réservation envoyé par erreur), écrivez à{' '}
      <a href="mailto:gestrack.gt@gmail.com">gestrack.gt@gmail.com</a>.
    </p>
  </div>
);

export default PolitiqueConfidentialite;
