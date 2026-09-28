/*
 * La page de connexion du portail, par son point d extension prevu
 * (SignInPageBlueprint): la page de Backstage, avec les moyens de connexion
 * choisis selon l endroit ou tourne le portail, et le logo OSCAR devant son
 * titre.
 */

import { SignInPage } from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SignInPageBlueprint } from '@backstage/plugin-app-react';
import type { SignInPageProps } from '@backstage/plugin-app-react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import icone from '../../marque/oscar-icone-96.png';
import { fournisseursDeConnexion } from './fournisseurs';

/** Le titre de la page, qui est aussi celui de l onglet du navigateur. */
const TITRE = 'Se connecter au portail technique';

const useStyles = makeStyles({
  titre: {
    display: 'flex',
    alignItems: 'center',
    // La zone de respiration de la charte autour du logo: au moins la
    // hauteur de son carre d accent, soit quelques pixels a cette taille.
    gap: 16,
  },
  icone: {
    // 48 px a l ecran: le symbole y fait 30 px de large, au-dessus du
    // minimum de 24 px de la charte. L image fait 96 px, pour les ecrans a
    // double densite.
    width: 48,
    height: 48,
    display: 'block',
    flexShrink: 0,
  },
  texte: { margin: 0 },
});

/**
 * Le titre de la page de connexion: l icone d application d OSCAR, puis la
 * phrase. C est l icone que la charte donne pour les interfaces numeriques
 * (le symbole blanc sur le carre Noir OSCAR): elle se lit sur le papier comme
 * sur le fond sombre, la ou le symbole blanc seul ne va que sur fond sombre.
 * L image est fabriquee par le generateur de marque (marque/LISEZ-MOI.md).
 *
 * Elle est decorative: le nom OSCAR est deja ecrit dans le bandeau de la
 * page, et un lecteur d ecran ne le lirait pas deux fois.
 */
const TitreDeConnexion = () => {
  const classes = useStyles();
  return (
    <div className={classes.titre}>
      <img src={icone} alt="" className={classes.icone} />
      <Typography variant="h4" component="h2" className={classes.texte}>
        {TITRE}
      </Typography>
    </div>
  );
};

export const PageDeConnexion = (props: SignInPageProps) => {
  const config = useApi(configApiRef);
  return (
    <SignInPage
      {...props}
      // Le titre de l onglet du navigateur. Celui de la page est dessine par
      // titleComponent, le reglage que la page de Backstage prevoit pour
      // remplacer son titre.
      title={TITRE}
      titleComponent={<TitreDeConnexion />}
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
