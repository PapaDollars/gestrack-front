// Mentions légales de la plateforme GesTrack Business (éditeur, hébergement, contact).
// Les informations de l'éditeur se complètent dans pages/public/constants.js.
import React from 'react';
import { mailto } from '@/utils/url/frontend';
import PageLegale, { Section } from '@/pages/public/components/PageLegale';
import { EDITEUR, PRESTATAIRES } from '@/pages/public/constants';

const Ligne = ({ label, valeur }) => (valeur ? <li><strong>{label} :</strong> {valeur}</li> : null);

const MentionsLegales = () => (
  <PageLegale titre="Mentions légales">
    <Section titre="Éditeur">
      <ul>
        <Ligne label="Service" valeur={`GesTrack Business — ${EDITEUR.site}`} />
        <Ligne label="Éditeur" valeur={EDITEUR.nom} />
        <Ligne label="Directeur de la publication" valeur={EDITEUR.responsable} />
        <Ligne label="Adresse" valeur={EDITEUR.adresse} />
        <Ligne label="Pays" valeur={EDITEUR.pays} />
        <Ligne label="Immatriculation" valeur={EDITEUR.immatriculation} />
        <Ligne label="Téléphone" valeur={EDITEUR.telephone} />
        <li><strong>E-mail :</strong> <a href={mailto(EDITEUR.email)}>{EDITEUR.email}</a></li>
      </ul>
    </Section>

    <Section titre="Hébergement et prestataires techniques">
      <ul>
        {PRESTATAIRES.map(p => <li key={p.nom}><strong>{p.nom}</strong> — {p.role}</li>)}
      </ul>
    </Section>

    <Section titre="Catalogues des commerçants">
      <p>
        Chaque catalogue publié sur GesTrack Business (adresse en /catalogue/…) est édité par le
        commerçant qui l'a créé. Ses produits, prix, photos et descriptions relèvent de sa seule
        responsabilité. Pour signaler un contenu illicite, écrivez à{' '}
        <a href={mailto(EDITEUR.email, { sujet: 'Signalement d\'un contenu' })}>{EDITEUR.email}</a>{' '}
        en indiquant l'adresse de la page concernée.
      </p>
    </Section>

    <Section titre="Propriété intellectuelle">
      <p>
        Le nom GesTrack, le logo et l'application sont la propriété de leur éditeur. Les contenus
        publiés par les commerçants (photos, textes) restent leur propriété.
      </p>
    </Section>
  </PageLegale>
);

export default MentionsLegales;
