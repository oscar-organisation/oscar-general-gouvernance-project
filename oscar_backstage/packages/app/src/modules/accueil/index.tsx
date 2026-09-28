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
    // La partie « Le deploiement »: ses fiches, et le tableau de bord de
    // Traefik. Absente des reglages, la partie ne s affiche pas.
    deploiement: z
      .object({
        fiches: z.array(z.string()).default([]),
        traefik: z
          .object({
            adresse: z.string(),
            // Un chemin sous secret_root/, jamais une valeur.
            identifiants: z.string(),
            documentation: z
              .object({ fiche: z.string(), page: z.string().default('') })
              .optional(),
          })
          .optional(),
      })
      .optional(),
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
