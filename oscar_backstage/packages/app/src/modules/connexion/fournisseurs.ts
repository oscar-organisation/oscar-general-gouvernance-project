/*
 * Qui peut se connecter, selon l endroit ou tourne le portail.
 *
 * Le reglage auth.environment le dit: « development » sur le poste du
 * developpeur (app-config.poste.yaml), « production » en test et en production
 * (app-config.production.yaml). Ce reglage est aussi celui qui choisit, cote
 * serveur, le jeu d identifiants GitHub: la page de connexion et le serveur ne
 * peuvent donc pas se contredire.
 */

import { githubAuthApiRef } from '@backstage/core-plugin-api';
import type { SignInProviderConfig } from '@backstage/core-components';

/** Le seul moyen d entrer en test et en production. */
export const connexionGitHub: SignInProviderConfig = {
  id: 'github-auth-provider',
  title: 'GitHub',
  message: "Avec votre compte GitHub, membre de l'organisation oscar-organisation.",
  apiRef: githubAuthApiRef,
};

/**
 * Les moyens de connexion a proposer. Sur le poste, l invite, et lui seul:
 * personne n y a les identifiants de l application GitHub. Partout ailleurs,
 * GitHub, et lui seul. Sans reglage, c est GitHub: un oubli ne doit jamais
 * ouvrir l acces invite.
 */
export function fournisseursDeConnexion(
  environnement: string | undefined,
): Array<'guest' | SignInProviderConfig> {
  return environnement === 'development' ? ['guest'] : [connexionGitHub];
}
