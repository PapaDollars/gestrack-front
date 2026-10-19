// Conditions générales d'utilisation de la plateforme GesTrack Business — valables pour
// tous les utilisateurs (commerçants) et pour les visiteurs des catalogues publics.
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, mailto } from '@/utils/url/frontend';
import PageLegale, { Section } from '@/pages/public/components/PageLegale';
import { EDITEUR } from '@/pages/public/constants';

const Conditions = () => (
  <PageLegale titre="Conditions d'utilisation"
    intro={`Les présentes conditions encadrent l'utilisation de GesTrack Business (${EDITEUR.site}), application de gestion commerciale éditée par ${EDITEUR.nom}. Créer un compte ou utiliser le service vaut acceptation de ces conditions.`}>

    <Section titre="1. Le service">
      <p>
        GesTrack Business permet à un commerçant de gérer son activité : stock de la boutique et
        du magasin, ventes, factures, clients et dettes, fournisseurs et commandes, finances, et
        un catalogue en ligne facultatif. GesTrack est un outil de gestion : il n'intervient pas
        dans les ventes entre un commerçant et ses clients et n'encaisse aucun paiement.
      </p>
    </Section>

    <Section titre="2. Compte utilisateur">
      <ul>
        <li>Un compte est créé avec une adresse e-mail vérifiée par un code et un mot de passe.</li>
        <li>Vous êtes responsable de la confidentialité de votre mot de passe de connexion et du
          code de l'application, et de toute action effectuée depuis votre compte.</li>
        <li>Les informations fournies doivent être exactes. Un compte est personnel à son
          titulaire et à son activité.</li>
      </ul>
    </Section>

    <Section titre="3. Accès, période d'essai et accès payant">
      <p>
        Un nouveau compte peut nécessiter l'approbation de l'administrateur. L'accès commence par
        une période d'essai gratuite dont la durée est indiquée dans l'application ; à son terme,
        la poursuite de l'utilisation est soumise à l'activation d'un accès payant auprès de
        l'administrateur. Pendant une suspension ou à la fin de l'essai, vos données sont
        conservées et redeviennent accessibles dès la réactivation.
      </p>
    </Section>

    <Section titre="4. Vos données">
      <p>
        Les données que vous saisissez (produits, clients, factures, dettes, fournisseurs…) vous
        appartiennent. Elles sont propres à votre compte : aucun autre utilisateur ne peut les
        consulter. Vous pouvez les exporter depuis les paramètres de l'application. Le traitement
        des données personnelles est décrit dans la{' '}
        <Link to={ROUTES.confidentialite}>politique de confidentialité</Link>.
      </p>
      <p>
        Vous restez responsable des informations que vous enregistrez sur vos propres clients
        (noms, téléphones, dettes) et de leur utilisation conforme à la réglementation applicable.
      </p>
    </Section>

    <Section titre="5. Catalogue public et boutique protégée">
      <ul>
        <li>Le catalogue en ligne n'est visible que si vous l'activez. Vous choisissez les
          produits dont le prix est affiché ; le prix d'achat et le stock exact ne sont jamais
          publiés.</li>
        <li>Les prix, descriptions, photos et disponibilités affichés sont fixés par le
          commerçant, qui en est seul responsable. Ils sont donnés à titre indicatif et ne
          constituent pas une offre engageant GesTrack.</li>
        <li>Les visiteurs peuvent envoyer un message à la boutique : ce message, avec le nom et le
          numéro saisis, est transmis uniquement au commerçant concerné, qui est seul responsable
          de la suite donnée (réponse, vente, livraison, paiement).</li>
      </ul>
    </Section>

    <Section titre="6. Contenus interdits et modération">
      <p>
        Il est interdit de publier des produits illégaux, contrefaits ou dangereux, des contenus
        injurieux, haineux, obscènes ou trompeurs, ou d'utiliser le service pour du spam ou une
        fraude. Les contenus publiés peuvent être vérifiés automatiquement et masqués ; en cas de
        manquement, l'administrateur peut masquer un contenu, suspendre ou supprimer un compte.
      </p>
    </Section>

    <Section titre="7. Disponibilité et responsabilité">
      <p>
        Le service est fourni « en l'état ». Nous faisons le nécessaire pour qu'il soit disponible
        et fiable, sans pouvoir garantir l'absence d'interruption (maintenance, panne d'un
        hébergeur, coupure réseau). Les calculs de l'application (stock, bénéfices, encaissements)
        dépendent des informations saisies : vérifiez-les avant toute décision importante.
        GesTrack ne peut être tenu responsable des pertes résultant d'une saisie erronée, d'une
        utilisation non conforme ou d'un litige entre un commerçant et ses clients.
      </p>
    </Section>

    <Section titre="8. Fin d'utilisation">
      <p>
        Vous pouvez cesser d'utiliser le service à tout moment et demander la suppression de votre
        compte et de vos données par e-mail. Pensez à exporter vos données avant la suppression,
        qui est définitive.
      </p>
    </Section>

    <Section titre="9. Modification des conditions">
      <p>
        Ces conditions peuvent évoluer avec le service. La date de mise à jour figure en haut de
        cette page ; une modification importante sera signalée dans l'application.
      </p>
    </Section>

    <Section titre="10. Droit applicable et contact">
      <p>
        Ces conditions sont régies par le droit en vigueur au {EDITEUR.pays}. Pour toute question
        ou réclamation : <a href={mailto(EDITEUR.email)}>{EDITEUR.email}</a>.
      </p>
    </Section>
  </PageLegale>
);

export default Conditions;
