/*
 * Le serveur du portail technique OSCAR.
 *
 * Chaque ligne ajoute un module de Backstage. Un module ne sert que si sa
 * configuration le demande: la connexion invitee, par exemple, n existe que
 * sur le poste du developpeur, ou app-config.poste.yaml la configure.
 */

import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Sert l interface du portail.
backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));

// Le createur de projets. Aucun modele de projet n est ecrit aujourd hui, et
// sa page est fermee (app-config.yaml); le catalogue s en sert pour lire les
// fiches de sorte Template le jour ou il y en aura.
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));

// La documentation des depots, construite par le portail avec le MkDocs de
// son image.
backend.add(import('@backstage/plugin-techdocs-backend'));

// La connexion. Par GitHub en test et en production; en invite sur le poste.
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

// Le catalogue.
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
// Ecrit dans le journal les fiches que le catalogue n arrive pas a lire, pour
// qu une erreur dans un catalog-info.yaml se voie.
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));
// Trouve les depots de l organisation qui portent un catalog-info.yaml: un
// depot cree demain apparait tout seul a la prochaine lecture.
backend.add(import('@backstage/plugin-catalog-backend-module-github'));
// Importe les personnes et les equipes de l organisation GitHub. Sans lui,
// personne ne peut se connecter en production: la connexion cherche une
// personne du catalogue qui porte le nom du compte GitHub.
backend.add(import('@backstage/plugin-catalog-backend-module-github-org'));

// Les droits. Tout est permis a qui est connecte; et n est connecte qu un
// membre de l organisation GitHub, ou l invite sur le poste.
backend.add(import('@backstage/plugin-permission-backend'));
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// La recherche, rangee dans la base PostgreSQL, sur le catalogue et la
// documentation.
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-pg'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// Les reglages de chaque personne: son theme, ses favoris.
backend.add(import('@backstage/plugin-user-settings-backend'));

// Les signaux: le serveur previent l interface d un changement. Le stockage
// des reglages de l interface (module user-settings) en depend; sans eux,
// le catalogue affichait « No API factory available for dependency
// apiRef{plugin.signal.service} ». Present dans l application generee par
// Backstage, retire puis remis au lot 4.
backend.add(import('@backstage/plugin-signals-backend'));

backend.start();
