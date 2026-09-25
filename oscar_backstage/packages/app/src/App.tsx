/*
 * Le portail technique OSCAR: l application Backstage, et ce qu OSCAR y
 * ajoute. Tous les modules d interface installes sont charges d office
 * (app.packages: all, dans app-config.yaml); ceux d ici les completent ou les
 * remplacent par leurs points d extension prevus.
 */

import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { accueilModule } from './modules/accueil';
import { charteModule } from './modules/charte';
import { connexionModule } from './modules/connexion';
import { navModule } from './modules/nav';
import { traductionsModule } from './modules/traductions';

export default createApp({
  features: [
    catalogPlugin,
    charteModule,
    connexionModule,
    navModule,
    accueilModule,
    traductionsModule,
  ],
});
