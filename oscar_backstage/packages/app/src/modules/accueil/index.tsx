/*
 * L accueil du portail, par le point d extension prevu du module d accueil de
 * Backstage (HomePageLayoutBlueprint): la page reste celle du module, a la
 * racine du portail, et c est sa mise en page qui devient « Commencer ici ».
 *
 * Les fiches a montrer se reglent dans app-config.yaml, sous
 * home-page-layout:home/commencer-ici.
 */

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { HomePageLayoutBlueprint } from '@backstage/plugin-home-react/alpha';
import { z } from 'zod';
import { CommencerIci } from './CommencerIci';

const commencerIci = HomePageLayoutBlueprint.makeWithOverrides({
  name: 'commencer-ici',
  configSchema: {
    guide: z
      .string()
      .default('component:default/oscar-general-gouvernance-project'),
    applications: z.array(z.string()).default([]),
    outils: z.array(z.string()).default([]),
  },
  factory(originalFactory, { config }) {
    return originalFactory({
      loader: async () => () => <CommencerIci reglages={config} />,
    });
  },
});

export const accueilModule = createFrontendModule({
  pluginId: 'home',
  extensions: [commencerIci],
});
