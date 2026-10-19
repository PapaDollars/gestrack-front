// Politique de confidentialité de la plateforme GesTrack Business — commune à tous les
// comptes (commerçants) et aux visiteurs des catalogues publics. Page publique aussi exigée
// pour les fiches Google Play des catalogues publiés en application.
import React from 'react';
import { mailto } from '@/utils/url/frontend';
import PageLegale, { Section } from '@/pages/public/components/PageLegale';
import { EDITEUR, PRESTATAIRES } from '@/pages/public/constants';

const PolitiqueConfidentialite = () => (
  <PageLegale titre="Politique de confidentialité"
    intro={`Cette politique explique quelles données GesTrack Business (${EDITEUR.site}) traite, pourquoi, et comment exercer vos droits. Elle concerne les commerçants qui utilisent l'application et les visiteurs des catalogues publics.`}>

    <Section titre="1. Visiteurs des catalogues publics">
      <ul>
        <li><strong>Sans inscription.</strong> Un identifiant anonyme est créé et conservé sur
          votre appareil. Il sert uniquement à afficher les rubriques « Pour vous », « Historique »
          et « Populaire » en comptant les produits consultés. Il n'est relié ni à votre nom ni à
          votre numéro.</li>
        <li><strong>Formulaire de contact.</strong> Si vous écrivez à une boutique, votre nom,
          votre numéro de téléphone et votre message sont transmis uniquement à cette boutique,
          pour qu'elle vous recontacte.</li>
        <li><strong>Boutique protégée.</strong> Le mot de passe saisi sert seulement à ouvrir la
          boutique ; le contenu affiché peut être gardé sur votre appareil pour éviter de le
          ressaisir.</li>
      </ul>
    </Section>

    <Section titre="2. Commerçants (titulaires d'un compte)">
      <ul>
        <li><strong>Compte :</strong> adresse e-mail, nom, prénom et données de connexion, pour
          vous identifier, sécuriser l'accès (codes envoyés par e-mail) et gérer votre accès.</li>
        <li><strong>Données de gestion :</strong> produits, stock, factures, clients, dettes,
          fournisseurs, finances et paramètres que vous saisissez, pour vous fournir le service.
          Elles sont propres à votre compte et ne sont visibles par aucun autre utilisateur.</li>
        <li><strong>Catalogue :</strong> seuls les produits, photos et prix que vous choisissez
          de rendre publics apparaissent sur votre catalogue ; prix d'achat et stock exact n'y
          figurent jamais.</li>
      </ul>
      <p>
        Les informations que vous enregistrez sur vos propres clients (noms, téléphones, dettes)
        sont traitées pour votre compte : vous en êtes responsable vis-à-vis d'eux.
      </p>
    </Section>

    <Section titre="3. Ce que nous ne faisons pas">
      <p>
        Nous ne vendons aucune donnée et ne la partageons pas à des fins publicitaires. Il n'y a ni
        publicité ni traqueur publicitaire dans l'application ni sur les catalogues.
      </p>
    </Section>

    <Section titre="4. Hébergement et prestataires">
      <p>Les données sont hébergées et traitées par les prestataires techniques suivants :</p>
      <ul>
        {PRESTATAIRES.map(p => <li key={p.nom}><strong>{p.nom}</strong> — {p.role}</li>)}
      </ul>
      <p>
        Les échanges sont chiffrés (HTTPS). Les mots de passe et codes secrets ne sont jamais
        conservés en clair. Ces prestataires peuvent héberger les données hors du {EDITEUR.pays}.
      </p>
    </Section>

    <Section titre="5. Durée de conservation">
      <p>
        Les données d'un compte sont conservées tant que le compte existe, y compris pendant une
        suspension d'accès, puis supprimées à la demande de son titulaire. Les messages des
        visiteurs sont conservés jusqu'à leur suppression par la boutique.
      </p>
    </Section>

    <Section titre="6. Vos droits">
      <p>
        Vous pouvez demander l'accès à vos données, leur correction ou leur suppression (par
        exemple un message envoyé par erreur à une boutique) en écrivant à{' '}
        <a href={mailto(EDITEUR.email, { sujet: 'Données personnelles' })}>{EDITEUR.email}</a>.
        Les commerçants peuvent aussi corriger et exporter leurs données directement dans
        l'application.
      </p>
    </Section>
  </PageLegale>
);

export default PolitiqueConfidentialite;
