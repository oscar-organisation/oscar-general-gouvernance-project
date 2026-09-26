/*
 * Le haut du menu: le symbole OSCAR, et le nom quand le menu est ouvert.
 *
 * Le symbole est celui de la charte, en blanc, puisque le menu est sur fond
 * Noir OSCAR (la version blanche ne va que sur fond sombre). Les logos
 * complets de la charte ne sont pas employes: leur orange s ecarte de
 * l Orange Signal (voir marque/LISEZ-MOI.md). Le nom s ecrit donc en Space
 * Grotesk, en majuscules espacees, comme dans l en-tete de la charte.
 */

import {
  Link,
  sidebarConfig,
  useSidebarOpenState,
} from '@backstage/core-components';
import { makeStyles } from '@material-ui/core/styles';
import symbole from '../../marque/oscar-symbole-blanc-56.png';
import { polices } from '../charte/themes';

const useStyles = makeStyles(theme => ({
  racine: {
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    alignItems: 'center',
    // La zone de respiration de la charte: au moins la hauteur du carre
    // d accent autour du symbole.
    paddingLeft: 24,
  },
  lien: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textDecoration: 'none',
  },
  symbole: {
    // 28 px a l ecran: au-dessus du minimum de 24 px de la charte. L image
    // fait 56 px de haut, pour les ecrans a double densite.
    height: 28,
    width: 'auto',
    display: 'block',
  },
  nom: {
    fontFamily: polices.technique,
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: theme.palette.navigation.selectedColor,
  },
}));

export const SidebarLogo = () => {
  const classes = useStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.racine}>
      <Link to="/" underline="none" className={classes.lien} aria-label="Accueil OSCAR">
        <img src={symbole} alt="" className={classes.symbole} />
        {isOpen && <span className={classes.nom}>OSCAR</span>}
      </Link>
    </div>
  );
};
