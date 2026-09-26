/*
 * La page de connexion du portail, par son point d extension prevu
 * (SignInPageBlueprint): la page de Backstage, avec les moyens de connexion
 * choisis selon l endroit ou tourne le portail.
 */

import { SignInPage } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import type { SignInPageProps } from '@backstage/plugin-app-react';
import { fournisseursDeConnexion } from './fournisseurs';

export const PageDeConnexion = (props: SignInPageProps) => {
  const config = useApi(configApiRef);
  return (
    <SignInPage
      {...props}
      title="Se connecter au portail technique"
      align="left"
      providers={fournisseursDeConnexion(
        config.getOptionalString('auth.environment'),
      )}
    />
  );
};

const pageDeConnexion = SignInPageBlueprint.make({
  params: {
    loader: async () => PageDeConnexion,
  },
});

export const connexionModule = createFrontendModule({
  pluginId: 'app',
  extensions: [pageDeConnexion],
});
